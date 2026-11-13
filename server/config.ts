import {existsSync} from 'node:fs'
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises'
import {homedir} from 'node:os'
import {dirname, join} from 'node:path'
import {parse} from 'smol-toml'
import type {Settings, SettingsSource} from '../shared/types.ts'

// config.toml is the hand-written file the Python report also reads. The app never writes it: Settings saves to
// settings.json next to it, and settings.json wins once it exists.
const CONFIG_PATH = process.env.HARNESS_REPORT_CONFIG || join(homedir(), '.config', 'harness-report', 'config.toml')
export const SETTINGS_PATH = join(dirname(CONFIG_PATH), 'settings.json')
const DEFAULT_EVAL_SESSIONS = '~/.copilot-evals'
// Sessions copied out of sandboxes: <folder>/<sandbox>/session-state/<id>/events.jsonl
export const DEFAULT_SANDBOX_FOLDER = '~/.copilot-sbx'
// Passed to sbx as an argument, so a name can't start with - and be read as a flag
const SANDBOX_NAME = /^[\w.][\w.-]*$/

type TomlConfig = {
    report?: {monthly_credits?: number}
    evals?: {results?: string | string[]; sessions?: string}
    sessions?: {sandboxes?: string | string[]}
    sandbox?: {name?: string}
}

// What settings.json holds. Paths are kept as typed, with ~ unexpanded, so the file stays portable.
type SavedSettings = {
    monthly_credits?: number
    eval_results?: string[]
    eval_sessions?: string
    sandbox_folder?: string
    sandboxes?: string[]
    // Older name for sandbox_folder, from when it was a list. Only the first entry is used.
    sandbox_sessions?: string[]
}

type StoredSettings = Settings & {evalSessions: string | undefined}

export type Config = {
    monthlyCredits: number
    evalResults: string[]
    // Extra folders laid out as <root>/<source>/session-state/<id>, listed alongside ~/.copilot sessions
    sessionRoots: string[]
    // Expanded sandbox copies folder, one <sandbox>/ subfolder per name in sandboxes
    sandboxFolder: string
    sandboxes: string[]
}

export function expandHome(path: string): string {
    return path.startsWith('~') ? join(homedir(), path.slice(1)) : path
}

function stringList(value: unknown): string[] {
    return [value ?? []].flat().filter((item): item is string => typeof item === 'string' && item.trim() !== '')
}

export async function readSettings(): Promise<{source: SettingsSource; settings: StoredSettings}> {
    if (existsSync(SETTINGS_PATH)) {
        const saved = JSON.parse(await readFile(SETTINGS_PATH, 'utf-8')) as SavedSettings
        return {
            source: 'settings',
            settings: {
                monthlyCredits: Number(saved.monthly_credits ?? 0) || 0,
                evalResults: stringList(saved.eval_results),
                sandboxFolder: (typeof saved.sandbox_folder === 'string' ? saved.sandbox_folder : stringList(saved.sandbox_sessions)[0]) ?? '',
                sandboxes: stringList(saved.sandboxes),
                evalSessions: typeof saved.eval_sessions === 'string' ? saved.eval_sessions : undefined,
            },
        }
    }

    if (existsSync(CONFIG_PATH)) {
        const toml = parse(await readFile(CONFIG_PATH, 'utf-8')) as TomlConfig
        return {
            source: 'config.toml',
            settings: {
                monthlyCredits: Number(toml.report?.monthly_credits ?? 0) || 0,
                evalResults: stringList(toml.evals?.results),
                sandboxFolder: stringList(toml.sessions?.sandboxes)[0] ?? '',
                sandboxes: stringList(toml.sandbox?.name),
                evalSessions: toml.evals?.sessions,
            },
        }
    }

    return {source: 'none', settings: {monthlyCredits: 0, evalResults: [], sandboxFolder: '', sandboxes: [], evalSessions: undefined}}
}

// Read on every request, so a save applies without a restart. No settings means no allowance and no evals.
export async function loadConfig(): Promise<Config> {
    const {settings} = await readSettings()
    const evalResults = settings.evalResults.map(expandHome)
    const sandboxFolder = expandHome(settings.sandboxFolder || DEFAULT_SANDBOX_FOLDER)
    const evals = evalResults.length > 0 ? [expandHome(settings.evalSessions ?? DEFAULT_EVAL_SESSIONS)] : []
    return {
        monthlyCredits: settings.monthlyCredits,
        evalResults,
        sessionRoots: [...new Set([sandboxFolder, ...evals])],
        sandboxFolder,
        sandboxes: settings.sandboxes,
    }
}

function isFullPath(path: string): boolean {
    return path.startsWith('/') || path.startsWith('~')
}

// Returns the settings to save, or the reason they can't be. The body comes from the browser, so nothing is trusted.
export function validateSettings(value: unknown): Settings | string {
    if (typeof value !== 'object' || value === null) return 'Settings must be an object'
    const {monthlyCredits, evalResults, sandboxFolder, sandboxes} = value as Record<string, unknown>

    if (typeof monthlyCredits !== 'number' || !Number.isInteger(monthlyCredits) || monthlyCredits < 0) {
        return 'Monthly credits must be a whole number, 0 or more'
    }
    if (!Array.isArray(evalResults) || evalResults.some((folder) => typeof folder !== 'string')) {
        return 'Eval results folders must be a list of paths'
    }

    const folders = [...new Set((evalResults as string[]).map((folder) => folder.trim()).filter(Boolean))]
    if (folders.length > 20) return 'Use 20 eval results folders or fewer'
    const relative = folders.find((folder) => !isFullPath(folder))
    if (relative) return `"${relative}" must be a full path, starting with / or ~`

    if (typeof sandboxFolder !== 'string') return 'Sandbox sessions folder must be a path'
    const folder = sandboxFolder.trim()
    if (folder !== '' && !isFullPath(folder)) return `"${folder}" must be a full path, starting with / or ~`

    if (!Array.isArray(sandboxes) || sandboxes.some((name) => typeof name !== 'string')) {
        return 'Sandboxes must be a list of names'
    }
    const names = [...new Set((sandboxes as string[]).map((name) => name.trim()).filter(Boolean))]
    if (names.length > 20) return 'Use 20 sandboxes or fewer'
    const badName = names.find((name) => !SANDBOX_NAME.test(name))
    if (badName) return `"${badName}" isn't a sandbox name: use letters, digits, dots, dashes and underscores`

    return {monthlyCredits, evalResults: folders, sandboxFolder: folder, sandboxes: names}
}

// Written to a temporary file and renamed, so a reader never sees half a file.
export async function saveSettings(settings: Settings): Promise<void> {
    const {settings: current} = await readSettings()
    const saved: SavedSettings = {
        monthly_credits: settings.monthlyCredits,
        eval_results: settings.evalResults,
        eval_sessions: current.evalSessions,
        sandbox_folder: settings.sandboxFolder,
        sandboxes: settings.sandboxes,
    }

    await mkdir(dirname(SETTINGS_PATH), {recursive: true})
    const temporary = `${SETTINGS_PATH}.${process.pid}.tmp`
    await writeFile(temporary, `${JSON.stringify(saved, null, 2)}\n`, 'utf-8')
    await rename(temporary, SETTINGS_PATH)
}
