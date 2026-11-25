import type { KeyAction, Layer, PhysicalKey } from '../lib/types'

interface ActionPanelProps {
  keyDef: PhysicalKey
  action: KeyAction | undefined
  layers: Layer[]
  onChange: (action: KeyAction) => void
}

const COMMON_KEYS = [
  'esc',
  'tab',
  'ret',
  'bspc',
  'spc',
  'lsft',
  'lctl',
  'lalt',
  'lmet',
  'a',
  's',
  'd',
  'f',
  'q',
  'w',
  'e',
  'r',
]

export function ActionPanel({
  keyDef,
  action,
  layers,
  onChange,
}: ActionPanelProps) {
  const type = action?.type ?? 'key'

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
        <label className="field">
          <span>Output key</span>
          <input
            list="common-keys"
            value={action?.type === 'key' ? action.code : keyDef.defsrc}
            onChange={(e) => onChange({ type: 'key', code: e.target.value })}
          />
          <datalist id="common-keys">
            {COMMON_KEYS.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </label>
      )}

      {(type === 'layer-toggle' || type === 'layer-switch') && (
        <label className="field">
          <span>Layer</span>
          <select
            value={
              action &&
              (action.type === 'layer-toggle' || action.type === 'layer-switch')
                ? action.layer
                : layers[0].name
            }
            onChange={(e) =>
              onChange({
                type: type === 'layer-toggle' ? 'layer-toggle' : 'layer-switch',
                layer: e.target.value,
              })
            }
          >
            {layers.map((layer) => (
              <option key={layer.id} value={layer.name}>
                {layer.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {type === 'tap-hold' && action?.type === 'tap-hold' && (
        <>
          <label className="field">
            <span>Tap key</span>
            <input
              value={
                action.tap.type === 'key' ? action.tap.code : keyDef.defsrc
              }
              onChange={(e) =>
                onChange({
                  ...action,
                  tap: { type: 'key', code: e.target.value },
                })
              }
            />
          </label>
          <label className="field">
            <span>Hold</span>
            <input
              value={
                action.hold.type === 'layer-toggle'
                  ? `layer-toggle:${action.hold.layer}`
                  : action.hold.type === 'key'
                    ? action.hold.code
                    : action.hold.type === 'multi'
                      ? '(multi …)'
                      : action.hold.type
              }
              readOnly
              title="Hold action imported from .kbd"
            />
          </label>
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
