import { TriangleAlert } from 'lucide-react'
import { useEscapeClose } from '../hooks/useEscapeClose'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  useEscapeClose(open, onCancel)

  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4"
      onClick={onCancel}
    >
      <div
        className="animate-modal-in bg-panel-raised border border-line rounded-none w-full max-w-sm shadow-[0_24px_60px_-20px_rgba(0,0,0,0.2)] p-5"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-8 h-8 rounded-full bg-danger-dim text-danger flex items-center justify-center">
            <TriangleAlert size={16} strokeWidth={2.2} />
          </span>
          <div className="flex-1 min-w-0 pt-1">
            <h3 id="confirm-dialog-title" className="font-display font-semibold text-ink text-sm">
              {title}
            </h3>
            <p id="confirm-dialog-message" className="text-xs text-ink-soft mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-ink-soft hover:text-ink transition-colors px-3 py-2 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            disabled={busy}
            className="bg-danger text-void px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] rounded-none hover:bg-danger/90 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/50"
          >
            {busy ? 'Eliminando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
