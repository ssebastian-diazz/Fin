import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Category, Transaction } from '../types'
import { addMonths, formatMonthLabel, formatWeekLabel, monthKey, shiftISO, todayISO, weekBounds } from '../lib/dates'

const money = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

type PeriodType = 'month' | 'week'
type ValueMode = 'pct' | 'total'

interface CategorySlice {
  catId: string | null
  name: string
  color: string
  amount: number
  pct: number
}

/** Insight 1: cuánto de lo gastado este período cae en cada categoría, como barra rankeada por monto. */
function CategoryBreakdown({
  transactions,
  categories,
  valueMode,
}: {
  transactions: Transaction[]
  categories: Category[]
  valueMode: ValueMode
}) {
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const slices = useMemo(() => {
    const expenses = transactions.filter((t) => Number(t.amount) < 0)
    const total = expenses.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0)
    const byCategory = new Map<string, number>()
    for (const t of expenses) {
      const key = t.category_id ?? '__none__'
      byCategory.set(key, (byCategory.get(key) ?? 0) + Math.abs(Number(t.amount)))
    }
    const out: CategorySlice[] = [...byCategory.entries()].map(([key, amount]) => {
      const cat = key === '__none__' ? undefined : catById.get(key)
      return {
        catId: key === '__none__' ? null : key,
        name: cat?.name ?? 'Sin categoría',
        color: cat?.bg_color ?? 'var(--color-ink-faint)',
        amount,
        pct: total > 0 ? (amount / total) * 100 : 0,
      }
    })
    return out.sort((a, b) => b.amount - a.amount)
  }, [transactions, catById])

  const total = slices.reduce((acc, s) => acc + s.amount, 0)

  return (
    <div className="self-stretch flex-1 flex flex-col rounded-none p-4">
      <div className="shrink-0 flex items-center justify-between mb-4">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
          Gastos por categoría
        </h2>
        <span className="font-data text-xs text-ink-faint tabular-nums">{money(total)}</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-evenly gap-2.5">
        {slices.length === 0 ? (
          <p className="text-sm text-ink-faint text-center">Sin gastos en este período.</p>
        ) : (
          slices.map((s) => (
            <div
              key={s.catId ?? '__none__'}
              title={`${s.name}: ${s.pct.toFixed(0)}% · ${money(s.amount)}`}
              className="shrink-0 flex items-center gap-2.5"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)' }}
              />
              <span className="text-xs text-ink-soft w-20 truncate shrink-0">{s.name}</span>
              <div className="flex-1 h-2.5 rounded-none bg-shade overflow-hidden">
                <div
                  className="h-full rounded-none"
                  style={{ width: `${Math.max(s.pct, 2)}%`, backgroundColor: s.color }}
                />
              </div>
              <span className="font-data text-[11px] text-ink tabular-nums w-16 text-right shrink-0">
                {valueMode === 'pct' ? `${s.pct.toFixed(0)}%` : money(s.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/** Insight 2: qué tanto del gasto de este período ya está comprometido (recurrente) vs. es discrecional. */
function FixedVsVariable({ transactions, valueMode }: { transactions: Transaction[]; valueMode: ValueMode }) {
  const { fixed, variable, total } = useMemo(() => {
    const expenses = transactions.filter((t) => Number(t.amount) < 0)
    let fixed = 0
    let variable = 0
    for (const t of expenses) {
      const amt = Math.abs(Number(t.amount))
      if (t.recurring_expense_id) fixed += amt
      else variable += amt
    }
    return { fixed, variable, total: fixed + variable }
  }, [transactions])

  const fixedPct = total > 0 ? (fixed / total) * 100 : 0
  const variablePct = total > 0 ? (variable / total) * 100 : 0

  return (
    <div className="self-stretch flex-1 flex flex-col rounded-none p-4">
      <div className="shrink-0 flex items-center justify-between mb-4">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
          Fijo vs. variable
        </h2>
        <span className="font-data text-xs text-ink-faint tabular-nums">{money(total)}</span>
      </div>
      {total === 0 ? (
        <p className="flex-1 flex items-center justify-center text-sm text-ink-faint">Sin gastos en este período.</p>
      ) : (
        <div className="flex-1 flex flex-col justify-center gap-5">
          <div className="flex h-3 rounded-none overflow-hidden">
            <div
              title={`Fijo: ${fixedPct.toFixed(0)}% · ${money(fixed)}`}
              style={{ width: `${fixedPct}%`, backgroundColor: 'var(--color-accent)' }}
            />
            {fixedPct > 0 && variablePct > 0 && <div className="w-[2px] bg-panel shrink-0" />}
            <div
              title={`Variable: ${variablePct.toFixed(0)}% · ${money(variable)}`}
              style={{ width: `${variablePct}%`, backgroundColor: 'var(--color-ink-faint)' }}
            />
          </div>
          <div className="flex items-center gap-5 text-xs">
            <span className="inline-flex items-center gap-1.5 text-ink-soft">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-accent)' }} />
              Fijo ·{' '}
              <span className="font-data tabular-nums text-ink">
                {valueMode === 'pct' ? `${fixedPct.toFixed(0)}%` : money(fixed)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-ink-soft">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-ink-faint)' }} />
              Variable ·{' '}
              <span className="font-data tabular-nums text-ink">
                {valueMode === 'pct' ? `${variablePct.toFixed(0)}%` : money(variable)}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function TabGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`min-h-8 px-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
            value === opt.value
              ? 'text-accent border-accent'
              : 'text-ink-faint border-transparent hover:text-ink-soft hover:border-ink-faint/40'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function Statistics({ categories, transactions }: { categories: Category[]; transactions: Transaction[] }) {
  const [periodType, setPeriodType] = useState<PeriodType>('month')
  const [valueMode, setValueMode] = useState<ValueMode>('total')
  const [monthKeyValue, setMonthKeyValue] = useState(() => monthKey(todayISO()))
  const [weekStartValue, setWeekStartValue] = useState(() => weekBounds(todayISO()).start)

  const periodTransactions = useMemo(() => {
    if (periodType === 'month') {
      return transactions.filter((t) => monthKey(t.date) === monthKeyValue)
    }
    const weekEnd = shiftISO(weekStartValue, 6)
    return transactions.filter((t) => t.date >= weekStartValue && t.date <= weekEnd)
  }, [transactions, periodType, monthKeyValue, weekStartValue])

  const periodLabel =
    periodType === 'month'
      ? `${formatMonthLabel(monthKeyValue)} ${monthKeyValue.slice(0, 4)}`
      : formatWeekLabel(weekStartValue, shiftISO(weekStartValue, 6))

  function goPrev() {
    if (periodType === 'month') setMonthKeyValue((mk) => addMonths(mk, -1))
    else setWeekStartValue((ws) => shiftISO(ws, -7))
  }

  function goNext() {
    if (periodType === 'month') setMonthKeyValue((mk) => addMonths(mk, 1))
    else setWeekStartValue((ws) => shiftISO(ws, 7))
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-panel p-5">
      <div className="shrink-0 flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <TabGroup
          options={[
            { value: 'month', label: 'Mes' },
            { value: 'week', label: 'Semana' },
          ]}
          value={periodType}
          onChange={setPeriodType}
        />

        <div className="flex items-center justify-center gap-3 order-first sm:order-none">
          <button
            onClick={goPrev}
            title="Período anterior"
            aria-label="Período anterior"
            className="w-7 h-7 rounded-none flex items-center justify-center text-ink-soft hover:text-accent hover:bg-panel-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <ChevronLeft size={14} strokeWidth={2.4} />
          </button>
          <span className="font-display text-sm font-semibold uppercase tracking-wide text-ink w-44 text-center">
            {periodLabel}
          </span>
          <button
            onClick={goNext}
            title="Período siguiente"
            aria-label="Período siguiente"
            className="w-7 h-7 rounded-none flex items-center justify-center text-ink-soft hover:text-accent hover:bg-panel-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <ChevronRight size={14} strokeWidth={2.4} />
          </button>
        </div>

        <TabGroup
          options={[
            { value: 'pct', label: 'Porcentual' },
            { value: 'total', label: 'Total' },
          ]}
          value={valueMode}
          onChange={setValueMode}
        />
      </div>
      <div className="flex-1 min-h-0 flex flex-col md:flex-row items-stretch gap-4">
        <div className="flex-1 min-h-0 flex">
          <CategoryBreakdown transactions={periodTransactions} categories={categories} valueMode={valueMode} />
        </div>
        <div className="flex-1 min-h-0 flex">
          <FixedVsVariable transactions={periodTransactions} valueMode={valueMode} />
        </div>
      </div>
    </div>
  )
}
