import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'finanzas:now-color'
export const DEFAULT_NOW = '#EDE4FA'

function readStoredNow(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_NOW
  } catch {
    return DEFAULT_NOW
  }
}

/** Color del resaltado "actual" (día de hoy, semana y mes en curso): persiste
 * en localStorage y se aplica como variable CSS en :root, de donde lo lee `bg-now`. */
export function useNowColor() {
  const [now, setNowState] = useState(readStoredNow)

  useEffect(() => {
    document.documentElement.style.setProperty('--color-now', now)
  }, [now])

  const setNow = useCallback((hex: string) => {
    setNowState(hex)
    try {
      localStorage.setItem(STORAGE_KEY, hex)
    } catch {
      // almacenamiento no disponible: el color queda aplicado solo en memoria
    }
  }, [])

  return { now, setNow }
}
