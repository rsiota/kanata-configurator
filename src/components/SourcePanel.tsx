import { useState } from 'react'

interface SourcePanelProps {
  source: string
  draft: string
  onDraftChange: (value: string) => void
  onApply: (text: string) => string | null
  onClose: () => void
}

export function SourcePanel({
  source,
  draft,
  onDraftChange,
  onApply,
  onClose,
}: SourcePanelProps) {
  const [error, setError] = useState<string | null>(null)
  const dirty = draft !== source

  function apply() {
    const message = onApply(draft)
    if (message) setError(message)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="source-panel"
        role="dialog"
        aria-label="Edit kanata source"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="source-panel__header">
          <h2>kanata.kbd{dirty ? ' •' : ''}</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close source"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <p className="source-panel__note">
          Applies to the active board. Only defsrc and deflayer bindings are
          kept; the layout is rebuilt from defsrc with 1u keys.
        </p>
        <textarea
          className="source-panel__code"
          value={draft}
          spellCheck={false}
          aria-label="Kanata source"
          onChange={(e) => {
            setError(null)
            onDraftChange(e.target.value)
          }}
        />
        {error && (
          <p className="source-panel__error" role="alert">
            {error}
          </p>
        )}
        <footer className="source-panel__actions">
          <button
            type="button"
            className="nav-btn"
            disabled={!dirty}
            onClick={() => {
              setError(null)
              onDraftChange(source)
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className="nav-btn nav-btn--accent"
            onClick={apply}
          >
            Apply
          </button>
        </footer>
      </div>
    </div>
  )
}
