import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { Adjustments, CropRect, FilterName, OperationManifest } from '@/types/operations'
import { DEFAULT_ADJUSTMENTS } from '@/types/operations'
import { buildFilterString } from '@/utils/filterString'
import { canvasToBlob, downloadBlob, downloadJson, stripExtension } from '@/utils/download'
import { replayManifest } from '@/utils/replay'
import type { CropperImageElement, CropperSelectionElement } from '@/types/cropper-elements'

export const useEditorStore = defineStore('editor', () => {
  // --- Original source (never mutated) ------------------------------------
  const originalFile = ref<File | null>(null)
  const originalUrl = ref<string | null>(null)
  const originalWidth = ref(0)
  const originalHeight = ref(0)

  // --- Non-destructive edit state ------------------------------------------
  const crop = ref<CropRect | null>(null)
  const adjustments = ref<Adjustments>({ ...DEFAULT_ADJUSTMENTS })
  const filter = ref<FilterName>('none')

  const hasImage = computed(() => originalUrl.value !== null)

  /** The single CSS filter string driving both live preview and export. */
  const cssFilter = computed(() => buildFilterString(adjustments.value, filter.value))

  const isEdited = computed(() => {
    const a = adjustments.value
    return (
      crop.value !== null ||
      filter.value !== 'none' ||
      a.brightness !== 100 ||
      a.contrast !== 100 ||
      a.saturate !== 100
    )
  })

  function loadImage(file: File): void {
    if (originalUrl.value) URL.revokeObjectURL(originalUrl.value)

    originalFile.value = file
    originalUrl.value = URL.createObjectURL(file)

    const probe = new Image()
    probe.onload = () => {
      originalWidth.value = probe.naturalWidth
      originalHeight.value = probe.naturalHeight
    }
    probe.src = originalUrl.value

    resetEdits()
  }

  function setCrop(rect: CropRect): void {
    crop.value = rect
  }

  function setAdjustment(key: keyof Adjustments, value: number): void {
    adjustments.value[key] = value
  }

  function setFilter(name: FilterName): void {
    filter.value = name
  }

  /** Resets edits (crop/adjustments/filter) but keeps the loaded original. */
  function resetEdits(): void {
    crop.value = null
    adjustments.value = { ...DEFAULT_ADJUSTMENTS }
    filter.value = 'none'
  }

  /** Fully clears the loaded image too. */
  function clearImage(): void {
    if (originalUrl.value) URL.revokeObjectURL(originalUrl.value)
    originalFile.value = null
    originalUrl.value = null
    originalWidth.value = 0
    originalHeight.value = 0
    resetEdits()
  }

  function buildManifest(): OperationManifest {
    const operations: OperationManifest['operations'] = []

    if (crop.value) {
      operations.push({ type: 'crop', ...crop.value })
    }

    operations.push({
      type: 'adjust',
      brightness: adjustments.value.brightness,
      contrast: adjustments.value.contrast,
      saturate: adjustments.value.saturate,
    })

    if (filter.value !== 'none') {
      operations.push({ type: 'filter', name: filter.value })
    }

    return {
      version: 1,
      source: {
        name: originalFile.value?.name ?? 'image',
        width: originalWidth.value,
        height: originalHeight.value,
      },
      operations,
    }
  }

  /**
   * Renders the final image: takes the current crop selection from the
   * Cropper.js selection element and re-applies our filter string during
   * the canvas draw step, so the exported pixels match the live preview.
   */
  async function exportImage(selectionEl: CropperSelectionElement, imageEl: CropperImageElement): Promise<void> {
    if (!originalFile.value) return

    const filterString = cssFilter.value
    const scaleRatio = imageEl.$image.naturalWidth / imageEl.getBoundingClientRect().width;
    const realWidth = selectionEl.width * scaleRatio;
    const realHeight = selectionEl.height * scaleRatio;
    const canvas = await selectionEl.$toCanvas({
      width: realWidth,
      height: realHeight,
      beforeDraw(context) {
        context.filter = filterString
      },
    })

    const mimeType = originalFile.value.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const blob = await canvasToBlob(canvas, mimeType, 0.92)
    const ext = mimeType === 'image/png' ? 'png' : 'jpg'
    downloadBlob(blob, `${stripExtension(originalFile.value.name)}-edited.${ext}`)
  }

  function exportManifest(): void {
    if (!originalFile.value) return
    downloadJson(buildManifest(), `${stripExtension(originalFile.value.name)}-operations.json`)
  }

  /**
   * Uses a previously exported (or hand-written) operations manifest,
   * replaying it directly against the currently loaded original image and
   * downloading the result. This deliberately bypasses the live Cropper.js
   * selection entirely - it's a standalone proof that the manifest alone is
   * enough to reproduce the edit.
   */
  async function replayManifestOntoOriginal(manifest: OperationManifest): Promise<void> {
    if (!originalUrl.value || !originalFile.value) return
    const canvas = await replayManifest(originalUrl.value, manifest)
    const mimeType = originalFile.value.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const blob = await canvasToBlob(canvas, mimeType, 0.92)
    const ext = mimeType === 'image/png' ? 'png' : 'jpg'
    downloadBlob(blob, `${stripExtension(originalFile.value.name)}-replayed.${ext}`)
  }

  return {
    originalFile,
    originalUrl,
    originalWidth,
    originalHeight,
    crop,
    adjustments,
    filter,
    hasImage,
    isEdited,
    cssFilter,
    loadImage,
    setCrop,
    setAdjustment,
    setFilter,
    resetEdits,
    clearImage,
    buildManifest,
    exportImage,
    exportManifest,
    replayManifestOntoOriginal,
  }
})
