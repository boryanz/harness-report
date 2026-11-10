import {existsSync} from 'node:fs'
import {readdir, readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {homedir} from 'node:os'
import type {CreditUsage, Finding, SessionDetail, SessionSummary} from '../../../shared/types.ts'
import {runChecks, sessionStatus} from '../../checks/index.ts'
import {loadConfig} from '../../config.ts'
import {parseActivity} from './activity.ts'
import {parseAgents} from './agents.ts'
import {parseCredits} from './credits.ts'
import {readEvents} from './events.ts'
import {parsePrompts} from './prompts.ts'
import {parseToolCalls, parseToolRecords} from './tools.ts'

const SESSIONS_ROOT = join(homedir(), '.copilot', 'session-state')

type SessionFolder = {id: string; folder: string; source: string}

async function foldersIn(sessionState: string, source: string): Promise<SessionFolder[]> {
    if (!existsSync(sessionState)) return []
    const entries = await readdir(sessionState, {withFileTypes: true})
    return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => ({id: entry.name, folder: join(sessionState, entry.name), source}))
}

// The one place that knows where sessions live: ~/.copilot, then every <root>/<source>/session-state from config.
// Sandboxes and eval suites each keep their own Copilot home, so the folder name under the root is the source.
async function sessionFolders(): Promise<SessionFolder[]> {
    const config = await loadConfig()
    const extra = await Promise.all(config.sessionRoots.map(async (root) => {
        if (!existsSync(root)) return []
        const sources = await readdir(root, {withFileTypes: true})
        const nested = await Promise.all(sources
            .filter((source) => source.isDirectory())
            .map((source) => foldersIn(join(root, source.name, 'session-state'), source.name)))
        return nested.flat()
    }))
    return [...await foldersIn(SESSIONS_ROOT, 'local'), ...extra.flat()]
}

async function findFolder(id: string): Promise<SessionFolder | undefined> {
    return (await sessionFolders()).find((entry) => entry.id === id)
}

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

async function readSession({id, folder, source}: SessionFolder): Promise<SessionSummary  | null> {
    const eventsPath = join(folder, 'events.jsonl')
    if (!existsSync(eventsPath)) return null

    const events = await readEvents(eventsPath)
    if(!events.some((event) => event.type === 'user.message')) return null
    const times = events.map((event) => Date.parse(event.timestamp))
    const agents = parseAgents(events)
    const end = new Date(Math.max(...times)).toISOString()

    const workspacePath = join(folder, 'workspace.yaml')
    const text = existsSync(workspacePath) ? await readFile(workspacePath, 'utf-8') : ''
    const meta = parseWorkspace(text)
    const name = meta['name'] || meta['summary'] || ''
    const findings = runChecks([{id, name, end, agents, tools: parseToolRecords(events)}])
    return {
        id,
        source,
        name,
        cwd: meta['cwd'] || '',
        start: new Date(Math.min(...times)).toISOString(),
        end,
        status: sessionStatus(findings),
        ...parseCredits(events, monthStart())
    }
}

export async function loadSessions(): Promise<SessionSummary[]> {
    const folders = await sessionFolders()
    const sessions = await Promise.all(folders.map(readSession))
    const cutOff = monthStart()
    return sessions.filter((session) => session !== null).filter((session) => Date.parse(session!.end) >= cutOff)
}

export async function loadSessionDetail(id: string): Promise<SessionDetail | null> {
    const entry = await findFolder(id)
    if (!entry) return null
    const path = join(entry.folder, 'events.jsonl')
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
    const folders = new Map((await sessionFolders()).map((entry) => [entry.id, entry.folder]))
    const sessions = await loadSessions()
    const checkSessions = await Promise.all(sessions.map(async (session) => {
        const events = await readEvents(join(folders.get(session.id)!, 'events.jsonl'))
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

// Every session, local, sandbox and eval, spends from the same allowance, and they're all in loadSessions now.
export async function loadCreditUsage(): Promise<CreditUsage> {
    const config = await loadConfig()
    const sessions = await loadSessions()

    return {
        allowance: config.monthlyCredits,
        used: sessions.reduce((total, item) => total + item.monthCredits, 0),
        premiumRequests: sessions.reduce((total, item) => total + item.monthPremiumRequests, 0)
    }
}

function monthStart(): number {
    const now = new Date()
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
}
