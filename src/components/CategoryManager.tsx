import { useEffect, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import type { Category, CategoryKind } from '../types'
import { errorMessage } from '../lib/errors'
import { readableInk } from '../lib/color'
import { useEscapeClose } from '../hooks/useEscapeClose'
import { ConfirmDialog } from './ConfirmDialog'
import { ErrorBanner } from './ErrorBanner'

const fieldClass =
  'bg-void border border-line rounded-none px-3 py-2.5 text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 transition-colors'

export function CategoryManager({
  open,
  categories,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: {
  open: boolean
  categories: Category[]
  onClose: () => void
  onCreate: (c: Omit<Category, 'id' | 'created_at'>) => Promise<void>
  onUpdate: (id: string, patch: Partial<Category>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<CategoryKind>('expense')
  const [color, setColor] = useState('#E8B457')
  const [isMovable, setIsMovable] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setSelectedId(null)
    setName('')
    setKind('expense')
    setColor('#E8B457')
    setIsMovable(true)
  }

  useEffect(() => {
    if (open) resetForm()
    setError(null)
    setDeletingId(null)
  }, [open])

  useEscapeClose(open && deletingId === null, onClose)

  if (!open) return null

  function selectForEdit(c: Category) {
    setSelectedId(c.id)
    setName(c.name)
    setKind(c.kind)
    setColor(c.bg_color)
    setIsMovable(c.is_movable)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      if (selectedId) {
        await onUpdate(selectedId, {
          name: name.trim(),
          kind,
          bg_color: color,
          text_color: readableInk(color),
          is_movable: isMovable,
        })
      } else {
        await onCreate({
          name: name.trim(),
          kind,
          bg_color: color,
          text_color: readableInk(color),
          is_movable: isMovable,
          sort_order: categories.length,
        })
      }
      resetForm()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deletingId) return
    setDeleting(true)
    setError(null)
    try {
      await onDelete(deletingId)
      if (selectedId === deletingId) resetForm()
      setDeletingId(null)
    } catch (err) {
      setError(errorMessage(err))
      setDeletingId(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="animate-modal-in bg-panel-raised border border-line rounded-none w-full max-w-lg shadow-[0_24px_60px_-20px_rgba(0,0,0,0.2)] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <h2 className="font-display font-semibold text-ink text-sm tracking-wide uppercase">Categorías</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex items-center justify-center w-11 h-11 -mr-2 text-ink-faint hover:text-ink rounded-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-1.5">
          {categories.length === 0 && (
            <p className="text-sm text-ink-faint text-center py-6">Aún no hay categorías.</p>
          )}
          {categories.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-3 border rounded-none px-1 transition-colors ${
                selectedId === c.id ? 'border-accent bg-accent-dim/30' : 'border-line hover:border-ink-faint'
              }`}
            >
              <button
                type="button"
                onClick={() => selectForEdit(c)}
                className="flex-1 min-w-0 flex items-center gap-3 px-2 py-2 text-left"
              >
                <span
                  className="w-3 h-3 shrink-0 rounded-full"
                  style={{ backgroundColor: c.bg_color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)' }}
                />
                <span className="flex-1 text-sm text-ink truncate">{c.name}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-faint shrink-0">
                  {c.kind === 'income' ? 'Ingreso' : 'Gasto'}
                </span>
              </button>
              <button
                onClick={() => setDeletingId(c.id)}
                className="flex items-center justify-center w-11 h-11 text-ink-faint hover:text-danger rounded-none transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/50"
                title="Eliminar categoría"
                aria-label={`Eliminar categoría ${c.name}`}
              >
                <Trash2 size={14} strokeWidth={2.2} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-line p-5 space-y-3 shrink-0">
          {error && <ErrorBanner message={error} />}

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nombre de categoría"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as CategoryKind)}
              className={fieldClass}
            >
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint block mb-1">
                Color
              </label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-9 bg-void border border-line rounded-none p-0.5"
              />
            </div>
            <label className="min-h-9 flex items-center gap-1.5 text-[11px] text-ink-soft">
              <input
                type="checkbox"
                checked={isMovable}
                onChange={(e) => setIsMovable(e.target.checked)}
                className="accent-accent w-3.5 h-3.5"
              />
              Movible (reprogramable)
            </label>
          </div>

          <div className="flex items-center gap-3 rounded-none border border-line px-3 py-2.5">
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="w-3 h-3 shrink-0 rounded-full"
                style={{ backgroundColor: color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)' }}
              />
              <span className="text-sm text-ink truncate">{name.trim() || 'Vista previa'}</span>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 rounded-none border border-line-soft bg-void px-2 py-1">
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.18)' }}
              />
              <span
                className={`font-data text-xs font-normal tabular-nums ${kind === 'income' ? 'text-income' : 'text-expense'}`}
              >
                {kind === 'income' ? '+$100' : '-$100'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedId && (
              <button
                type="button"
                onClick={resetForm}
                className="min-h-11 text-xs font-medium text-ink-soft hover:text-ink transition-colors px-3 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-accent text-void min-h-11 text-xs font-semibold uppercase tracking-[0.06em] rounded-none hover:bg-accent-soft transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {saving ? 'Guardando…' : selectedId ? 'Guardar cambios' : 'Agregar categoría'}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={deletingId !== null}
        title="Eliminar categoría"
        message={`¿Eliminar "${categories.find((c) => c.id === deletingId)?.name ?? ''}"? Las transacciones que ya la usan quedarán sin categoría.`}
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  )
}
