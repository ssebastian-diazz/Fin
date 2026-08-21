# FinTrack — Personal Finance App

Public demo of a single-user personal finance app. Navigate by day, week, or
month, with a real running balance, recurring transactions, and a statistics
tab with a breakdown by category and fixed-vs-variable. Frontend built with
React + Vite + Tailwind.

**This demo has no backend.** The data you see is fictitious and is
generated and stored in your own browser's `localStorage` the first time you
load the page — each visitor sees their own editable copy, which doesn't
persist across visitors or devices and is never sent to any server.

## Usage

- **Calendar**: the ledger view — each month can be collapsed into a
  category summary or expanded into weeks, and each week into days. Navigate
  with the arrows or the "Today" button.
- **+ Transaction**: quick capture — amount, description, category, date,
  and if recurring, frequency + end date.
- Drag a transaction to another day/week, or use the arrows that appear on
  hover to move it one day at a time.
- **Statistics**: spending by category and fixed vs. variable, with toggles
  to view the period by month or by week, and values as a percentage or a
  total amount.
- **Settings** (gear icon): highlight color for the current period, and
  "Relative spending" mode — colors each day/week by how strong its balance
  was relative to the rest of the month.

## Running this project locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Fictitious data is seeded into `localStorage`
on first load; clear it from your browser's developer tools
(`localStorage.removeItem('fintrack-demo-v1')`) to reset the demo from
scratch.

**Note on the opening balance:** the running balance sums every transaction
from the start. To start from zero, log a single transaction called
"Opening balance" dated today with the amount you want to use as your
starting point.

## Publishing to GitHub Pages

1. **Settings → Pages** → source "GitHub Actions".
2. If the repo isn't named `FinTrack`, edit `base` in `vite.config.ts` to
   match (`/your-repo/`).
3. Push to `main` — `.github/workflows/deploy.yml` builds and deploys it.
