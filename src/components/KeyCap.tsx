import type { CSSProperties, ReactNode } from 'react'
import { actionSource, keyLabel } from '../lib/keyDisplay'
import type { KeyAction, PhysicalKey } from '../lib/types'

interface KeyCapProps {
  keyDef: PhysicalKey
  action: KeyAction | undefined
  layerNumbers: Record<string, number>
  selected: boolean
  onSelect: (id: string, rect: DOMRect) => void
}

interface ActionLabelProps {
  action: KeyAction | undefined
  fallback: string
  layerNumbers: Record<string, number>
}

function ShiftLegend({ side }: { side: 'l' | 'r' }) {
  const isLeft = side === 'l'

  return (
    <span
      className="keycap__shift"
      role="img"
      aria-label={`${isLeft ? 'Left' : 'Right'} Shift`}
    >
      {isLeft && (
        <span
          className="keycap__side keycap__side--left"
          aria-hidden="true"
        >
          L
        </span>
      )}
      <svg
        className="keycap__shift-arrow"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      >
        <path d="M12 2L22 12H17V22H7V12H2Z" />
      </svg>
      {!isLeft && (
        <span
          className="keycap__side keycap__side--right"
          aria-hidden="true"
        >
          R
        </span>
      )}
    </span>
  )
}

function AltLegend({ side }: { side: 'l' | 'r' }) {
  const isLeft = side === 'l'

  return (
    <span
      className="keycap__alt"
      role="img"
      aria-label={`${isLeft ? 'Left' : 'Right'} Alt`}
    >
      {isLeft && (
        <span
          className="keycap__side keycap__side--left"
          aria-hidden="true"
        >
          L
        </span>
      )}
      <span className="keycap__alt-glyph" aria-hidden="true">
        ⌥
      </span>
      {!isLeft && (
        <span
          className="keycap__side keycap__side--right"
          aria-hidden="true"
        >
          R
        </span>
      )}
    </span>
  )
}

function LayerBadge({
  layer,
  layerNumbers,
}: {
  layer: string
  layerNumbers: Record<string, number>
}) {
  return (
    <span className="keycap__layer-num">
      {layerNumbers[layer] ?? '?'}
    </span>
  )
}

function ActionLabel({
  action,
  fallback,
  layerNumbers,
}: ActionLabelProps): ReactNode {
  if (!action) return fallback

  switch (action.type) {
    case 'key':
      if (action.code === 'lsft') return <ShiftLegend side="l" />
      if (action.code === 'rsft') return <ShiftLegend side="r" />
      if (action.code === 'lalt') return <AltLegend side="l" />
      if (action.code === 'ralt') return <AltLegend side="r" />
      return keyLabel(action.code)
    case 'transparent':
      return '▽'
    case 'none':
      return ''
    case 'layer-toggle':
    case 'layer-switch':
      return <LayerBadge layer={action.layer} layerNumbers={layerNumbers} />
    case 'tap-hold':
      return (
        <>
          <ActionLabel
            action={action.tap}
            fallback="·"
            layerNumbers={layerNumbers}
          />
          <span className="keycap__sep">/</span>
          <ActionLabel
            action={action.hold}
            fallback="·"
            layerNumbers={layerNumbers}
          />
        </>
      )
    case 'multi':
      return action.actions.map((part, index) => (
        <span key={index}>
          {index > 0 && <span className="keycap__sep">+</span>}
          <ActionLabel
            action={part}
            fallback="·"
            layerNumbers={layerNumbers}
          />
        </span>
      ))
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
  layerNumbers,
  selected,
  onSelect,
}: KeyCapProps) {
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
      title={`${keyDef.id} · matrix ${keyDef.col} · defsrc ${keyDef.defsrc} · ${actionSource(action, keyDef.label)}`}
    >
      {isTapHold ? (
        <span className="keycap__legend keycap__legend--stack">
          <span className="keycap__tap">
            <ActionLabel
              action={action.tap}
              fallback="·"
              layerNumbers={layerNumbers}
            />
          </span>
          <span className="keycap__hold">
            <ActionLabel
              action={action.hold}
              fallback="·"
              layerNumbers={layerNumbers}
            />
          </span>
        </span>
      ) : (
        <span className="keycap__legend">
          <ActionLabel
            action={action}
            fallback={keyDef.label}
            layerNumbers={layerNumbers}
          />
        </span>
      )}
    </button>
  )
}
