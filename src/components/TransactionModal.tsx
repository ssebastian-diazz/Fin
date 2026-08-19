import { useEffect, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import type { Category, Transaction } from '../types'
import { todayISO } from '../lib/dates'
import { errorMessage } from '../lib/errors'
import { useEscapeClose } from '../hooks/useEscapeClose'
import { DatePicker } from './DatePicker'
import { ConfirmDialog } from './ConfirmDialog'
import { ErrorBanner } from './ErrorBanner'

type Mode = 'create' | 'edit'

const fieldClass =
  'w-full mt-1.5 bg-void border border-line rounded-none px-3 py-2.5 text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 transition-colors'

export function TransactionModal({
  open,
  mode,
  categories,
  initial,
  initialDate,
  initialDescription,
  initialKind,
  onClose,
  onCreateOnce,
  onSave,
  onDelete,
}: {
  open: boolean
  mode: Mode
  categories: Category[]
  initial?: Transaction | null
  initialDate?: string | null
  initialDescription?: string | null
  initialKind?: 'income' | 'expense' | null
  onClose: () => void
  onCreateOnce: (input: {
    date: string
    amount: number
    description: string
    category_id: string | null
  }) => Promise<void>
  onSave: (id: string, patch: Partial<Transaction>) => Promise<void>
  onDelete: (tx: Transaction) => Promise<void>
}) {
  const [date, setDate] = useState(todayISO())
  const [kind, setKind] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  useEffect(() => {
    if (initial) {
      setDate(initial.date)
      setKind(initial.amount >= 0 ? 'income' : 'expense')
      setAmount(String(Math.abs(initial.amount)))
      setDescription(initial.description ?? '')
      setCategoryId(initial.category_id ?? '')
    } else if (open) {
      setDate(initialDate ?? todayISO())
      setKind(initialKind ?? 'expense')
      setAmount('')
      setDescription(initialDescription ?? '')
      setCategoryId('')
    }
    setError(null)
    setConfirmingDelete(false)
    setDatePickerOpen(false)
  }, [initial, open, initialDate, initialDescription, initialKind])

  // El datepicker pausa el Escape del modal (igual que confirmingDelete) para
  // que cerrar el calendario no borre el resto del formulario ya tecleado.
  useEscapeClose(open && !confirmingDelete && !datePickerOpen, onClose)

  if (!open) return null

  const filteredCategories = categories.filter((c) => c.kind === kind)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numAmount = Math.abs(Number(amount))
    if (!numAmount) return
    const signedAmount = kind === 'income' ? numAmount : -numAmount
    setSaving(true)
    setError(null)
    try {
      if (mode === 'edit' && initial) {
        await onSave(initial.id, {
          date,
          amount: signedAmount,
          description,
          category_id: categoryId || null,
        })
      } else {
        await onCreateOnce({
          date,
          amount: signedAmount,
          description,
          category_id: categoryId || null,
        })
      }
      onClose()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!initial) return
    setDeleting(true)
    setError(null)
    try {
      await onDelete(initial)
      setConfirmingDelete(false)
      onClose()
    } catch (err) {
      setError(errorMessage(err))
      setConfirmingDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="animate-modal-in bg-panel-raised border border-line rounded-none w-full max-w-md shadow-[0_24px_60px_-20px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <h2 className="font-display font-semibold text-ink text-sm tracking-wide uppercase">
            {mode === 'edit' ? 'Editar transacción' : 'Nueva transacción'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex items-center justify-center w-11 h-11 -mr-2 text-ink-faint hover:text-ink rounded-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <ErrorBanner message={error} />}

          <div className="grid grid-cols-2 bg-void border border-line rounded-none p-0.5 gap-0.5">
            {(['expense', 'income'] as const).map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => {
                  setKind(k)
                  setCategoryId('')
                }}
                className={`flex items-center justify-center min-h-11 text-xs font-semibold uppercase tracking-[0.08em] rounded-none transition-all ${
                  kind === k
                    ? k === 'income'
                      ? 'bg-income-dim text-income shadow-[inset_0_0_0_1px_rgba(14,154,98,0.35)]'
                      : 'bg-expense-dim text-expense shadow-[inset_0_0_0_1px_rgba(194,59,99,0.35)]'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                {k === 'income' ? 'Ingreso' : 'Gasto'}
              </button>
            ))}
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">Monto</label>
            <input
              type="number"
              step="0.01"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${fieldClass} font-data text-lg`}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={fieldClass}
              placeholder="Ej. Uber al trabajo"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Sin categoría</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tx-date" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
              Fecha
            </label>
            <DatePicker id="tx-date" value={date} onChange={setDate} onOpenChange={setDatePickerOpen} />
          </div>

          <div className="flex items-center justify-between pt-2">
            {mode === 'edit' && initial && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="inline-flex items-center gap-1.5 min-h-11 px-2 text-xs font-medium text-danger hover:text-danger/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/50 rounded-none"
              >
                <Trash2 size={13} strokeWidth={2.2} />
                Eliminar
              </button>
            )}
            <div className="flex-1" />
            <button
              type="submit"
              disabled={saving}
              className="bg-accent text-void px-4 min-h-11 text-xs font-semibold uppercase tracking-[0.06em] rounded-none hover:bg-accent-soft transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Eliminar transacción"
        message={
          initial?.description
            ? `¿Eliminar "${initial.description}"? Esta acción no se puede deshacer.`
            : '¿Eliminar esta transacción? Esta acción no se puede deshacer.'
        }
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  )
}
