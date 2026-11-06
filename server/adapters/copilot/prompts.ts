import type {RawEvent} from './events.ts'
import type {Prompt} from '../../../shared/types.ts'

const MAX_PROMPT_LENGTH = 300

// A user.message with an agentId is the instruction given to a subagent, not something the user typed
export function parsePrompts(events: RawEvent[]): Prompt[] {
    return events
        .filter((event) => event.type === 'user.message' && !event.agentId)
        .map((event) => ({
            id: event.id,
            text: (event.data.content as string).slice(0, MAX_PROMPT_LENGTH),
            time: event.timestamp
        }))
}
