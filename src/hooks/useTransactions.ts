import { useCallback, useEffect, useState } from 'react'
import {
  deleteTransactionRow,
  insertTransactionRow,
  listTransactionsInRange,
  updateTransactionRow,
} from '../lib/demoStore'
import type { Transaction } from '../types'

export interface NewTransactionInput {
  date: string
  amount: number
  description: string
  category_id: string | null
}

export function useTransactions(rangeStart: string, rangeEnd: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setTransactions(listTransactionsInRange(rangeStart, rangeEnd))
    setLoading(false)
  }, [rangeStart, rangeEnd])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addTransaction = async (t: NewTransactionInput) => {
    insertTransactionRow({
      date: t.date,
      amount: t.amount,
      description: t.description || null,
      category_id: t.category_id,
      recurrence_group_id: null,
      recurring_expense_id: null,
    })
    await refresh()
  }

  const updateTransaction = async (id: string, patch: Partial<Transaction>) => {
    updateTransactionRow(id, patch)
    await refresh()
  }

  const moveTransaction = async (id: string, newDate: string) => {
    await updateTransaction(id, { date: newDate })
  }

  const deleteTransaction = async (id: string) => {
    deleteTransactionRow(id)
    await refresh()
  }

  return {
    transactions,
    loading,
    refresh,
    addTransaction,
    updateTransaction,
    moveTransaction,
    deleteTransaction,
  }
}
