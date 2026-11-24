import type { KeyAction, PhysicalKey } from '../lib/types'

interface KeyCapProps {
  keyDef: PhysicalKey
  action: KeyAction | undefined
  selected: boolean
  unit: number
  onSelect: (id: string) => void
}

function actionLabel(action: KeyAction | undefined, fallback: string): string {
  if (!action) return fallback
  switch (action.type) {
    case 'key':
      return action.code
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
      return action.actions.map((a) => actionLabel(a, '·')).join('+')
    case 'raw':
      return action.expr.length > 18
        ? `${action.expr.slice(0, 16)}…`
        : action.expr
    default:
      return fallback
  }
}

export function KeyCap({
  keyDef,
  action,
  selected,
  unit,
  onSelect,
}: KeyCapProps) {
  const width = keyDef.w * unit
  const label = actionLabel(action, keyDef.label)
  const isMod =
    action?.type === 'layer-toggle' ||
    action?.type === 'layer-switch' ||
    action?.type === 'tap-hold' ||
    action?.type === 'multi'

  return (
    <button
      type="button"
      className={`keycap${selected ? ' is-selected' : ''}${isMod ? ' is-mod' : ''}`}
      style={{ width, height: unit }}
      onClick={() => onSelect(keyDef.id)}
      aria-pressed={selected}
      title={`${keyDef.id} · ${keyDef.defsrc}`}
    >
      <span className="keycap__legend">{label}</span>
      <span className="keycap__matrix">{keyDef.id}</span>
    </button>
  )
}
