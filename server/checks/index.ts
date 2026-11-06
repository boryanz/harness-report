import type {Finding, FindingKind, SessionStatus} from '../../shared/types.ts'
import type {Check, CheckSession} from '../model.ts'
import {checkHungCalls} from './hungCalls.ts'
import {checkIdenticalCalls} from './identicalCalls.ts'
import {checkStuckLoops} from './stuckLoops.ts'
import {checkToolFailures} from './toolFailures.ts'

const CHECKS: Check[] = [checkStuckLoops, checkHungCalls, checkIdenticalCalls, checkToolFailures]
const STUCK_KINDS: FindingKind[] = ['stuck-loop', 'hung-call']

export function sessionStatus(findings: Finding[]): SessionStatus {
    if (findings.some((finding) => STUCK_KINDS.includes(finding.kind))) return 'stuck'
    return findings.length > 0 ? 'degraded' : 'healthy'
}

// Newest first
export function runChecks(sessions: CheckSession[]): Finding[] {
    return sessions
        .flatMap((session) => CHECKS.flatMap((check) => check(session)))
        .sort((a, b) => Date.parse(b.time) - Date.parse(a.time))
}
