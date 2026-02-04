import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './gamemaster-client' // Initialise la connexion au backoffice
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
