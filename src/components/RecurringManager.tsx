import { useEffect, useState } from 'react'
import { Trash2, X } from 'lucide-react'
import type { Category, RecurringExpense } from '../types'
import { formatDayLabel, parseISO, todayISO, type RecurrenceFrequency } from '../lib/dates'
import type { RecurringEditScope, RecurringExpenseInput } from '../hooks/useRecurringExpenses'
import { errorMessage } from '../lib/errors'
import { useEscapeClose } from '../hooks/useEscapeClose'
import { DatePicker } from './DatePicker'
import { ConfirmDialog } from './ConfirmDialog'
import { ErrorBanner } from './ErrorBanner'

const fieldClass =
  'bg-void border border-line rounded-none px-3 py-2.5 text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 transition-colors'

const FREQUENCY_LABEL: Record<RecurrenceFrequency, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
}

export function RecurringManager({
  open,
  categories,
  recurringExpenses,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onManageCategories,
}: {
  open: boolean
  categories: Category[]
  recurringExpenses: RecurringExpense[]
  onClose: () => void
  onCreate: (input: RecurringExpenseInput) => Promise<void>
  onUpdate: (id: string, input: RecurringExpenseInput, scope: RecurringEditScope) => Promise<void>
  onDelete: (id: string, scope: RecurringEditScope) => Promise<void>
  onManageCategories: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly')
  const [startDate, setStartDate] = useState(todayISO())
  const [endDate, setEndDate] = useState('')
  const [scope, setScope] = useState<RecurringEditScope>('future')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingSubmitInput, setPendingSubmitInput] = useState<RecurringExpenseInput | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [startPickerOpen, setStartPickerOpen] = useState(false)
  const [endPickerOpen, setEndPickerOpen] = useState(false)

  function resetForm() {
    setSelectedId(null)
    setName('')
    setKind('expense')
    setAmount('')
    setCategoryId('')
    setFrequency('monthly')
    setStartDate(todayISO())
    setEndDate('')
    setScope('future')
  }

  useEffect(() => {
    if (open) resetForm()
    setError(null)
    setPendingSubmitInput(null)
    setConfirmingDelete(false)
    setStartPickerOpen(false)
    setEndPickerOpen(false)
  }, [open])

  // Los datepickers pausan el Escape del modal (igual que confirmingDelete)
  // para que cerrar el calendario no borre el resto del formulario ya tecleado.
  useEscapeClose(
    open && !confirmingDelete && pendingSubmitInput === null && !startPickerOpen && !endPickerOpen,
    onClose,
  )

  if (!open) return null

  const catById = new Map(categories.map((c) => [c.id, c]))
  const filteredCategories = categories.filter((c) => c.kind === kind)

  function selectForEdit(r: RecurringExpense) {
    setSelectedId(r.id)
    setName(r.name)
    setKind(r.amount >= 0 ? 'income' : 'expense')
    setAmount(String(Math.abs(r.amount)))
    setCategoryId(r.category_id ?? '')
    setFrequency(r.frequency)
    setStartDate(r.start_date)
    setEndDate(r.end_date)
    setScope('future')
  }

  async function runSubmit(input: RecurringExpenseInput) {
    setSaving(true)
    setError(null)
    try {
      if (selectedId) {
        await onUpdate(selectedId, input, scope)
      } else {
        await onCreate(input)
      }
      resetForm()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
      setPendingSubmitInput(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numAmount = Math.abs(Number(amount))
    if (!numAmount || !name.trim() || !startDate) return
    const input: RecurringExpenseInput = {
      name: name.trim(),
      amount: kind === 'income' ? numAmount : -numAmount,
      category_id: categoryId || null,
      frequency,
      start_date: startDate,
      end_date: endDate || startDate,
    }
    // "Todas" reescribe transacciones ya pasadas: exige confirmación explícita
    // antes de tocar historial, no solo el aviso pasivo bajo el selector.
    if (selectedId && scope === 'all') {
      setPendingSubmitInput(input)
      return
    }
    await runSubmit(input)
  }

  async function handleConfirmDelete() {
    if (!selectedId) return
    setSaving(true)
    setError(null)
    try {
      await onDelete(selectedId, scope)
      resetForm()
      setConfirmingDelete(false)
    } catch (err) {
      setError(errorMessage(err))
      setConfirmingDelete(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="animate-modal-in bg-panel-raised border border-line rounded-none w-full max-w-3xl shadow-[0_24px_60px_-20px_rgba(0,0,0,0.2)] max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line shrink-0">
          <h2 className="font-display font-semibold text-ink text-sm tracking-wide uppercase">Recurrentes</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onManageCategories}
              className="flex items-center min-h-11 px-2 text-xs font-medium text-ink-faint hover:text-ink transition-colors rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              Editar categorías
            </button>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="flex items-center justify-center w-11 h-11 -mr-2 text-ink-faint hover:text-ink rounded-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <X size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
          <div className="overflow-y-auto p-5 space-y-1.5 min-h-[220px] sm:min-h-0 sm:w-72 sm:shrink-0 sm:border-r sm:border-line">
            {recurringExpenses.length === 0 && (
              <p className="text-sm text-ink-faint text-center py-6">Aún no hay recurrentes.</p>
            )}
            {recurringExpenses.map((r) => {
              const cat = r.category_id ? catById.get(r.category_id) : undefined
              const positive = r.amount >= 0
              return (
                <button
                  key={r.id}
                  onClick={() => selectForEdit(r)}
                  className={`w-full flex items-center gap-3 border rounded-none px-3 py-2 text-left transition-colors ${
                    selectedId === r.id ? 'border-accent bg-accent-dim/30' : 'border-line hover:border-ink-faint'
                  }`}
                >
                  <span
                    className="w-3 h-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor: cat?.bg_color ?? 'var(--color-panel-raised)',
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)',
                    }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-ink truncate">{r.name}</span>
                    <span className="block text-[10px] text-ink-faint truncate">
                      {cat?.name ?? 'Sin categoría'} · {FREQUENCY_LABEL[r.frequency]} ·{' '}
                      {formatDayLabel(parseISO(r.start_date))} – {formatDayLabel(parseISO(r.end_date))}
                    </span>
                  </span>
                  <span className={`font-data text-xs tabular-nums shrink-0 ${positive ? 'text-income' : 'text-expense'}`}>
                    {r.amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })}
                  </span>
                </button>
              )
            })}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-line sm:border-t-0 p-5 space-y-3 flex-1 min-h-0 overflow-y-auto"
          >
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

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nombre (ej. Renta, Netflix)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Monto"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${fieldClass} font-data`}
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint block mb-1">
                Categoría
              </label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${fieldClass} w-full`}>
                <option value="">Sin categoría</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint block mb-1">
                  Frecuencia
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                  className={`${fieldClass} w-full`}
                >
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint block mb-1">
                  Fecha inicio
                </label>
                <DatePicker value={startDate} onChange={setStartDate} onOpenChange={setStartPickerOpen} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint block mb-1">
                Fecha fin (plazo)
              </label>
              <DatePicker value={endDate || startDate} onChange={setEndDate} onOpenChange={setEndPickerOpen} />
            </div>

            {selectedId && (
              <div className="border-t border-line pt-3">
                <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint block mb-1">
                  Aplicar cambios a
                </label>
                <div className="grid grid-cols-2 bg-void border border-line rounded-none p-0.5 gap-0.5">
                  {(['future', 'all'] as const).map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setScope(s)}
                      className={`flex items-center justify-center min-h-11 text-xs font-semibold rounded-none transition-all ${
                        scope === s
                          ? 'bg-accent-dim text-accent shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-accent)_35%,transparent)]'
                          : 'text-ink-soft hover:text-ink'
                      }`}
                    >
                      {s === 'future' ? 'Solo futuras' : 'Todas'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-ink-faint mt-1">Todas también reescribe las transacciones que ya pasaron.</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              {selectedId ? (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 min-h-11 px-2 text-xs font-medium text-danger hover:text-danger/80 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/50 rounded-none"
                  >
                    <Trash2 size={13} strokeWidth={2.2} />
                    Eliminar
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="min-h-11 text-xs font-medium text-ink-soft hover:text-ink transition-colors px-3 rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-accent text-void px-4 min-h-11 text-xs font-semibold uppercase tracking-[0.06em] rounded-none hover:bg-accent-soft transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                    >
                      {saving ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-accent text-void min-h-11 text-xs font-semibold uppercase tracking-[0.06em] rounded-none hover:bg-accent-soft transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  Agregar recurrente
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={pendingSubmitInput !== null}
        title="Aplicar a todas las fechas"
        message="Esto reescribe también las transacciones que ya pasaron para esta recurrencia, no solo las futuras. Los ajustes manuales que hayas hecho a esas transacciones se perderán."
        confirmLabel="Aplicar a todas"
        busy={saving}
        onConfirm={() => pendingSubmitInput && runSubmit(pendingSubmitInput)}
        onCancel={() => setPendingSubmitInput(null)}
      />

      <ConfirmDialog
        open={confirmingDelete}
        title="Eliminar recurrente"
        message={
          scope === 'all'
            ? `¿Eliminar "${name}"? Esto también elimina las transacciones que ya pasaron para esta recurrencia.`
            : `¿Eliminar "${name}"? Se eliminarán sus transacciones futuras; las que ya pasaron se conservan.`
        }
        busy={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  )
}
