import { useRef, useState } from 'react'
import { Check, Settings } from 'lucide-react'
import { readableInk } from '../lib/color'
import { DEFAULT_NOW } from '../hooks/useNowColor'

const PRESETS = [
  { name: 'Violeta tenue', hex: '#EDE4FA' },
  { name: 'Celeste tenue', hex: '#E5EFFA' },
  { name: 'Menta tenue', hex: '#E5FAF2' },
  { name: 'Durazno tenue', hex: '#FAEFE5' },
  { name: 'Rosa tenue', hex: '#FAE5EC' },
  { name: 'Gris tenue', hex: '#EDEFF2' },
]

// Pequeño margen de gracia antes de cerrar por hover: sin esto, cruzar el
// hueco entre el ícono y el panel (o un temblor de mouse) lo cierra de golpe.
const CLOSE_DELAY_MS = 250

export function SettingsPanel({
  value,
  onChange,
  heatMode,
  onHeatModeChange,
}: {
  value: string
  onChange: (hex: string) => void
  heatMode: boolean
  onHeatModeChange: (v: boolean) => void
}) {
  // "hovering" es el hover normal (con margen de gracia); "pinned" es lo que
  // deja el clic — se mantiene fijo pase lo que pase con el mouse hasta que
  // se vuelve a apretar. El panel se ve si cualquiera de los dos es true.
  const [hovering, setHovering] = useState(false)
  const [pinned, setPinned] = useState(false)
  const open = hovering || pinned
  const closeTimer = useRef<number | null>(null)

  function clearCloseTimer() {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  function handleMouseEnter() {
    clearCloseTimer()
    setHovering(true)
  }

  function handleMouseLeave() {
    clearCloseTimer()
    closeTimer.current = window.setTimeout(() => setHovering(false), CLOSE_DELAY_MS)
  }

  // El clic fija o suelta el panel al instante, sin depender del mouse — así
  // siempre se puede dejarlo abierto a propósito o cerrarlo con un segundo clic.
  function handleToggle() {
    clearCloseTimer()
    setPinned((p) => !p)
  }

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Ajustes"
        aria-expanded={open}
        title="Ajustes"
        className="inline-flex items-center justify-center w-11 h-11 text-ink-soft rounded-none hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <Settings size={20} strokeWidth={2} />
      </button>

      <div
        className={`absolute right-0 z-50 mt-1.5 w-80 bg-panel-raised border border-line rounded-none shadow-[0_24px_60px_-20px_rgba(0,0,0,0.2)] p-3 transition-all duration-150 ${
          open ? 'opacity-100 visible translate-y-0 pointer-events-auto' : 'opacity-0 invisible -translate-y-1 pointer-events-none'
        }`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2.5">
          Color de resaltado
        </p>
        <div className="grid grid-cols-6 gap-1 mb-3">
          {PRESETS.map((p) => (
            <button
              key={p.hex}
              type="button"
              onClick={() => onChange(p.hex)}
              aria-label={p.name}
              aria-pressed={value.toUpperCase() === p.hex}
              title={p.name}
              className="w-11 h-11 rounded-full border border-line flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              style={{ backgroundColor: p.hex }}
            >
              {value.toUpperCase() === p.hex && <Check size={15} strokeWidth={3} color={readableInk(p.hex)} />}
            </button>
          ))}
        </div>

        <label className="flex items-center justify-between gap-2 text-xs text-ink-soft mb-2.5">
          Personalizado
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-7 rounded-none cursor-pointer bg-void p-0.5"
          />
        </label>

        {value.toUpperCase() !== DEFAULT_NOW && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_NOW)}
            className="w-full text-[11px] font-medium text-ink-soft hover:text-ink transition-colors text-left"
          >
            Restablecer color por defecto
          </button>
        )}

        <div className="mt-3 pt-3 border-t border-line-soft">
          <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
            <span className="text-xs text-ink-soft">Gastos relativos</span>
            <button
              type="button"
              role="switch"
              aria-checked={heatMode}
              onClick={() => onHeatModeChange(!heatMode)}
              className={`relative inline-flex shrink-0 h-5 w-9 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                heatMode ? 'bg-accent border-accent' : 'bg-line border-line'
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-block h-3.5 w-3.5 rounded-full bg-void transition-transform ${
                  heatMode ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
        </div>
      </div>
    </div>
  )
}
