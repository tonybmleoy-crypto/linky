import './platform-env'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './site.css'
import { Landing } from './landing/Landing'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Landing />
  </StrictMode>
)
