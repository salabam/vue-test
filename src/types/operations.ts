/**
 * The full non-destructive edit state kept in the store.
 *
 * Nothing here ever touches the original image bytes - it's purely a
 * "recipe" that is applied on top of the untouched original whenever we
 * need to render a preview or produce a final export.
 */
export interface CropRect {
  /** All values are in ORIGINAL IMAGE pixel space (not screen/canvas space). */
  x: number
  y: number
  width: number
  height: number
}

export interface Adjustments {
  /** 100 = neutral / unchanged, matches the CSS filter percentage scale. */
  brightness: number
  contrast: number
  saturate: number
}

export type FilterName = 'none' | 'grayscale' | 'sepia'

export interface EditState {
  crop: CropRect | null
  adjustments: Adjustments
  filter: FilterName
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
}

export const DEFAULT_EDIT_STATE: EditState = {
  crop: null,
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  filter: 'none',
}

/**
 * Serializable description of the edits, in the order they must be
 * replayed to reproduce the exported image from the original file.
 *
 * This is the "bonus" JSON manifest shape. Design notes:
 * - `source` records the original dimensions/name purely for context and
 *   sanity-checking on replay (e.g. warn if you point it at a differently
 *   sized image); it is not required to perform the replay itself.
 * - `crop` coordinates are absolute pixels in the *original* image, so
 *   replay is independent of whatever size the editor was displayed at.
 * - `adjust` and `filter` are expressed with the same values used to build
 *   the CSS `filter` string driving the live preview - the exact same
 *   string is handed to the canvas 2D context (`context.filter = ...`) at
 *   export time, so preview and export are guaranteed to match pixel-for-
 *   pixel (mod any browser filter-implementation nuance).
 */
export interface OperationManifest {
  version: 1
  source: {
    name: string
    width: number
    height: number
  }
  operations: Array<
    | { type: 'crop'; x: number; y: number; width: number; height: number }
    | { type: 'adjust'; brightness: number; contrast: number; saturate: number }
    | { type: 'filter'; name: FilterName }
  >
}
