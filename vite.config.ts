import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Cropper.js v2 renders as native Web Components (<cropper-canvas>,
          // <cropper-image>, <cropper-selection>, ...). Tell the Vue compiler
          // to treat any `cropper-*` tag as a native custom element instead of
          // trying (and failing) to resolve it as a Vue component.
          isCustomElement: (tag) => tag.startsWith('cropper-'),
        },
      },
    }),
    vueDevTools(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
