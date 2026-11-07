# harness-report

A local dashboard for your coding agent harness. It reads your agent sessions and eval results from disk and shows where things go wrong: stuck loops, hung tool calls, failing tools and credit usage.

Everything runs on your machine. The server listens only on `127.0.0.1` and never sends your data anywhere.

## What it shows

- **Sessions**: every agent session this month, marked healthy, degraded or stuck, with a timeline, an event log and per-agent tool calls.
- **Needs attention**: problems found automatically, with a plain-English hint for known errors:
  - **Stuck loop**: the same tool fails 3+ times in a row.
  - **Hung call**: a tool call that never returned.
  - **Identical calls**: the agent repeats the exact same call.
  - **Tool failures**: recurring errors, grouped by agent and message.
- **Credits**: usage against your monthly budget.
- **Evals**: results from any test tool that writes the [eval results contract](docs/eval-contract.md), grouped by skill or agent and compared across versions.

Sessions are read from GitHub Copilot CLI (`~/.copilot/session-state`). Adapters for other harnesses live in `server/adapters/`.

## Quick start

Requires Node 22.18 or newer.

```sh
git clone <repo-url> harness-report
cd harness-report
npm install
npm run server   # API on http://127.0.0.1:3001
npm run dev      # UI on http://localhost:5173
```

> `npx harness-report` is coming soon.

## Configuration

Open **Settings** in the app to set your monthly credit budget and add eval results folders. Settings are saved to `~/.config/harness-report/settings.json`.

## Adding your evals

Write one JSON file per suite run into a folder and add that folder in Settings:

```json
{
  "schema": 2,
  "suite": "20260315-093000-my-skill",
  "subject": { "kind": "skill", "name": "my-skill", "version": "a1b2c3" },
  "started": "2026-03-15T09:30:00Z",
  "complete": true,
  "metrics": [{ "id": "passed", "label": "Tests passed", "unit": "percent", "better": "higher" }],
  "runs": [{ "case": "handles-empty-input", "status": "ok", "metrics": { "passed": 1 } }]
}
```

Any language or test runner works. See the [full contract](docs/eval-contract.md) for arms, baselines and noisy metrics.

## Project layout

```
server/            Node API (no framework, plain node:http)
  adapters/        reads sessions from a harness
  checks/          finds stuck loops, hung calls, failures
  evals/           loads and validates eval result files
shared/types.ts    types shared by server and UI
src/               React UI (Vite, Tailwind, shadcn/ui, Recharts)
fixtures/          synthetic sample data
docs/              eval results contract
```

## Scripts

| Command | What it does |
|---|---|
| `npm run server` | Start the API with auto-reload |
| `npm run dev` | Start the UI with hot reload |
| `npm run build` | Type-check and build the UI |
| `npm run lint` | Lint with oxlint |
