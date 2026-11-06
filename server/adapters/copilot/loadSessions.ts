import {existsSync} from 'node:fs'
import {readdir, readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {homedir} from 'node:os'
import type {Finding, SessionDetail, SessionSummary} from '../../../shared/types.ts'
import {runChecks, sessionStatus} from '../../checks/index.ts'
import {parseActivity} from './activity.ts'
import {parseAgents} from './agents.ts'
import {parseCredits} from './credits.ts'
import {readEvents} from './events.ts'
import {parsePrompts} from './prompts.ts'
import {parseToolCalls, parseToolRecords} from './tools.ts'

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
    const agents = parseAgents(events)
    const {waiting} = parseActivity(events, agents)
    const end = new Date(Math.max(...times)).toISOString()

    const workspacePath = join(folder, 'workspace.yaml')
    const text = existsSync(workspacePath) ? await readFile(workspacePath, 'utf-8') : ''
    const meta = parseWorkspace(text)
    const name = meta['name'] || meta['summary'] || ''
    const findings = runChecks([{id, name, end, agents, tools: parseToolRecords(events)}])
    return {
        id,
        name,
        cwd: meta['cwd'] || '',
        start: new Date(Math.min(...times)).toISOString(),
        end,
        status: sessionStatus(findings),
        ...parseCredits(events, monthStart()),
        waitingMs: waiting.reduce((total, span) => total + Date.parse(span.end) - Date.parse(span.start), 0)
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
    const agents = parseAgents(events)
    return {
        agents,
        activity: parseActivity(events, agents),
        toolCalls: parseToolCalls(events),
        prompts: parsePrompts(events)
    }
}

export async function loadFindings(): Promise<Finding[]> {
    const sessions = await loadSessions()
    const checkSessions = await Promise.all(sessions.map(async (session) => {
        const events = await readEvents(join(SESSIONS_ROOT, session.id, 'events.jsonl'))
        return {
            id: session.id,
            name: session.name || session.id,
            end: session.end,
            agents: parseAgents(events),
            tools: parseToolRecords(events)
        }
    }))
    return runChecks(checkSessions)
}

function monthStart(): number {
    const now = new Date()
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
}