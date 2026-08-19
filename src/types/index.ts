import type { RecurrenceFrequency } from '../lib/dates'

export type CategoryKind = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  bg_color: string
  text_color: string
  kind: CategoryKind
  is_movable: boolean
  sort_order: number
  created_at: string
}

export interface RecurringExpense {
  id: string
  name: string
  amount: number // negativo = gasto, positivo = ingreso
  category_id: string | null
  frequency: RecurrenceFrequency
  start_date: string
  end_date: string
  created_at: string
}

export interface Transaction {
  id: string
  date: string // yyyy-mm-dd
  amount: number // negativo = gasto, positivo = ingreso
  description: string | null
  category_id: string | null
  recurrence_group_id: string | null // legado: ya no se escribe ni se lee, ver recurring_expense_id
  recurring_expense_id: string | null
  created_at: string
}
