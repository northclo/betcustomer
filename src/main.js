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
import './css/custom.css'
// import './css/tailwind.css'

import VueLazyload from 'vue3-lazyload'
import socketPlugin from './plugins/socket';

const app = createApp(App)
app.use(socketPlugin);

app.use(Antd)
app.use(router)
app.use(store)
app.use(VueLazyload, {
  preLoad: 3,
  attempt: 3,
})

const originalConsoleError = console.error;
console.error = (...args) => {
  const errorMessage = args.join(' ');
  if (errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
      errorMessage.includes('ResizeObserver loop limit exceeded')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

window.addEventListener('error', (e) => {
  const errorMessage = e.message || e.error?.message || String(e.error || '');
  if (errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
      errorMessage.includes('ResizeObserver loop limit exceeded')) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
  }
}, true);

window.addEventListener('unhandledrejection', (e) => {
  const errorMessage = e.reason?.message || String(e.reason || '');
  if (errorMessage.includes('ResizeObserver') || 
      errorMessage.includes('ResizeObserver loop')) {
    e.preventDefault();
  }
});

if (typeof window !== 'undefined') {
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (message && typeof message === 'string' && 
        (message.includes('ResizeObserver loop completed with undelivered notifications') ||
         message.includes('ResizeObserver loop limit exceeded'))) {
      return true;
    }
    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };
}

app.mount('#app')