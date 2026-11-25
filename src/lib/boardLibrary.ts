import type { SavedBoard } from './types'

const STORAGE_KEY = 'layr.boards.v1'

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
