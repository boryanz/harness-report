import type {RawEvent} from './events.ts'

const NANO_PER_CREDIT = 1e9

function totalNanoAiu(checkpoint: RawEvent | undefined): number {
    return (checkpoint?.data.totalNanoAiu as number | undefined) ?? 0
}

// Each usage_checkpoint holds the running total for the session, so the last one is the session's cost.
// Subtracting the last checkpoint before the month keeps a session that crosses months from counting old spend.
export function parseCredits(events: RawEvent[], monthStart: number) {
    const checkpoints = events.filter((event) => event.type === 'session.usage_checkpoint')
    const beforeMonth = checkpoints.filter((event) => Date.parse(event.timestamp) <= monthStart).at(-1)
    const total = totalNanoAiu(checkpoints.at(-1))

    return {
        credits: total / NANO_PER_CREDIT,
        monthCredits: Math.max(total - totalNanoAiu(beforeMonth), 0) / NANO_PER_CREDIT
    }
}
