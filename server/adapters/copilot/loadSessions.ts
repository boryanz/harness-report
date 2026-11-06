import {existsSync} from 'node:fs'
import {readdir, readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {homedir} from 'node:os'
import type {SessionSummary} from '../../../shared/types.ts'

const SESSIONS_ROOT = join(homedir(), '.copilot', 'session-state')

function parseWorkspace(text: string): Record<string, string> {
    const meta: Record<string, string> = {}
    for (const line of text.split('\n')) {
        const colon: number = line.indexOf(':')
        if (colon === -1 || line.startsWith(' ')) continue

        const key = line.slice(0, colon).trim()
        meta[key] = line.slice(colon + 1).trim().replace(/^['"]+|['"]+$/g, '')
    }
    return meta
}

async function readSession(id: string): Promise<SessionSummary  | null> {
    const folder = join(SESSIONS_ROOT, id)
    if (!existsSync(join(folder, 'events.jsonl'))) return null

    const workspacePath = join(folder, 'workspace.yaml')
    const text = existsSync(workspacePath) ? await readFile(workspacePath, 'utf-8') : ''
    const meta = parseWorkspace(text)
    return {
        id,
        name: meta['name'] || meta['summary'] || '',
        cwd: meta['cwd'] || ''
    }
}

export async function loadSessions(): Promise<SessionSummary[]> {
    const entries = await readdir(SESSIONS_ROOT, {withFileTypes: true})
    const folders = entries.filter((entry) => entry.isDirectory())
    const sessions = await Promise.all(folders.map((folder) => readSession(folder.name)))
    return sessions.filter((session) => session !== null)
}