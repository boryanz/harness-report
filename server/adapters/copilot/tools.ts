import type {RawEvent} from './events.ts'
import type {ToolCall} from '../../../shared/types.ts'

export function parseToolCalls(events: RawEvent[]): ToolCall[] {
    const results = new Map<string, RawEvent>()
    for (const event of events) {
        if (event.type === 'tool.execution_complete') {
            results.set(event.data.toolCallId as string, event)
        }
    }

    return events
        .filter((event) => event.type === 'tool.execution_start')
        .map((start) => {
            const result = results.get(start.data.toolCallId as string)
            const error = result?.data.error as {message: string} | undefined
            return {
                id: start.data.toolCallId as string,
                name: start.data.toolName as string,
                agentId: start.agentId ?? null,
                start: start.timestamp,
                durationMs: result ? Date.parse(result.timestamp) - Date.parse(start.timestamp) : null,
                success: (result?.data.success as boolean | undefined) ?? null,
                error: error?.message ?? null
            }
        })
}
