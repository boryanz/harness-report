import type {AgentRun, Finding, ToolCall} from '../shared/types.ts'

// What the checks work from. Adapters build this, so the checks never see harness-specific events.
export type ToolRecord = {
    call: ToolCall
    argsKey: string
    turnKey: string
    message: string
    polling: boolean
}

export type CheckSession = {
    id: string
    name: string
    end: string
    agents: AgentRun[]
    tools: ToolRecord[]
}

export type Check = (session: CheckSession) => Finding[]
