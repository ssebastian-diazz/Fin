import { useMemo, useState } from 'react'
import { Plus, Repeat } from 'lucide-react'
import { BASE_RIGHT_YEAR, LEFT_BOUND, Ledger } from './components/Ledger'
import { TransactionModal } from './components/TransactionModal'
import { CategoryManager } from './components/CategoryManager'
import { RecurringManager } from './components/RecurringManager'
import { SettingsPanel } from './components/SettingsPanel'
import { Statistics } from './components/Statistics'
import { useNowColor } from './hooks/useNowColor'
import { useCategories } from './hooks/useCategories'
import { useTransactions } from './hooks/useTransactions'
import { useRecurringExpenses } from './hooks/useRecurringExpenses'
import { useOpeningBalance } from './hooks/useOpeningBalance'
import { monthBounds, todayISO } from './lib/dates'
import type { Transaction } from './types'

type Page = 'calendario' | 'estadisticas'

function BrandMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none" role="img" aria-label="Finanzas">
      <rect x="1" y="1" width="46" height="46" fill="var(--color-ink)" />
      <path d="M12 10 L36 10 L24 22 L12 22 Z M12 22 L22 22 L15 40 L12 40 Z" fill="var(--color-void)" />
    </svg>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('calendario')
  const { now, setNow } = useNowColor()
  const { categories, createCategory, updateCategory, deleteCategory } = useCategories()
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [recurringOpen, setRecurringOpen] = useState(false)
  const [heatMode, setHeatMode] = useState(false)

  const [txModalOpen, setTxModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [presetDate, setPresetDate] = useState<string | null>(null)
  const [presetDescription, setPresetDescription] = useState<string | null>(null)
  const [presetKind, setPresetKind] = useState<'income' | 'expense' | null>(null)

  // Única fuente de datos de transacciones: el Ledger y el modal comparten el
  // mismo hook para que crear/editar/eliminar/mover se refleje de inmediato.
  const [extraYears, setExtraYears] = useState(0)
  const rightBoundEnd = useMemo(() => monthBounds(`${BASE_RIGHT_YEAR + extraYears}-12`).end, [extraYears])
  const {
    transactions,
    addTransaction,
    updateTransaction,
    moveTransaction,
    deleteTransaction,
    refresh: refreshTransactions,
  } = useTransactions(LEFT_BOUND, rightBoundEnd)
  const { recurringExpenses, createRecurringExpense, updateRecurringExpense, deleteRecurringExpense } =
    useRecurringExpenses(refreshTransactions)
  const trueOpeningBalance = useOpeningBalance(LEFT_BOUND)

  function openCreate(date?: string, preset?: { description?: string; kind?: 'income' | 'expense' }) {
    setEditingTx(null)
    setPresetDate(date ?? null)
    setPresetDescription(preset?.description ?? null)
    setPresetKind(preset?.kind ?? null)
    setTxModalOpen(true)
  }

  function openInitialBalance() {
    openCreate(todayISO(), { description: 'Saldo inicial', kind: 'income' })
  }

  function openEdit(tx: Transaction) {
    setEditingTx(tx)
    setTxModalOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-void">
      <header className="sticky top-0 z-10 bg-panel border-b border-line shadow-[0_8px_24px_-16px_rgba(0,0,0,0.12)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-center gap-4 sm:gap-7">
            <BrandMark />
            <nav className="flex items-center gap-1">
              {(
                [
                  ['calendario', 'Calendario'],
                  ['estadisticas', 'Estadísticas'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPage(key)}
                  className={`relative min-h-11 px-3 text-xs font-semibold tracking-[0.08em] uppercase transition-colors rounded-none border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                    page === key
                      ? 'text-accent border-accent'
                      : 'text-ink-soft border-transparent hover:text-ink hover:border-ink-faint/40'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openCreate()}
              className="inline-flex items-center justify-center gap-1.5 min-h-11 text-xs font-semibold tracking-wide bg-accent text-void px-3.5 rounded-none hover:bg-accent-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <Plus size={14} strokeWidth={2.5} />
              Transacción
            </button>
            <button
              onClick={() => setRecurringOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 min-h-11 text-xs font-medium tracking-wide text-ink-soft px-3 rounded-none hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <Repeat size={14} strokeWidth={2} />
              Recurrentes
            </button>
            <SettingsPanel value={now} onChange={setNow} heatMode={heatMode} onHeatModeChange={setHeatMode} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 flex-1 flex flex-col min-h-0 w-full">
        {page === 'calendario' ? (
          <Ledger
            categories={categories}
            transactions={transactions}
            trueOpeningBalance={trueOpeningBalance}
            extraYears={extraYears}
            onAddYear={() => setExtraYears((y) => y + 1)}
            onQuickAdd={openCreate}
            onAddOpeningBalance={openInitialBalance}
            onEditTransaction={openEdit}
            onMoveTransaction={moveTransaction}
            heatMode={heatMode}
          />
        ) : (
          <Statistics categories={categories} transactions={transactions} />
        )}
      </main>

      <TransactionModal
        open={txModalOpen}
        mode={editingTx ? 'edit' : 'create'}
        categories={categories}
        initial={editingTx}
        initialDate={presetDate}
        initialDescription={presetDescription}
        initialKind={presetKind}
        onClose={() => setTxModalOpen(false)}
        onCreateOnce={addTransaction}
        onSave={updateTransaction}
        onDelete={(tx) => deleteTransaction(tx.id)}
      />

      <RecurringManager
        open={recurringOpen}
        categories={categories}
        recurringExpenses={recurringExpenses}
        onClose={() => setRecurringOpen(false)}
        onCreate={createRecurringExpense}
        onUpdate={updateRecurringExpense}
        onDelete={deleteRecurringExpense}
        onManageCategories={() => {
          setRecurringOpen(false)
          setCategoriesOpen(true)
        }}
      />

      <CategoryManager
        open={categoriesOpen}
        categories={categories}
        onClose={() => setCategoriesOpen(false)}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />
    </div>
  )
}
