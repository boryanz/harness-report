export type CreditUsage = {
    allowance: number
    used: number
    premiumRequests: number
}

export type SessionStatus = 'stuck' | 'degraded' | 'healthy'

export type SessionSummary = {
    id: string
    // Where the session was recorded: 'local' for ~/.copilot, otherwise the sandbox or eval suite name
    source: string
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

export type EvalSubject = {
    kind: 'skill' | 'agent'
    name: string
    version: string
}

export type EvalMetric = {
    id: string
    label: string
    unit: 'percent' | 'count' | 'credits'
    better: 'higher' | 'lower'
    noisy?: boolean
}

export type EvalRun = {
    case: string
    status: 'ok' | 'invalid' | 'error'
    metrics: Record<string, number | null>
    type?: string
    arm?: string
    rep?: number
    reason?: string
    session_id?: string
    credits?: number
    duration_s?: number
}

// Field names match the JSON contract in docs/eval-contract.md
export type EvalSuite = {
    schema: 2
    suite: string
    subject: EvalSubject
    started: string
    finished?: string | null
    complete: boolean
    metrics: EvalMetric[]
    arms?: string[]
    baseline_arm?: string
    labels?: Record<string, string>
    runs: EvalRun[]
}

export type RejectedEvalFile = {
    file: string
    reason: string
}

export type EvalResults = {
    suites: EvalSuite[]
    rejected: RejectedEvalFile[]
    // "kind:name" keys of subjects no longer installed in ~/.copilot
    removed: string[]
}

// Settings the app can change. Paths are kept as typed, so ~ stays unexpanded.
export type Settings = {
  monthlyCredits: number
  evalResults: string[]
}

// Where the settings were read from: the app's own settings.json, the hand-written config.toml, or nothing yet.
export type SettingsSource = 'settings' | 'config.toml' | 'none'

export type FolderCheck = {
  path: string
  found: boolean
  resultFiles: number
}

export type SettingsResponse = {
  settings: Settings
  source: SettingsSource
  file: string
  folders: FolderCheck[]
}
