import type { RawEvent } from "./events.ts";
import type {AgentRun} from '../../../shared/types.ts'


// Copilot's default agent type says nothing useful, so these runs are labelled by their model instead
const DEFAULT_AGENT = 'general-purpose'

// claude-sonnet-5.5 -> Sonnet 5.5, gpt-5.6-luna -> GPT 5.6 Luna
function modelLabel(model: string): string {
    return model
        .replace(/^claude-/, '')
        .split('-')
        .map((word) => (word === 'gpt' ? 'GPT' : word[0].toUpperCase() + word.slice(1)))
        .join(' ')
}

export function parseAgents(events: RawEvent[]): AgentRun[] {
    const runs = new Map<string, AgentRun>()
    for (const event of events) {
        if(!event.agentId) continue

        if(event.type === 'subagent.started') {
            const name = event.data.agentName as string
            const model = modelLabel(event.data.model as string)
            runs.set(event.agentId, {
                id: event.agentId,
                name,
                label: name === DEFAULT_AGENT ? model : name,
                model,
                displayName: event.data.agentDisplayName as string,
                mode: event.data.executionMode as string,
                start: event.timestamp,
                durationMs: 0,
                toolCalls: 0,
                tokens: 0,
                credits: 0
            })
        }

        if(event.type === 'subagent.completed') {
            const run = runs.get(event.agentId)
            if(run) {
                run.durationMs = event.data.durationMs as number
                run.toolCalls = event.data.totalToolCalls as number
                run.tokens = event.data.totalTokens as number
            }
        }

        if(event.type === 'session.usage_record') {
            const run = runs.get(event.agentId)
            const usage = event.data.usage as {copilotUsage?: {totalNanoAiu?: number}} | undefined
            if(run) {
                run.credits += (usage?.copilotUsage?.totalNanoAiu ?? 0) / 1e9
            }
        }
    }
    return [...runs.values()]
}