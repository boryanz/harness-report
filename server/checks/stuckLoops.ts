import type {Finding} from '../../shared/types.ts'
import type {CheckSession, ToolRecord} from '../model.ts'
import {errorHint} from './hints.ts'
import {agentLabel, finding, normalise, shorten} from './shared.ts'

const STREAK_MIN = 3

export type Streak = {
    attempts: ToolRecord[]
    outcome: 'recovered' | 'gave up'
}

// Runs of failed calls of one tool by one agent, with no success of that tool in between
export function failureStreaks(session: CheckSession): Streak[] {
    const sequences = new Map<string, ToolRecord[]>()
    for (const tool of session.tools) {
        if (tool.polling || tool.call.rejected) continue
        const key = `${tool.call.agentId}|${tool.call.name}`
        sequences.set(key, [...(sequences.get(key) ?? []), tool])
    }

    const streaks: Streak[] = []
    function close(attempts: ToolRecord[], outcome: Streak['outcome']) {
        // Calls fired in parallel in one model turn didn't see each other's error, so count retries by turn
        const turns = new Set(attempts.map((attempt) => attempt.turnKey))
        if (turns.size >= STREAK_MIN) streaks.push({attempts, outcome})
    }

    for (const sequence of sequences.values()) {
        let attempts: ToolRecord[] = []
        for (const tool of sequence) {
            if (tool.call.success === false) {
                attempts.push(tool)
            } else {
                close(attempts, 'recovered')
                attempts = []
            }
        }
        close(attempts, 'gave up')
    }
    return streaks
}

export function checkStuckLoops(session: CheckSession): Finding[] {
    return failureStreaks(session).map(({attempts, outcome}) => {
        const messages = attempts.map((attempt) => attempt.message)
        const sameError = new Set(messages.map((message) => shorten(normalise(message), 110))).size === 1
        const hint = errorHint(messages)
        const first = attempts[0].call
        return finding(session, {
            id: `stuck-loop:${first.id}`,
            kind: 'stuck-loop',
            severity: attempts.length >= 5 ? 'high' : 'medium',
            title: `${first.name} failed ${attempts.length}× in a row, then ${outcome}`,
            detail: `${hint ? `${hint} · ` : ''}${sameError ? 'same error every time: ' : ''}${shorten(messages.at(-1) ?? '', 120)}`,
            agent: agentLabel(session, first.agentId),
            time: first.start,
        })
    })
}
