import type {Finding} from '../../shared/types.ts'
import type {CheckSession, ToolRecord} from '../model.ts'
import {finding, shorten} from './shared.ts'

const REPEAT_MIN = 3

export function checkIdenticalCalls(session: CheckSession): Finding[] {
    return session.agents.flatMap((agent) => {
        const repeats = new Map<string, ToolRecord[]>()
        for (const tool of session.tools) {
            if (tool.call.agentId !== agent.id || tool.polling) continue
            const key = `${tool.call.name}|${tool.argsKey}`
            repeats.set(key, [...(repeats.get(key) ?? []), tool])
        }

        return [...repeats.values()]
            .filter((calls) => calls.length >= REPEAT_MIN)
            .map((calls) => finding(session, {
                id: `identical-call:${calls[0].call.id}`,
                kind: 'identical-call',
                severity: 'medium',
                title: `identical ${calls[0].call.name} call ×${calls.length}`,
                detail: shorten(calls[0].argsKey),
                agent: agent.label,
                time: calls[0].call.start,
            }))
    })
}
