import type { ChangeEvent } from 'react'
import type { SymbolLayout } from '../lib/displaySettings'
import type { KeyAction, Layer, PhysicalKey } from '../lib/types'
import { KeyPicker } from './KeyPicker'

interface ActionPanelProps {
  keyDef: PhysicalKey
  action: KeyAction | undefined
  layers: Layer[]
  symbolLayout: SymbolLayout
  onAddLayer: (name?: string) => Layer
  onChange: (action: KeyAction) => void
}

export function ActionPanel({
  keyDef,
  action,
  layers,
  symbolLayout,
  onAddLayer,
  onChange,
}: ActionPanelProps) {
  const type = action?.type ?? 'key'

  function chooseLayer(select: (name: string) => void) {
    return (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value
      if (value !== '__new__') {
        select(value)
        return
      }

      const name = window
        .prompt('New layer name', `Layer ${layers.length + 1}`)
        ?.trim()
      if (!name) return
      select(onAddLayer(name).name)
    }
  }

  function layerSelect(current: string, select: (name: string) => void) {
    return (
      <label className="field">
        <span>Layer</span>
        <select value={current} onChange={chooseLayer(select)}>
          {layers.map((layer) => (
            <option key={layer.id} value={layer.name}>
              {layer.name}
            </option>
          ))}
          <option value="__new__">+ New layer…</option>
        </select>
      </label>
    )
  }

  return (
    <div className="action-panel">
      <label className="field">
        <span>Action</span>
        <select
          value={type}
          onChange={(e) => {
            const next = e.target.value as KeyAction['type']
            if (next === 'key') {
              onChange({ type: 'key', code: keyDef.defsrc })
            } else if (next === 'transparent') {
              onChange({ type: 'transparent' })
            } else if (next === 'none') {
              onChange({ type: 'none' })
            } else if (next === 'layer-toggle') {
              onChange({
                type: 'layer-toggle',
                layer: layers[1]?.name ?? layers[0].name,
              })
            } else if (next === 'layer-switch') {
              onChange({
                type: 'layer-switch',
                layer: layers[0].name,
              })
            } else if (next === 'tap-hold') {
              onChange({
                type: 'tap-hold',
                tap: { type: 'key', code: keyDef.defsrc },
                hold: {
                  type: 'layer-toggle',
                  layer: layers[1]?.name ?? layers[0].name,
                },
                tapMs: 200,
                holdMs: 200,
              })
            }
          }}
        >
          <option value="key">Key</option>
          <option value="transparent">Transparent</option>
          <option value="none">None (XX)</option>
          <option value="layer-toggle">Layer toggle (hold)</option>
          <option value="layer-switch">Layer switch</option>
          <option value="tap-hold">Tap-hold</option>
          {type === 'multi' && <option value="multi">Multi</option>}
          {type === 'raw' && <option value="raw">Raw</option>}
        </select>
      </label>

      {type === 'key' && (
        <KeyPicker
          label="Output key"
          value={action?.type === 'key' ? action.code : keyDef.defsrc}
          symbolLayout={symbolLayout}
          onSelect={(code) => onChange({ type: 'key', code })}
        />
      )}

      {(type === 'layer-toggle' || type === 'layer-switch') &&
        layerSelect(
          action &&
            (action.type === 'layer-toggle' || action.type === 'layer-switch')
            ? action.layer
            : layers[0].name,
          (layer) =>
            onChange({
              type: type as 'layer-toggle' | 'layer-switch',
              layer,
            }),
        )}

      {type === 'tap-hold' && action?.type === 'tap-hold' && (
        <>
          <KeyPicker
            label="Tap key"
            value={action.tap.type === 'key' ? action.tap.code : keyDef.defsrc}
            symbolLayout={symbolLayout}
            onSelect={(code) =>
              onChange({ ...action, tap: { type: 'key', code } })
            }
          />
          <label className="field">
            <span>Hold</span>
            <select
              value={
                action.hold.type === 'key' ||
                action.hold.type === 'layer-toggle' ||
                action.hold.type === 'layer-switch' ||
                action.hold.type === 'none'
                  ? action.hold.type
                  : 'imported'
              }
              onChange={(e) => {
                const value = e.target.value
                const hold: KeyAction =
                  value === 'key'
                    ? { type: 'key', code: keyDef.defsrc }
                    : value === 'layer-toggle' ||
                        value === 'layer-switch'
                      ? {
                          type: value,
                          layer: layers[1]?.name ?? layers[0].name,
                        }
                      : value === 'none'
                        ? { type: 'none' }
                        : action.hold
                onChange({ ...action, hold })
              }}
            >
              <option value="key">Key</option>
              <option value="layer-toggle">Layer toggle</option>
              <option value="layer-switch">Layer switch</option>
              <option value="none">None (XX)</option>
              {!['key', 'layer-toggle', 'layer-switch', 'none'].includes(
                action.hold.type,
              ) && <option value="imported">Imported — keep as-is</option>}
            </select>
          </label>

          {action.hold.type === 'key' && (
            <KeyPicker
              label="Hold key"
              value={action.hold.code}
              symbolLayout={symbolLayout}
              onSelect={(code) =>
                onChange({ ...action, hold: { type: 'key', code } })
              }
            />
          )}

          {(action.hold.type === 'layer-toggle' ||
            action.hold.type === 'layer-switch') &&
            layerSelect(action.hold.layer, (layer) => {
              const holdType = action.hold.type as
                | 'layer-toggle'
                | 'layer-switch'
              onChange({ ...action, hold: { type: holdType, layer } })
            })}
          <div className="field-row">
            <label className="field">
              <span>Tap ms</span>
              <input
                type="number"
                min={0}
                value={action.tapMs}
                onChange={(e) =>
                  onChange({ ...action, tapMs: Number(e.target.value) })
                }
              />
            </label>
            <label className="field">
              <span>Hold ms</span>
              <input
                type="number"
                min={0}
                value={action.holdMs}
                onChange={(e) =>
                  onChange({ ...action, holdMs: Number(e.target.value) })
                }
              />
            </label>
          </div>
        </>
      )}

      {type === 'multi' && action?.type === 'multi' && (
        <p className="field-note">
          Multi chord with {action.actions.length} parts (imported).
        </p>
      )}

      {type === 'raw' && action?.type === 'raw' && (
        <label className="field">
          <span>Raw expression</span>
          <input
            value={action.expr}
            onChange={(e) => onChange({ ...action, expr: e.target.value })}
          />
        </label>
      )}
    </div>
  )
}
