# FinTrack — libro mayor personal

Demo pública de una app de finanzas personales de un solo usuario: un "libro
mayor en T" que se navega por día, semana o mes, con saldo corrido real,
recurrentes, y una pestaña de estadísticas con desglose por categoría y
fijo-vs-variable. Frontend en React + Vite + Tailwind, backend en Supabase
(Postgres real).

**Los datos que ves en la demo son ficticios**, generados por `demo_seed.sql`
sobre un proyecto de Supabase separado, solo para este propósito — no hay
datos personales reales en este repositorio ni en el backend que usa.

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

1. Crea un proyecto en https://supabase.com (gratis).
2. **SQL Editor** → pega y corre `schema.sql` (crea las tablas, funciones de
   semana natural, vista de saldo diario, y categorías de ejemplo).
3. Opcional, para poblarlo con los mismos datos ficticios que la demo: corre
   también `demo_seed.sql` en el mismo editor (después de `schema.sql`, en un
   proyecto que no sea el tuyo real — genera meses de movimientos relativos a
   la fecha actual).
4. **Settings → API** → copia `Project URL` y la `anon`/`publishable` key.

```bash
npm install
cp .env.example .env
# pega tu Project URL y key en .env
npm run dev
```

Abre `http://localhost:5173`.

**Nota sobre el saldo inicial:** el saldo corrido suma todas las
transacciones desde el principio. Para arrancar desde cero, registra una
transacción única llamada "Saldo inicial" fechada hoy con el monto que
quieras usar como punto de partida.

## Publicar en GitHub Pages

1. En el repo: **Settings → Secrets and variables → Actions**, agrega
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
2. **Settings → Pages** → fuente "GitHub Actions".
3. Si el repo no se llama `FinTrack`, edita `base` en `vite.config.ts` para
   que coincida (`/tu-repo/`).
4. Push a `main` — `.github/workflows/deploy.yml` construye y despliega.

**Nota de seguridad:** la `anon`/`publishable` key es segura de exponer en un
frontend, pero como esta app no tiene login, cualquiera con la URL puede
leer y escribir en el proyecto de Supabase al que apunte. Por eso esta demo
usa un proyecto separado sembrado con datos ficticios — nunca apuntes un
despliegue público a un proyecto con datos reales.
