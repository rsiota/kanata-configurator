import type { KeyboardLayout } from '../lib/types'

/**
 * MMD KM40 physical layout (44 keys, 4×12 matrix with gaps).
 * Matrix positions match the corrected VIA definition
 * (right spacebar at 3,6 — not duplicated 3,5).
 *
 * `col` is the firmware matrix column; `x` is the physical position on the
 * board. They differ on wide keys and on the bottom row.
 */
export const km40: KeyboardLayout = {
  id: 'km40',
  name: 'KM40',
  description: 'MMD KM40 — 40% wireless (44 keys)',
  vendorId: '0x28E9',
  productId: '0x3199',
  keys: [
    // Row 0 — 13u
    { id: '0,0', row: 0, col: 0, x: 0, w: 1.5, label: 'Esc', defsrc: 'esc' },
    { id: '0,1', row: 0, col: 1, x: 1.5, w: 1, label: 'Q', defsrc: 'q' },
    { id: '0,2', row: 0, col: 2, x: 2.5, w: 1, label: 'W', defsrc: 'w' },
    { id: '0,3', row: 0, col: 3, x: 3.5, w: 1, label: 'E', defsrc: 'e' },
    { id: '0,4', row: 0, col: 4, x: 4.5, w: 1, label: 'R', defsrc: 'r' },
    { id: '0,5', row: 0, col: 5, x: 5.5, w: 1, label: 'T', defsrc: 't' },
    { id: '0,6', row: 0, col: 6, x: 6.5, w: 1, label: 'Y', defsrc: 'y' },
    { id: '0,7', row: 0, col: 7, x: 7.5, w: 1, label: 'U', defsrc: 'u' },
    { id: '0,8', row: 0, col: 8, x: 8.5, w: 1, label: 'I', defsrc: 'i' },
    { id: '0,9', row: 0, col: 9, x: 9.5, w: 1, label: 'O', defsrc: 'o' },
    { id: '0,10', row: 0, col: 10, x: 10.5, w: 1, label: 'P', defsrc: 'p' },
    { id: '0,11', row: 0, col: 11, x: 11.5, w: 1.5, label: 'Bksp', defsrc: 'bspc' },

    // Row 1 — 13u; no physical key at 1,10 (absorbed into Enter)
    { id: '1,0', row: 1, col: 0, x: 0, w: 1.75, label: 'Tab', defsrc: 'tab' },
    { id: '1,1', row: 1, col: 1, x: 1.75, w: 1, label: 'A', defsrc: 'a' },
    { id: '1,2', row: 1, col: 2, x: 2.75, w: 1, label: 'S', defsrc: 's' },
    { id: '1,3', row: 1, col: 3, x: 3.75, w: 1, label: 'D', defsrc: 'd' },
    { id: '1,4', row: 1, col: 4, x: 4.75, w: 1, label: 'F', defsrc: 'f' },
    { id: '1,5', row: 1, col: 5, x: 5.75, w: 1, label: 'G', defsrc: 'g' },
    { id: '1,6', row: 1, col: 6, x: 6.75, w: 1, label: 'H', defsrc: 'h' },
    { id: '1,7', row: 1, col: 7, x: 7.75, w: 1, label: 'J', defsrc: 'j' },
    { id: '1,8', row: 1, col: 8, x: 8.75, w: 1, label: 'K', defsrc: 'k' },
    { id: '1,9', row: 1, col: 9, x: 9.75, w: 1, label: 'L', defsrc: 'l' },
    { id: '1,11', row: 1, col: 11, x: 10.75, w: 2.25, label: 'Enter', defsrc: 'ret' },

    // Row 2 — 13u
    { id: '2,0', row: 2, col: 0, x: 0, w: 1.25, label: 'Shift', defsrc: 'lsft' },
    { id: '2,1', row: 2, col: 1, x: 1.25, w: 1, label: 'Z', defsrc: 'z' },
    { id: '2,2', row: 2, col: 2, x: 2.25, w: 1, label: 'X', defsrc: 'x' },
    { id: '2,3', row: 2, col: 3, x: 3.25, w: 1, label: 'C', defsrc: 'c' },
    { id: '2,4', row: 2, col: 4, x: 4.25, w: 1, label: 'V', defsrc: 'v' },
    { id: '2,5', row: 2, col: 5, x: 5.25, w: 1, label: 'B', defsrc: 'b' },
    { id: '2,6', row: 2, col: 6, x: 6.25, w: 1, label: 'N', defsrc: 'n' },
    { id: '2,7', row: 2, col: 7, x: 7.25, w: 1, label: 'M', defsrc: 'm' },
    { id: '2,8', row: 2, col: 8, x: 8.25, w: 1, label: ',', defsrc: ',' },
    { id: '2,9', row: 2, col: 9, x: 9.25, w: 1, label: '.', defsrc: '.' },
    { id: '2,10', row: 2, col: 10, x: 10.25, w: 1, label: '/', defsrc: '/' },
    { id: '2,11', row: 2, col: 11, x: 11.25, w: 1.75, label: 'Shift', defsrc: 'rsft' },

    // Row 3 — 13u; matrix columns are not physical x positions here
    { id: '3,0', row: 3, col: 0, x: 0, w: 1.25, label: 'Ctrl', defsrc: 'lctl' },
    { id: '3,1', row: 3, col: 1, x: 1.25, w: 1, label: 'Alt', defsrc: 'lalt' },
    { id: '3,2', row: 3, col: 2, x: 2.25, w: 1.25, label: 'Meta', defsrc: 'lmet' },
    { id: '3,5', row: 3, col: 5, x: 3.5, w: 2.5, label: 'Space', defsrc: 'spc' },
    { id: '3,8', row: 3, col: 8, x: 6, w: 1, label: 'Fn', defsrc: 'f24' },
    { id: '3,6', row: 3, col: 6, x: 7, w: 2.5, label: 'Space', defsrc: 'f23' },
    { id: '3,9', row: 3, col: 9, x: 9.5, w: 1.25, label: 'Meta', defsrc: 'rmet' },
    { id: '3,10', row: 3, col: 10, x: 10.75, w: 1, label: 'Alt', defsrc: 'ralt' },
    { id: '3,11', row: 3, col: 11, x: 11.75, w: 1.25, label: 'Ctrl', defsrc: 'rctl' },
  ],
}
