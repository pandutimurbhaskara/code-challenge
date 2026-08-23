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

There are two GitHub Actions workflows under `.github/workflows/`, one per testable
problem. Each only fires when its own files change — fixing something in problem5
won't drag problem2 through its suite again. Pushing twice in a row also cancels any
run still in flight for the older commit instead of queueing it.

### [problem2.yml](./.github/workflows/problem2.yml) — swap form

Watches `src/problem2/**` plus the workflow itself. On Node 22 it does a clean
`npm ci` (npm cache is keyed to the lockfile, so installs stay fast), then checks the
code three ways: ESLint, `tsc --noEmit`, and the Vitest suite with `-- --ci` so nothing
tries to open a watch mode inside the runner.

### [problem5.yml](./.github/workflows/problem5.yml) — Items Price API

Same setup — path filter, Node 22, cached `npm ci` — minus the lint step; strict
typecheck covers what matters for an API this small. The interesting bit is SQLite:
`better-sqlite3` normally needs node-gyp, but prebuilt binaries exist for ubuntu-latest,
and worst case the runner has the toolchain to compile it anyway. The tests themselves
boot Express against an in-memory database and hit every route via supertest, so a green
build means the endpoints genuinely respond, not just that the types agree.

