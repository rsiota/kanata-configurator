import type { CSSProperties } from 'react'
import { actionLabel, actionSource } from '../lib/keyDisplay'
import type { KeyAction, PhysicalKey } from '../lib/types'

interface KeyCapProps {
  keyDef: PhysicalKey
  action: KeyAction | undefined
  selected: boolean
  onSelect: (id: string, rect: DOMRect) => void
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
      title={`${keyDef.id} · matrix ${keyDef.col} · defsrc ${keyDef.defsrc} · ${actionSource(action, keyDef.label)}`}
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
