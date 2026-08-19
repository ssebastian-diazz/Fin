import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { Category, Transaction } from '../types'
import { heatBackground } from '../lib/color'
import {
  addDays,
  addMonths,
  formatDayLabel,
  formatMonthLabel,
  monthBounds,
  monthKey,
  parseISO,
  shiftISO,
  shortWeekdayLabel,
  toISO,
  todayISO,
  weeksInMonth,
} from '../lib/dates'
const money = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

export const LEFT_BOUND = '2026-01-01'
export const BASE_RIGHT_YEAR = 2027
const WEEK_COL_WIDTH = 116
const DAY_COL_WIDTH = 92
const MONTH_SUMMARY_WIDTH = 208

/** Punto de color de la categoría: el mismo lenguaje que ya usan Categorías, Recurrentes y Estadísticas. */
function CategoryDot({ cat }: { cat: Category | undefined }) {
  return (
    <span
      aria-hidden="true"
      className="w-1.5 h-1.5 shrink-0 rounded-full"
      style={
        cat
          ? { backgroundColor: cat.bg_color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.18)' }
          : { boxShadow: 'inset 0 0 0 1px var(--color-line)' }
      }
    />
  )
}

function CategoryChip({ cat }: { cat: Category | undefined }) {
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0 max-w-[110px]">
      <CategoryDot cat={cat} />
      <span className={`text-xs truncate ${cat ? 'text-ink-soft' : 'text-ink-faint italic'}`}>
        {cat ? cat.name : 'Sin cat.'}
      </span>
    </span>
  )
}

/** Payload de arrastre de un chip: id de la transacción + su fecha original, para saber si el drop es un no-op. */
function parseDragPayload(e: React.DragEvent): { id: string; date: string } | null {
  try {
    return JSON.parse(e.dataTransfer.getData('text/plain'))
  } catch {
    return null
  }
}

/** El chip: una transacción, coloreada por su categoría. Clic para editar; flechas al pasar el cursor para mover ±1 día al instante; arrastrable con el mouse a otro día/semana. */
function TxChip({
  tx,
  cat,
  onEdit,
  onMove,
}: {
  tx: Transaction
  cat: Category | undefined
  onEdit: () => void
  onMove: (dir: 1 | -1) => void
}) {
  function handleMove(e: React.MouseEvent, dir: 1 | -1) {
    e.stopPropagation()
    onMove(dir)
  }

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: tx.id, date: tx.date }))
  }

  const amountClass = tx.amount >= 0 ? 'text-income' : 'text-expense'

  const kindLabel = tx.amount >= 0 ? 'Ingreso' : 'Gasto'
  const editLabel = `Editar ${kindLabel.toLowerCase()} de ${money(Math.abs(tx.amount))}${
    tx.description ? `: ${tx.description}` : ''
  }${cat ? `, categoría ${cat.name}` : ''}${tx.recurring_expense_id ? ' (recurrente)' : ''}`

  return (
    <div className="group/chip relative mb-1 last:mb-0 rounded-none border border-line-soft bg-panel-raised overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute left-0 inset-y-0 w-1.5 pointer-events-none"
        style={{ backgroundColor: cat?.bg_color ?? 'var(--color-line)' }}
      />
      {tx.recurring_expense_id && (
        <span
          aria-hidden="true"
          className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-ink-faint opacity-70"
        />
      )}
      <button
        type="button"
        onClick={onEdit}
        title={tx.description || undefined}
        aria-label={editLabel}
        draggable
        onDragStart={handleDragStart}
        className="relative z-0 flex items-center justify-center min-w-0 w-full font-data text-xs font-normal tabular-nums pl-2.5 pr-1 py-1 cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      >
        <span className={`truncate min-w-0 ${amountClass}`}>{money(tx.amount)}</span>
      </button>
      <button
        type="button"
        onClick={(e) => handleMove(e, -1)}
        title="Mover un día antes"
        aria-label="Mover un día antes"
        className="absolute z-10 left-0 inset-y-0 w-3 opacity-0 group-hover/chip:opacity-100 flex items-center justify-center bg-black/15 transition-opacity focus-visible:opacity-100"
      >
        <ChevronLeft size={9} strokeWidth={2.8} />
      </button>
      <button
        type="button"
        onClick={(e) => handleMove(e, 1)}
        title="Mover un día después"
        aria-label="Mover un día después"
        className="absolute z-10 right-0 inset-y-0 w-3 opacity-0 group-hover/chip:opacity-100 flex items-center justify-center bg-black/15 transition-opacity focus-visible:opacity-100"
      >
        <ChevronRight size={9} strokeWidth={2.8} />
      </button>
    </div>
  )
}

