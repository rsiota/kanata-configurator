import type { KeyAction } from './types'

const KEY_LABELS: Record<string, string> = {
  esc: 'Esc',
  tab: 'Tab',
  ret: 'Enter',
  bspc: 'Bksp',
  spc: 'Space',
  caps: 'Caps',
  lsft: 'Shift',
  rsft: 'Shift',
  lctl: 'Ctrl',
  rctl: 'Ctrl',
  lalt: 'Alt',
  ralt: 'Alt',
  lmet: 'Meta',
  rmet: 'Meta',
  app: 'Menu',
  del: 'Del',
  ins: 'Ins',
  home: 'Home',
  end: 'End',
  pgup: 'PgUp',
  pgdn: 'PgDn',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
}

/** US-style shifted legends. The Kanata code is still shown in the editor. */
const SHIFTED_LABELS: Record<string, string> = {
  '`': '~',
  '1': '!',
  '2': '@',
  '3': '#',
  '4': '$',
  '5': '%',
  '6': '^',
  '7': '&',
  '8': '*',
  '9': '(',
  '0': ')',
  '-': '_',
  '=': '+',
  '[': '{',
  ']': '}',
  '\\': '|',
  ';': ':',
  "'": '"',
  ',': '<',
  '.': '>',
  '/': '?',
}

function shiftedLabel(code: string): string | null {
  const match = /^(?:S|LSFT|RSFT)-(.*)$/.exec(code)
  if (!match) return null

  const base = match[1]
  const symbol = SHIFTED_LABELS[base]
  if (symbol) return symbol
  if (/^[a-z]$/.test(base)) return base.toUpperCase()
  return null
}

export function keyLabel(code: string): string {
  const shifted = shiftedLabel(code)
  if (shifted) return shifted

  const known = KEY_LABELS[code.toLowerCase()]
  if (known) return known
  return code.length === 1 ? code.toUpperCase() : code
}

export function actionLabel(
  action: KeyAction | undefined,
  fallback: string,
): string {
  if (!action) return fallback
  switch (action.type) {
    case 'key':
      return keyLabel(action.code)
    case 'transparent':
      return '▽'
    case 'none':
      return ''
    case 'layer-toggle':
      return `↥ ${action.layer}`
    case 'layer-switch':
      return `⇄ ${action.layer}`
    case 'tap-hold':
      return `${actionLabel(action.tap, '·')} / ${actionLabel(action.hold, '·')}`
    case 'multi':
      return action.actions
        .map((a) => actionLabel(a, '·'))
        .filter(Boolean)
        .join(' + ')
    case 'raw':
      return action.expr.length > 18
        ? `${action.expr.slice(0, 16)}…`
        : action.expr
    default:
      return fallback
  }
}

/** Raw Kanata-facing value, used for tooltips without changing export. */
export function actionSource(
  action: KeyAction | undefined,
  fallback: string,
): string {
  if (!action) return fallback
  switch (action.type) {
    case 'key':
      return action.code
    case 'transparent':
      return '_'
    case 'none':
      return 'XX'
    case 'layer-toggle':
      return `layer-toggle:${action.layer}`
    case 'layer-switch':
      return `layer-switch:${action.layer}`
    case 'tap-hold':
      return `tap-hold ${action.tapMs} ${action.holdMs} ${actionSource(action.tap, '·')} ${actionSource(action.hold, '·')}`
    case 'multi':
      return `multi ${action.actions.map((a) => actionSource(a, '·')).join(' ')}`
    case 'raw':
      return action.expr
    default:
      return fallback
  }
}
