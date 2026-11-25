import type { CSSProperties } from 'react'
import type { KeyAction, PhysicalKey } from '../lib/types'

interface KeyCapProps {
  keyDef: PhysicalKey
  action: KeyAction | undefined
  selected: boolean
  onSelect: (id: string, rect: DOMRect) => void
}

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

function keyLabel(code: string): string {
  const known = KEY_LABELS[code.toLowerCase()]
  if (known) return known
  return code.length === 1 ? code.toUpperCase() : code
}

function actionLabel(action: KeyAction | undefined, fallback: string): string {
  if (!action) return fallback
  switch (action.type) {
    case 'key':
      return keyLabel(action.code)
    case 'transparent':
      return '▽'
    case 'none':
      return 'XX'
    case 'layer-toggle':
      return `↥ ${action.layer}`
    case 'layer-switch':
      return `⇄ ${action.layer}`
    case 'tap-hold':
      return `${actionLabel(action.tap, '·')} / ${actionLabel(action.hold, '·')}`
    case 'multi':
      return action.actions.map((a) => actionLabel(a, '·')).join(' + ')
    case 'raw':
      return action.expr.length > 18
        ? `${action.expr.slice(0, 16)}…`
        : action.expr
    default:
      return fallback
  }
}

export function KeyCap({ keyDef, action, selected, onSelect }: KeyCapProps) {
  const type = action?.type ?? 'key'
  const isTapHold = action?.type === 'tap-hold'

  const style: CSSProperties = {
    left: `calc(${keyDef.x} * var(--u))`,
    top: `calc(${keyDef.row} * var(--u))`,
    width: `calc(${keyDef.w} * var(--u) - var(--key-gap))`,
    height: `calc(var(--u) - var(--key-gap))`,
  }

  return (
    <button
      type="button"
      className={`keycap keycap--${type}${selected ? ' is-selected' : ''}`}
      style={style}
      onClick={(e) => onSelect(keyDef.id, e.currentTarget.getBoundingClientRect())}
      aria-pressed={selected}
      title={`${keyDef.id} · matrix ${keyDef.col} · defsrc ${keyDef.defsrc}`}
    >
      {isTapHold ? (
        <span className="keycap__legend keycap__legend--stack">
          <span className="keycap__tap">
            {actionLabel(action.tap, '·')}
          </span>
          <span className="keycap__hold">
            {actionLabel(action.hold, '·')}
          </span>
        </span>
      ) : (
        <span className="keycap__legend">
          {actionLabel(action, keyDef.label)}
        </span>
      )}
    </button>
  )
}
