import type { RawEvent } from "./events.ts";
import type {AgentRun} from '../../../shared/types.ts'


export function parseAgents(events: RawEvent[]): AgentRun[] {
    const runs = new Map<string, AgentRun>()
    for (const event of events) {
        if(!event.agentId) continue

        if(event.type === 'subagent.started') {
            runs.set(event.agentId, {
                id: event.agentId,
                name: event.data.agentName as string,
                displayName: event.data.agentDisplayName as string,
                mode: event.data.executionMode as string,
                start: event.timestamp,
                durationMs: 0,
                toolCalls: 0,
                tokens: 0
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
    }
    return [...runs.values()]
}