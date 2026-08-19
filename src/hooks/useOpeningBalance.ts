import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Saldo acumulado de todo lo registrado ANTES de `beforeDate`.
// Para que esto tenga sentido real, registra una transacción única
// "Saldo inicial" en la fecha en que empezaste a usar la app.
export function useOpeningBalance(beforeDate: string) {
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .lt('date', beforeDate)
      if (error) {
        console.error(error)
        return
      }
      const sum = (data ?? []).reduce((acc, r) => acc + Number(r.amount), 0)
      if (!cancelled) setBalance(sum)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [beforeDate])

  return balance
}
