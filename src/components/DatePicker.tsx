import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, addMonths, formatDayLabel, formatMonthLabel, monthBounds, monthKey, parseISO, toISO, todayISO } from '../lib/dates'

const WEEKDAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function mondayOfWeek(d: Date): Date {
  const day = d.getUTCDay() // 0 = domingo … 6 = sábado
  const offset = day === 0 ? 6 : day - 1
  return addDays(d, -offset)
}

/** Grilla completa del mes (6 filas típico), con días de meses vecinos
 * atenuados para navegación — a diferencia del calendario principal, aquí sí
 * queremos continuidad visual entre meses. */
function buildGrid(monthKeyStr: string): string[] {
  const { start, end } = monthBounds(monthKeyStr)
  const gridStart = mondayOfWeek(parseISO(start))
  const gridEnd = addDays(mondayOfWeek(parseISO(end)), 6)
  const days: string[] = []
  let cur = gridStart
  while (cur.getTime() <= gridEnd.getTime()) {
    days.push(toISO(cur))
    cur = addDays(cur, 1)
  }
  return days
}

export function DatePicker({
  value,
  onChange,
  id,
  onOpenChange,
}: {
  value: string
  onChange: (iso: string) => void
  id?: string
  /** Notifica al contenedor cuando el popup se abre/cierra, para que un modal
   * padre pueda pausar su propio Escape mientras este picker está abierto en
   * vez de cerrarse junto con él. */
  onOpenChange?: (open: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => monthKey(value))
  const rootRef = useRef<HTMLDivElement>(null)

  function updateOpen(next: boolean) {
    setOpen(next)
    onOpenChange?.(next)
  }

  useEffect(() => {
    if (open) setViewMonth(monthKey(value))
  }, [open, value])

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) updateOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') updateOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const days = buildGrid(viewMonth)
  const today = todayISO()
  const viewYear = viewMonth.split('-')[0]

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => updateOpen(!open)}
        className="w-full mt-1.5 bg-void border border-line rounded-none px-3 py-2 text-ink text-left font-data focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 transition-colors"
      >
        {formatDayLabel(parseISO(value))} {value.slice(0, 4)}
      </button>

      {open && (
        <div className="absolute z-50 bottom-full mb-1.5 w-64 bg-panel-raised border border-line rounded-none shadow-[0_24px_60px_-20px_rgba(0,0,0,0.2)] p-3 animate-modal-in">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth((mk) => addMonths(mk, -1))}
              title="Mes anterior"
              aria-label="Mes anterior"
              className="w-11 h-11 -my-2 rounded-full flex items-center justify-center text-ink-soft hover:text-accent hover:bg-panel transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <ChevronLeft size={14} strokeWidth={2.4} />
            </button>
            <span className="font-display text-xs font-semibold uppercase tracking-wide text-ink">
              {formatMonthLabel(viewMonth)} {viewYear}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((mk) => addMonths(mk, 1))}
              title="Mes siguiente"
              aria-label="Mes siguiente"
              className="w-11 h-11 -my-2 rounded-full flex items-center justify-center text-ink-soft hover:text-accent hover:bg-panel transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <ChevronRight size={14} strokeWidth={2.4} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_HEADERS.map((w, i) => (
              <span key={i} className="text-center text-[10px] font-semibold text-ink-faint py-1">
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((d) => {
              const inMonth = monthKey(d) === viewMonth
              const isSelected = d === value
              const isToday = d === today
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    onChange(d)
                    updateOpen(false)
                  }}
                  aria-label={`${formatDayLabel(parseISO(d))} ${d.slice(0, 4)}`}
                  aria-current={isToday ? 'date' : undefined}
                  aria-pressed={isSelected}
                  className={`h-7 rounded-none text-[11px] font-data flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                    isSelected
                      ? 'bg-accent text-void font-bold'
                      : isToday
                        ? 'bg-now font-bold text-ink'
                        : inMonth
                          ? 'text-ink hover:bg-panel'
                          : 'text-ink-faint/60 hover:bg-panel'
                  }`}
                >
                  {Number(d.slice(8, 10))}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
