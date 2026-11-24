import { getLayout, layouts } from '../layouts'
import type { KeyboardLayout, ProjectConfig } from './types'

export function resolveLayout(config: ProjectConfig): KeyboardLayout {
  if (config.customLayout && config.layoutId === config.customLayout.id) {
    return config.customLayout
  }
  return getLayout(config.layoutId)
}

export function availableLayouts(config: ProjectConfig): KeyboardLayout[] {
  if (config.customLayout) {
    return [...layouts, config.customLayout]
  }
  return layouts
}
