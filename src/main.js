import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import 'semantic-ui-css/semantic.css'
import router from './Router'
import store from './store'

import './css/root.css'
import './css/common.css'
import './css/header.css'
import './css/customAntd.css'

import VueLazyload from 'vue3-lazyload'

// Create app instance
const app = createApp(App)

// Use plugins
app.use(Antd)
app.use(router)
app.use(store)
app.use(VueLazyload, {
  preLoad: 3,
  attempt: 3,
})

app.mount('#app')