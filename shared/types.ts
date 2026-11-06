export type CreditUsage = {
    allowance: number
    used: number
    premiumRequests: number
}

export type SessionStatus = 'stuck' | 'degraded' | 'healthy'

export type SessionSummary = {
    id: string
    name: string
    cwd: string
    start: string
    end: string
    credits: number
    monthCredits: number
    monthPremiumRequests: number
    status: SessionStatus
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

export type ToolKind = 'tool' | 'mcp' | 'skill' | 'subagent' | 'ask'

export type RawToolCall = {
    arguments: string
    result: string | null
}

export type ToolCall = {
    id: string
    name: string
    kind: ToolKind
    title: string
    detail: string | null
    agentId: string | null
    start: string
    durationMs: number | null
    success: boolean | null
    rejected: boolean
    error: string | null
    hint: string | null
    raw: RawToolCall
}

export type Severity = 'high' | 'medium' | 'low'

export type FindingKind = 'stuck-loop' | 'hung-call' | 'identical-call' | 'tool-failure'

export type Finding = {
    id: string
    kind: FindingKind
    severity: Severity
    title: string
    detail: string
    agent: string
    time: string
    sessionId: string
    sessionName: string
}

export type Prompt = {
    id: string
    text: string
    time: string
}

export type SessionDetail = {
    agents: AgentRun[]
    activity: SessionActivity
    toolCalls: ToolCall[]
    prompts: Prompt[]
}