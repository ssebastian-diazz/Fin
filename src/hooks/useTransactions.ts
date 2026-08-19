import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
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
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', rangeStart)
      .lte('date', rangeEnd)
      .order('date', { ascending: true })
    if (error) console.error(error)
    setTransactions(data ?? [])
    setLoading(false)
  }, [rangeStart, rangeEnd])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addTransaction = async (t: NewTransactionInput) => {
    const { error } = await supabase.from('transactions').insert({
      date: t.date,
      amount: t.amount,
      description: t.description || null,
      category_id: t.category_id,
    })
    if (error) throw error
    await refresh()
  }

  const updateTransaction = async (id: string, patch: Partial<Transaction>) => {
    const { error } = await supabase.from('transactions').update(patch).eq('id', id)
    if (error) throw error
    await refresh()
  }

  const moveTransaction = async (id: string, newDate: string) => {
    await updateTransaction(id, { date: newDate })
  }

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
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
