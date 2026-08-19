function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

/** Contraste WCAG entre dos colores hex; 4.5:1 es el mínimo AA para texto normal. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA)
  const lB = relativeLuminance(hexB)
  const lighter = Math.max(lA, lB)
  const darker = Math.min(lA, lB)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Tinta legible (negro o blanco de la marca) para un fondo dado, la que dé más contraste. */
export function readableInk(bgHex: string): string {
  const ink = '#14141B'
  const void_ = '#FFFFFF'
  return contrastRatio(bgHex, ink) >= contrastRatio(bgHex, void_) ? ink : void_
}

const HEAT_INCOME_RGB = '14, 154, 98' // --color-income
const HEAT_EXPENSE_RGB = '194, 59, 99' // --color-expense

/** Fondo del modo "gastos relativos": intensidad proporcional a qué tan fuerte
 * fue este balance frente al máximo (absoluto) del mismo mes, para que un día
 * o semana se lea de un vistazo contra el resto del mes en cuestión. */
export function heatBackground(net: number, maxAbsInMonth: number): string | undefined {
  if (maxAbsInMonth <= 0 || net === 0) return undefined
  const intensity = Math.min(1, Math.abs(net) / maxAbsInMonth)
  const alpha = 0.1 + intensity * 0.55
  const rgb = net > 0 ? HEAT_INCOME_RGB : HEAT_EXPENSE_RGB
  return `rgba(${rgb}, ${alpha.toFixed(3)})`
}
