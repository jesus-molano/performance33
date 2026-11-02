import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigErrorScreen } from './components/ConfigErrorScreen'
import { BACKEND } from './config/backend'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

const render = (app: ReactNode) => createRoot(root).render(<StrictMode>{app}</StrictMode>)

// A half-configured build must not even load the app: it could fall back to the demo login.
if (BACKEND.mode === 'invalid') render(<ConfigErrorScreen />)
else void import('./App').then(({ App }) => render(<App />))
