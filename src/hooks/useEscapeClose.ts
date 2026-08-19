import { useEffect } from 'react'

/** Cierra con Escape. `active` se apaga mientras un diálogo anidado (ej. ConfirmDialog)
 * está abierto, para que Escape cierre la capa de arriba primero, no todo a la vez. */
export function useEscapeClose(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active, onClose])
}
