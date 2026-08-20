import type { Category, RecurringExpense, Transaction } from '../types'
import type { RecurringExpenseInput } from '../hooks/useRecurringExpenses'
import { generateRecurringDates, monthBounds, monthKey, addMonths, parseISO, shiftISO, toISO, todayISO } from './dates'

// Backend simulado para la demo pública: no hay servidor, todo vive en
// localStorage del navegador de cada visitante, sembrado con datos
// ficticios la primera vez que se carga. Ver PORTFOLIO_DEMO_PLAN.md.

const STORAGE_KEY = 'fintrack-demo-v1'

interface DemoState {
  categories: Category[]
  transactions: Transaction[]
  recurringExpenses: RecurringExpense[]
}

let state: DemoState | null = null

function nowISO(): string {
  return new Date().toISOString()
}

function mkCategory(
  name: string,
  bg_color: string,
  text_color: string,
  kind: Category['kind'],
  is_movable: boolean,
  sort_order: number
): Category {
  return { id: crypto.randomUUID(), name, bg_color, text_color, kind, is_movable, sort_order, created_at: nowISO() }
}

function mkTransaction(
  date: string,
  amount: number,
  description: string | null,
  category_id: string | null,
  recurring_expense_id: string | null = null
): Transaction {
  return {
    id: crypto.randomUUID(),
    date,
    amount,
    description,
    category_id,
    recurrence_group_id: null,
    recurring_expense_id,
    created_at: nowISO(),
  }
}

function randomAmount(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min))
}

// Misma aritmética "mes calendario" que usa generateRecurringDates para las
// plantillas mensuales: conserva el día del mes, cae al último día si el mes
// destino es más corto.
function addMonthsToISO(dateStr: string, delta: number): string {
  const d = parseISO(dateStr)
  const day = d.getUTCDate()
  const next = new Date(d)
  next.setUTCMonth(next.getUTCMonth() + delta)
  if (next.getUTCDate() !== day) next.setUTCDate(0)
  return toISO(next)
}

function buildSeed(): DemoState {
  const today = todayISO()

  const categories: Category[] = [
    mkCategory('Sueldo', '#16A34A', '#FFFFFF', 'income', false, 0),
    mkCategory('Renta', '#7C3AED', '#FFFFFF', 'expense', false, 1),
    mkCategory('Comida', '#F59E0B', '#111827', 'expense', true, 2),
    mkCategory('Transporte', '#0EA5E9', '#111827', 'expense', true, 3),
    mkCategory('Entretenimiento', '#EC4899', '#111827', 'expense', true, 4),
    mkCategory('Deudas', '#DC2626', '#FFFFFF', 'expense', false, 5),
  ]
  const catId = (name: string) => categories.find((c) => c.name === name)!.id

  const transactions: Transaction[] = []
  const recurringExpenses: RecurringExpense[] = []

  function addRecurring(
    name: string,
    amount: number,
    category_id: string,
    frequency: RecurringExpense['frequency'],
    start_date: string,
    end_date: string
  ) {
    const id = crypto.randomUUID()
    recurringExpenses.push({ id, name, amount, category_id, frequency, start_date, end_date, created_at: nowISO() })
    for (const date of generateRecurringDates(start_date, end_date, frequency)) {
      transactions.push(mkTransaction(date, amount, name, category_id, id))
    }
  }

  // Sueldo y Renta: mensual, día 1, de hace 3 meses a 9 meses en el futuro.
  const monthlyStart = monthBounds(addMonths(monthKey(today), -3)).start
  const monthlyEnd = monthBounds(addMonths(monthKey(today), 9)).start
  addRecurring('Sueldo', 45000, catId('Sueldo'), 'monthly', monthlyStart, monthlyEnd)
  addRecurring('Renta depto', -12000, catId('Renta'), 'monthly', monthlyStart, monthlyEnd)

  // Pago tarjeta: quincenal, de hace 2 meses a 2 meses en el futuro.
  addRecurring(
    'Pago tarjeta',
    -1500,
    catId('Deudas'),
    'biweekly',
    addMonthsToISO(today, -2),
    addMonthsToISO(today, 2)
  )

  // Comida: dos compras por semana, desde hace 9 semanas hasta hoy.
  for (let cursor = shiftISO(today, -63); cursor <= today; cursor = shiftISO(cursor, 7)) {
    transactions.push(mkTransaction(cursor, -randomAmount(600, 1500), 'Supermercado', catId('Comida')))
    transactions.push(mkTransaction(shiftISO(cursor, 3), -randomAmount(150, 500), 'Comida rápida', catId('Comida')))
  }

  // Transporte: dos cargos por semana, desde hace 8 semanas hasta hoy.
  for (let cursor = shiftISO(today, -56); cursor <= today; cursor = shiftISO(cursor, 7)) {
    transactions.push(
      mkTransaction(shiftISO(cursor, 1), -randomAmount(80, 230), 'Gasolina / transporte', catId('Transporte'))
    )
    transactions.push(mkTransaction(shiftISO(cursor, 4), -randomAmount(60, 180), 'Uber', catId('Transporte')))
  }

  // Entretenimiento: un cargo por mes, desde hace 2 meses hasta hoy.
  for (
    let cursor = addMonthsToISO(today, -2);
    cursor <= today;
    cursor = addMonthsToISO(cursor, 1)
  ) {
    transactions.push(
      mkTransaction(shiftISO(cursor, 5), -randomAmount(300, 900), 'Cine / streaming', catId('Entretenimiento'))
    )
  }

  // Un par de ingresos sueltos, sin recurrencia.
  transactions.push(mkTransaction(shiftISO(today, -18), 3500, 'Proyecto freelance', catId('Sueldo')))
  transactions.push(mkTransaction(shiftISO(today, -45), 2200, 'Venta artículo usado', null))

  return { categories, transactions, recurringExpenses }
}

