# WalletPage code review

`WalletPageMessy.tsx` holds the original submission, `WalletPage.tsx` the cleaned-up result. Findings below refer to the fixed file where relevant.

## Actual bugs

- **No `blockchain` on `WalletBalance`.** `getPriority` receives `balance.blockchain` in both the filter and the sort, while the interface only declares `currency` and `amount`. The property doesn't exist on the type, so the original fails to compile under a normal TypeScript setup. Adding `blockchain: string` gives the rest of the logic something real to read.

- **`lhsPriority` was never defined.** The filter callback computes `balancePriority` and then tests a variable called `lhsPriority`, which exists nowhere in scope. Another compile error, and if the code somehow ran anyway it would throw a ReferenceError on the first pass. The fixed filter calls `getPriority(balance.blockchain)` directly.

- **The filter kept exactly the wrong balances.** Past the compile error, the condition only returns true when `balance.amount <= 0`, so everything the wallet actually holds gets dropped and the empty or negative rows stay. A wallet page needs the opposite: `getPriority(balance.blockchain) > -99 && balance.amount > 0`.

- **Sort comparator could return undefined.** On ties — Zilliqa and Neo both score 20 — neither branch runs and the function falls through returning nothing. Sort expects a number back every time, so strict null checks reject it, and tied values order inconsistently besides. The whole if/else chain collapses into `getPriority(rhs.blockchain) - getPriority(lhs.blockchain)`.

- **A missing price turned into NaN.** `prices[balance.currency]` comes back undefined until the feed loads, and `undefined * balance.amount` poisons `usdValue` plus anything rendering it. `(prices[balance.currency] ?? 0)` keeps an unloaded price from breaking the numbers shown on screen.

- **`children` destructured then dropped.** Props pulled `children` out but the returned JSX never rendered it, so anything nested inside `<WalletPage>` just disappeared. The wrapper div now renders `{children}` after the rows.

## Wasted work

- **`useMemo` depended on prices for no reason.** The dependency array was `[balances, prices]`, but the filtering and sorting inside never touch prices, so every live tick forced a full refilter and resort of data that hadn't changed. `[balances]` alone is enough.

- **`getPriority` rebuilt on every render.** Declared inside the component body even though nothing from props or state is used. It lives outside the component now and gets created once.

- **Switch replaced by a lookup.** Five known strings mapping to five numbers is exactly what a `Record<string, number>` is for. A new chain costs one object entry instead of another case block, and unknown names still fall through `?? -99`.

- **`formattedBalances` built and thrown away.** The map attached a `formatted` field nothing downstream reads, while `rows` mapped over `sortedBalances` and labeled its items `FormattedWalletBalance` — so at runtime `balance.formatted` was really undefined and WalletRow got a missing `formattedAmount`. Both steps merged into the single `rows` memo, producing `formatted` and `usdValue` together.

## Type safety and loose ends

- **`getPriority(blockchain: any)`.** Typing the parameter `any` accepts strings, numbers, whatever shows up without complaint. Plain `string` covers it since unrecognized names already hit the default case.

- **Array index as React key.** After the list is filtered and sorted, index n can point at a completely different balance between renders. React matches elements by key across renders, so unstable keys cause extra re-renders and lost row state. Keys are now `` `${blockchain}-${currency}` `` and hold up regardless of ordering.

- **`toFixed()` with no argument.** Rounds to zero decimal places by default, throwing away cents. `toFixed(2)` keeps fractional amounts visible.

- **Empty interface, left as-is.** `interface Props extends BoxProps {}` adds no members, and `type Props = BoxProps` would say the same thing with less syntax. The fixed file still declares the interface, so this one remains open if a change is wanted.
