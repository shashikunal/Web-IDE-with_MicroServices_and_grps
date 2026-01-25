import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { setupMonacoEnv } from './lib/monaco'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import './index.css'
import App from './App.tsx'

// Initialize Monaco Environment (Workers & Local Instance)
setupMonacoEnv();
loader.config({ monaco });

// Suppress Vite HMR WebSocket error - this is a known development-only issue
// that doesn't affect application functionality
if (import.meta.env.DEV) {
  const originalError = console.error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'object' &&
      args[0]?.type === 'error' &&
      args[0]?.target?.constructor?.name === 'WebSocket'
    ) {
      return
    }
    originalError.apply(console, args)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
