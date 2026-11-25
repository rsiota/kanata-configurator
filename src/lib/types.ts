export type KeyAction =
  | { type: 'key'; code: string }
  | { type: 'transparent' }
  | { type: 'none' }
  | { type: 'layer-toggle'; layer: string }
  | { type: 'layer-switch'; layer: string }
  | {
      type: 'tap-hold'
      tap: KeyAction
      hold: KeyAction
      tapMs: number
      holdMs: number
    }
  | { type: 'multi'; actions: KeyAction[] }
  | { type: 'raw'; expr: string }

export interface PhysicalKey {
  /** Unique id within the layout, e.g. "0,0" */
  id: string
  /** Physical row from the top (0-based) */
  row: number
  /** Matrix column from the keyboard firmware (0-based) */
  col: number
  /** Physical x position in key units — independent of the matrix column */
  x: number
  /** Key unit width (1 = 1u) */
  w: number
  /** Optional label shown on the keycap face */
  label: string
  /** Default Kanata physical key name for defsrc */
  defsrc: string
}

export interface KeyboardLayout {
  id: string
  name: string
  description: string
  /** USB ids when known */
  vendorId?: string
  productId?: string
  keys: PhysicalKey[]
}

export interface Layer {
  id: string
  name: string
  /** Map of physical key id → action */
  bindings: Record<string, KeyAction>
}

export interface ProjectConfig {
  layoutId: string
  layers: Layer[]
  activeLayerId: string
  selectedKeyId: string | null
  /** Optional runtime layout when importing a .kbd that is not a known board */
  customLayout?: KeyboardLayout
}

/** A named board saved in the local library (layout + layers + bindings). */
export interface SavedBoard {
  id: string
  name: string
  config: ProjectConfig
  savedAt: number
}
