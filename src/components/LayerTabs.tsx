import type { Layer } from '../lib/types'

interface LayerTabsProps {
  layers: Layer[]
  activeLayerId: string
  onSelect: (id: string) => void
  onAdd: () => void
}

export function LayerTabs({
  layers,
  activeLayerId,
  onSelect,
  onAdd,
}: LayerTabsProps) {
  return (
    <div className="layer-tabs" role="tablist" aria-label="Layers">
      {layers.map((layer) => (
        <button
          key={layer.id}
          type="button"
          role="tab"
          aria-selected={layer.id === activeLayerId}
          className={`layer-tabs__tab${layer.id === activeLayerId ? ' is-active' : ''}`}
          onClick={() => onSelect(layer.id)}
        >
          {layer.name}
        </button>
      ))}
      <button
        type="button"
        className="layer-tabs__add"
        onClick={onAdd}
        aria-label="Add layer"
      >
        +
      </button>
    </div>
  )
}
