import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'

import App from './App.vue'
import router from './router'
import { setupDirectives } from '@/directives'
import './assets/styles/global.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ArcoVue)
setupDirectives(app)

app.mount('#app')
