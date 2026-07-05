<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useEditorStore } from '@/stores/editor'
import type {
  CropperImageElement,
  CropperSelectionElement,
} from '@/types/cropper-elements'

const store = useEditorStore()

const imageRef = ref<CropperImageElement | null>(null)
const selectionRef = ref<CropperSelectionElement | null>(null)

const stageKey = ref(0)

const previewingOriginal = ref(false)
const previewFilter = computed(() => (previewingOriginal.value ? 'none' : store.cssFilter))

const canvasAspectStyle = computed(() => ({
  aspectRatio:
    store.originalWidth && store.originalHeight
      ? `${store.originalWidth} / ${store.originalHeight}`
      : '4 / 3',
}))

function commitNaturalRect(): void {
  const imageEl = imageRef.value
  const selectionEl = selectionRef.value
  if (!imageEl || !selectionEl || !imageEl.naturalWidth) return

  const imageRect = imageEl.getBoundingClientRect()
  const selectionRect = selectionEl.getBoundingClientRect()
  if (imageRect.width === 0 || imageRect.height === 0) return

  const scaleX = imageEl.naturalWidth / imageRect.width
  const scaleY = imageEl.naturalHeight / imageRect.height

  store.setCrop({
    x: Math.max(0, Math.round((selectionRect.left - imageRect.left) * scaleX)),
    y: Math.max(0, Math.round((selectionRect.top - imageRect.top) * scaleY)),
    width: Math.round(selectionRect.width * scaleX),
    height: Math.round(selectionRect.height * scaleY),
  })
}

async function initSelection(): Promise<void> {
  await nextTick()
  const imageEl = imageRef.value
  const selectionEl = selectionRef.value
  if (!imageEl || !selectionEl) return

  await imageEl.$ready(() => {
    selectionEl.aspectRatio = 1
    selectionEl.$center()
    commitNaturalRect()
  })
}

watch(
  () => store.originalUrl,
  (url) => {
    if (url) initSelection()
  },
)

function zoomIn(): void {
  imageRef.value?.$zoom(0.1)
  nextTick(commitNaturalRect)
}

function zoomOut(): void {
  imageRef.value?.$zoom(-0.1)
  nextTick(commitNaturalRect)
}

function handleReset(): void {
  store.resetEdits()
  stageKey.value += 1
  nextTick(initSelection)
}

defineExpose({ selectionRef, imageRef })
</script>

<template>
  <div class="cropper-stage">
    <div v-if="!store.hasImage" class="cropper-stage__empty text-medium-emphasis">
      Upload an image to start editing.
    </div>

    <cropper-canvas
      v-else
      :key="stageKey"
      class="cropper-stage__canvas"
      initial-space="contain"
      :style="canvasAspectStyle"
    >
      <cropper-image
        ref="imageRef"
        :src="store.originalUrl ?? undefined"
        alt="Uploaded image"
        scalable
        translatable
        :style="{ filter: previewFilter }"
      ></cropper-image>
      <cropper-shade hidden></cropper-shade>
      <cropper-handle action="move" plain></cropper-handle>
      <cropper-selection
        ref="selectionRef"
        initial-coverage="0.8"
        movable
        resizable
        outlined
        zoomable
        @change="commitNaturalRect"
        v-show="!previewingOriginal"
      >
        <cropper-grid role="grid" covered rows="3" columns="3"></cropper-grid>
        <cropper-crosshair centered></cropper-crosshair>
        <cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle>
        <cropper-handle action="n-resize"></cropper-handle>
        <cropper-handle action="e-resize"></cropper-handle>
        <cropper-handle action="s-resize"></cropper-handle>
        <cropper-handle action="w-resize"></cropper-handle>
        <cropper-handle action="ne-resize"></cropper-handle>
        <cropper-handle action="nw-resize"></cropper-handle>
        <cropper-handle action="se-resize"></cropper-handle>
        <cropper-handle action="sw-resize"></cropper-handle>
      </cropper-selection>
    </cropper-canvas>

    <div v-if="store.hasImage" class="d-flex align-center justify-space-between mt-3 flex-wrap ga-2">
      <div class="d-flex ga-2">
        <v-btn icon="mdi-magnify-plus-outline" size="small" variant="tonal" @click="zoomIn" />
        <v-btn icon="mdi-magnify-minus-outline" size="small" variant="tonal" @click="zoomOut" />
      </div>

      <div class="d-flex ga-2">
        <v-btn
          size="small"
          variant="tonal"
          prepend-icon="mdi-eye-outline"
          @mousedown="previewingOriginal = true"
          @mouseup="previewingOriginal = false"
          @mouseleave="previewingOriginal = false"
          @touchstart.prevent="previewingOriginal = true"
          @touchend.prevent="previewingOriginal = false"
        >
          Hold to view original
        </v-btn>
        <v-btn
          size="small"
          variant="tonal"
          color="warning"
          prepend-icon="mdi-restore"
          @click="handleReset"
        >
          Reset
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cropper-stage__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 320px;
  border: 2px dashed rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

.cropper-stage__canvas {
  width: 100%;
  max-height: 65vh;
  display: block;
  /* Override Cropper.js v2's default (dark) canvas fill so any empty space
     around the image reads as neutral, not "darkened". */
  background-image: repeating-linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), repeating-linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc);
  background-image: repeating-conic-gradient(#ccc 0 25%, #fff 0 50%);
  background-position: 0 0, 0.5rem 0.5rem;
  background-size: 1rem 1rem;
  background-repeat: repeat;
}
cropper-shade {
  opacity: 0;
}
[action$=-resize]:after {
  background-color: rgb(0 61 121);
}
</style>
