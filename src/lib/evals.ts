import type { EvalMetric, EvalRun, EvalSubject, EvalSuite } from '../../shared/types.ts'

// A suite with no arms has one unnamed group holding all its runs
export type Arm = string | undefined

export type SubjectEvals = {
  key: string
  subject: EvalSubject
  // The newest finished suite of each version, oldest version first
  history: EvalSuite[]
  running: EvalSuite | null
}

export type ArmStats = {
  ok: number
  invalid: number
  errors: number
  credits: number | null
  durationS: number | null
}

function mean(values: number[]): number | null {
  return values.length > 0 ? values.reduce((total, value) => total + value, 0) / values.length : null
}

function sampleDeviation(values: number[]): number {
  const average = mean(values) ?? 0
  const squares = values.reduce((total, value) => total + (value - average) ** 2, 0)
  return Math.sqrt(squares / (values.length - 1))
}

function reported(values: (number | undefined)[]): number[] {
  return values.filter((value) => value !== undefined)
}

export function suiteArms(suite: EvalSuite): Arm[] {
  return suite.arms ?? [undefined]
}

export function armRuns(suite: EvalSuite, arm: Arm): EvalRun[] {
  return arm === undefined ? suite.runs : suite.runs.filter((run) => run.arm === arm)
}

// Only ok runs say anything about the subject. A metric that doesn't apply to a run is skipped.
export function metricScore(runs: EvalRun[], metricId: string): number | null {
  const values = runs
    .filter((run) => run.status === 'ok')
    .map((run) => run.metrics[metricId])
    .filter((value) => value !== null && value !== undefined)
  return mean(values)
}

// Credits and time are costs, so every run counts, whatever its status
export function armStats(runs: EvalRun[]): ArmStats {
  const count = (status: EvalRun['status']) => runs.filter((run) => run.status === status).length
  return {
    ok: count('ok'),
    invalid: count('invalid'),
    errors: count('error'),
    credits: mean(reported(runs.map((run) => run.credits))),
    durationS: mean(reported(runs.map((run) => run.duration_s))),
  }
}

// How far a noisy metric moves between repetitions of the same thing. A smaller difference means nothing.
export function noiseMargin(suite: EvalSuite, metric: EvalMetric): number {
  if (!metric.noisy) return 0

  const spreads = suiteArms(suite).map((arm) => {
    const runs = armRuns(suite, arm)
    const reps = new Set(reported(runs.map((run) => run.rep)))
    const scores = [...reps]
      .map((rep) => metricScore(runs.filter((run) => run.rep === rep), metric.id))
      .filter((score) => score !== null)
    return scores.length > 1 ? sampleDeviation(scores) : 0
  })
  return Math.max(...spreads)
}

export function groupBySubject(suites: EvalSuite[]): SubjectEvals[] {
  const subjects = new Map<string, SubjectEvals & { versions: Map<string, EvalSuite> }>()

  for (const suite of suites) {
    const key = `${suite.subject.kind}:${suite.subject.name}`
    const entry = subjects.get(key) ?? { key, subject: suite.subject, history: [], running: null, versions: new Map() }
    subjects.set(key, entry)

    if (!suite.complete) {
      entry.running = suite
      continue
    }

    // Deleting first moves a re-run version to the end, so the order follows the newest run
    entry.versions.delete(suite.subject.version)
    entry.versions.set(suite.subject.version, suite)
    // A later finished suite means an earlier unfinished one was abandoned
    entry.running = null
  }

  return [...subjects.values()]
    .map(({ versions, ...entry }) => ({ ...entry, history: [...versions.values()] }))
    .sort((a, b) => a.subject.name.localeCompare(b.subject.name))
}

export function formatMetric(value: number | null, unit: EvalMetric['unit']): string {
  if (value === null) return '—'
  if (unit === 'percent') return `${Math.round(value * 100)}%`
  return value.toLocaleString([], { maximumFractionDigits: 1 })
}

export function formatMargin(value: number, unit: EvalMetric['unit']): string {
  return unit === 'percent' ? `±${Math.round(value * 100)} pts` : `±${value.toFixed(1)}`
}

export type Difference = {
  text: string
  verdict: 'better' | 'worse' | 'same'
  withinNoise: boolean
}

export function compareScores(score: number | null, baseline: number | null, metric: EvalMetric, margin: number): Difference | null {
  if (score === null || baseline === null) return null

  const delta = score - baseline
  const withinNoise = margin > 0 && Math.abs(delta) <= margin
  const sign = delta > 0 ? '+' : ''
  const text = metric.unit === 'percent' ? `${sign}${Math.round(delta * 100)} pts` : `${sign}${delta.toFixed(1)}`

  if (delta === 0 || withinNoise) return { text, verdict: 'same', withinNoise }
  const improved = metric.better === 'higher' ? delta > 0 : delta < 0
  return { text, verdict: improved ? 'better' : 'worse', withinNoise }
}
