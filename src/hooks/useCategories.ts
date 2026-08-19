import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Category } from '../types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) console.error(error)
    setCategories(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createCategory = async (c: Omit<Category, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('categories').insert(c)
    if (error) throw error
    await refresh()
  }

  const updateCategory = async (id: string, patch: Partial<Category>) => {
    const { error } = await supabase.from('categories').update(patch).eq('id', id)
    if (error) throw error
    await refresh()
  }

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { categories, loading, refresh, createCategory, updateCategory, deleteCategory }
}
