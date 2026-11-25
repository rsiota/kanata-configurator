import type { CSSProperties } from 'react'
import type { KeyAction, KeyboardLayout } from '../lib/types'
import { KeyCap } from './KeyCap'

interface KeyboardProps {
  layout: KeyboardLayout
  bindings: Record<string, KeyAction>
  layerNumbers: Record<string, number>
  selectedKeyId: string | null
  onSelectKey: (id: string, rect: DOMRect) => void
}

type BoardStyle = CSSProperties & {
  '--cols': number
  '--rows': number
}

export function Keyboard({
  layout,
  bindings,
  layerNumbers,
  selectedKeyId,
  onSelectKey,
}: KeyboardProps) {
  const cols = Math.max(...layout.keys.map((k) => k.x + k.w))
  const rows = Math.max(...layout.keys.map((k) => k.row)) + 1

  return (
    <div className="keyboard-scroll">
      <div
        className="keyboard"
        role="group"
        aria-label={`${layout.name} keymap`}
        style={{ '--cols': cols, '--rows': rows } as BoardStyle}
      >
        {layout.keys.map((key) => (
          <KeyCap
            key={key.id}
            keyDef={key}
            action={bindings[key.id]}
            layerNumbers={layerNumbers}
            selected={selectedKeyId === key.id}
            onSelect={onSelectKey}
          />
        ))}
      </div>
    </div>
  )
}
