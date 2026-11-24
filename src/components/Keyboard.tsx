import type { KeyAction, KeyboardLayout } from '../lib/types'
import { KeyCap } from './KeyCap'

interface KeyboardProps {
  layout: KeyboardLayout
  bindings: Record<string, KeyAction>
  selectedKeyId: string | null
  onSelectKey: (id: string) => void
}

const UNIT = 56
const GAP = 6

export function Keyboard({
  layout,
  bindings,
  selectedKeyId,
  onSelectKey,
}: KeyboardProps) {
  const maxRow = Math.max(...layout.keys.map((k) => k.row))
  const rows: number[] = []
  for (let r = 0; r <= maxRow; r++) rows.push(r)

  return (
    <div className="keyboard" role="group" aria-label={`${layout.name} keymap`}>
      {rows.map((row) => {
        const keys = layout.keys.filter((k) => k.row === row)
        return (
          <div
            key={row}
            className="keyboard__row"
            style={{ gap: GAP, marginBottom: row < maxRow ? GAP : 0 }}
          >
            {keys.map((key) => (
              <KeyCap
                key={key.id}
                keyDef={key}
                action={bindings[key.id]}
                selected={selectedKeyId === key.id}
                unit={UNIT}
                onSelect={onSelectKey}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
