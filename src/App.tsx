import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ActionPanel } from './components/ActionPanel'
import { Keyboard } from './components/Keyboard'
import { LayerTabs } from './components/LayerTabs'
import { SourcePanel } from './components/SourcePanel'
import { layouts } from './layouts'
import { loadBoards, saveBoards } from './lib/boardLibrary'
import { createDefaultConfig } from './lib/defaultConfig'
import { exportKanataConfig } from './lib/kanataExport'
import { importKanataConfig } from './lib/kanataImport'
import { resolveLayout } from './lib/resolveLayout'
import type { KeyAction, Layer, ProjectConfig, SavedBoard } from './lib/types'

type Anchor = Pick<
  DOMRect,
  'left' | 'top' | 'right' | 'bottom' | 'width' | 'height'
>
type Notice = { text: string; tone: 'info' | 'error' } | null

function snapshot(config: ProjectConfig): ProjectConfig {
  return { ...config, selectedKeyId: null }
}

function sameConfig(a: ProjectConfig, b: ProjectConfig): boolean {
  return JSON.stringify(snapshot(a)) === JSON.stringify(snapshot(b))
}

function uniqueId(prefix: string): string {
  const random =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${random}`
}

function makeBoard(
  config: ProjectConfig,
  name: string,
  id = uniqueId('board'),
): SavedBoard {
  const layout = resolveLayout(config)
  return {
    id,
    name,
    config: {
      ...snapshot(config),
      layoutId: id,
      customLayout: { ...layout, id },
    },
    savedAt: Date.now(),
  }
}

export default function App() {
  const [config, setConfig] = useState<ProjectConfig>(() =>
    createDefaultConfig('km40'),
  )
  const [notice, setNotice] = useState<Notice>(null)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ left: number; top: number } | null>(
    null,
  )
  const [savedBoards, setSavedBoards] = useState<SavedBoard[]>(loadBoards)
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null)

  const popoverRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastKeyRef = useRef<HTMLElement | null>(null)
  const baselineRef = useRef<ProjectConfig>(snapshot(config))

  const layout = useMemo(() => resolveLayout(config), [config])
  const source = useMemo(() => exportKanataConfig(config), [config])

  const activeLayer =
    config.layers.find((l) => l.id === config.activeLayerId) ??
    config.layers[0]
  const selectedKey =
    layout.keys.find((k) => k.id === config.selectedKeyId) ?? null

  function closeSelection(restoreFocus = false) {
    setConfig((prev) => ({ ...prev, selectedKeyId: null }))
    setAnchor(null)
    setPopoverPos(null)
    if (restoreFocus) lastKeyRef.current?.focus()
  }

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    saveBoards(savedBoards)
  }, [savedBoards])

  useLayoutEffect(() => {
    if (!selectedKey || !anchor) return

    const el = popoverRef.current
    if (!el) return

    function place() {
      if (!el || !anchor) return
      const { width, height } = el.getBoundingClientRect()
      const margin = 12
      const gap = 10

      const left = Math.min(
        Math.max(margin, anchor.left + anchor.width / 2 - width / 2),
        window.innerWidth - width - margin,
      )

      let top = anchor.bottom + gap
      if (
        top + height > window.innerHeight - margin &&
        anchor.top - height - gap >= margin
      ) {
        top = anchor.top - height - gap
      } else {
        top = Math.min(top, window.innerHeight - height - margin)
      }

      setPopoverPos({ left, top })
    }

    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [selectedKey, anchor])

  useEffect(() => {
    if (!config.selectedKeyId && !sourceOpen) return

    function onPointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement
      if (sourceOpen) {
        if (target.closest('.source-panel')) return
        setSourceOpen(false)
        return
      }
      if (target.closest('.keycap') || target.closest('.key-popover')) return
      closeSelection()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (sourceOpen) setSourceOpen(false)
      else closeSelection(true)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [config.selectedKeyId, sourceOpen])

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

  function selectKey(id: string, rect: Anchor) {
    if (config.selectedKeyId === id) {
      closeSelection(true)
      return
    }
    lastKeyRef.current = document.activeElement as HTMLElement | null
    setConfig((prev) => ({ ...prev, selectedKeyId: id }))
    setAnchor(rect)
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

  function applyNextConfig(next: ProjectConfig, boardId: string | null) {
    const clean = snapshot(next)
    setConfig(clean)
    setActiveBoardId(boardId)
    baselineRef.current = clean
    closeSelection()
  }

  function snapshotCurrentInto(boards: SavedBoard[]): SavedBoard[] {
    if (sameConfig(config, baselineRef.current)) return boards

    if (activeBoardId) {
      const existing = boards.find((b) => b.id === activeBoardId)
      if (existing) {
        return boards.map((b) =>
          b.id === activeBoardId
            ? {
                ...b,
                config: {
                  ...snapshot(config),
                  layoutId: b.id,
                  customLayout: { ...layout, id: b.id },
                },
                savedAt: Date.now(),
              }
            : b,
        )
      }
    }

    return [...boards, makeBoard(config, `${layout.name} (custom)`)]
  }

  function handleLayoutChange(layoutId: string) {
    setNotice(null)
    const boards = snapshotCurrentInto(savedBoards)
    setSavedBoards(boards)

    if (layouts.some((l) => l.id === layoutId)) {
      applyNextConfig(createDefaultConfig(layoutId), null)
      return
    }

    const board = boards.find((b) => b.id === layoutId)
    if (board) applyNextConfig(board.config, board.id)
  }

  function renameActiveBoard() {
    if (!activeBoardId) return
    const board = savedBoards.find((b) => b.id === activeBoardId)
    if (!board) return
    const name = window.prompt('Board name', board.name)?.trim()
    if (!name) return
    setSavedBoards((prev) =>
      prev.map((b) => (b.id === board.id ? { ...b, name } : b)),
    )
  }

  function deleteActiveBoard() {
    if (!activeBoardId) return
    const board = savedBoards.find((b) => b.id === activeBoardId)
    if (!board) return
    if (!window.confirm(`Delete "${board.name}"?`)) return
    setSavedBoards((prev) => prev.filter((b) => b.id !== board.id))
    applyNextConfig(createDefaultConfig('km40'), null)
  }

  async function copySource() {
    try {
      await navigator.clipboard.writeText(source)
      setNotice({ text: 'Copied kanata.kbd to clipboard', tone: 'info' })
    } catch {
      setNotice({ text: 'Clipboard unavailable', tone: 'error' })
    }
  }

  function downloadSource() {
    const blob = new Blob([source], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'kanata.kbd'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFile(file: File) {
    setNotice(null)
    try {
      const text = await file.text()
      const name = file.name.replace(/\.kbd$/i, '')
      const { config: imported, warnings } = importKanataConfig(text, { name })

      const id = uniqueId('board')
      const importedLayout = imported.customLayout
      const next: ProjectConfig = {
        ...imported,
        layoutId: id,
        customLayout: importedLayout
          ? { ...importedLayout, id }
          : { ...resolveLayout(imported), id },
        selectedKeyId: null,
      }
      const board = makeBoard(next, name, id)

      setSavedBoards([...snapshotCurrentInto(savedBoards), board])
      setSourceOpen(false)
      applyNextConfig(next, id)
      setNotice({
        text:
          warnings.length > 0
            ? `Imported with notes: ${warnings.join(' · ')}`
            : `Saved "${name}" with ${next.layers.length} layers`,
        tone: 'info',
      })
    } catch (err) {
      setNotice({
        text: err instanceof Error ? err.message : 'Failed to import .kbd',
        tone: 'error',
      })
    }
  }

  const popoverStyle: CSSProperties = {
    visibility: popoverPos ? 'visible' : 'hidden',
    left: popoverPos?.left ?? 0,
    top: popoverPos?.top ?? 0,
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">
            layr<span className="brand__cursor">_</span>
          </span>
          <span className="brand__tag">kanata configurator</span>
        </div>

        <nav className="nav-actions" aria-label="Project actions">
          <label className="layout-picker">
            <span>Board</span>
            <select
              value={activeBoardId ?? config.layoutId}
              onChange={(e) => handleLayoutChange(e.target.value)}
            >
              <optgroup label="Built-in">
                {layouts.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </optgroup>
              {savedBoards.length > 0 && (
                <optgroup label="Saved">
                  {savedBoards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
          {activeBoardId && (
            <>
              <button
                type="button"
                className="nav-btn"
                onClick={renameActiveBoard}
              >
                Rename
              </button>
              <button
                type="button"
                className="nav-btn"
                onClick={deleteActiveBoard}
              >
                Delete
              </button>
            </>
          )}
          <button
            type="button"
            className="nav-btn"
            onClick={() => fileRef.current?.click()}
          >
            Import
          </button>
          <button type="button" className="nav-btn" onClick={() => void copySource()}>
            Copy
          </button>
          <button type="button" className="nav-btn" onClick={downloadSource}>
            Download
          </button>
          <button
            type="button"
            className="nav-btn nav-btn--accent"
            aria-expanded={sourceOpen}
            onClick={() => setSourceOpen(true)}
          >
            Source
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".kbd,text/plain"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
              e.target.value = ''
            }}
          />
        </nav>
      </header>

      {notice && (
        <div
          className={`toast${notice.tone === 'error' ? ' toast--error' : ''}`}
          role="status"
        >
          {notice.text}
        </div>
      )}

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
            onSelectKey={selectKey}
          />
        </section>
      </main>

      {selectedKey && anchor && (
        <div
          ref={popoverRef}
          className="key-popover"
          style={popoverStyle}
          role="dialog"
          aria-label={`Binding for ${selectedKey.label}`}
        >
          <header className="key-popover__header">
            <div>
              <h2>{selectedKey.label}</h2>
              <p>
                matrix <code>{selectedKey.id}</code> · defsrc{' '}
                <code>{selectedKey.defsrc}</code>
              </p>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Close key editor"
              onClick={() => closeSelection(true)}
            >
              ×
            </button>
          </header>
          <ActionPanel
            keyDef={selectedKey}
            action={activeLayer.bindings[selectedKey.id]}
            layers={config.layers}
            onChange={setBinding}
          />
        </div>
      )}

      {sourceOpen && (
        <SourcePanel source={source} onClose={() => setSourceOpen(false)} />
      )}
    </div>
  )
}
