---
name: Finanzas
description: A private, instrument-precise personal ledger — cold paper and one deep-pine accent, never a fintech dashboard selling goals.
colors:
  void: "#FFFFFF"
  panel: "#F6F6F8"
  panel-raised: "#FFFFFF"
  line: "#E3E3E9"
  line-soft: "#EEEEF2"
  shade: "#E4E4EC"
  now: "#EDE4FA"
  ink: "#14141B"
  ink-soft: "#686874"
  ink-faint: "#6E6E77"
  accent: "#0F2E22"
  accent-soft: "#314B41"
  accent-dim: "#ECEEED"
  income: "#0E9A62"
  income-dim: "#E5F7EE"
  expense: "#C23B63"
  expense-dim: "#FCEAF1"
  danger: "#DC2626"
  danger-dim: "#FDEAEA"
typography:
  display:
    fontFamily: "Overpass, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px–15px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.06em–0.14em"
  data:
    fontFamily: "Clear Sans, ui-sans-serif, sans-serif"
    fontSize: "12px–18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  none: "0px"
  full: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.void}"
    typography: "{typography.display}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-soft}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.display}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.void}"
    typography: "{typography.display}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  input:
    backgroundColor: "{colors.void}"
    textColor: "{colors.ink}"
    typography: "{typography.data}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  transaction-chip:
    backgroundColor: "{colors.panel-raised}"
    typography: "{typography.data}"
    rounded: "{rounded.none}"
    padding: "4px 4px 4px 10px"
---

# Design System: Finanzas

## Overview

**Creative North Star: "The Cold Ledger"**

Finanzas reads as a private accounting instrument, not a fintech dashboard selling goals. The surface is deliberately unwarm: white and cool grey paper, a single deep-pine accent held in reserve for action and selection, and a strict jade/wine pairing for income and expense that never bleeds into decoration. This is a conscious rejection of the genre's default — no beige, no cream, no soft "AI assistant" comfort palette — in favor of the flat, precise, slightly clinical feel of a well-kept paper ledger read under good light. Every corner is sharp: ruled paper doesn't have rounded cells, and neither does this ledger — curvature is reserved entirely for the small set of genuinely circular controls (dots, icon buttons), never for a card, chip, or button edge.

Density is the point, not a compromise. The calendar is the product: day, week, and month views pack real transaction data into narrow, ruled columns, and the design system exists to keep that density legible rather than to soften it. Where the interface needs to speak with weight (a destructive action, a running balance, a category), it does so through color role, position, or weight, never through size or ornament — a chip's left edge tags its category, its type color says income or expense, bold is reserved for the two numbers that matter most (opening and closing balance), and nothing on the page shouts.

**Key Characteristics:**
- One accent color (deep pine, a very dark green — fixed, not user-configurable), spent almost exclusively on primary actions, active state, and focus — never on decoration.
- Income and expense are the only two colors allowed to carry meaning in running text or figures; category identity lives in small dots and edge-tags, never in full-bleed fills.
- Every corner is sharp (0px radius) except genuinely circular controls — no soft "card" rounding anywhere.
- Flat by default: hairline borders do the separating; shadows are reserved for things that float (modals, the floating month controls).
- Numerals are tabular and set in a distinct data face, so columns of money always align; only opening and closing balances are bold, so the eye can find the two numbers that anchor a period without the page feeling like everything is shouting.
- The expanded week/day calendar view grows to fill the space it's given; the collapsed month summary deliberately stays compact instead, so the two states read as visually distinct rather than uniform.
- Overflow inside a fixed-height list is paged, never scrolled — an internal scrollbar would compete with the calendar's own horizontal month-to-month scroll gesture.

## Colors

Cold neutrals carry the page; the deep-pine accent is spent in small, deliberate doses; jade and wine are the only colors allowed to mean something in a figure.

### Primary
- **Deep Pine** (`#0F2E22`): the one accent, fixed (not user-configurable). Active navigation, primary buttons, focus rings, links, and the running-balance figure when positive. Hover state lightens to **Accent Soft** (`#314B41`); selected/active surfaces use **Accent Dim** (`#ECEEED`) as a tint background, never the full-strength hex as a fill. Deliberately much darker than **Jade** (income) so a positive balance and an income figure never read as the same green at a glance.

### Secondary
- **Tenue Violet** (`#EDE4FA` default, token `now`): the highlight wash for temporal position — today's day cell, the current week's header, the current month's label pill. Deliberately a distinct hue from the accent (not just a lighter tint of it), so "this is now" and "this is selected/actionable" never read as the same signal. This is the one user-customizable color in the system, set from the Ajustes panel (header, top-right) — a flat wash with no derived soft/dim shades, so any custom hue should stay light enough for `ink` text to sit on top of it legibly.

