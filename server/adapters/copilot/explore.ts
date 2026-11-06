import {homedir} from 'node:os'
import {join} from 'node:path'
import {readEvents} from './events.ts'
import {parseAgents} from './agents.ts'

// Usage:
//   node server/adapters/copilot/explore.ts <session-id>           counts + list of every event
//   node server/adapters/copilot/explore.ts <session-id> <type>    the JSON of the first event of that type
const [id, type] = process.argv.slice(2)
const path = join(homedir(), '.copilot', 'session-state', id, 'events.jsonl')
const events = await readEvents(path)

// Long prompts and file contents would flood the terminal, so cut strings short
function shorten(_key: string, value: unknown) {
    if (typeof value === 'string' && value.length > 80) return value.slice(0, 80) + '...'
    return value
}

if (type) {
    const sample = events.find((event) => event.type === type)
    console.log(sample ? JSON.stringify(sample, shorten, 2) : `No event of type ${type}`)
} else {
    const counts = new Map<string, number>()

    for(const event of events) {
        counts.set(event.type, (counts.get(event.type) || 0) + 1)
    }

    console.log(events.length, 'events')
    console.log(events.filter((event) => event.agentId).length, 'from subagents')
    console.log(counts)
    console.log(parseAgents(events))
}