function persist(): void {
  if (!state) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function getState(): DemoState {
  if (state) return state
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      state = JSON.parse(raw) as DemoState
      return state
    }
  } catch (err) {
    console.error('No se pudo leer el estado de la demo, se reinicia con datos ficticios.', err)
  }
  state = buildSeed()
  persist()
  return state
}

// ── Categorías ───────────────────────────────────────────────────────────

export function listCategories(): Category[] {
  return [...getState().categories].sort((a, b) => a.sort_order - b.sort_order)
}

export function insertCategoryRow(c: Omit<Category, 'id' | 'created_at'>): void {
  const s = getState()
  s.categories.push({ ...c, id: crypto.randomUUID(), created_at: nowISO() })
  persist()
}

export function updateCategoryRow(id: string, patch: Partial<Category>): void {
  const s = getState()
  const idx = s.categories.findIndex((c) => c.id === id)
  if (idx !== -1) s.categories[idx] = { ...s.categories[idx], ...patch }
  persist()
}

export function deleteCategoryRow(id: string): void {
  const s = getState()
  s.categories = s.categories.filter((c) => c.id !== id)
  // Replica el `on delete set null` de la FK real.
  for (const t of s.transactions) if (t.category_id === id) t.category_id = null
  for (const r of s.recurringExpenses) if (r.category_id === id) r.category_id = null
  persist()
}

// ── Transacciones ────────────────────────────────────────────────────────

export function listTransactionsInRange(start: string, end: string): Transaction[] {
  return getState()
    .transactions.filter((t) => t.date >= start && t.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function listTransactionsBefore(beforeDate: string): Transaction[] {
  return getState().transactions.filter((t) => t.date < beforeDate)
}

export function insertTransactionRow(t: Omit<Transaction, 'id' | 'created_at'>): void {
  const s = getState()
  s.transactions.push({ ...t, id: crypto.randomUUID(), created_at: nowISO() })
  persist()
}

export function insertTransactionRows(rows: Omit<Transaction, 'id' | 'created_at'>[]): void {
  const s = getState()
  for (const row of rows) s.transactions.push({ ...row, id: crypto.randomUUID(), created_at: nowISO() })
  persist()
}

export function updateTransactionRow(id: string, patch: Partial<Transaction>): void {
  const s = getState()
  const idx = s.transactions.findIndex((t) => t.id === id)
  if (idx !== -1) s.transactions[idx] = { ...s.transactions[idx], ...patch }
  persist()
}

export function deleteTransactionRow(id: string): void {
  const s = getState()
  s.transactions = s.transactions.filter((t) => t.id !== id)
  persist()
}

export function deleteTransactionsByRecurringId(recurringId: string, fromDate?: string): void {
  const s = getState()
  s.transactions = s.transactions.filter(
    (t) => !(t.recurring_expense_id === recurringId && (!fromDate || t.date >= fromDate))
  )
  persist()
}

// ── Recurrentes ──────────────────────────────────────────────────────────

export function listRecurringExpenses(): RecurringExpense[] {
  return [...getState().recurringExpenses].sort((a, b) => a.start_date.localeCompare(b.start_date))
}

export function insertRecurringExpenseRow(input: RecurringExpenseInput): RecurringExpense {
  const s = getState()
  const row: RecurringExpense = { ...input, id: crypto.randomUUID(), created_at: nowISO() }
  s.recurringExpenses.push(row)
  persist()
  return row
}

export function updateRecurringExpenseRow(id: string, patch: Partial<RecurringExpense>): void {
  const s = getState()
  const idx = s.recurringExpenses.findIndex((r) => r.id === id)
  if (idx !== -1) s.recurringExpenses[idx] = { ...s.recurringExpenses[idx], ...patch }
  persist()
}

export function deleteRecurringExpenseRow(id: string): void {
  const s = getState()
  s.recurringExpenses = s.recurringExpenses.filter((r) => r.id !== id)
  persist()
}
