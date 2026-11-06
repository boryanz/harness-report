import type {RawEvent} from './events.ts'

const NANO_PER_CREDIT = 1e9

function total(checkpoint: RawEvent | undefined, field: 'totalNanoAiu' | 'totalPremiumRequests'): number {
    return (checkpoint?.data[field] as number | undefined) ?? 0
}

// Each usage_checkpoint holds the running total for the session, so the last one is the session's cost.
// Subtracting the last checkpoint before the month keeps a session that crosses months from counting old spend.
export function parseCredits(events: RawEvent[], monthStart: number) {
    const checkpoints = events.filter((event) => event.type === 'session.usage_checkpoint')
    const beforeMonth = checkpoints.filter((event) => Date.parse(event.timestamp) <= monthStart).at(-1)
    const last = checkpoints.at(-1)
    const credits = total(last, 'totalNanoAiu')

    return {
        credits: credits / NANO_PER_CREDIT,
        monthCredits: Math.max(credits - total(beforeMonth, 'totalNanoAiu'), 0) / NANO_PER_CREDIT,
        monthPremiumRequests: Math.max(total(last, 'totalPremiumRequests') - total(beforeMonth, 'totalPremiumRequests'), 0)
    }
}
