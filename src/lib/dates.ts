const DAY_MS = 24 * 60 * 60 * 1000

// "Hoy" siempre es la fecha de Ciudad de México — 'en-CA' formatea directo
// como yyyy-mm-dd.
const CDMX_TIME_ZONE = 'America/Mexico_City'
const cdmxDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CDMX_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// El reloj del dispositivo puede estar mal puesto (fecha equivocada), y fijar
// solo la zona horaria no lo arregla: new Date() siempre parte del reloj
// local, la zona horaria únicamente cambia cómo se muestra esa hora. Para
// que "hoy" sea confiable de verdad, corregimos Date.now() contra la
// cabecera Date de una respuesta del propio sitio (same-origin, así que el
// header es legible sin restricciones de CORS) al arrancar la app.
let clockOffsetMs = 0

export async function syncServerClock(): Promise<void> {
  try {
    const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' })
    const serverDate = res.headers.get('date')
    if (serverDate) clockOffsetMs = new Date(serverDate).getTime() - Date.now()
  } catch {
    // Sin red: seguimos con el reloj del dispositivo tal cual.
  }
}

function now(): Date {
  return new Date(Date.now() + clockOffsetMs)
}

export function parseISO(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS)
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7) // yyyy-mm
}

// Todas las fechas de la app son "fecha calendario pura" construidas con
// Date.UTC (sin hora real asociada). Si se formatean sin fijar la zona
// horaria, el navegador las reinterpreta en su hora LOCAL: para cualquiera
// en un huso negativo (ej. CDMX, UTC-6), la medianoche UTC del 1 de agosto
// se ve como "31 de julio, 6pm" y el mes se muestra mal. Por eso se fija
// timeZone: 'UTC' en todo lo que formatea estas fechas.
export function formatDayLabel(d: Date): string {
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', timeZone: 'UTC' })
}

export function formatMonthLabel(monthKeyStr: string): string {
  const [y, m] = monthKeyStr.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1, 1))
  return d.toLocaleDateString('es-MX', { month: 'long', timeZone: 'UTC' })
}

export function shiftISO(dateStr: string, days: number): string {
  return toISO(addDays(parseISO(dateStr), days))
}

export function todayISO(): string {
  return cdmxDateFormatter.format(now())
}

export function monthBounds(monthKeyStr: string): { start: string; end: string } {
  const [y, m] = monthKeyStr.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1))
  const end = new Date(Date.UTC(y, m, 0))
  return { start: toISO(start), end: toISO(end) }
}

export function addMonths(monthKeyStr: string, delta: number): string {
  const [y, m] = monthKeyStr.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return monthKey(toISO(d))
}

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly'

export function generateRecurringDates(start: string, end: string, frequency: RecurrenceFrequency): string[] {
  const dates: string[] = []
  let cursor = parseISO(start)
  const endDate = parseISO(end)
  const stepDays = frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 15 : null

  if (stepDays) {
    while (cursor.getTime() <= endDate.getTime()) {
      dates.push(toISO(cursor))
      cursor = addDays(cursor, stepDays)
    }
  } else {
    // monthly: mismo día del mes, avanza mes a mes
    const day = cursor.getUTCDate()
    while (cursor.getTime() <= endDate.getTime()) {
      dates.push(toISO(cursor))
      const next = new Date(cursor)
      next.setUTCMonth(next.getUTCMonth() + 1)
      // corrige si el mes siguiente tiene menos días
      if (next.getUTCDate() !== day) next.setUTCDate(0)
      cursor = next
    }
  }
  return dates
}

export function shortWeekdayLabel(d: Date): string {
  return d.toLocaleDateString('es-MX', { weekday: 'short', timeZone: 'UTC' }).replace('.', '')
}

function mondayOfWeek(d: Date): Date {
  const day = d.getUTCDay() // 0 = domingo … 6 = sábado
  const offsetFromMonday = day === 0 ? 6 : day - 1
  return addDays(d, -offsetFromMonday)
}

/** Semana de lunes a domingo (calendario) que contiene la fecha dada. */
export function weekBounds(dateStr: string): { start: string; end: string } {
  const start = toISO(mondayOfWeek(parseISO(dateStr)))
  return { start, end: shiftISO(start, 6) }
}

export function formatWeekLabel(start: string, end: string): string {
  return `${formatDayLabel(parseISO(start))} – ${formatDayLabel(parseISO(end))}`
}

export interface WeekChunk {
  key: string
  start: string
  end: string
}

/**
 * Semanas de lunes a domingo recortadas a los límites del mes: una semana de
 * calendario que cruza fin de mes aparece partida en dos trozos, uno por mes,
 * para que la vista de días de un mes nunca muestre fechas de otro mes.
 */
export function weeksInMonth(monthKeyStr: string): WeekChunk[] {
  const { start, end } = monthBounds(monthKeyStr)
  const monthEnd = parseISO(end)
  const chunks: WeekChunk[] = []
  let cur = parseISO(start)
  while (cur.getTime() <= monthEnd.getTime()) {
    const sunday = addDays(mondayOfWeek(cur), 6)
    const chunkEnd = sunday.getTime() < monthEnd.getTime() ? sunday : monthEnd
    chunks.push({ key: toISO(cur), start: toISO(cur), end: toISO(chunkEnd) })
    cur = addDays(chunkEnd, 1)
  }
  return chunks
}
