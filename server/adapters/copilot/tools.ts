import type {RawEvent} from './events.ts'
import type {ToolCall, ToolKind} from '../../../shared/types.ts'
import {errorHint} from '../../checks/hints.ts'
import type {ToolRecord} from '../../model.ts'

type ToolDescription = {kind: ToolKind; title: string; detail: string | null}

function describeTool(data: RawEvent['data']): ToolDescription {
    const name = data.toolName as string
    const args = (data.arguments ?? {}) as Record<string, unknown>
    const description = (args.description as string | undefined) ?? null

    if (data.mcpServerName) {
        return {kind: 'mcp', title: `${data.mcpServerName}.${data.mcpToolName}`, detail: null}
    }
    if (name === 'task') {
        return {kind: 'subagent', title: (args.name ?? args.agent_type ?? name) as string, detail: description}
    }
    if (name === 'skill') return {kind: 'skill', title: (args.skill ?? name) as string, detail: null}
    if (name === 'ask_user') return {kind: 'ask', title: name, detail: null}
    return {kind: 'tool', title: name, detail: description}
}

const MAX_ERROR_LENGTH = 300
const MAX_RAW_STRING_LENGTH = 4000

// Tools that wait on something else, so repeating them isn't a sign of being stuck
const POLLING_TOOLS = new Set(['read_agent', 'read_bash', 'list_agents', 'list_bash', 'write_agent'])

// Object keys can arrive in any order, and two calls with the same arguments must compare equal
function stableJson(value: unknown): string {
    return JSON.stringify(value, (_key, item) => {
        if (item === null || typeof item !== 'object' || Array.isArray(item)) return item
        return Object.fromEntries(Object.entries(item).sort(([a], [b]) => (a < b ? -1 : 1)))
    })
}

function resultText(result: RawEvent | undefined): string {
    const error = result?.data.error as {message?: string} | undefined
    if (error) return error.message ?? JSON.stringify(error)
    const output = result?.data.result as {content?: string} | undefined
    return output?.content ?? ''
}

// A shell command can exit with an error while the tool call itself reports success.
// Exit code 1 is usually just grep finding nothing, so only 2 and above counts as a failure.
function failedExitCode(result: RawEvent | undefined): number | null {
    const shell = result?.data.shellExecution as {exitCode?: number} | undefined
    const exitCode = shell?.exitCode ?? 0
    return exitCode > 1 ? exitCode : null
}

// The user said no, which isn't a problem with the tool or the harness
function wasRejected(result: RawEvent | undefined): boolean {
    const error = result?.data.error as {code?: string} | undefined
    return error?.code === 'rejected'
}

function errorText(result: RawEvent | undefined): string | null {
    const error = result?.data.error as {message?: string} | undefined
    if (error?.message) return error.message

    const exitCode = failedExitCode(result)
    if (exitCode === null) return result?.data.success === false ? resultText(result) : null
    return `Exit code ${exitCode}: ${resultText(result).slice(0, MAX_ERROR_LENGTH)}`
}

// Pretty-printed for the event log. Long strings like file contents are cut so a response stays small.
function rawJson(value: unknown): string {
    return JSON.stringify(value, (_key, item) => {
        if (typeof item !== 'string' || item.length <= MAX_RAW_STRING_LENGTH) return item
        return `${item.slice(0, MAX_RAW_STRING_LENGTH)}… (cut, ${item.length} characters in total)`
    }, 2)
}

function turnKey(start: RawEvent, result: RawEvent | undefined): string {
    if (result?.data.turnId === undefined) return start.data.toolCallId as string
    return `${result.data.interactionId}:${result.data.turnId}`
}

export function parseToolRecords(events: RawEvent[]): ToolRecord[] {
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
            const error = errorText(result)
            const success = result ? error === null : null
            return {
                call: {
                    id: start.data.toolCallId as string,
                    name: start.data.toolName as string,
                    ...describeTool(start.data),
                    agentId: start.agentId ?? null,
                    start: start.timestamp,
                    durationMs: result ? Date.parse(result.timestamp) - Date.parse(start.timestamp) : null,
                    success,
                    rejected: wasRejected(result),
                    error,
                    hint: error ? errorHint([error]) || null : null,
                    raw: success === true ? null : {
                        arguments: rawJson(start.data.arguments ?? {}),
                        result: result ? rawJson(result) : null
                    }
                },
                argsKey: stableJson(start.data.arguments ?? {}),
                turnKey: turnKey(start, result),
                message: error ?? '',
                polling: POLLING_TOOLS.has(start.data.toolName as string)
            }
        })
}

export function parseToolCalls(events: RawEvent[]): ToolCall[] {
    return parseToolRecords(events).map((record) => record.call)
}
