import type { Layer } from '../lib/types'

export type LayerAction = 'menu' | 'rename' | 'delete' | 'right' | 'end'

interface LayerTabsProps {
  layers: Layer[]
  activeLayerId: string
  openLayerMenuId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onLayerAction: (id: string, action: LayerAction, rect: DOMRect) => void
}

export function LayerTabs({
  layers,
  activeLayerId,
  openLayerMenuId,
  onSelect,
  onAdd,
  onLayerAction,
}: LayerTabsProps) {
  return (
    <div className="layer-tabs" role="tablist" aria-label="Layers">
      {layers.map((layer, index) => (
        <div
          key={layer.id}
          className="layer-tabs__item"
          role="presentation"
        >
          <button
            type="button"
            role="tab"
            aria-selected={layer.id === activeLayerId}
            className={`layer-tabs__tab${layer.id === activeLayerId ? ' is-active' : ''}`}
            aria-label={`Layer ${index + 1}: ${layer.name}`}
            title={`Layer ${index + 1}: ${layer.name}`}
            onClick={() => onSelect(layer.id)}
          >
            <span className="layer-tabs__num" aria-hidden="true">
              {index + 1}
            </span>
            <span className="layer-tabs__name">{layer.name}</span>
          </button>
          <button
            type="button"
            className="layer-tabs__chevron"
            aria-label={`Options for ${layer.name}`}
            aria-expanded={openLayerMenuId === layer.id}
            title="Layer options"
            onClick={(e) =>
              onLayerAction(layer.id, 'menu', e.currentTarget.getBoundingClientRect())
            }
          >
            ▾
          </button>
        </div>
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
