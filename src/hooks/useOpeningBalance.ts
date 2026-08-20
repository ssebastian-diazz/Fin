import { useEffect, useState } from 'react'
import { listTransactionsBefore } from '../lib/demoStore'

// Saldo acumulado de todo lo registrado ANTES de `beforeDate`.
// Para que esto tenga sentido real, registra una transacción única
// "Saldo inicial" en la fecha en que empezaste a usar la app.
export function useOpeningBalance(beforeDate: string) {
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    const sum = listTransactionsBefore(beforeDate).reduce((acc, r) => acc + Number(r.amount), 0)
    setBalance(sum)
  }, [beforeDate])

  return balance
}
