import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { applyMonocoTheme, cleanupMonocoTheme } from './features/ui/monoco-theme'

createApp(App).mount('#app')

const root = document.getElementById('app')

if (root) {
  applyMonocoTheme(root)

  const observer = new MutationObserver(() => {
    applyMonocoTheme(root)
  })

  observer.observe(root, { childList: true, subtree: true })

  window.addEventListener(
    'beforeunload',
    () => {
      observer.disconnect()
      cleanupMonocoTheme(root)
    },
    { once: true },
  )
}
