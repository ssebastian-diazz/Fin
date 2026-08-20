import { useCallback, useEffect, useState } from 'react'
import {
  deleteRecurringExpenseRow,
  deleteTransactionsByRecurringId,
  insertRecurringExpenseRow,
  insertTransactionRows,
  listRecurringExpenses,
  updateRecurringExpenseRow,
} from '../lib/demoStore'
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
      recurrence_group_id: null,
      recurring_expense_id: recurringId,
    }))
}

export function useRecurringExpenses(refreshTransactions: () => Promise<void>) {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setRecurringExpenses(listRecurringExpenses())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createRecurringExpense = async (input: RecurringExpenseInput) => {
    const row = insertRecurringExpenseRow(input)
    const rows = materializedRows(row.id, input, input.start_date)
    if (rows.length) insertTransactionRows(rows)
    await refresh()
    await refreshTransactions()
  }

  const updateRecurringExpense = async (id: string, input: RecurringExpenseInput, scope: RecurringEditScope) => {
    const fromDate = scope === 'future' ? todayISO() : input.start_date

    deleteTransactionsByRecurringId(id, scope === 'future' ? todayISO() : undefined)
    updateRecurringExpenseRow(id, input)

    const rows = materializedRows(id, input, fromDate)
    if (rows.length) insertTransactionRows(rows)
    await refresh()
    await refreshTransactions()
  }

  const deleteRecurringExpense = async (id: string, scope: RecurringEditScope) => {
    deleteTransactionsByRecurringId(id, scope === 'future' ? todayISO() : undefined)
    deleteRecurringExpenseRow(id)
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
