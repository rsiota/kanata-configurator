import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ActionPanel } from './components/ActionPanel'
import { Keyboard } from './components/Keyboard'
import { LayerTabs, type LayerAction } from './components/LayerTabs'
import { SourcePanel } from './components/SourcePanel'
import { layouts } from './layouts'
import {
  loadActive,
  loadBoards,
  saveActive,
  saveBoards,
} from './lib/boardLibrary'
import { createDefaultConfig } from './lib/defaultConfig'
import { exportKanataConfig } from './lib/kanataExport'
import { importKanataConfig } from './lib/kanataImport'
import { resolveLayout } from './lib/resolveLayout'
import type { KeyAction, Layer, ProjectConfig, SavedBoard } from './lib/types'

type Anchor = Pick<
  DOMRect,
  'left' | 'top' | 'right' | 'bottom' | 'width' | 'height'
>
type Position = { left: number; top: number }
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

function placePopover(el: HTMLElement, anchor: Anchor): Position {
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

  return { left, top }
}

function clearLayerRefs(action: KeyAction, name: string): KeyAction {
  switch (action.type) {
    case 'layer-toggle':
    case 'layer-switch':
      return action.layer === name ? { type: 'transparent' } : action
    case 'tap-hold':
      return {
        ...action,
        tap: clearLayerRefs(action.tap, name),
        hold: clearLayerRefs(action.hold, name),
      }
    case 'multi':
      return {
        ...action,
        actions: action.actions.map((a) => clearLayerRefs(a, name)),
      }
    default:
      return action
  }
}

function renameLayerRefs(
  action: KeyAction,
  from: string,
  to: string,
): KeyAction {
  switch (action.type) {
    case 'layer-toggle':
    case 'layer-switch':
      return { ...action, layer: action.layer === from ? to : action.layer }
    case 'tap-hold':
      return {
        ...action,
        tap: renameLayerRefs(action.tap, from, to),
        hold: renameLayerRefs(action.hold, from, to),
      }
    case 'multi':
      return {
        ...action,
        actions: action.actions.map((a) => renameLayerRefs(a, from, to)),
      }
    default:
      return action
  }
}

