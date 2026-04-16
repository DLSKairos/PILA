import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Registrar Service Worker con auto-reload al detectar nueva versión
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        // Cuando el SW nuevo está listo para activarse, recargar la página
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            // SW nuevo activado + había un SW anterior = hay una nueva versión
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              window.location.reload()
            }
          })
        })
      })
      .catch(console.error)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
