import type {RawEvent} from './events.ts'
import type {AgentRun, SessionActivity, Span} from '../../../shared/types.ts'
type TimeSpan = {start: number; end: number}

const MIN_WAIT_MS = 30_000

function mergeSpans(spans: TimeSpan[]): TimeSpan[] {
    const merged: TimeSpan[] = []
    const sorted = [...spans].sort((a, b) => a.start - b.start)
    for (const span of sorted) {
        const last = merged.at(-1)
        if (last && span.start <= last.end) {
            last.end = Math.max(last.end, span.end)
        } else {
            merged.push({...span})
        }
    }
    return merged
}

function subtractSpans(spans: TimeSpan[], cuts: TimeSpan[]): TimeSpan[] {
    const remaining: TimeSpan[] = []
    for (const span of spans) {
        let start = span.start
        for (const cut of cuts) {
            if (cut.end <= start || cut.start >= span.end) continue
            if (cut.start > start) remaining.push({start, end: cut.start})
            start = Math.max(start, cut.end)
        }
        if (start < span.end) remaining.push({start, end: span.end})
    }
    return remaining
}

function toSpan(span: TimeSpan): Span {
    return {start: new Date(span.start).toISOString(), end: new Date(span.end).toISOString()}
}

export function parseActivity(events: RawEvent[], agents: AgentRun[]): SessionActivity {
    const mainEvents = events.filter((event) => !event.agentId)
    const times = events.map((event) => Date.parse(event.timestamp))
    const subagents = mergeSpans(agents.map((agent) => {
        const start = Date.parse(agent.start)
        return {start, end: start + agent.durationMs}
    }))
    const sessionStart = Math.min(...times)
    const sessionEnd = Math.max(...times, ...subagents.map((span) => span.end))

    const turns: TimeSpan[] = []
    let turnStart: number | null = null
    for (const event of mainEvents) {
        if (event.type === 'assistant.turn_start' && turnStart === null) {
            turnStart = Date.parse(event.timestamp)
        } else if (event.type === 'assistant.turn_end' && turnStart !== null) {
            turns.push({start: turnStart, end: Date.parse(event.timestamp)})
            turnStart = null
        }
    }
    if (turnStart !== null) turns.push({start: turnStart, end: sessionEnd})

    const askResults = new Map<string, RawEvent>()
    for (const event of events) {
        if (event.type === 'tool.execution_complete') askResults.set(event.data.toolCallId as string, event)
    }
    const asks = mergeSpans(mainEvents
        .filter((event) => event.type === 'tool.execution_start' && event.data.toolName === 'ask_user')
        .map((event) => {
            const result = askResults.get(event.data.toolCallId as string)
            return {start: Date.parse(event.timestamp), end: result ? Date.parse(result.timestamp) : sessionEnd}
        }))

    const idle = subtractSpans([{start: sessionStart, end: sessionEnd}], mergeSpans([...turns, ...subagents]))
    const waiting = mergeSpans([...asks, ...idle]).filter((span) => span.end - span.start >= MIN_WAIT_MS)
    const main = subtractSpans(mergeSpans(turns), mergeSpans([...asks, ...subagents]))
    return {main: main.map(toSpan), waiting: waiting.map(toSpan)}
}
