interface SourcePanelProps {
  source: string
  onClose: () => void
}

export function SourcePanel({ source, onClose }: SourcePanelProps) {
  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="source-panel"
        role="dialog"
        aria-label="Generated kanata source"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="source-panel__header">
          <h2>kanata.kbd</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close source"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <pre className="source-panel__code">
          <code>{source}</code>
        </pre>
      </div>
    </div>
  )
}
