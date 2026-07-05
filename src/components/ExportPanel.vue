<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { isOperationManifest } from '@/utils/replay'

const store = useEditorStore()
const emit = defineEmits<{ 'export-image': []; 'export-json': [] }>()

const isExporting = ref(false)
const isReplaying = ref(false)
const replayError = ref('')
const manifestInput = ref<HTMLInputElement | null>(null)

async function handleExportImage(): Promise<void> {
  isExporting.value = true
  try {
    emit('export-image')
  } finally {
    setTimeout(() => (isExporting.value = false), 400)
  }
}

function openManifestPicker(): void {
  replayError.value = ''
  manifestInput.value?.click()
}

async function handleManifestFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  replayError.value = ''
  isReplaying.value = true
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    if (!isOperationManifest(parsed)) {
      throw new Error("That file doesn't look like an operations manifest.")
    }
    await store.replayManifestOntoOriginal(parsed)
  } catch (error) {
    replayError.value = error instanceof Error ? error.message : 'Could not replay that file.'
  } finally {
    isReplaying.value = false
  }
}
</script>

<template>
  <v-card variant="outlined" :disabled="!store.hasImage">
    <v-card-title class="text-subtitle-1">Export</v-card-title>
    <v-card-text class="d-flex flex-column ga-2">
      <v-btn
        color="primary"
        prepend-icon="mdi-download"
        :loading="isExporting"
        block
        @click="handleExportImage"
      >
        Download image
      </v-btn>
    </v-card-text>
  </v-card>
</template>
