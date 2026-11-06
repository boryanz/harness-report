export type SessionSummary = {
    id: string
    name: string
    cwd: string
    start: string
    end: string
}

export type AgentRun = {
    id: string
    name: string
    displayName: string
    mode: string
    start: string
    durationMs: number
    toolCalls: number
    tokens: number
}

export type SessionDetail = {
    agents: AgentRun[]
}