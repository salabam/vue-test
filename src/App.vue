<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import ImageDropzone from '@/components/ImageDropzone.vue'
import CropperStage from '@/components/CropperStage.vue'
import AdjustmentPanel from '@/components/AdjustmentPanel.vue'
import ExportPanel from '@/components/ExportPanel.vue'

const store = useEditorStore()

// CropperStage exposes its <cropper-selection> ref - we need it here because
// the final export ($toCanvas) has to happen against the live DOM element.
const stageRef = ref<InstanceType<typeof CropperStage> | null>(null)

async function handleExportImage(): Promise<void> {
  const selectionEl = stageRef.value?.selectionRef
  const imageEl = stageRef.value?.imageRef
  if (!selectionEl) return
  await store.exportImage(selectionEl, imageEl)
}

function handleExportJson(): void {
  store.exportManifest()
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary" flat>
      <v-app-bar-title>
        <v-icon icon="mdi-image-edit-outline" class="mr-2" />
        Image Editor
      </v-app-bar-title>
      <template v-if="store.hasImage" #append>
        <v-btn
          variant="text"
          prepend-icon="mdi-file-image-plus-outline"
          @click="store.clearImage()"
        >
          New image
        </v-btn>
      </template>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <v-container fluid class="py-6">
        <ImageDropzone v-if="!store.hasImage" class="mx-auto" style="max-width: 640px" />

        <v-row v-else>
          <v-col cols="12" md="8">
            <v-card variant="outlined" class="pa-3">
              <CropperStage ref="stageRef" />
            </v-card>
          </v-col>

          <v-col cols="12" md="4" class="d-flex flex-column ga-4">
            <AdjustmentPanel />
            <ExportPanel @export-image="handleExportImage" @export-json="handleExportJson" />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
