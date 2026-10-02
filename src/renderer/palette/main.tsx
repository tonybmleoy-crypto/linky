import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/app.css'
import { Palette } from './Palette'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Palette />
  </StrictMode>
)
