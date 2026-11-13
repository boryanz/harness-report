import type {Finding} from '../../shared/types.ts'
import type {CheckSession, ToolRecord} from '../model.ts'
import {errorCause} from './hints.ts'
import {agentLabel, finding, normalise, shorten} from './shared.ts'
import {failureStreaks} from './stuckLoops.ts'

const MEDIUM_FROM = 5

export function checkToolFailures(session: CheckSession): Finding[] {
    const inStreak = new Set(failureStreaks(session).flatMap((streak) => streak.attempts.map((attempt) => attempt.call.id)))
    const groups = new Map<string, ToolRecord[]>()

    for (const tool of session.tools) {
        if (tool.call.success !== false || tool.call.rejected || inStreak.has(tool.call.id)) continue
        const key = `${agentLabel(session, tool.call.agentId)}|${tool.call.name}|${normalise(tool.message)}`
        groups.set(key, [...(groups.get(key) ?? []), tool])
    }

    // A one-off environment failure (sandbox crash, MCP timeout) is usually worked around, so it only
    // counts once it keeps happening. A run of them in a row is still caught as a stuck loop.
    const worthReporting = (hits: ToolRecord[]) =>
        errorCause([hits[0].message]) !== 'environment' || hits.length >= MEDIUM_FROM

    return [...groups.values()].filter(worthReporting).map((hits) => {
        const first = hits[0]
        const latest = hits[hits.length - 1]
        return finding(session, {
            id: `tool-failure:${first.call.id}`,
            kind: 'tool-failure',
            severity: hits.length >= MEDIUM_FROM ? 'medium' : 'low',
            title: `${first.call.name} failed ×${hits.length}`,
            detail: shorten(first.message),
            agent: agentLabel(session, first.call.agentId),
            time: latest.call.start,
        })
    })
}
