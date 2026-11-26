import { exec } from 'node:child_process'
import fs from 'node:fs/promises'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const run = promisify(exec)

const port = Number(process.env.KANATA_BRIDGE_PORT ?? '8787')
const configPath = path.resolve(
  (process.env.KANATA_CONFIG_PATH ?? '~/.config/kanata/kanata.kbd').replace(
    /^~(?=\/|$)/,
    os.homedir(),
  ),
)
function shellQuote(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

const quotedConfigPath = shellQuote(configPath)
const checkCommand = process.env.KANATA_CHECK_COMMAND ?? ''
const restartCommand =
  process.env.KANATA_RESTART_COMMAND ??
  `pkill -x kanata; nohup kanata -c ${quotedConfigPath} >/tmp/kanata.log 2>&1 &`
const token = process.env.KANATA_BRIDGE_TOKEN ?? ''
const extraOrigins = new Set(
  (process.env.KANATA_BRIDGE_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
)
const maxBodyBytes = 1_000_000

function send(res, status, body) {
  const data = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(data),
  })
  res.end(data)
}

function allowedOrigin(origin) {
  if (!origin) return true
  if (extraOrigins.has(origin)) return true
  try {
    return ['localhost', '127.0.0.1', '[::1]'].includes(
      new URL(origin).hostname,
    )
  } catch {
    return false
  }
}

async function readBody(req) {
  let data = ''
  for await (const chunk of req) {
    data += chunk
    if (data.length > maxBodyBytes) throw new Error('Payload too large')
  }
  return JSON.parse(data || '{}')
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin
  if (!allowedOrigin(origin)) {
    send(res, 403, { error: 'Origin not allowed' })
    return
  }

  if (origin) res.setHeader('access-control-allow-origin', origin)
  res.setHeader('vary', 'origin')
  res.setHeader('access-control-allow-credentials', 'true')

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type, x-bridge-token',
      'access-control-max-age': '600',
    })
    res.end()
    return
  }

  if (token && req.headers['x-bridge-token'] !== token) {
    send(res, 401, { error: 'Invalid bridge token' })
    return
  }

  const { pathname } = new URL(req.url ?? '/', `http://${req.headers.host}`)

  if (req.method === 'GET' && pathname === '/health') {
    send(res, 200, { ok: true, configPath })
    return
  }

  if (req.method !== 'POST' || pathname !== '/apply') {
    send(res, 404, { error: 'Not found' })
    return
  }

  try {
    const body = await readBody(req)
    if (typeof body.source !== 'string' || !body.source.trim()) {
      send(res, 400, { error: 'Missing source' })
      return
    }

    if (checkCommand) {
      const tempPath = `${configPath}.layr-check`
      await fs.writeFile(tempPath, body.source, 'utf8')
      try {
        await run(checkCommand.replaceAll('{config}', shellQuote(tempPath)))
      } catch (err) {
        await fs.unlink(tempPath).catch(() => {})
        send(res, 422, {
          error: 'Config check failed',
          detail: String(err.stderr || err.stdout || err.message || '').trim(),
        })
        return
      }
      await fs.unlink(tempPath).catch(() => {})
    }

    await fs.mkdir(path.dirname(configPath), { recursive: true })
    await fs.writeFile(configPath, body.source, 'utf8')

    let stdout = ''
    let stderr = ''
    try {
      const result = await run(restartCommand)
      stdout = result.stdout
      stderr = result.stderr
    } catch (err) {
      send(res, 502, {
        error: `Config written, but restart failed: ${err.message}`,
        stdout: err.stdout ?? '',
        stderr: err.stderr ?? '',
      })
      return
    }

    send(res, 200, { ok: true, configPath, stdout, stderr })
  } catch (err) {
    send(res, 400, {
      error: err instanceof Error ? err.message : 'Invalid request',
    })
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Kanata bridge listening on http://127.0.0.1:${port}`)
  console.log(`  config:  ${configPath}`)
  console.log(`  check:   ${checkCommand || '(disabled)'}`)
  console.log(`  restart: ${restartCommand || '(disabled)'}`)
  console.log(`  token:   ${token ? 'required' : 'not set'}`)
  if (extraOrigins.size) {
    console.log(`  origins: ${[...extraOrigins].join(', ')}`)
  }
})
