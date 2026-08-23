# 99Tech Code Challenge #1 #

Note that if you fork this repository, your responses may be publicly linked to this repo.  
Please submit your application along with the solutions attached or linked.   

It is important that you minimally attempt the problems, even if you do not arrive at a working solution.

## Submission ##
You can either provide a link to an online repository, attach the solution in your application, or whichever method you prefer.
We're cool as long as we can view your solution without any pain.

## Result ##

| # | Problem | Solution | Description |
|---|---------|----------|-------------|
| 1 | Sum to N | [src/problem1/index.mjs](./src/problem1/index.mjs) | Three approaches: iterative loop, mathematical formula, and recursion |
| 2 | Currency Swap Form | [src/problem2/README.md](src/problem2/README.md) | Frontend swap form with tests and CI |
| 3 | WalletPage Code Review | [src/problem3/README.md](src/problem3/README.md) | Code review findings plus refactored `WalletPage.tsx` |
| 4 | Sum to N (Complexity) | [src/problem4/index.mjs](./src/problem4/index.mjs) | Same three variants annotated with time/space complexity |
| 5 | Items Price API | [src/problem5/README.md](src/problem5/README.md) | Express REST API with SQLite, Swagger UI, and Vitest coverage |
| 6 | Live Scoreboard API Spec | [src/problem6/README.md](src/problem6/README.md) | Architecture, API spec, data model, and anti-cheat design |

## CI/CD ##

GitHub Actions runs one pipeline per solvable frontend/backend problem. Each workflow
lives in `.github/workflows/` and only touches its own problem's directory.

### [problem2.yml](./.github/workflows/problem2.yml) — swap form

Triggers on pushes and PRs that change `src/problem2/**` or the workflow itself, so
edits to other problems never wake it up. A concurrency group keyed on the branch
cancels superseded runs when new commits land.

The single job checks out the code, sets up Node 22 with the npm cache pinned to
`src/problem2/package-lock.json`, then runs three gates in order:

1. `npm ci` — clean install from the lockfile.
2. `npm run lint` and `npm run typecheck` — style rules and strict TypeScript.
3. `npm test -- --ci` — Vitest suite in CI mode (no watch, fail on unhandled errors).

### [problem5.yml](./.github/workflows/problem5.yml) — Items Price API

Same shape as problem2: path-filtered trigger, branch-keyed concurrency, Node 22,
cached install from `src/problem5/package-lock.json`. Two differences:

1. No lint step — the API relies on `tsc --noEmit` via `npm run typecheck`.
2. A comment notes why SQLite is safe here: `better-sqlite3` ships prebuilt binaries
   for ubuntu-latest, and the runner has the toolchain to compile from source if a
   prebuild is missing.

Tests run through `npm test`, which boots Express with an in-memory database and
exercises every route end-to-end via supertest.
