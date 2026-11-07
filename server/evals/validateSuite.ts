import type {EvalSuite} from '../../shared/types.ts'

const KINDS = ['skill', 'agent']
const UNITS = ['percent', 'count', 'credits']
const DIRECTIONS = ['higher', 'lower']
const STATUSES = ['ok', 'invalid', 'error']

export type Parsed = {ok: true; suite: EvalSuite} | {ok: false; reason: string}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isText(value: unknown): value is string {
    return typeof value === 'string' && value !== ''
}

function oneOf(value: unknown, allowed: string[]): boolean {
    return typeof value === 'string' && allowed.includes(value)
}

function subjectProblem(subject: unknown): string | null {
    if (!isRecord(subject)) return 'subject is missing'
    if (!oneOf(subject.kind, KINDS)) return `subject.kind must be one of: ${KINDS.join(', ')}`
    if (!isText(subject.name)) return 'subject.name is missing'
    if (!isText(subject.version)) return 'subject.version is missing'
    return null
}

function metricProblem(metric: unknown, index: number): string | null {
    if (!isRecord(metric)) return `metrics[${index}] is not an object`
    if (!isText(metric.id)) return `metrics[${index}].id is missing`
    if (!isText(metric.label)) return `Metric "${metric.id}" has no label`
    if (!oneOf(metric.unit, UNITS)) return `Metric "${metric.id}": unit must be one of: ${UNITS.join(', ')}`
    if (!oneOf(metric.better, DIRECTIONS)) return `Metric "${metric.id}": better must be higher or lower`
    return null
}

function valueProblem(run: string, id: string, value: unknown, unit: unknown): string | null {
    if (value === null) return null
    if (typeof value !== 'number') return `Run "${run}": metric "${id}" must be a number or null`
    if (unit === 'percent' && (value < 0 || value > 1)) return `Run "${run}": percent metric "${id}" must be from 0 to 1`
    return null
}

function runProblem(run: unknown, index: number, units: Map<unknown, unknown>, arms: unknown): string | null {
    if (!isRecord(run)) return `runs[${index}] is not an object`
    if (!isText(run.case)) return `runs[${index}].case is missing`
    if (!oneOf(run.status, STATUSES)) return `Run "${run.case}": status must be one of: ${STATUSES.join(', ')}`
    if (!isRecord(run.metrics)) return `Run "${run.case}" has no metrics object`
    if (Array.isArray(arms) && !arms.includes(run.arm)) return `Run "${run.case}": arm must be one of the suite's arms`

    for (const [id, value] of Object.entries(run.metrics)) {
        if (!units.has(id)) return `Run "${run.case}" uses undeclared metric "${id}"`
        const problem = valueProblem(run.case, id, value, units.get(id))
        if (problem) return problem
    }
    return null
}

function suiteProblem(suite: Record<string, unknown>): string | null {
    if (suite.schema === undefined) return 'schema is missing'
    if (suite.schema !== 2) return `Unknown schema: ${suite.schema}`
    if (!isText(suite.suite)) return 'suite is missing'
    if (!isText(suite.started) || Number.isNaN(Date.parse(suite.started))) return 'started must be an ISO 8601 time'
    if (typeof suite.complete !== 'boolean') return 'complete must be true or false'

    const subject = subjectProblem(suite.subject)
    if (subject) return subject

    if (!Array.isArray(suite.metrics) || suite.metrics.length === 0) return 'metrics needs at least one metric'
    const metric = suite.metrics.map(metricProblem).find(Boolean)
    if (metric) return metric

    if (suite.arms !== undefined && !Array.isArray(suite.arms)) return 'arms must be a list'
    if (suite.baseline_arm !== undefined && !(suite.arms as unknown[] | undefined)?.includes(suite.baseline_arm)) {
        return 'baseline_arm must be listed in arms'
    }

    if (!Array.isArray(suite.runs)) return 'runs must be a list'
    const units = new Map(suite.metrics.map((item) => [item.id, item.unit]))
    return suite.runs.map((run, index) => runProblem(run, index, units, suite.arms)).find(Boolean) ?? null
}

// TypeScript's types are gone at runtime, so everything the app relies on is checked by hand here
export function validateSuite(value: unknown): Parsed {
    if (!isRecord(value)) return {ok: false, reason: 'The file must contain a JSON object'}

    const reason = suiteProblem(value)
    return reason ? {ok: false, reason} : {ok: true, suite: value as EvalSuite}
}
