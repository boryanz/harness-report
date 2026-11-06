import type {Finding} from '../../shared/types.ts'
import type {CheckSession} from '../model.ts'
import {agentLabel, finding} from './shared.ts'

// A call in a session that's still running may simply not have finished yet
const STILL_RUNNING_MS = 5 * 60 * 1000

export function checkHungCalls(session: CheckSession): Finding[] {
    if (Date.now() - Date.parse(session.end) < STILL_RUNNING_MS) return []

    return session.tools
        .filter((tool) => tool.call.success === null)
        .map((tool) => finding(session, {
            id: `hung-call:${tool.call.id}`,
            kind: 'hung-call',
            severity: 'medium',
            title: `${tool.call.title} never returned a result`,
            detail: tool.call.detail ?? '',
            agent: agentLabel(session, tool.call.agentId),
            time: tool.call.start,
        }))
}
