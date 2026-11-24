import type { KeyboardLayout } from '../lib/types'
import { km40 } from './km40'

export const layouts: KeyboardLayout[] = [km40]

export function getLayout(id: string): KeyboardLayout {
  const layout = layouts.find((l) => l.id === id)
  if (!layout) {
    throw new Error(`Unknown layout: ${id}`)
  }
  return layout
}

export { km40 }
