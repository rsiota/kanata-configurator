const STORAGE_KEY = 'layr.bridge'

export interface BridgeSettings {
  url: string
  token: string
}

export const DEFAULT_BRIDGE_SETTINGS: BridgeSettings = {
  url: 'http://127.0.0.1:8787',
  token: '',
}

interface BridgeResponse {
  ok?: boolean
  error?: string
  detail?: string
  stdout?: string
  stderr?: string
}

export function loadBridgeSettings(): BridgeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_BRIDGE_SETTINGS
    const parsed = JSON.parse(raw) as Partial<BridgeSettings>
    return {
      url:
        typeof parsed.url === 'string' && parsed.url.trim()
          ? parsed.url
          : DEFAULT_BRIDGE_SETTINGS.url,
      token: typeof parsed.token === 'string' ? parsed.token : '',
    }
  } catch {
    return DEFAULT_BRIDGE_SETTINGS
  }
}

export function saveBridgeSettings(settings: BridgeSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export async function applyAndRestart(
  source: string,
  settings: BridgeSettings,
): Promise<string> {
  const url = `${settings.url.replace(/\/+$/, '')}/apply`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(settings.token ? { 'x-bridge-token': settings.token } : {}),
      },
      body: JSON.stringify({ source }),
    })
  } catch {
    throw new Error(
      `Cannot reach the bridge at ${settings.url}. Is "npm run bridge" running? Check the URL in bridge settings.`,
    )
  }

  let body: BridgeResponse = {}
  try {
    body = (await response.json()) as BridgeResponse
  } catch {
    // A non-JSON response is handled below via the status code.
  }

  if (!response.ok || body.ok !== true) {
    const message = [body.error, body.detail]
      .filter(Boolean)
      .join(' — ')
    throw new Error(message || `Bridge returned ${response.status}`)
  }

  const detail = body.stderr?.trim()
  return detail ? `Kanata restarted · ${detail}` : 'Kanata restarted with current source'
}
