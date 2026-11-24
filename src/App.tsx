import { useMemo, useState } from 'react'
import { ActionPanel } from './components/ActionPanel'
import { ExportPanel } from './components/ExportPanel'
import { Keyboard } from './components/Keyboard'
import { LayerTabs } from './components/LayerTabs'
import { getLayout, layouts } from './layouts'
import { createDefaultConfig } from './lib/defaultConfig'
import type { KeyAction, Layer, ProjectConfig } from './lib/types'

export default function App() {
  const [config, setConfig] = useState<ProjectConfig>(() =>
    createDefaultConfig('km40'),
  )

  const layout = useMemo(
    () => getLayout(config.layoutId),
    [config.layoutId],
  )
  const activeLayer =
    config.layers.find((l) => l.id === config.activeLayerId) ??
    config.layers[0]
  const selectedKey =
    layout.keys.find((k) => k.id === config.selectedKeyId) ?? null

  function updateActiveLayer(mutator: (layer: Layer) => Layer) {
    setConfig((prev) => ({
      ...prev,
      layers: prev.layers.map((layer) =>
        layer.id === prev.activeLayerId ? mutator(layer) : layer,
      ),
    }))
  }

  function setBinding(action: KeyAction) {
    if (!config.selectedKeyId) return
    const keyId = config.selectedKeyId
    updateActiveLayer((layer) => ({
      ...layer,
      bindings: { ...layer.bindings, [keyId]: action },
    }))
  }

  function addLayer() {
    setConfig((prev) => {
      const index = prev.layers.length + 1
      const layer: Layer = {
        id: `layer-${index}`,
        name: `Layer ${index}`,
        bindings: Object.fromEntries(
          layout.keys.map((key) => [key.id, { type: 'transparent' as const }]),
        ),
      }
      return {
        ...prev,
        layers: [...prev.layers, layer],
        activeLayerId: layer.id,
      }
    })
  }

  return (
    <div className="app">
      <div className="atmosphere" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">Layr</span>
          <span className="brand__tag">Kanata configurator</span>
        </div>

        <label className="layout-picker">
          <span>Layout</span>
          <select
            value={config.layoutId}
            onChange={(e) =>
              setConfig(createDefaultConfig(e.target.value))
            }
          >
            {layouts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <main className="workspace">
        <section className="board-stage">
          <div className="board-stage__intro">
            <h1>{layout.name}</h1>
            <p>{layout.description}</p>
          </div>

          <LayerTabs
            layers={config.layers}
            activeLayerId={config.activeLayerId}
            onSelect={(id) =>
              setConfig((prev) => ({ ...prev, activeLayerId: id }))
            }
            onAdd={addLayer}
          />

          <Keyboard
            layout={layout}
            bindings={activeLayer.bindings}
            selectedKeyId={config.selectedKeyId}
            onSelectKey={(id) =>
              setConfig((prev) => ({ ...prev, selectedKeyId: id }))
            }
          />
        </section>

        <div className="side-rail">
          <ActionPanel
            keyDef={selectedKey}
            action={
              selectedKey
                ? activeLayer.bindings[selectedKey.id]
                : undefined
            }
            layers={config.layers}
            onChange={setBinding}
          />
          <ExportPanel config={config} />
        </div>
      </main>
    </div>
  )
}