### Neutral
- **Paper White** (`#FFFFFF`): page background and every elevated surface (modals, transaction chips, "raised" cards) — `void` and `panel-raised` share this value but are named separately for what they mean: `void` is the page itself, `panel-raised` is something sitting a level above the page.
- **Cool Fog** (`#F6F6F8`): the recessed panel tone — calendar column bodies, the sticky header background, stat-card fills. This is the "resting" surface; things lift off of it in Paper White.
- **Hairline** (`#E3E3E9`) / **Hairline Soft** (`#EEEEF2`): the two border weights. `line` separates structural regions (card edges, column borders); `line-soft` separates content within a region (the divider between a week column's income and expense halves).
- **Shade** (`#E4E4EC`): a purely neutral track/fill tone now scoped to one job — the empty portion of the Estadísticas progress bars. It no longer means "current"; see `now` above.
- **Ink** (`#14141B`), **Ink Soft** (`#686874`), **Ink Faint** (`#6E6E77`): the three-step text hierarchy, darkest to most muted. Ink Faint was deliberately darkened from an earlier near-invisible grey (`#9A9AA6`) to clear 4.5:1 against both Paper White and Cool Fog — it is muted, not illegible.

### Named Rules
**The One Accent Rule.** The deep-pine accent is the only color with license to mean "this is the important action here." It never appears as a category color, a decorative fill, or a status indicator — those belong to income/expense green-wine, to the `now` wash for temporal position, or to a category's own assigned dot color.

**The Figure-Color Rule.** Only two hexes are allowed to color a money figure: `income` (jade) for positive amounts, `expense` (wine) for negative ones. Category identity is conveyed by position (a dot, a left-edge bar) never by recoloring the number itself.

## Typography

**Display Font:** Overpass (with ui-sans-serif, system-ui fallback)
**Data Font:** Clear Sans, self-hosted (with ui-sans-serif fallback)

**Character:** Overpass carries every label, heading, and button — set semibold-to-extrabold, frequently uppercase with wide tracking (0.06–0.14em), giving the chrome a stamped, instrument-panel feel. Clear Sans carries every number, set with `tabular-nums` so columns of currency always align vertically; it's the "read the dial" face, distinct from the "read the label" face.

### Hierarchy
- **Title:** there is no text wordmark — the header carries only the `F` brand mark (white glyph on an `ink`-filled square), the sole branded element in the app.
- **Body** (semibold, 12–14px): modal titles, section headers, category names, most UI copy.
- **Data — balance** (semibold, 12–18px, tabular-nums): opening and closing balance figures only — the top and bottom of every week/day/month-summary column, and the closing figure inline in a collapsed month's header. 18px only for the amount field inside the transaction form; every other balance sits at 12px by design.
- **Data — transaction** (regular weight, 12px, tabular-nums, colored by income/expense): every individual transaction amount inside a chip. Deliberately lighter than the balances that bracket it, so the two "anchor" numbers per column stay findable at a glance instead of every figure competing at the same weight.
- **Label** (semibold, 10–11px, uppercase, 0.06–0.14em tracking): form field labels, category micro-badges, the day-of-week headers in the day-breakout view.

### Named Rules
**The Tabular Rule.** Any element displaying currency uses `font-data` with `tabular-nums`. Never mix the display face into a money figure, even a small one.

**The Balance-Only Bold Rule.** Semibold weight on a money figure is reserved for opening and closing balances — the two numbers that frame a period. An individual transaction amount is never bold, no matter how large; weight is spent on anchors, not on every line.

## Layout

The app is a single sticky header over one full-height content region — there is no sidebar, no secondary navigation, no dashboard grid of unrelated widgets. `main` fills the viewport below the header (`flex-1`, minimum height cleared with `min-h-0`) and its content stretches to fill that space rather than sitting at natural content height with blank page below it.

**Calendario** is a horizontally-scrolling strip of month blocks (custom native-feel scroll, wheel input redirected from vertical to horizontal). Each month is a fixed-width column set: week columns at 116px, single-day columns at 92px, a collapsed month-summary column at 208px. An **expanded** month (week or day view) stretches every column to the full height of the viewport-minus-chrome, splitting extra vertical room evenly between its income and expense halves — like ruled lines running to the bottom of a physical ledger page. A **collapsed** month deliberately does the opposite: `MonthSummaryColumn` sizes to its own content and floats at the top of the row (`align-self: flex-start`), staying short next to a tall expanded neighbor. This asymmetry is the point — collapsed and expanded read as two distinct modes, not the same layout with more or less data in it.

**Overflow inside a column is paged, not scrolled.** A fixed-height income or expense list measures how many transaction chips actually fit and, if there are more, shows only one page at a time with a small "chevron + n/total" control to cycle through the rest. This exists specifically because an internal `overflow-y-auto` captures the mouse wheel and blocks the calendar's own gesture for moving between months — scroll is reserved entirely for horizontal month navigation.

**Estadísticas** is a two-panel row (stacks to one column below the `md` breakpoint) that fills the same vertical space: the category-breakdown list spaces its rows out to use the full card height, and the fixed-vs-variable panel centers its single visualization block vertically within its card.

Responsive behavior is content-driven, not device-driven: the header collapses from a single row to two stacked rows below `sm` specifically because its two button groups no longer fit side by side, not because "mobile" implies stacking as a rule.

## Elevation & Depth

Flat by default. The base surfaces (page, panels, cards, chips) carry no shadow at rest — separation comes from hairline borders and the panel/panel-raised tone shift. Shadow is reserved for things that visually float above the page: modals, the sticky header's lower edge, and the fixed month-navigation controls in the bottom-right corner.

### Shadow Vocabulary
- **Modal float** (`0 24px 60px -20px rgba(0,0,0,0.2)`): the diffuse, generous shadow under every modal and confirm dialog — the strongest shadow in the system, reserved for content that interrupts the page.
- **Floating controls** (`0 12px 30px -10px rgba(0,0,0,0.18)`): the pill-shaped month-scroll and "Hoy" controls fixed to the bottom-right corner.
- **Header separation** (`0 8px 24px -16px rgba(0,0,0,0.12)`): a tight, low-spread shadow under the sticky header — present but easy to miss, just enough to read as "above" the scrolling content.
- **Primary CTA glow** (`0 2px 8px -2px` at 35% of the accent color, via `color-mix`): the one colored shadow in the system, tinted to the active accent, under the "+ Transacción" button only.
- **Selected-state ring** (`inset 0 0 0 1px` in the relevant hue at 35% alpha): used instead of a shadow for toggle selection (income/expense/scope segmented controls) — an inset hairline in the selected color, not a fill or an outer glow.
- **Swatch ring** (`inset 0 0 0 1px rgba(0,0,0,0.25/0.18/0.15)`): every category-color dot — where the fill is an arbitrary user-chosen color, not a system token — gets a fixed-alpha black inset ring for edge definition, since the fill alone can't be trusted to read against any background. Alpha scales down with size: 0.25 for the ~12px list-row dots, 0.18 for the ~6px month-summary/preview dots, 0.15 for the ~10px Estadísticas legend dots. The transaction chip's left-edge color bar is the one exception — it deliberately has no ring, since its full-height edge against the chip's own border already gives it definition.

### Named Rules
**The Floating-Only Rule.** A drop shadow only appears on something that is genuinely layered above the page (modal, sticky header, fixed controls) or on the single primary CTA. A card at rest never has one.

## Shapes

Sharp rectangles and hairline borders throughout — zero radius on every card, chip, modal, input, and rectangular button. This reads as ruled ledger paper: real accounting pages don't have soft corners, and neither does this one. Curvature is reserved exclusively for things that are genuinely circular by function, not for softening a rectangle: category dots, the recurring-transaction marker, and icon-only controls whose hit area is a true circle (quick-add buttons, the bottom-right month-scroll pair, the `ConfirmDialog` icon badge). A wide pill shape (the old "Hoy" button, the scroll-control tray) is not exempt just because it used to be `rounded-full` — if it isn't a circle, it's sharp.

### Named Rules
**The Circle-or-Sharp Rule.** There are exactly two corner states in this system: 0px, or a true circle (`border-radius: 9999px` on an element whose width equals its height). Nothing in between — no 4px, 6px, or 8px "soft" radius survives anywhere. If an element isn't a literal circle, it's a sharp rectangle.

The transaction chip's left-edge color bar (a 6px-wide full-height rectangle in the category's color, clipped flush by the chip's own sharp corners) is the system's one signature shape — it tags a dense row with color without ever filling it.

## Components

### Buttons
- **Shape:** sharp (0px radius) for every rectangular button — primary, secondary, danger, and pill-shaped floating controls alike. Only literal icon-circle controls stay round.
- **Primary:** deep-pine fill, white text, semibold uppercase label, 44px minimum height. Hover shifts to Accent Soft.
- **Secondary / Ghost:** transparent or hairline-bordered, `ink-soft` text that darkens to `ink` on hover.
- **Danger:** solid `danger` fill, reserved for the confirm action inside a `ConfirmDialog` — never used for a bare delete trigger, which stays ghost-styled until confirmed.
- **Icon-only:** circular, 44px hit area, `ink-faint` icon that shifts to `accent` (or `danger` for destructive icons) on hover; every one carries an explicit `aria-label`.

### Chips
- **Transaction chip:** `panel-raised` background, hairline `line-soft` border, sharp corners, a left-edge color bar tagging the category. The amount is set in `font-data`, colored `income` or `expense` by sign — never by category — and never bold (see Typography's Balance-Only Bold Rule). A recurring transaction gets a small muted dot in the top-right corner; hovering reveals two 12px-wide day-nudge chevrons layered on top of the chip's edges.
- **Category dot:** a small circle (6-12px depending on context) filled with the category's own color, always paired with the category name in plain `ink-soft` text — never a full-color fill badge. Used identically in the Categorías list, the Recurrentes list, and the Estadísticas legend.

### Cards / Containers
- **Corner Style:** sharp, 0px radius, everywhere.
- **Background:** `panel` (Cool Fog) for calendar columns and stat cards; `panel-raised` (Paper White) for anything meant to read as "above" that, including transaction chips sitting inside a `panel` column.
- **Shadow Strategy:** none at rest (see Elevation & Depth).
- **Border:** 1px `line`, `line-soft` for internal dividers.

### Inputs / Fields
- **Style:** `void` background, 1px `line` border, sharp corners, `font-data` for numeric fields.
- **Focus:** border shifts to `accent`, paired with a 1px `accent` ring at 40% alpha.
- **Native chrome removed:** number inputs lose their spin buttons deliberately — "the amount is an instrument reading, not a stepper."

### Navigation
- Text-only tabs (Calendario / Estadísticas), semibold uppercase, `ink-soft` at rest with a transparent bottom border; active state switches text to `accent` and fills that border with a 2px `accent` underline — no background fill. Hover on an inactive tab shows a faint `ink-faint` underline, never the accent color. No icons in primary navigation; icons are reserved for secondary actions (Recurrentes, Ajustes) and destructive/utility controls.

### Modal & ConfirmDialog (signature pattern)
Every modal shares one shell: a `bg-ink/40` backdrop with blur, a centered `panel-raised` surface with sharp corners and the Modal Float shadow, and a 220ms `modal-in` entrance (fade + slight rise + scale). `ConfirmDialog` is the same shell at a smaller max-width, always layered on top of its parent modal (`z-[60]` vs. the parent's `z-50`), with a danger-tinted icon badge and a mandatory two-button choice — it never auto-dismisses and Escape closes only the topmost layer, not both at once.

## Do's and Don'ts

### Do:
- **Do** spend the accent only on primary action, active state, selection, and focus — nowhere else.
- **Do** color a money figure by income/expense sign, never by category, and reserve bold weight for opening/closing balances only.
- **Do** use the left-edge color bar (or a plain dot) for category identity; never a full-bleed colored fill on text-bearing surfaces.
- **Do** keep every card, chip, modal, input, and rectangular button at 0px radius; reserve `rounded-full` strictly for true circles.
- **Do** let an expanded week/day view grow to fill available viewport height; keep a collapsed month summary compact and content-sized instead, so the two states stay visually distinct.
- **Do** page a fixed-height list when its content overflows, with a small chevron + page-count control — never give it its own `overflow-y-auto`.
- **Do** pair every icon-only control with an explicit `aria-label`, and give every standalone control a 44px hit area. **Exception:** cells inside a genuinely dense grid — the `DatePicker` popup's day grid (7 columns of a full month in a 256px-wide popup) and the main calendar's own quick-add/day-nudge micro-controls — are allowed below 44px, the same way the calendar itself is allowed to be dense; this is a deliberate trade against ballooning a compact grid, not overlooked drift. Anything that isn't part of a repeating dense grid (month-nav chevrons, preset swatches, standalone icon buttons) still gets the full 44px.
- **Do** require explicit confirmation, via `ConfirmDialog`, before any destructive or hard-to-reverse action (delete, or rewriting past recurring transactions).

### Don't:
- **Don't** introduce a second accent color. One deep-pine, spent rarely, is the rule.
- **Don't** add a drop shadow to a surface at rest — shadow is reserved for things that float above the page.
- **Don't** reach for warm/cream/beige tones anywhere in the neutral scale — the palette is deliberately cold.
- **Don't** let a category's arbitrary user-chosen color become the background of a text-bearing surface — it clashes across categories and breaks contrast guarantees; keep it to dots and edge-tags.
- **Don't** add `overflow-y-auto` (or any independent scroll region) inside the horizontally-scrolling calendar strip — it captures the wheel gesture the month-to-month navigation depends on.
- **Don't** ship a destructive action without a confirm step, or a modal without an Escape handler.
