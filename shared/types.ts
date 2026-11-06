export type SessionSummary = {
    id: string
    name: string
    cwd: string
    start: string
    end: string
    credits: number
    monthCredits: number
    waitingMs: number
}

export type AgentRun = {
    id: string
    name: string
    label: string
    model: string
    displayName: string
    mode: string
    start: string
    durationMs: number
    toolCalls: number
    tokens: number
    credits: number
}

export type Span = {
    start: string
    end: string
}

export type SessionActivity = {
    main: Span[]
    waiting: Span[]
}

export type ToolCall = {
    id: string
    name: string
    agentId: string | null
    start: string
    durationMs: number | null
    success: boolean | null
    error: string | null
}

export type SessionDetail = {
    agents: AgentRun[]
    activity: SessionActivity
    toolCalls: ToolCall[]
}