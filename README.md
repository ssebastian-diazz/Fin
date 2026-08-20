# FinTrack — App personal de finanzas

Demo pública de una app de finanzas personales de un solo usuario (single-user). Se se navega por día, semana o mes, con saldo corrido real,
recurrentes, y una pestaña de estadísticas con desglose por categoría y
fijo-vs-variable. Frontend en React + Vite + Tailwind.

**Esta demo no tiene backend.** Los datos que ves son ficticios y se generan
y guardan en el `localStorage` de tu propio navegador la primera vez que
cargas la página — cada visitante ve su propia copia, editable, que no
persiste entre visitantes ni dispositivos y no se envía a ningún servidor.

## Uso

- **Calendario**: la T de mayor — cada mes se puede colapsar a un resumen por
  categoría o expandir a semanas, y cada semana a días. Navega con las flechas
  o el botón "Hoy".
- **+ Transacción**: captura rápida — monto, descripción, categoría, fecha, y
  si es recurrente, frecuencia + fecha de fin.
- Arrastra una transacción a otro día/semana, o usa las flechas que aparecen
  al pasar el cursor para moverla un día a la vez.
- **Estadísticas**: gastos por categoría y fijo vs. variable, con switches
  para ver el período por mes o por semana, y los valores en porcentaje o en
  monto total.
- **Ajustes** (ícono de tuerca): color de resaltado del período actual, y el
  modo "Gastos relativos" — colorea cada día/semana según qué tan fuerte fue
  su balance frente al resto del mes.

## Correr este proyecto localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Al primer load se siembran datos ficticios en
`localStorage`; bórralos desde las herramientas de desarrollador del
navegador (`localStorage.removeItem('fintrack-demo-v1')`) para reiniciar la
demo desde cero.

**Nota sobre el saldo inicial:** el saldo corrido suma todas las
transacciones desde el principio. Para arrancar desde cero, registra una
transacción única llamada "Saldo inicial" fechada hoy con el monto que
quieras usar como punto de partida.

## Publicar en GitHub Pages

1. **Settings → Pages** → fuente "GitHub Actions".
2. Si el repo no se llama `FinTrack`, edita `base` en `vite.config.ts` para
   que coincida (`/tu-repo/`).
3. Push a `main` — `.github/workflows/deploy.yml` construye y despliega.
