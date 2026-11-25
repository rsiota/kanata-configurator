import { atom, isList, parseKanataSource, type Sexp } from './sexp'
import type {
  KeyAction,
  KeyboardLayout,
  Layer,
  PhysicalKey,
  ProjectConfig,
} from './types'

function sexpToString(value: Sexp): string {
  if (typeof value === 'string') return value
  return `(${value.map(sexpToString).join(' ')})`
}

function layoutFromDefsrcRows(
  rows: string[][],
  name = 'Imported',
): KeyboardLayout {
  const keys: PhysicalKey[] = []
  rows.forEach((rowKeys, row) => {
    rowKeys.forEach((defsrc, col) => {
      keys.push({
        id: `${row},${col}`,
        row,
        col,
        // Imported defsrc rows have no width information: assume 1u keys.
        x: col,
        w: 1,
        label: defsrc,
        defsrc,
      })
    })
  })

  return {
    id: 'imported',
    name,
    description: `Imported from .kbd (${keys.length} keys)`,
    keys,
  }
}

/**
 * Parse defsrc while keeping newline-separated visual rows when present.
 * Falls back to a single row if the source had no line breaks inside defsrc.
 */
function parseDefsrcRows(source: string, defsrcForm: Sexp[]): string[][] {
  const defsrcMatch = source.match(/\(defsrc\b([\s\S]*?)\)/i)
  if (!defsrcMatch) {
    return [defsrcForm.slice(1).map(atom)]
  }

  const body = defsrcMatch[1]
  const lines = body
    .split('\n')
    .map((line) => line.replace(/;;.*$/, '').trim())
    .filter(Boolean)

  if (lines.length <= 1) {
    return [defsrcForm.slice(1).map(atom)]
  }

  return lines.map((line) =>
    line
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean),
  )
}

function resolveVars(token: string, vars: Record<string, string>): string {
  if (token.startsWith('$')) {
    const name = token.slice(1)
    if (!(name in vars)) {
      throw new Error(`Unknown variable $${name}`)
    }
    return vars[name]
  }
  return token
}

function parseNumber(token: string, vars: Record<string, string>): number {
  const resolved = resolveVars(token, vars)
  const n = Number(resolved)
  if (Number.isNaN(n)) {
    throw new Error(`Expected number, got ${token}`)
  }
  return n
}

function parseAction(
  value: Sexp,
  ctx: {
    vars: Record<string, string>
    aliases: Record<string, Sexp>
    resolving: Set<string>
  },
): KeyAction {
  if (typeof value === 'string') {
    if (value === '_' ) return { type: 'transparent' }
    if (value === 'XX' || value === 'xx') return { type: 'none' }
    if (value.startsWith('@')) {
      const name = value.slice(1)
      if (ctx.resolving.has(name)) {
        return { type: 'raw', expr: value }
      }
      const alias = ctx.aliases[name]
      if (!alias) {
        return { type: 'raw', expr: value }
      }
      ctx.resolving.add(name)
      try {
        return parseAction(alias, ctx)
      } finally {
        ctx.resolving.delete(name)
      }
    }
    return { type: 'key', code: resolveVars(value, ctx.vars) }
  }

  if (!isList(value) || value.length === 0) {
    return { type: 'raw', expr: sexpToString(value) }
  }

  const head = atom(value[0])

  if (head === 'layer-toggle' && value.length >= 2) {
    return { type: 'layer-toggle', layer: atom(value[1]) }
  }
  if (head === 'layer-switch' && value.length >= 2) {
    return { type: 'layer-switch', layer: atom(value[1]) }
  }
  if (
    (head === 'tap-hold' ||
      head === 'tap-hold-press' ||
      head === 'tap-hold-release') &&
    value.length >= 5
  ) {
    return {
      type: 'tap-hold',
      tapMs: parseNumber(atom(value[1]), ctx.vars),
      holdMs: parseNumber(atom(value[2]), ctx.vars),
      tap: parseAction(value[3], ctx),
      hold: parseAction(value[4], ctx),
    }
  }
  if (head === 'multi') {
    return {
      type: 'multi',
      actions: value.slice(1).map((part) => parseAction(part, ctx)),
    }
  }

  return { type: 'raw', expr: sexpToString(value) }
}

export interface ImportResult {
  config: ProjectConfig
  warnings: string[]
}

export function importKanataConfig(
  source: string,
  options?: { name?: string },
): ImportResult {
  const forms = parseKanataSource(source)
  const warnings: string[] = []
  const vars: Record<string, string> = {}
  const aliases: Record<string, Sexp> = {}
  let defsrcForm: Sexp[] | null = null
  const layerForms: { name: string; actions: Sexp[] }[] = []

  for (const form of forms) {
    if (!isList(form) || form.length === 0) continue
    const head = atom(form[0])

    if (head === 'defvar') {
      for (let i = 1; i + 1 < form.length; i += 2) {
        vars[atom(form[i])] = atom(form[i + 1])
      }
    } else if (head === 'defalias') {
      for (let i = 1; i + 1 < form.length; i += 2) {
        aliases[atom(form[i])] = form[i + 1]
      }
    } else if (head === 'defsrc') {
      defsrcForm = form
    } else if (head === 'deflayer') {
      layerForms.push({
        name: atom(form[1]),
        actions: form.slice(2),
      })
    }
  }

  if (!defsrcForm) {
    throw new Error('No (defsrc …) found in kanata config')
  }
  if (layerForms.length === 0) {
    throw new Error('No (deflayer …) found in kanata config')
  }

  const defsrcKeys = defsrcForm.slice(1).map(atom)
  const rows = parseDefsrcRows(source, defsrcForm)
  const flatFromRows = rows.flat()
  if (flatFromRows.length !== defsrcKeys.length) {
    warnings.push(
      'Visual row parsing did not match defsrc length; using a single row.',
    )
    rows.length = 0
    rows.push(defsrcKeys)
  }

  const layout = layoutFromDefsrcRows(
    rows,
    options?.name ?? 'Imported',
  )

  const ctx = { vars, aliases, resolving: new Set<string>() }

  const layers: Layer[] = layerForms.map((layer, index) => {
    if (layer.actions.length !== layout.keys.length) {
      warnings.push(
        `Layer "${layer.name}" has ${layer.actions.length} actions but defsrc has ${layout.keys.length} keys`,
      )
    }

    const bindings: Record<string, KeyAction> = {}
    layout.keys.forEach((key, i) => {
      const actionSexp = layer.actions[i]
      bindings[key.id] = actionSexp
        ? parseAction(actionSexp, ctx)
        : { type: 'transparent' }
    })

    return {
      id: `layer-${index}-${layer.name}`,
      name: layer.name,
      bindings,
    }
  })

  return {
    config: {
      layoutId: layout.id,
      customLayout: layout,
      layers,
      activeLayerId: layers[0].id,
      selectedKeyId: null,
    },
    warnings,
  }
}
