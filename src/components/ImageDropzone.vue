<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const errorMessage = ref('')

function openBrowser(): void {
  fileInput.value?.click()
}

function acceptFile(file: File | undefined): void {
  errorMessage.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Please choose an image file.'
    return
  }
  store.loadImage(file)
}

function onInputChange(event: Event): void {
  const target = event.target as HTMLInputElement
  acceptFile(target.files?.[0])
  target.value = ''
}

function onDrop(event: DragEvent): void {
  isDragging.value = false
  acceptFile(event.dataTransfer?.files?.[0])
}
</script>

<template>
  <v-card
    class="dropzone"
    :class="{ 'dropzone--active': isDragging }"
    variant="outlined"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
    @click="openBrowser"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="d-none"
      @change="onInputChange"
    />
    <v-icon icon="mdi-tray-arrow-up" size="40" color="primary" class="mb-2" />
    <div class="text-body-1 font-weight-medium">Drop an image here, or click to browse</div>
    <div class="text-caption text-medium-emphasis">PNG, JPG</div>
    <v-alert v-if="errorMessage" type="error" density="compact" class="mt-3" variant="tonal">
      {{ errorMessage }}
    </v-alert>
  </v-card>
</template>

<style scoped>
.dropzone {
  padding: 40px 24px;
  text-align: center;
  cursor: pointer;
  border-style: dashed !important;
  border-width: 2px !important;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.dropzone--active {
  background-color: rgba(24, 103, 192, 0.08);
  border-color: rgb(var(--v-theme-primary)) !important;
}
</style>
