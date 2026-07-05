import { DEFAULT_ADJUSTMENTS } from '@/types/operations'
import type { OperationManifest } from '@/types/operations'
import { buildFilterString } from '@/utils/filterString'

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('The image could not be loaded.'))
    img.src = src
  })
}

/** Very small runtime shape check - enough to fail loudly on a bad file. */
export function isOperationManifest(value: unknown): value is OperationManifest {
  if (!value || typeof value !== 'object') return false
  const manifest = value as Record<string, unknown>
  return manifest.version === 1 && Array.isArray(manifest.operations)
}

/**
 * Replays a manifest's operations against a source image and returns the
 * resulting canvas. This intentionally does NOT touch the live Cropper.js
 * selection/preview - it draws straight from the original image using only
 * the numbers in the manifest, so it doubles as proof that the JSON export
 * is a faithful, self-contained recipe rather than something that only
 * "works" alongside extra hidden state.
 *
 * Step order mirrors the manifest's `operations` array:
 *  1. crop   - a plain drawImage crop, unfiltered (coordinates are already
 *              absolute pixels in the original image, so no scaling math
 *              is needed here).
 *  2. adjust/filter - drawn again onto a second canvas with `context.filter`
 *              built by the exact same `buildFilterString()` helper the
 *              live app uses for preview and export, so the result matches
 *              pixel-for-pixel (mod browser filter rounding).
 */
export async function replayManifest(
  sourceImageUrl: string,
  manifest: OperationManifest,
): Promise<HTMLCanvasElement> {
  const image = await loadImageElement(sourceImageUrl)

  const cropOp = manifest.operations.find((op) => op.type === 'crop')
  const sx = cropOp?.type === 'crop' ? cropOp.x : 0
  const sy = cropOp?.type === 'crop' ? cropOp.y : 0
  const sw = cropOp?.type === 'crop' ? cropOp.width : image.naturalWidth
  const sh = cropOp?.type === 'crop' ? cropOp.height : image.naturalHeight

  const cropCanvas = document.createElement('canvas')
  cropCanvas.width = sw
  cropCanvas.height = sh
  const cropCtx = cropCanvas.getContext('2d')
  if (!cropCtx) throw new Error('Canvas 2D context is unavailable.')
  cropCtx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh)

  const adjustOp = manifest.operations.find((op) => op.type === 'adjust')
  const filterOp = manifest.operations.find((op) => op.type === 'filter')

  const filterString = buildFilterString(
    adjustOp?.type === 'adjust'
      ? { brightness: adjustOp.brightness, contrast: adjustOp.contrast, saturate: adjustOp.saturate }
      : DEFAULT_ADJUSTMENTS,
    filterOp?.type === 'filter' ? filterOp.name : 'none',
  )

  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = sw
  finalCanvas.height = sh
  const ctx = finalCanvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is unavailable.')
  ctx.filter = filterString
  ctx.drawImage(cropCanvas, 0, 0)

  return finalCanvas
}