/** Lista de chips que pagina en vez de hacer scroll interno: el scroll vertical
 * dentro de una columna le roba el gesto de rueda al desplazamiento horizontal
 * entre meses, que es más importante. Si no caben todos, muestra una página a
 * la vez con una flecha para pasar a la siguiente. */
function PagedChips({
  transactions,
  catById,
  onEditTransaction,
  onMove,
  minHeightPx,
  className = '',
}: {
  transactions: Transaction[]
  catById: Map<string, Category>
  onEditTransaction: (tx: Transaction) => void
  onMove: (id: string, newDate: string) => void
  minHeightPx: number
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(Math.max(1, transactions.length))

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    function recompute() {
      if (!container || transactions.length === 0) return
      const first = container.firstElementChild as HTMLElement | null
      if (!first) return
      const chipHeight = first.getBoundingClientRect().height + 4 // mb-1
      const available = container.clientHeight
      const capacity = Math.max(1, Math.floor(available / chipHeight))
      setPageSize(transactions.length <= capacity ? transactions.length : Math.max(1, capacity - 1))
    }
    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(container)
    return () => ro.disconnect()
  }, [transactions.length])

  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize))
  const safePage = page >= totalPages ? 0 : page
  const visible = transactions.slice(safePage * pageSize, safePage * pageSize + pageSize)

  return (
    <div ref={containerRef} className={`flex-1 overflow-hidden ${className}`} style={{ minHeight: minHeightPx }}>
      {visible.map((tx) => (
        <TxChip
          key={tx.id}
          tx={tx}
          cat={catById.get(tx.category_id ?? '')}
          onEdit={() => onEditTransaction(tx)}
          onMove={(dir) => onMove(tx.id, shiftISO(tx.date, dir))}
        />
      ))}
      {totalPages > 1 && (
        <button
          type="button"
          onClick={() => setPage((p) => (p + 1) % totalPages)}
          aria-label={`Ver más transacciones, página ${((safePage + 1) % totalPages) + 1} de ${totalPages}`}
          className="w-full flex items-center justify-center gap-1 font-data text-[10px] text-ink-faint tabular-nums hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        >
          <ChevronDown size={9} strokeWidth={2.8} />
          {safePage + 1}/{totalPages}
        </button>
      )}
    </div>
  )
}

function aggregateByCategory(transactions: Transaction[], matches: (amount: number) => boolean) {
  const map = new Map<string, { catId: string | null; total: number }>()
  for (const t of transactions) {
    const amount = Number(t.amount)
    if (!matches(amount)) continue
    const key = t.category_id ?? '__none__'
    const cur = map.get(key) ?? { catId: t.category_id, total: 0 }
    cur.total += amount
    map.set(key, cur)
  }
  return [...map.values()].sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
}

interface WeekData {
  key: string
  start: string
  end: string
  transactions: Transaction[]
  income: Transaction[]
  expenses: Transaction[]
  opening: number
  net: number
  closing: number
}

interface MonthGroup {
  monthKey: string
  weeks: WeekData[]
  opening: number
  net: number
  closing: number
  transactions: Transaction[]
}

