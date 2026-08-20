import { useCallback, useEffect, useState } from 'react'
import { deleteCategoryRow, insertCategoryRow, listCategories, updateCategoryRow } from '../lib/demoStore'
import type { Category } from '../types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setCategories(listCategories())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createCategory = async (c: Omit<Category, 'id' | 'created_at'>) => {
    insertCategoryRow(c)
    await refresh()
  }

  const updateCategory = async (id: string, patch: Partial<Category>) => {
    updateCategoryRow(id, patch)
    await refresh()
  }

  const deleteCategory = async (id: string) => {
    deleteCategoryRow(id)
    await refresh()
  }

  return { categories, loading, refresh, createCategory, updateCategory, deleteCategory }
}
