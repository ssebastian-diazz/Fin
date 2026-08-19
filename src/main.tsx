import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { syncServerClock } from './lib/dates'

function mount() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Corrige el reloj del dispositivo contra la hora real del servidor antes de
// montar la app (con un tope de 1.5s por si no hay red), para que "hoy" no
// dependa de que el reloj local esté bien puesto.
Promise.race([syncServerClock(), new Promise((resolve) => setTimeout(resolve, 1500))]).then(mount)
