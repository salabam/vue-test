import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import vuetify from './plugins/vuetify'

// Registers <cropper-canvas>, <cropper-image>, <cropper-selection>, etc.
// as native custom elements (Cropper.js v2 side-effect import).
import 'cropperjs'

const app = createApp(App)

app.use(createPinia())
app.use(vuetify)

app.mount('#app')
