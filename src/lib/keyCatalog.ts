import type { SymbolLayout } from './displaySettings'
import { keyLabel } from './keyDisplay'

export const KEY_GROUPS = [
  'Letters',
  'Numbers',
  'Symbols',
  'Shifted symbols',
  'Modifiers',
  'Navigation',
  'Function',
] as const

export type KeyGroup = (typeof KEY_GROUPS)[number]

export interface KeyOption {
  code: string
  group: KeyGroup
  keywords: string
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')
const NUMBERS = '1234567890'.split('')
const SYMBOLS = ['grv', '-', '=', '[', ']', '\\', ';', "'", ',', '.', '/', 'non_us_pound']

const SHIFTED_BASES = [
  'grv',
  ...NUMBERS,
  '-',
  '=',
  '[',
  ']',
  '\\',
  ';',
  "'",
  ',',
  '.',
  '/',
]

const MODIFIERS = [
  'lsft',
  'rsft',
  'lctl',
  'rctl',
  'lalt',
  'ralt',
  'lmet',
  'rmet',
  'caps',
]

const NAVIGATION = [
  'esc',
  'tab',
  'ret',
  'bspc',
  'spc',
  'del',
  'ins',
  'home',
  'end',
  'pgup',
  'pgdn',
  'up',
  'down',
  'left',
  'right',
]

const FUNCTION = Array.from({ length: 12 }, (_, i) => `f${i + 1}`)

const SHIFTED_KEYWORDS: Record<string, string> = {
  'S-grv': 'tilde not grave',
  'S-1': 'exclamation bang',
  'S-2': 'at sign double quote',
  'S-3': 'pound sterling hash number three',
  'S-4': 'dollar',
  'S-5': 'percent',
  'S-6': 'caret',
  'S-7': 'ampersand',
  'S-8': 'asterisk star',
  'S-9': 'open parenthesis',
  'S-0': 'close parenthesis',
  'S--': 'underscore',
  'S-=': 'plus',
  'S-[': 'open curly brace',
  'S-]': 'close curly brace',
  'S-\\': 'pipe',
  'S-;': 'colon',
  "S-'": 'at sign double quote apostrophe',
  'S-,': 'less than',
  'S-.': 'greater than',
  'S-/': 'question mark',
}

function options(codes: string[], group: KeyGroup): KeyOption[] {
  return codes.map((code) => ({ code, group, keywords: '' }))
}

/** Ordered catalog for the visual key picker. */
export function keyCatalog(): KeyOption[] {
  return [
    ...options(LETTERS, 'Letters'),
    ...options(NUMBERS, 'Numbers'),
    ...options(SYMBOLS, 'Symbols').map((option) => ({
      ...option,
      keywords:
        option.code === 'non_us_pound'
          ? 'hash pound tilde iso pound non us'
          : option.code === 'grv'
            ? 'grave backtick tick'
            : option.code === 'ret'
              ? 'return enter'
              : '',
    })),
    ...SHIFTED_BASES.map((base) => {
      const code = `S-${base}`
      return {
        code,
        group: 'Shifted symbols' as const,
        keywords: SHIFTED_KEYWORDS[code] ?? 'shifted symbol',
      }
    }),
    ...options(MODIFIERS, 'Modifiers'),
    ...options(NAVIGATION, 'Navigation').map((option) => ({
      ...option,
      keywords:
        option.code === 'ret'
          ? 'return enter'
          : option.code === 'bspc'
            ? 'backspace delete'
            : option.code === 'spc'
              ? 'spacebar'
              : option.code === 'lmet'
                ? 'command windows super meta'
                : option.code === 'rmet'
                  ? 'command windows super meta'
                  : '',
    })),
    ...options(FUNCTION, 'Function'),
  ]
}

export function keySearchText(
  option: KeyOption,
  symbolLayout: SymbolLayout,
): string {
  return [
    option.code,
    keyLabel(option.code, symbolLayout),
    option.keywords,
    option.group,
  ]
    .join(' ')
    .toLowerCase()
}
