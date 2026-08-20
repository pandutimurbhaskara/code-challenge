# Problem 2 — Currency Swap Form

A currency swap form where a user converts one crypto asset into another at live
exchange rates. Built with **Vite + React + TypeScript**.

## Run it

```bash
npm install
npm run dev      # dev server + HMR (http://localhost:5173)
npm run build    # type-check (tsc -b) + production build
npm run preview  # preview the production build
npm run lint     # oxlint
```

## What it does

- **Live prices** — exchange rates come from
  `https://interview.switcheo.com/prices.json`. Records are deduplicated to the
  most recent quote per currency, and tokens without a price are omitted. A
  bundled snapshot (`src/data/prices.json`) is used as a fallback if the live
  fetch fails, so the form always works offline (an "offline prices" badge shows
  when the fallback is used).
- **Token picker** — a searchable dialog listing every priced token with its
  logo, USD price, and balance. Fully keyboard-navigable (type to filter, arrow
  keys to move, Enter to select, Esc to close). Token icons come from the
  [Switcheo token-icons](https://github.com/Switcheo/token-icons) repo and fall
  back to a colored monogram if an icon is missing.
- **Bidirectional conversion** — edit either the "pay" or "receive" amount and
  the other side recomputes from USD prices. A live "1 X = Y" rate and per-side
  USD values are always shown.
- **Direction toggle** — the ⇅ control on the rate rule swaps the two tokens
  (and their amounts). Selecting the counterpart token in the picker flips the
  pair too.
- **Validation** — the submit button reflects state directly: *Enter an amount*,
  *Insufficient balance* (with an error style on the field), or *Swap X for Y*.
  Balances are simulated (deterministic mock holdings) to make "Max" and the
  insufficient-balance check meaningful.
- **Simulated submit + balance updates** — submitting shows a loading spinner
  for a short delay (mock backend), then a confirmation receipt. On success the
  sent token is **debited** and the received token **credited**. These changes
  are kept in memory only, so **refreshing the page returns every balance to its
  original value**.
- **Light / dark theme** — a toggle (top-right) switches themes; the preference
  is saved to `localStorage` and applied before first paint (no flash). You can
  also force a theme with `?theme=light` / `?theme=dark`.

## Structure

```
src/
├─ main.tsx                     # React entry
├─ App.tsx / App.css            # page shell (background, layout)
├─ index.css                    # theme tokens, reset, focus styles
├─ lib/
│  ├─ types.ts                  # PriceRecord, Token
│  ├─ prices.ts                 # fetch + dedupe + build tokens (+ fallback)
│  ├─ tokens.ts                 # icon URLs, mock balances, monogram colors
│  └─ format.ts                 # number parsing / formatting
├─ hooks/
│  ├─ useTokens.ts              # load state + in-memory balance deltas
│  └─ useTheme.ts               # light/dark preference (persisted)
├─ components/
│  ├─ SwapCard.tsx / .css       # the form: fields, rate rule, CTA, submit
│  ├─ TokenSelectDialog.tsx     # searchable token picker (a11y)
│  ├─ ThemeToggle.tsx           # light/dark switch
│  └─ TokenIcon.tsx             # remote SVG with monogram fallback
└─ data/prices.json             # bundled fallback snapshot
```

## Styling

**Tailwind CSS v4** (via `@tailwindcss/vite`), set up so the JSX stays clean:
- The palette, fonts, and radii are registered as Tailwind theme tokens with
  `@theme` in `src/index.css`, which generates utilities like `bg-surface`,
  `text-fg-dim`, `rounded-card`, and `font-mono`.
- Components use **semantic class names** (`card`, `field`, `token-pill`, …); the
  actual utilities live in the scoped CSS files via `@apply` (each references the
  theme with `@reference '../index.css'`). Bespoke bits (the ledger-rule
  gradient, glow, gradient CTA, keyframes) stay as hand-written CSS.
- **Theming** is one variable swap: the `@theme` tokens are CSS variables, and
  `:root[data-theme='light']` overrides them — no `dark:` variants scattered
  through the markup.
