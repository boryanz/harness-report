import {existsSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
import type {EvalSubject} from '../../shared/types.ts'

const COPILOT = join(homedir(), '.copilot')

// A skill is a folder holding SKILL.md, an agent is a single .agent.md file. Plugin-installed ones aren't checked.
export function isInstalled(subject: Pick<EvalSubject, 'kind' | 'name'>): boolean {
    const path = subject.kind === 'skill'
        ? join(COPILOT, 'skills', subject.name, 'SKILL.md')
        : join(COPILOT, 'agents', `${subject.name}.agent.md`)
    return existsSync(path)
}
