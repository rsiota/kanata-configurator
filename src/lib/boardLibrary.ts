import type { ProjectConfig, SavedBoard } from './types'

const STORAGE_KEY = 'layr.boards.v1'
const ACTIVE_KEY = 'layr.active.v1'

function isSavedBoard(value: unknown): value is SavedBoard {
  if (!value || typeof value !== 'object') return false
  const board = value as Partial<SavedBoard>
  const config = board.config
  return (
    typeof board.id === 'string' &&
    typeof board.name === 'string' &&
    !!config &&
    typeof config.layoutId === 'string' &&
    Array.isArray(config.layers) &&
    !!config.customLayout &&
    config.customLayout.id === config.layoutId &&
    Array.isArray(config.customLayout.keys)
  )
}

export function loadBoards(): SavedBoard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isSavedBoard) : []
  } catch {
    return []
  }
}

export function saveBoards(boards: SavedBoard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards))
  } catch {
    // Storage may be unavailable (private mode, quota); keep the session usable.
  }
}

export interface ActiveState {
  config: ProjectConfig
  boardId: string | null
}

export function loadActive(): ActiveState | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const active = parsed as Partial<ActiveState>
    if (!active.config || !Array.isArray(active.config.layers)) return null
    return {
      config: active.config,
      boardId: typeof active.boardId === 'string' ? active.boardId : null,
    }
  } catch {
    return null
  }
}

export function saveActive(state: ActiveState): void {
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage failures; the in-memory session still works.
  }
}