export default function App() {
  const [restored] = useState(loadActive)
  const [config, setConfig] = useState<ProjectConfig>(
    () => restored?.config ?? createDefaultConfig('km40'),
  )
  const [notice, setNotice] = useState<Notice>(null)
  const [colorCoded, setColorCoded] = useState(true)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [popoverPos, setPopoverPos] = useState<Position | null>(null)
  const [layerEditor, setLayerEditor] = useState<{
    id: string
    anchor: Anchor
  } | null>(null)
  const [layerDraft, setLayerDraft] = useState('')
  const [layerPopoverPos, setLayerPopoverPos] = useState<Position | null>(null)
  const [layerMenu, setLayerMenu] = useState<{
    id: string
    anchor: Anchor
  } | null>(null)
  const [layerMenuPos, setLayerMenuPos] = useState<Position | null>(null)
  const [boardEditor, setBoardEditor] = useState<{ anchor: Anchor } | null>(null)
  const [boardDraft, setBoardDraft] = useState('')
  const [boardPopoverPos, setBoardPopoverPos] = useState<Position | null>(null)
  const [savedBoards, setSavedBoards] = useState<SavedBoard[]>(loadBoards)
  const [activeBoardId, setActiveBoardId] = useState<string | null>(
    restored?.boardId ?? null,
  )

  const popoverRef = useRef<HTMLDivElement>(null)
  const layerPopoverRef = useRef<HTMLDivElement>(null)
  const layerMenuRef = useRef<HTMLDivElement>(null)
  const boardPopoverRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastKeyRef = useRef<HTMLElement | null>(null)
  const lastBoardTriggerRef = useRef<HTMLElement | null>(null)
  const lastLayerTriggerRef = useRef<HTMLElement | null>(null)
  const lastLayerMenuTriggerRef = useRef<HTMLElement | null>(null)
  const baselineRef = useRef<ProjectConfig>(snapshot(config))

  const layout = useMemo(() => resolveLayout(config), [config])
  const source = useMemo(() => exportKanataConfig(config), [config])
  const layerNumbers = useMemo(
    () =>
      Object.fromEntries(
        config.layers.map((layer, index) => [layer.name, index + 1]),
      ),
    [config.layers],
  )

  const activeLayer =
    config.layers.find((l) => l.id === config.activeLayerId) ??
    config.layers[0]
  const selectedKey =
    layout.keys.find((k) => k.id === config.selectedKeyId) ?? null
  const activeBoard = activeBoardId
    ? savedBoards.find((b) => b.id === activeBoardId) ?? null
    : null
  const menuLayer = layerMenu
    ? config.layers.find((l) => l.id === layerMenu.id) ?? null
    : null
  const menuIndex = menuLayer
    ? config.layers.findIndex((l) => l.id === menuLayer.id)
    : -1

  function closeSelection(restoreFocus = false) {
    setConfig((prev) => ({ ...prev, selectedKeyId: null }))
    setAnchor(null)
    setPopoverPos(null)
    if (restoreFocus) lastKeyRef.current?.focus()
  }

  function closeLayerEditor(restoreFocus = false) {
    setLayerEditor(null)
    setLayerPopoverPos(null)
    if (restoreFocus) lastLayerTriggerRef.current?.focus()
  }

  function closeLayerMenu(restoreFocus = false) {
    setLayerMenu(null)
    setLayerMenuPos(null)
    if (restoreFocus) lastLayerMenuTriggerRef.current?.focus()
  }

  function closeBoardEditor(restoreFocus = false) {
    setBoardEditor(null)
    setBoardPopoverPos(null)
    if (restoreFocus) lastBoardTriggerRef.current?.focus()
  }

  function openBoardEditor(rect: Anchor) {
    if (!activeBoard) return
    lastBoardTriggerRef.current = document.activeElement as HTMLElement | null
    setBoardDraft(activeBoard.name)
    setBoardEditor({ anchor: rect })
    closeSelection()
    closeLayerEditor()
    closeLayerMenu()
  }

  function saveBoardRename() {
    if (!activeBoard) return
    const name = boardDraft.trim()
    if (!name) {
      setNotice({ text: 'Board name cannot be empty', tone: 'error' })
      return
    }

    if (name !== activeBoard.name) {
      setSavedBoards((prev) =>
        prev.map((b) => (b.id === activeBoard.id ? { ...b, name } : b)),
      )
      setNotice({ text: `Renamed board to "${name}"`, tone: 'info' })
    }

    closeBoardEditor(true)
  }

  function openLayerEditor(
    id: string,
    rect: Anchor,
    trigger?: HTMLElement | null,
  ) {
    lastLayerTriggerRef.current =
      trigger ?? (document.activeElement as HTMLElement | null)
    setLayerDraft(config.layers.find((l) => l.id === id)?.name ?? '')
    setLayerEditor({ id, anchor: rect })
    closeSelection()
    closeLayerMenu()
    closeBoardEditor()
  }

  function handleLayerAction(id: string, action: LayerAction, rect: Anchor) {
    if (action === 'menu') {
      lastLayerMenuTriggerRef.current = document.activeElement as HTMLElement | null
      setLayerMenu({ id, anchor: rect })
      closeSelection()
      closeLayerEditor()
      closeBoardEditor()
      return
    }

    if (action === 'rename') {
      openLayerEditor(id, rect, lastLayerMenuTriggerRef.current)
      return
    }

    if (action === 'delete') {
      const layer = config.layers.find((l) => l.id === id)
      if (!layer) return
      if (config.layers.length === 1) {
        setNotice({ text: 'A project needs at least one layer', tone: 'error' })
        closeLayerMenu(true)
        return
      }
      if (!window.confirm(`Delete layer "${layer.name}"?`)) {
        closeLayerMenu(true)
        return
      }
      setConfig((prev) => {
        const layers = prev.layers.filter((l) => l.id !== id)
        return {
          ...prev,
          layers: layers.map((l) => ({
            ...l,
            bindings: Object.fromEntries(
              Object.entries(l.bindings).map(([key, binding]) => [
                key,
                clearLayerRefs(binding, layer.name),
              ]),
            ),
          })),
          activeLayerId:
            prev.activeLayerId === id ? layers[0].id : prev.activeLayerId,
        }
      })
      setNotice({
        text: `Deleted "${layer.name}"; bindings pointing to it were cleared`,
        tone: 'info',
      })
      closeLayerMenu(true)
      return
    }

    setConfig((prev) => {
      const index = prev.layers.findIndex((l) => l.id === id)
      if (index === -1 || index === prev.layers.length - 1) return prev
      const layers = [...prev.layers]
      if (action === 'end') {
        const [moved] = layers.splice(index, 1)
        layers.push(moved)
      } else {
        const next = layers[index + 1]
        layers[index + 1] = layers[index]
        layers[index] = next
      }
      return { ...prev, layers }
    })
    closeLayerMenu(true)
  }

  function saveLayerRename() {
    if (!layerEditor) return
    const name = layerDraft.trim()
    if (!name) {
      setNotice({ text: 'Layer name cannot be empty', tone: 'error' })
      return
    }

    const layer = config.layers.find((l) => l.id === layerEditor.id)
    if (!layer) return

    if (
      layer.name !== name &&
      config.layers.some((l) => l.id !== layer.id && l.name === name)
    ) {
      setNotice({ text: 'A layer with that name already exists', tone: 'error' })
      return
    }

    if (layer.name !== name) {
      const from = layer.name
      setConfig((prev) => ({
        ...prev,
        layers: prev.layers.map((l) => ({
          ...l,
          name: l.id === layer.id ? name : l.name,
          bindings: Object.fromEntries(
            Object.entries(l.bindings).map(([key, action]) => [
              key,
              renameLayerRefs(action, from, name),
            ]),
          ),
        })),
      }))
      setNotice({ text: `Renamed layer to "${name}"`, tone: 'info' })
    }

    closeLayerEditor(true)
  }

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    saveBoards(savedBoards)
  }, [savedBoards])

  useEffect(() => {
    saveActive({ config: snapshot(config), boardId: activeBoardId })
  }, [config, activeBoardId])

  useLayoutEffect(() => {
    if (!selectedKey || !anchor) return
    const el = popoverRef.current
    if (!el) return

    function place() {
      if (el && anchor) setPopoverPos(placePopover(el, anchor))
    }

    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [selectedKey, anchor])

  useLayoutEffect(() => {
    if (!layerEditor) return
    const el = layerPopoverRef.current
    if (!el) return

    function place() {
      if (el && layerEditor) {
        setLayerPopoverPos(placePopover(el, layerEditor.anchor))
      }
    }

    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [layerEditor])

  useLayoutEffect(() => {
    if (!boardEditor) return
    const el = boardPopoverRef.current
    if (!el) return

    function place() {
      if (el && boardEditor) {
        setBoardPopoverPos(placePopover(el, boardEditor.anchor))
      }
    }

    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [boardEditor])

  useLayoutEffect(() => {
    if (!layerMenu) return
    const el = layerMenuRef.current
    if (!el) return

    function place() {
      if (el && layerMenu) {
        setLayerMenuPos(placePopover(el, layerMenu.anchor))
      }
    }

    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [layerMenu])

  useEffect(() => {
    if (
      !config.selectedKeyId &&
      !layerEditor &&
      !layerMenu &&
      !boardEditor &&
      !sourceOpen
    ) {
      return
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement
      if (sourceOpen) {
        if (target.closest('.source-panel')) return
        setSourceOpen(false)
        return
      }
      if (
        target.closest('.keycap') ||
        target.closest('.layer-tabs__chevron') ||
        target.closest('.board-stage__title-btn') ||
        target.closest('.popover')
      ) {
        return
      }
      closeSelection()
      closeLayerEditor()
      closeLayerMenu()
      closeBoardEditor()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (sourceOpen) setSourceOpen(false)
      else if (boardEditor) closeBoardEditor(true)
      else if (layerEditor) closeLayerEditor(true)
      else if (layerMenu) closeLayerMenu(true)
      else closeSelection(true)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [config.selectedKeyId, layerEditor, layerMenu, boardEditor, sourceOpen])

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
    closeLayerEditor()
    closeLayerMenu()
    closeBoardEditor()
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

  function deleteActiveBoard() {
    if (!activeBoardId) return
    const board = savedBoards.find((b) => b.id === activeBoardId)
    if (!board) return
    if (!window.confirm(`Delete "${board.name}"?`)) return
    setSavedBoards((prev) => prev.filter((b) => b.id !== board.id))
    closeBoardEditor()
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

  const layerPopoverStyle: CSSProperties = {
    visibility: layerPopoverPos ? 'visible' : 'hidden',
    left: layerPopoverPos?.left ?? 0,
    top: layerPopoverPos?.top ?? 0,
  }

  const layerMenuStyle: CSSProperties = {
    visibility: layerMenuPos ? 'visible' : 'hidden',
    left: layerMenuPos?.left ?? 0,
    top: layerMenuPos?.top ?? 0,
  }

  const boardPopoverStyle: CSSProperties = {
    visibility: boardPopoverPos ? 'visible' : 'hidden',
    left: boardPopoverPos?.left ?? 0,
    top: boardPopoverPos?.top ?? 0,
  }

  return (
    <div className={colorCoded ? 'app app--color' : 'app'}>
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
            <button
              type="button"
              className="nav-btn"
              onClick={deleteActiveBoard}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            className="nav-btn nav-btn--toggle"
            aria-pressed={colorCoded}
            title="Blue: dual function · Green: modifiers · Amber: layer keys"
            onClick={() => setColorCoded((on) => !on)}
          >
            Colour code
          </button>
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
            <h1 className={activeBoard ? 'board-stage__title' : undefined}>
              {activeBoard ? (
                <button
                  type="button"
                  className="board-stage__title-btn"
                  onClick={(e) =>
                    openBoardEditor(e.currentTarget.getBoundingClientRect())
                  }
                  title="Rename board"
                >
                  {activeBoard.name}
                </button>
              ) : (
                layout.name
              )}
            </h1>
            <p>{activeBoard ? `${layout.name} · ` : ''}{layout.description}</p>
          </div>

          <LayerTabs
            layers={config.layers}
            activeLayerId={config.activeLayerId}
            openLayerMenuId={layerMenu?.id ?? null}
            onSelect={(id) =>
              setConfig((prev) => ({ ...prev, activeLayerId: id }))
            }
            onAdd={addLayer}
            onLayerAction={handleLayerAction}
          />

          <Keyboard
            layout={layout}
            bindings={activeLayer.bindings}
            layerNumbers={layerNumbers}
            selectedKeyId={config.selectedKeyId}
            onSelectKey={selectKey}
          />
        </section>
      </main>

      {selectedKey && anchor && (
        <div
          ref={popoverRef}
          className="popover key-popover"
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

      {layerEditor && (
        <div
          ref={layerPopoverRef}
          className="popover key-popover layer-popover"
          style={layerPopoverStyle}
          role="dialog"
          aria-label="Rename layer"
        >
          <header className="key-popover__header">
            <div>
              <h2>Rename layer</h2>
              <p>Bindings that point here follow the new name.</p>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Close layer editor"
              onClick={() => closeLayerEditor(true)}
            >
              ×
            </button>
          </header>
          <label className="field">
            <span>Layer name</span>
            <input
              autoFocus
              value={layerDraft}
              onChange={(e) => setLayerDraft(e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  saveLayerRename()
                }
              }}
            />
          </label>
          <div className="popover-actions">
            <button
              type="button"
              className="nav-btn"
              onClick={() => closeLayerEditor(true)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="nav-btn nav-btn--accent"
              onClick={saveLayerRename}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {boardEditor && activeBoard && (
        <div
          ref={boardPopoverRef}
          className="popover key-popover board-popover"
          style={boardPopoverStyle}
          role="dialog"
          aria-label="Rename board"
        >
          <header className="key-popover__header">
            <div>
              <h2>Rename board</h2>
              <p>Only the saved board name changes; the .kbd export is unaffected.</p>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Close board editor"
              onClick={() => closeBoardEditor(true)}
            >
              ×
            </button>
          </header>
          <label className="field">
            <span>Board name</span>
            <input
              autoFocus
              value={boardDraft}
              onChange={(e) => setBoardDraft(e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  saveBoardRename()
                }
              }}
            />
          </label>
          <div className="popover-actions">
            <button
              type="button"
              className="nav-btn"
              onClick={() => closeBoardEditor(true)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="nav-btn nav-btn--accent"
              onClick={saveBoardRename}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {layerMenu && menuLayer && (
        <div
          ref={layerMenuRef}
          className="popover layer-menu"
          style={layerMenuStyle}
          role="menu"
          aria-label={`Options for ${menuLayer.name}`}
        >
          <div className="layer-menu__title">{menuLayer.name}</div>
          <button
            type="button"
            role="menuitem"
            className="layer-menu__item"
            onClick={() =>
              handleLayerAction(
                menuLayer.id,
                'rename',
                layerMenu.anchor,
              )
            }
          >
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            className="layer-menu__item"
            onClick={() =>
              handleLayerAction(menuLayer.id, 'delete', layerMenu.anchor)
            }
          >
            Delete
          </button>
          <button
            type="button"
            role="menuitem"
            className="layer-menu__item"
            disabled={menuIndex === config.layers.length - 1}
            onClick={() =>
              handleLayerAction(menuLayer.id, 'right', layerMenu.anchor)
            }
          >
            Move right
          </button>
          <button
            type="button"
            role="menuitem"
            className="layer-menu__item"
            disabled={menuIndex === config.layers.length - 1}
            onClick={() =>
              handleLayerAction(menuLayer.id, 'end', layerMenu.anchor)
            }
          >
            Move end
          </button>
        </div>
      )}

      {sourceOpen && (
        <SourcePanel source={source} onClose={() => setSourceOpen(false)} />
      )}
    </div>
  )
}
