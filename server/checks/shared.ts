import type {Finding} from '../../shared/types.ts'
import type {CheckSession} from '../model.ts'

export function shorten(text: string, length = 160): string {
    const oneLine = text.split(/\s+/).filter(Boolean).join(' ')
    return oneLine.length <= length ? oneLine : oneLine.slice(0, length - 1) + '…'
}

// Paths, ids and numbers differ between otherwise identical errors
export function normalise(message: string): string {
    return message
        .replace(/\/[\w./ -]+/g, '<path>')
        .replace(/\b[0-9a-f]{8,}\b|\d+/g, '#')
        .slice(0, 140)
}

export function agentLabel(session: CheckSession, agentId: string | null): string {
    return session.agents.find((agent) => agent.id === agentId)?.label ?? 'Main agent'
}

type FindingFields = Omit<Finding, 'sessionId' | 'sessionName'>

export function finding(session: CheckSession, fields: FindingFields): Finding {
    return {...fields, sessionId: session.id, sessionName: session.name}
}
