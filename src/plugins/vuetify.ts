/**
 * Vuetify plugin setup.
 *
 * Components/directives are auto-imported by `vite-plugin-vuetify`
 * (see vite.config.ts), so we only need to configure the instance here.
 */
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1867C0',
          secondary: '#424242',
        },
      },
    },
  },
  defaults: {
    VBtn: { rounded: 'lg' },
    VCard: { rounded: 'lg' },
  },
})
