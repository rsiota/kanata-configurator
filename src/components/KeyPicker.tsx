import { useEffect, useMemo, useRef, useState } from 'react'
import type { SymbolLayout } from '../lib/displaySettings'
import { keyLabel } from '../lib/keyDisplay'
import { KEY_GROUPS, keyCatalog, keySearchText } from '../lib/keyCatalog'

interface KeyPickerProps {
  label: string
  value: string
  symbolLayout: SymbolLayout
  onSelect: (code: string) => void
}

export function KeyPicker({
  label,
  value,
  symbolLayout,
  onSelect,
}: KeyPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const options = useMemo(() => keyCatalog(), [])
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options
    return options.filter((option) =>
      keySearchText(option, symbolLayout).includes(term),
    )
  }, [options, query, symbolLayout])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      setOpen(false)
    }
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [open])

  function choose(code: string) {
    onSelect(code)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className="key-picker-trigger"
        aria-label={`${label}: ${value}`}
        onClick={() => {
          setQuery('')
          setOpen(true)
        }}
      >
        <span className="key-picker-trigger__text">
          <span>{label}</span>
          <span className="key-picker-trigger__code">{value}</span>
        </span>
        <span className="key-picker-trigger__cap">
          {keyLabel(value, symbolLayout)}
        </span>
      </button>

      {open && (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div
            className="key-picker-modal"
            role="dialog"
            aria-label={`Choose ${label.toLowerCase()}`}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="source-panel__header">
              <h2>Choose key</h2>
              <button
                type="button"
                className="icon-btn"
                aria-label="Close key picker"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>

            <div className="key-picker__search">
              <input
                ref={searchRef}
                value={query}
                spellCheck={false}
                placeholder="Search by key, code, or symbol — e.g. £, pound, S-3"
                aria-label="Search keys"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filtered[0]) {
                    e.preventDefault()
                    choose(filtered[0].code)
                  }
                }}
              />
            </div>

            <div className="key-picker__results">
              {filtered.length === 0 && (
                <p className="key-picker__empty">No keys match “{query}”.</p>
              )}

              {KEY_GROUPS.map((group) => {
                const groupOptions = filtered.filter(
                  (option) => option.group === group,
                )
                if (groupOptions.length === 0) return null

                return (
                  <section className="key-picker__group" key={group}>
                    <h3>{group}</h3>
                    <div className="key-picker__grid">
                      {groupOptions.map((option) => (
                        <button
                          type="button"
                          key={option.code}
                          className={`picker-key${option.code === value ? ' is-current' : ''}`}
                          title={`${option.code} · ${keyLabel(option.code, symbolLayout)}`}
                          onClick={() => choose(option.code)}
                        >
                          <span className="picker-key__label">
                            {keyLabel(option.code, symbolLayout)}
                          </span>
                          <span className="picker-key__code">
                            {option.code}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>

            <footer className="source-panel__actions">
              <span className="key-picker__hint">
                Click a key to assign it · Enter picks the first match
              </span>
              <button
                type="button"
                className="nav-btn"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}
