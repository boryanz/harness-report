import {existsSync} from 'node:fs'
import {readdir, readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {homedir} from 'node:os'
import type {SessionDetail, SessionSummary} from '../../../shared/types.ts'
import {parseAgents} from './agents.ts'
import {readEvents} from './events.ts'

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
    const eventsPath = join(folder, 'events.jsonl')
    if (!existsSync(eventsPath)) return null

    const events = await readEvents(eventsPath)
    if(!events.some((event) => event.type === 'user.message')) return null
    const times = events.map((event) => Date.parse(event.timestamp))

    const workspacePath = join(folder, 'workspace.yaml')
    const text = existsSync(workspacePath) ? await readFile(workspacePath, 'utf-8') : ''
    const meta = parseWorkspace(text)
    return {
        id,
        name: meta['name'] || meta['summary'] || '',
        cwd: meta['cwd'] || '',
        start: new Date(Math.min(...times)).toISOString(),
        end: new Date(Math.max(...times)).toISOString()
    }
}

export async function loadSessions(): Promise<SessionSummary[]> {
    const entries = await readdir(SESSIONS_ROOT, {withFileTypes: true})
    const folders = entries.filter((entry) => entry.isDirectory())
    const sessions = await Promise.all(folders.map((folder) => readSession(folder.name)))
    const cutOff = monthStart()
    return sessions.filter((session) => session !== null).filter((session) => Date.parse(session!.end) >= cutOff)
}

export async function loadSessionDetail(id: string): Promise<SessionDetail | null> {
    const path = join(SESSIONS_ROOT, id, 'events.jsonl')
    if (!existsSync(path)) return null

    const events = await readEvents(path)
    return {
        agents: parseAgents(events)
    }
}

function monthStart(): number {
    const now = new Date()
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
}