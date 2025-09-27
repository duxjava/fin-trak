import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Создаем корневой элемент
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

// Рендерим приложение
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Обработка ошибок React
window.addEventListener('error', (event) => {
  console.error('React Error Boundary caught an error:', event.error)
})

// Обработка необработанных промисов
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

// Обработка глобальных ошибок
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
})

// Service Worker для PWA (опционально)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Отладочная информация в development режиме
if (import.meta.env.DEV) {
  console.log('🚀 Personal Finance App запущен в режиме разработки')
  console.log('📊 Версия:', import.meta.env.VITE_APP_VERSION || '1.0.0')
  console.log('🔧 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:8080')
}