import type { Adjustments, FilterName } from '@/types/operations'

/**
 * Builds a CSS `filter` value from the current adjustments + named filter.
 *
 * This exact string is used in two places:
 *  1. As the inline `style.filter` on the live <cropper-image> preview.
 *  2. As `context.filter` inside Cropper.js v2's `$toCanvas({ beforeDraw })`
 *     hook when producing the final export.
 *
 * Using one function for both guarantees the exported pixels match what
 * the user saw on screen - there is no separate "export renderer" to drift
 * out of sync with the preview.
 */
export function buildFilterString(adjustments: Adjustments, filter: FilterName): string {
  const parts = [
    `brightness(${adjustments.brightness}%)`,
    `contrast(${adjustments.contrast}%)`,
    `saturate(${adjustments.saturate}%)`,
  ]

  if (filter === 'grayscale') parts.push('grayscale(100%)')
  if (filter === 'sepia') parts.push('sepia(100%)')

  return parts.join(' ')
}
