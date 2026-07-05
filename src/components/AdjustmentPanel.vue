<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import type { FilterName } from '@/types/operations'

const store = useEditorStore()

const filters: Array<{ value: FilterName; label: string; icon: string }> = [
  { value: 'none', label: 'None', icon: 'mdi-close' },
  { value: 'grayscale', label: 'Greyscale', icon: 'mdi-invert-colors-off' },
  { value: 'sepia', label: 'Sepia', icon: 'mdi-white-balance-sunny' },
]
</script>

<template>
  <v-card variant="outlined" :disabled="!store.hasImage">
    <v-card-title class="text-subtitle-1">Adjustments</v-card-title>
    <v-card-text>
      <div class="mb-4">
        <div class="d-flex justify-space-between text-body-2 mb-n2">
          <span>Brightness</span>
          <span class="text-medium-emphasis">{{ store.adjustments.brightness }}%</span>
        </div>
        <v-slider
          :model-value="store.adjustments.brightness"
          min="0"
          max="200"
          step="1"
          color="primary"
          hide-details
          @update:model-value="(v) => store.setAdjustment('brightness', v)"
        />
      </div>

      <div class="mb-4">
        <div class="d-flex justify-space-between text-body-2 mb-n2">
          <span>Contrast</span>
          <span class="text-medium-emphasis">{{ store.adjustments.contrast }}%</span>
        </div>
        <v-slider
          :model-value="store.adjustments.contrast"
          min="0"
          max="200"
          step="1"
          color="primary"
          hide-details
          @update:model-value="(v) => store.setAdjustment('contrast', v)"
        />
      </div>

      <div class="mb-2">
        <div class="d-flex justify-space-between text-body-2 mb-n2">
          <span>Saturation</span>
          <span class="text-medium-emphasis">{{ store.adjustments.saturate }}%</span>
        </div>
        <v-slider
          :model-value="store.adjustments.saturate"
          min="0"
          max="200"
          step="1"
          color="primary"
          hide-details
          @update:model-value="(v) => store.setAdjustment('saturate', v)"
        />
      </div>

      <v-divider class="my-3" />

      <div class="text-body-2 mb-2">Filter</div>
      <v-btn-toggle
        :model-value="store.filter"
        color="primary"
        density="comfortable"
        mandatory
        @update:model-value="(v) => store.setFilter(v)"
      >
        <v-btn v-for="f in filters" :key="f.value" :value="f.value" :prepend-icon="f.icon">
          {{ f.label }}
        </v-btn>
      </v-btn-toggle>
    </v-card-text>
  </v-card>
</template>