import type { KeyAction, Layer, ProjectConfig } from './types'
import { getLayout } from '../layouts'

function passthroughBindings(
  layoutId: string,
): Record<string, KeyAction> {
  const layout = getLayout(layoutId)
  const bindings: Record<string, KeyAction> = {}
  for (const key of layout.keys) {
    bindings[key.id] = { type: 'key', code: key.defsrc }
  }
  return bindings
}

export function createDefaultConfig(layoutId = 'km40'): ProjectConfig {
  const base: Layer = {
    id: 'base',
    name: 'Base',
    bindings: passthroughBindings(layoutId),
  }

  const nav: Layer = {
    id: 'nav',
    name: 'Nav',
    bindings: Object.fromEntries(
      getLayout(layoutId).keys.map((key) => [
        key.id,
        { type: 'transparent' } satisfies KeyAction,
      ]),
    ),
  }

  // Seed a useful tap-hold on Caps-equivalent Esc for demo feel on 40%
  // Esc stays Esc; Fn holds Nav layer
  base.bindings['3,8'] = {
    type: 'layer-toggle',
    layer: 'nav',
  }

  return {
    layoutId,
    layers: [base, nav],
    activeLayerId: base.id,
    selectedKeyId: null,
  }
}