/** Mes colapsado: una sola columna con la T resumida por categoría — cada chip es la suma del mes, no una transacción. */
function MonthSummaryColumn({
  transactions,
  opening,
  closing,
  catById,
}: {
  transactions: Transaction[]
  opening: number
  closing: number
  catById: Map<string, Category>
}) {
  const incomeRows = useMemo(() => aggregateByCategory(transactions, (n) => n > 0), [transactions])
  const expenseRows = useMemo(() => aggregateByCategory(transactions, (n) => n < 0), [transactions])
  const positive = closing >= 0

  return (
    <div
      className="shrink-0 flex flex-col rounded-none border border-line overflow-hidden bg-panel"
      style={{ width: MONTH_SUMMARY_WIDTH }}
    >
      <div className="font-data text-xs font-semibold text-ink-soft text-center tabular-nums pt-1.5 pb-1">
        {money(opening)}
      </div>
      <div className="px-1.5 pb-1 min-h-[22px] space-y-0.5">
        {incomeRows.length === 0 ? (
          <p className="text-xs text-ink-faint italic text-center py-1">Sin ingresos</p>
        ) : (
          incomeRows.map((r) => (
            <div key={r.catId ?? '__none__'} className="flex items-center justify-between gap-2">
              <CategoryChip cat={r.catId ? catById.get(r.catId) : undefined} />
              <span className="font-data text-xs text-income tabular-nums shrink-0">{money(r.total)}</span>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-line-soft" />
      <div className="px-1.5 pt-1 pb-1.5 min-h-[22px] space-y-0.5">
        {expenseRows.length === 0 ? (
          <p className="text-xs text-ink-faint italic text-center py-1">Sin gastos</p>
        ) : (
          expenseRows.map((r) => (
            <div key={r.catId ?? '__none__'} className="flex items-center justify-between gap-2">
              <CategoryChip cat={r.catId ? catById.get(r.catId) : undefined} />
              <span className="font-data text-xs text-expense tabular-nums shrink-0">{money(r.total)}</span>
            </div>
          ))
        )}
      </div>
      <div
        className={`shrink-0 font-data text-xs text-center tabular-nums py-1 border-t border-line-soft font-semibold ${
          positive ? 'text-accent' : 'text-danger'
        }`}
      >
        {money(closing)}
      </div>
    </div>
  )
}

/** Semana como una sola columna: ingresos arriba, una línea fina, gastos abajo — liquidez de la semana arriba y abajo. */
function WeekColumn({
  week,
  isCurrent,
  onExpand,
  onQuickAdd,
  catById,
  onEditTransaction,
  onMove,
  heatMode,
  monthMaxAbsWeekNet,
}: {
  week: WeekData
  isCurrent: boolean
  onExpand: () => void
  onQuickAdd: (date: string) => void
  catById: Map<string, Category>
  onEditTransaction: (tx: Transaction) => void
  onMove: (id: string, newDate: string) => void
  heatMode: boolean
  monthMaxAbsWeekNet: number
}) {
  // En modo calor el subtotal de abajo dejar de ser el saldo acumulado y pasa
  // a ser únicamente el balance de la semana (lo mismo que colorea el recuadro).
  const bottomValue = heatMode ? week.net : week.closing
  const positive = bottomValue >= 0
  const startDay = parseISO(week.start).getUTCDate()
  const endDay = parseISO(week.end).getUTCDate()
  const rangeLabel = startDay === endDay ? String(startDay) : `${startDay}–${endDay}`
  const [dragOver, setDragOver] = useState(false)
  const heatBg = heatMode ? heatBackground(week.net, monthMaxAbsWeekNet) : undefined
  // En modo calor las filas internas dejan su propio fondo opaco para que el
  // tinte de "qué tan fuerte fue la semana" se vea de corrido en todo el recuadro.
  const rowBgClass = heatMode ? '' : 'bg-panel'

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const payload = parseDragPayload(e)
    if (!payload || payload.date === week.start) return
    onMove(payload.id, week.start)
  }

  return (
    <div
      className={`group relative shrink-0 self-stretch flex flex-col rounded-none border overflow-hidden transition-colors ${
        dragOver ? 'border-accent bg-accent-dim/40' : isCurrent ? 'border-ink-faint' : 'border-line'
      }`}
      style={{ width: WEEK_COL_WIDTH, backgroundColor: !dragOver ? heatBg : undefined }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onQuickAdd(week.start)
        }}
        title="Agregar transacción esta semana"
        aria-label="Agregar transacción esta semana"
        className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-panel-raised border border-line flex items-center justify-center text-ink-faint opacity-0 group-hover:opacity-100 hover:text-accent hover:border-accent transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <Plus size={11} strokeWidth={2.6} />
      </button>
      <button
        onClick={onExpand}
        title="Ver por día"
        aria-label={`Ver ${rangeLabel} por día`}
        className={`w-full flex items-center justify-between gap-1 px-1.5 py-2 border-b border-line-soft hover:bg-panel-raised/60 transition-colors focus-visible:outline-none ${
          heatMode ? '' : isCurrent ? 'bg-now' : 'bg-panel'
        } ${heatMode && isCurrent ? 'ring-1 ring-inset ring-ink-faint' : ''}`}
      >
        <span className={`font-data text-xs ${isCurrent ? 'font-bold text-ink' : 'text-ink-soft'}`}>{rangeLabel}</span>
        <ChevronRight size={10} strokeWidth={2.4} className="text-ink-faint" />
      </button>
      <div className={`shrink-0 px-1 pt-1 text-center font-data text-xs font-semibold text-ink-soft tabular-nums ${rowBgClass}`}>
        {money(week.opening)}
      </div>
      <PagedChips
        transactions={week.income}
        catById={catById}
        onEditTransaction={onEditTransaction}
        onMove={onMove}
        minHeightPx={26}
        className={`px-1 pt-1 ${rowBgClass}`}
      />
      <div className="shrink-0 border-t border-line-soft" />
      <PagedChips
        transactions={week.expenses}
        catById={catById}
        onEditTransaction={onEditTransaction}
        onMove={onMove}
        minHeightPx={26}
        className={`px-1 pt-1 pb-1 ${rowBgClass}`}
      />
      <div
        title={heatMode ? 'Balance de la semana' : 'Saldo final de la semana'}
        className={`shrink-0 font-data text-xs text-center tabular-nums py-1 border-t border-line-soft ${
          heatMode ? '' : 'font-semibold'
        } ${positive ? 'text-accent' : 'text-danger'}`}
      >
        {money(bottomValue)}
      </div>
    </div>
  )
}

/** Semana desplegada por día: la misma T, pero cada día de lunes a domingo es su propia columna angosta. */
interface DayStats {
  opening: number
  incomeTotal: number
  expenseTotal: number
  net: number
  closing: number
}

function DayBreakout({
  week,
  isCurrentWeek,
  today,
  onCollapse,
  onQuickAdd,
  catById,
  onEditTransaction,
  onMove,
  heatMode,
  monthMaxAbsDayNet,
}: {
  week: WeekData
  isCurrentWeek: boolean
  today: string
  onCollapse: () => void
  onQuickAdd: (date: string) => void
  catById: Map<string, Category>
  onEditTransaction: (tx: Transaction) => void
  onMove: (id: string, newDate: string) => void
  heatMode: boolean
  monthMaxAbsDayNet: number
}) {
  const days = useMemo(() => {
    const out: string[] = []
    let cur = parseISO(week.start)
    const end = parseISO(week.end)
    while (cur.getTime() <= end.getTime()) {
      out.push(toISO(cur))
      cur = addDays(cur, 1)
    }
    return out
  }, [week.start, week.end])

  const byDay = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of week.transactions) map.set(t.date, [...(map.get(t.date) ?? []), t])
    return map
  }, [week.transactions])

  // Saldo corrido día a día dentro de la semana, arrancando del saldo con el
  // que abre la semana, para que cada día muestre su propio "inicial" y
  // "final" — el snapshot que deja ver de un vistazo en qué día se gastó más.
  const dayStats = useMemo(() => {
    const map = new Map<string, DayStats>()
    let running = week.opening
    for (const d of days) {
      const dayTx = byDay.get(d) ?? []
      const incomeTotal = dayTx.filter((t) => Number(t.amount) > 0).reduce((acc, t) => acc + Number(t.amount), 0)
      const expenseTotal = dayTx.filter((t) => Number(t.amount) < 0).reduce((acc, t) => acc + Number(t.amount), 0)
      const opening = running
      const net = incomeTotal + expenseTotal
      const closing = opening + net
      running = closing
      map.set(d, { opening, incomeTotal, expenseTotal, net, closing })
    }
    return map
  }, [days, byDay, week.opening])

  const [dragOverDay, setDragOverDay] = useState<string | null>(null)

  return (
    <div
      className={`shrink-0 self-stretch flex flex-col rounded-none border overflow-hidden ${isCurrentWeek ? 'border-ink-faint' : 'border-line'}`}
    >
      <button
        onClick={onCollapse}
        title="Ver por semana"
        aria-label="Ver por semana"
        className={`shrink-0 w-full flex items-center justify-between gap-2 px-2 py-2 border-b border-line-soft hover:bg-panel-raised/60 transition-colors focus-visible:outline-none ${
          isCurrentWeek ? 'bg-now' : 'bg-panel'
        }`}
      >
        <span
          className={`font-data text-xs whitespace-nowrap ${isCurrentWeek ? 'font-bold text-ink' : 'text-ink-soft'}`}
        >
          {formatDayLabel(parseISO(week.start))} – {formatDayLabel(parseISO(week.end))}
        </span>
        <ChevronDown size={10} strokeWidth={2.4} className="text-ink-faint rotate-180 shrink-0" />
      </button>
      <div className="flex-1 min-h-0 flex items-stretch">
        {days.map((d) => {
          const dayTx = byDay.get(d) ?? []
          const income = dayTx.filter((t) => Number(t.amount) > 0)
          const expenses = dayTx.filter((t) => Number(t.amount) < 0)
          const isToday = d === today
          const stats = dayStats.get(d)!
          // En modo calor el subtotal de abajo deja de ser el saldo acumulado
          // (y su desglose ingreso/gasto) y pasa a ser únicamente el balance
          // del día — lo mismo que colorea el recuadro.
          const bottomValue = heatMode ? stats.net : stats.closing
          const dayPositive = bottomValue >= 0
          const showDragTint = dragOverDay === d
          const heatBg = heatMode ? heatBackground(stats.net, monthMaxAbsDayNet) : undefined
          return (
            <div
              key={d}
              className={`group relative shrink-0 self-stretch flex flex-col border-l border-line-soft first:border-l-0 transition-colors ${
                showDragTint ? 'bg-accent-dim/40' : !heatMode && isToday ? 'bg-now' : ''
              } ${heatMode && isToday ? 'ring-1 ring-inset ring-ink-faint' : ''}`}
              style={{ width: DAY_COL_WIDTH, backgroundColor: !showDragTint ? heatBg : undefined }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverDay(d)
              }}
              onDragLeave={() => setDragOverDay((cur) => (cur === d ? null : cur))}
              onDrop={(e) => {
                e.preventDefault()
                setDragOverDay(null)
                const payload = parseDragPayload(e)
                if (!payload || payload.date === d) return
                onMove(payload.id, d)
              }}
            >
              <button
                onClick={() => onQuickAdd(d)}
                title="Agregar transacción este día"
                aria-label={`Agregar transacción el ${shortWeekdayLabel(parseISO(d))} ${d.slice(8, 10)}`}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-panel-raised border border-line flex items-center justify-center text-ink-faint opacity-0 group-hover:opacity-100 hover:text-accent hover:border-accent transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                <Plus size={11} strokeWidth={2.6} />
              </button>
              <div
                className={`shrink-0 text-center py-1 border-b border-line-soft ${isToday ? 'font-bold text-ink' : 'text-ink-faint'}`}
              >
                <span className="font-data text-xs tabular-nums uppercase">
                  {shortWeekdayLabel(parseISO(d))} {d.slice(8, 10)}
                </span>
              </div>
              <div
                title="Saldo inicial del día"
                className="shrink-0 px-1 pt-1 text-center font-data text-[10px] font-medium text-ink-faint tabular-nums"
              >
                {money(stats.opening)}
              </div>
              <PagedChips
                transactions={income}
                catById={catById}
                onEditTransaction={onEditTransaction}
                onMove={onMove}
                minHeightPx={24}
                className="px-1 pt-1"
              />
              <div className="shrink-0 border-t border-line-soft/70" />
              <PagedChips
                transactions={expenses}
                catById={catById}
                onEditTransaction={onEditTransaction}
                onMove={onMove}
                minHeightPx={24}
                className="px-1 pt-1 pb-1"
              />
              <div className="shrink-0 border-t border-line-soft/70 px-1 pt-1 pb-1 space-y-0.5">
                {!heatMode && (
                  <div className="flex items-center justify-between gap-1 font-data text-[9px] tabular-nums">
                    <span className="text-income truncate" title="Ingresos del día">
                      {money(stats.incomeTotal)}
                    </span>
                    <span className="text-expense truncate" title="Gastos del día">
                      {money(stats.expenseTotal)}
                    </span>
                  </div>
                )}
                <div
                  title={heatMode ? 'Balance del día' : 'Saldo final del día'}
                  className={`text-center font-data text-xs tabular-nums ${heatMode ? '' : 'font-semibold'} ${
                    dayPositive ? 'text-accent' : 'text-danger'
                  }`}
                >
                  {money(bottomValue)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MonthBlock({
  group,
  isCurrent,
  expanded,
  onToggle,
  expandedWeeks,
  onToggleWeek,
  today,
  onQuickAdd,
  catById,
  onEditTransaction,
  onMove,
  sectionRef,
  heatMode,
}: {
  group: MonthGroup
  isCurrent: boolean
  expanded: boolean
  onToggle: () => void
  expandedWeeks: Set<string>
  onToggleWeek: (key: string) => void
  today: string
  onQuickAdd: (date: string) => void
  catById: Map<string, Category>
  onEditTransaction: (tx: Transaction) => void
  onMove: (id: string, newDate: string) => void
  sectionRef?: RefObject<HTMLDivElement | null>
  heatMode: boolean
}) {
  const positive = group.closing >= 0

  // Máximos absolutos del mes para normalizar el modo "gastos relativos":
  // cada día/semana se colorea contra el extremo más fuerte de ESTE mes, no
  // de todo el histórico, para que el tinte siga siendo legible mes a mes.
  const heatStats = useMemo(() => {
    if (!heatMode) return { maxAbsDayNet: 0, maxAbsWeekNet: 0 }
    const dayNet = new Map<string, number>()
    for (const t of group.transactions) {
      dayNet.set(t.date, (dayNet.get(t.date) ?? 0) + Number(t.amount))
    }
    const maxAbsDayNet = Math.max(0, ...[...dayNet.values()].map((n) => Math.abs(n)))
    const maxAbsWeekNet = Math.max(0, ...group.weeks.map((w) => Math.abs(w.net)))
    return { maxAbsDayNet, maxAbsWeekNet }
  }, [group.transactions, group.weeks, heatMode])

  return (
    <div ref={sectionRef} className={`shrink-0 flex flex-col ${expanded ? 'self-stretch' : 'self-start'}`}>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Contraer' : 'Expandir'} ${formatMonthLabel(group.monthKey)}, saldo ${money(group.closing)}`}
        className="shrink-0 flex items-center gap-1.5 min-h-9 mb-1.5 px-0.5 text-left group/header rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <ChevronDown
          size={13}
          strokeWidth={2.4}
          className={`text-ink-faint transition-transform duration-200 shrink-0 ${expanded ? 'rotate-180' : ''}`}
        />
        <span
          className={`font-display uppercase tracking-tight whitespace-nowrap rounded-none px-1.5 py-0.5 ${
            isCurrent
              ? 'text-sm font-bold text-ink bg-now'
              : 'text-xs font-semibold text-ink-soft group-hover/header:text-ink transition-colors'
          }`}
        >
          {formatMonthLabel(group.monthKey)}
        </span>
        <span className={`font-data text-xs font-semibold tabular-nums shrink-0 ${positive ? 'text-accent' : 'text-danger'}`}>
          {money(group.closing)}
        </span>
      </button>

      {expanded ? (
        <div className="flex-1 min-h-0 flex items-stretch gap-1.5">
          {group.weeks.map((w) => {
            const isCurrentWeek = w.start <= today && today <= w.end
            return expandedWeeks.has(w.key) ? (
              <DayBreakout
                key={w.key}
                week={w}
                isCurrentWeek={isCurrentWeek}
                today={today}
                onCollapse={() => onToggleWeek(w.key)}
                onQuickAdd={onQuickAdd}
                catById={catById}
                onEditTransaction={onEditTransaction}
                onMove={onMove}
                heatMode={heatMode}
                monthMaxAbsDayNet={heatStats.maxAbsDayNet}
              />
            ) : (
              <WeekColumn
                key={w.key}
                week={w}
                isCurrent={isCurrentWeek}
                onExpand={() => onToggleWeek(w.key)}
                onQuickAdd={onQuickAdd}
                catById={catById}
                onEditTransaction={onEditTransaction}
                onMove={onMove}
                heatMode={heatMode}
                monthMaxAbsWeekNet={heatStats.maxAbsWeekNet}
              />
            )
          })}
        </div>
      ) : (
        <MonthSummaryColumn
          transactions={group.transactions}
          opening={group.opening}
          closing={group.closing}
          catById={catById}
        />
      )}
    </div>
  )
}

export function Ledger({
  categories,
  transactions,
  trueOpeningBalance,
  extraYears,
  onAddYear,
  onEditTransaction,
  onMoveTransaction,
  onQuickAdd,
  onAddOpeningBalance,
  heatMode,
}: {
  categories: Category[]
  transactions: Transaction[]
  trueOpeningBalance: number | null
  extraYears: number
  onAddYear: () => void
  onQuickAdd: (date: string) => void
  onAddOpeningBalance: () => void
  onEditTransaction: (tx: Transaction) => void
  onMoveTransaction: (id: string, newDate: string) => void
  heatMode: boolean
}) {
  const today = useMemo(() => todayISO(), [])
  const currentMonthKeyValue = useMemo(() => monthKey(today), [today])
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => new Set([currentMonthKeyValue]))
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(() => new Set())

  const rightBoundEnd = useMemo(() => monthBounds(`${BASE_RIGHT_YEAR + extraYears}-12`).end, [extraYears])

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const txByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of transactions) map.set(t.date, [...(map.get(t.date) ?? []), t])
    return map
  }, [transactions])

  // Recorre mes a mes desde LEFT_BOUND; cada mes trae sus propias semanas
  // (lunes-domingo, recortadas al mes) para que nunca se filtren días de
  // otro mes. El saldo corre día a día sin huecos entre meses/semanas.
  const monthGroups: MonthGroup[] = useMemo(() => {
    const lastMonthKey = monthKey(rightBoundEnd)
    let running = trueOpeningBalance ?? 0
    const groups: MonthGroup[] = []
    let mk = monthKey(LEFT_BOUND)
    while (true) {
      const weeksData: WeekData[] = weeksInMonth(mk).map((chunk) => {
        const days: string[] = []
        let cur = parseISO(chunk.start)
        const chunkEnd = parseISO(chunk.end)
        while (cur.getTime() <= chunkEnd.getTime()) {
          days.push(toISO(cur))
          cur = addDays(cur, 1)
        }
        const txs = days
          .flatMap((d) => txByDate.get(d) ?? [])
          .slice()
          .sort((a, b) => a.date.localeCompare(b.date))
        const net = txs.reduce((acc, t) => acc + Number(t.amount), 0)
        const opening = running
        const closing = opening + net
        running = closing
        return {
          key: chunk.key,
          start: chunk.start,
          end: chunk.end,
          transactions: txs,
          income: txs.filter((t) => Number(t.amount) > 0),
          expenses: txs.filter((t) => Number(t.amount) < 0),
          opening,
          net,
          closing,
        }
      })
      groups.push({
        monthKey: mk,
        weeks: weeksData,
        opening: weeksData[0]?.opening ?? running,
        net: weeksData.reduce((acc, w) => acc + w.net, 0),
        closing: weeksData[weeksData.length - 1]?.closing ?? running,
        transactions: weeksData.flatMap((w) => w.transactions),
      })
      if (mk === lastMonthKey) break
      mk = addMonths(mk, 1)
    }
    return groups
  }, [rightBoundEnd, txByDate, trueOpeningBalance])

  function toggleMonth(mk: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev)
      if (next.has(mk)) next.delete(mk)
      else next.add(mk)
      return next
    })
  }

  function toggleWeek(wk: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev)
      if (next.has(wk)) next.delete(wk)
      else next.add(wk)
      return next
    })
  }

  const currentMonthRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const didInitialScroll = useRef(false)

  useLayoutEffect(() => {
    if (!didInitialScroll.current && currentMonthRef.current) {
      currentMonthRef.current.scrollIntoView({ inline: 'start', block: 'nearest' })
      didInitialScroll.current = true
    }
  }, [])

  // El mouse/mousepad solo emite scroll vertical; lo redirigimos al eje horizontal
  // del timeline desde cualquier punto de la página (no solo sobre la tabla).
  // Requiere un listener nativo con passive:false para poder frenar el scroll
  // vertical de la página (React adjunta onWheel como pasivo). Se excluyen las
  // listas con scroll vertical propio (ej. el modal de categorías).
  useEffect(() => {
    function onWheel(e: WheelEvent) {
      const el = scrollRef.current
      if (!el) return
      if ((e.target as HTMLElement | null)?.closest('.overflow-y-auto')) return
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (delta === 0) return
      e.preventDefault()
      el.scrollLeft += delta
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  const autoScrollRef = useRef<number | null>(null)

  function startAutoScroll(dir: -1 | 1) {
    stopAutoScroll()
    const step = () => scrollRef.current?.scrollBy({ left: dir * 14 })
    step()
    autoScrollRef.current = window.setInterval(step, 16)
  }

  function stopAutoScroll() {
    if (autoScrollRef.current !== null) {
      window.clearInterval(autoScrollRef.current)
      autoScrollRef.current = null
    }
  }

  useEffect(() => stopAutoScroll, [])

  const isFirstRun = trueOpeningBalance === null && transactions.length === 0

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {isFirstRun && (
        <div className="mb-5 rounded-none border border-dashed border-line px-6 py-8 text-center shrink-0">
          <p className="text-sm text-ink-soft max-w-sm mx-auto">
            Sin movimientos todavía. Registra una transacción única llamada{' '}
            <span className="text-ink font-medium">"Saldo inicial"</span> fechada hoy para que el saldo sea correcto
            desde el día uno.
          </p>
          <button
            onClick={onAddOpeningBalance}
            className="mt-4 inline-flex items-center justify-center gap-1.5 min-h-11 bg-accent text-void px-4 text-xs font-semibold uppercase tracking-[0.06em] rounded-none hover:bg-accent-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <Plus size={14} strokeWidth={2.5} />
            Agregar saldo inicial
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 flex items-stretch gap-2.5 overflow-x-auto scrollbar-hidden pb-24 -mx-1 px-1"
      >
        {monthGroups.map((mg) => (
          <MonthBlock
            key={mg.monthKey}
            group={mg}
            isCurrent={mg.monthKey === currentMonthKeyValue}
            expanded={expandedMonths.has(mg.monthKey)}
            onToggle={() => toggleMonth(mg.monthKey)}
            expandedWeeks={expandedWeeks}
            onToggleWeek={toggleWeek}
            today={today}
            onQuickAdd={onQuickAdd}
            catById={catById}
            onEditTransaction={onEditTransaction}
            onMove={onMoveTransaction}
            sectionRef={mg.monthKey === currentMonthKeyValue ? currentMonthRef : undefined}
            heatMode={heatMode}
          />
        ))}
        <div className="shrink-0 self-center pl-1">
          <button
            onClick={onAddYear}
            className="inline-flex items-center gap-1.5 min-h-11 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-faint border border-dashed border-line px-3 rounded-none hover:text-accent hover:border-ink-faint transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <Plus size={12} strokeWidth={2.6} />
            Añadir {BASE_RIGHT_YEAR + extraYears + 1}
          </button>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-20 flex items-center gap-3">
        <div className="inline-flex items-center gap-0.5 bg-panel-raised rounded-none p-1">
          <button
            onMouseDown={() => startAutoScroll(-1)}
            onMouseUp={stopAutoScroll}
            onMouseLeave={stopAutoScroll}
            onTouchStart={() => startAutoScroll(-1)}
            onTouchEnd={stopAutoScroll}
            title="Desplazar a meses anteriores"
            aria-label="Desplazar a meses anteriores"
            className="flex items-center justify-center w-11 h-11 rounded-full text-ink-soft hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <ChevronLeft size={15} strokeWidth={2.4} />
          </button>
          <button
            onMouseDown={() => startAutoScroll(1)}
            onMouseUp={stopAutoScroll}
            onMouseLeave={stopAutoScroll}
            onTouchStart={() => startAutoScroll(1)}
            onTouchEnd={stopAutoScroll}
            title="Desplazar a meses posteriores"
            aria-label="Desplazar a meses posteriores"
            className="flex items-center justify-center w-11 h-11 rounded-full text-ink-soft hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <ChevronRight size={15} strokeWidth={2.4} />
          </button>
        </div>

        <button
          onClick={() => currentMonthRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })}
          className="inline-flex items-center gap-1.5 min-h-11 bg-panel-raised text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft px-4 rounded-none hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          Hoy
        </button>
      </div>
    </div>
  )
}
