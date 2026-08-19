import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { generateRecurringDates, todayISO, type RecurrenceFrequency } from '../lib/dates'
import type { RecurringExpense } from '../types'

export interface RecurringExpenseInput {
  name: string
  amount: number
  category_id: string | null
  frequency: RecurrenceFrequency
  start_date: string
  end_date: string
}

export type RecurringEditScope = 'future' | 'all'

function materializedRows(recurringId: string, input: RecurringExpenseInput, fromDate: string) {
  return generateRecurringDates(input.start_date, input.end_date, input.frequency)
    .filter((date) => date >= fromDate)
    .map((date) => ({
      date,
      amount: input.amount,
      description: input.name || null,
      category_id: input.category_id,
      recurring_expense_id: recurringId,
    }))
}

export function useRecurringExpenses(refreshTransactions: () => Promise<void>) {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .order('start_date', { ascending: true })
    if (error) console.error(error)
    setRecurringExpenses(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createRecurringExpense = async (input: RecurringExpenseInput) => {
    const { data, error } = await supabase.from('recurring_expenses').insert(input).select().single()
    if (error) throw error
    const rows = materializedRows(data.id, input, input.start_date)
    if (rows.length) {
      const { error: insErr } = await supabase.from('transactions').insert(rows)
      if (insErr) throw insErr
    }
    await refresh()
    await refreshTransactions()
  }

  const updateRecurringExpense = async (id: string, input: RecurringExpenseInput, scope: RecurringEditScope) => {
    const fromDate = scope === 'future' ? todayISO() : input.start_date

    let del = supabase.from('transactions').delete().eq('recurring_expense_id', id)
    if (scope === 'future') del = del.gte('date', todayISO())
    const { error: delErr } = await del
    if (delErr) throw delErr

    const { error: updErr } = await supabase.from('recurring_expenses').update(input).eq('id', id)
    if (updErr) throw updErr

    const rows = materializedRows(id, input, fromDate)
    if (rows.length) {
      const { error: insErr } = await supabase.from('transactions').insert(rows)
      if (insErr) throw insErr
    }
    await refresh()
    await refreshTransactions()
  }

  const deleteRecurringExpense = async (id: string, scope: RecurringEditScope) => {
    let del = supabase.from('transactions').delete().eq('recurring_expense_id', id)
    if (scope === 'future') del = del.gte('date', todayISO())
    const { error: delErr } = await del
    if (delErr) throw delErr

    const { error } = await supabase.from('recurring_expenses').delete().eq('id', id)
    if (error) throw error
    await refresh()
    await refreshTransactions()
  }

  return {
    recurringExpenses,
    loading,
    refresh,
    createRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
  }
}
