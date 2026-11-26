const STORAGE_KEY = 'layr.display'

export type SymbolLayout = 'uk' | 'us'

export interface DisplaySettings {
  /** Which shifted-symbol legends to show on keycaps. */
  symbolLayout: SymbolLayout
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  symbolLayout: 'uk',
}

export function loadDisplaySettings(): DisplaySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_DISPLAY_SETTINGS
    const parsed = JSON.parse(raw) as Partial<DisplaySettings>
    return {
      symbolLayout:
        parsed.symbolLayout === 'us' || parsed.symbolLayout === 'uk'
          ? parsed.symbolLayout
          : DEFAULT_DISPLAY_SETTINGS.symbolLayout,
    }
  } catch {
    return DEFAULT_DISPLAY_SETTINGS
  }
}

export function saveDisplaySettings(settings: DisplaySettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
