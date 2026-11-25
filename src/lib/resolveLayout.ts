import { getLayout } from '../layouts'
import type { KeyboardLayout, ProjectConfig } from './types'

export function resolveLayout(config: ProjectConfig): KeyboardLayout {
  if (config.customLayout && config.layoutId === config.customLayout.id) {
    return config.customLayout
  }
  return getLayout(config.layoutId)
}
