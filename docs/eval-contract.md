# Eval results contract

The same content is shown in the app under Evals → Docs (`src/components/evals/ContractGuide.tsx`). Change both together.

harness-report shows eval results from JSON files. It doesn't know how your tests work: any tool in any language can
appear in the Evals screen by writing one file per suite run.

## Quick start

Write a file like this into a results folder:

```json
{
  "schema": 2,
  "suite": "20260315-093000-my-skill",
  "subject": { "kind": "skill", "name": "my-skill", "version": "a1b2c3" },
  "started": "2026-03-15T09:30:00Z",
  "finished": "2026-03-15T09:34:10Z",
  "complete": true,
  "metrics": [
    { "id": "passed", "label": "Tests passed", "unit": "percent", "better": "higher" }
  ],
  "runs": [
    { "case": "handles-empty-input", "status": "ok", "metrics": { "passed": 1 } }
  ]
}
```

Then point harness-report at the folder in `~/.config/harness-report/config.toml`:

```toml
[evals]
results = "~/my-evals/results"       # or a list: ["~/my-evals/results", "~/team-evals/results"]
```

Every `*.json` file directly in the folder is read. Subfolders are ignored, so you can keep run artifacts there.

## Suite fields

| Field | Required | Meaning |
|---|---|---|
| `schema` | yes | Always `2`. |
| `suite` | yes | Unique id for this run of the suite. |
| `subject` | yes | What was tested, see below. |
| `started` | yes | ISO 8601 time with a timezone. |
| `finished` | no | ISO 8601 time. `null` or missing while the suite runs. |
| `complete` | yes | `false` until the last run is written. |
| `metrics` | yes | The metrics this suite reports, in display order. At least one. |
| `arms` | no | Variants being compared, such as `["with-skill", "baseline"]`. Leave it out if you compare nothing. |
| `baseline_arm` | no | The arm the others are compared against. Must be listed in `arms`. |
| `labels` | no | Extra text shown on the card, as string pairs: `{ "agent model": "some-model" }`. |
| `runs` | yes | One entry per run. May be empty while the suite runs. |

### `subject`

| Field | Required | Meaning |
|---|---|---|
| `kind` | yes | `skill` or `agent`. |
| `name` | yes | Results for the same `kind` and `name` are grouped on one card. |
| `version` | yes | Any string that changes when the subject changes, such as a content hash. Version history is grouped by it. |

### `metrics`

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Key used in each run's `metrics`. |
| `label` | yes | Text shown in the table. |
| `unit` | yes | `percent` (a number from 0 to 1), `count`, or `credits`. |
| `better` | yes | `higher` or `lower`. Decides whether a difference is good or bad. |
| `noisy` | no | `true` if the score moves between identical runs, for example when an LLM judge gives it. See "Noise". |

## Run fields

| Field | Required | Meaning |
|---|---|---|
| `case` | yes | Test case id. Repeats of a case share it. |
| `status` | yes | `ok`, `invalid` or `error`. See "How scores are worked out". |
| `metrics` | yes | Values by metric id. Use `null` or leave a metric out when it doesn't apply to this run. Pass and fail are `1` and `0`. |
| `type` | no | Short case category shown as a tag, such as `trap`. |
| `arm` | no | Which entry of `arms` this run belongs to. Required when the suite has `arms`. |
| `rep` | no | Repetition number, starting at 1. Needed for noise. |
| `reason` | no | Why the run is `invalid` or `error`. |
| `session_id` | no | Agent session behind this run, so the app can open its timeline and tool log. |
| `credits` | no | Cost of the run. |
| `duration_s` | no | Length of the run in seconds. |

## How scores are worked out

- A metric's score for an arm is the mean of its values across runs with status `ok`. `null` and missing values are
  skipped. `invalid` and `error` runs say nothing about the subject, so they never affect a score, and the card shows
  how many were left out.
- `credits` and `duration_s` are costs, so they're averaged over every run that reports them, whatever its status.
- Metrics are never blended into one overall score.

## Noise

Mark a metric `noisy` and give runs a `rep` to get a noise margin. For each arm, the app takes the mean of the metric
within each repetition and then the standard deviation of those means. The larger value across arms is the margin,
and a difference inside it is labelled "within noise". With only one repetition the margin is 0.

## Rules for writers

- **Write atomically.** Write to a temporary file in the same folder and rename it over the real one. The app can read
  at any moment.
- **Keep `complete: false` until the end.** Update the file after each run if you want live progress. The app never
  scores an incomplete suite.
- **One file per suite run.** Don't overwrite old files. They are your version history.
- **Don't change a metric's meaning under the same `id`.** Versions are compared by `id`. Use a new one instead.

## When a file is rejected

A file that can't be read or doesn't follow this contract is listed in the Evals screen with the reason. It never
stops other files from loading. Files that aren't valid JSON, or are missing required fields, are rejected. A run with
a metric id that isn't declared in `metrics` is also rejected, because that's almost always a typo.

## Starting a suite from the app

The app starts a suite by running a command you declare, and it never builds a command from anything the browser
sends. It shows the command's output and then reads the result files as usual, so your command only has to write a
file that follows this contract.

```toml
[[evals.suites]]
name = "my-skill"
cwd = "~/my-evals"
command = "./run-evals.sh --skill my-skill"
```

Examples: [`fixtures/evals`](../fixtures/evals).
