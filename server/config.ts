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

type TomlConfig = {
    report?: {monthly_credits?: number}
    evals?: {results?: string | string[]; sessions?: string}
}

// What settings.json holds. Paths are kept as typed, with ~ unexpanded, so the file stays portable.
type SavedSettings = {
    monthly_credits?: number
    eval_results?: string[]
    eval_sessions?: string
}

type StoredSettings = Settings & {evalSessions: string | undefined}

export type Config = {
    monthlyCredits: number
    evalResults: string[]
    evalSessions: string | null
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
                evalSessions: toml.evals?.sessions,
            },
        }
    }

    return {source: 'none', settings: {monthlyCredits: 0, evalResults: [], evalSessions: undefined}}
}

// Read on every request, so a save applies without a restart. No settings means no allowance and no evals.
export async function loadConfig(): Promise<Config> {
    const {settings} = await readSettings()
    const evalResults = settings.evalResults.map(expandHome)
    return {
        monthlyCredits: settings.monthlyCredits,
        evalResults,
        evalSessions: evalResults.length > 0 ? expandHome(settings.evalSessions ?? DEFAULT_EVAL_SESSIONS) : null,
    }
}

// Returns the settings to save, or the reason they can't be. The body comes from the browser, so nothing is trusted.
export function validateSettings(value: unknown): Settings | string {
    if (typeof value !== 'object' || value === null) return 'Settings must be an object'
    const {monthlyCredits, evalResults} = value as Record<string, unknown>

    if (typeof monthlyCredits !== 'number' || !Number.isInteger(monthlyCredits) || monthlyCredits < 0) {
        return 'Monthly credits must be a whole number, 0 or more'
    }
    if (!Array.isArray(evalResults) || evalResults.some((folder) => typeof folder !== 'string')) {
        return 'Eval results folders must be a list of paths'
    }

    const folders = [...new Set((evalResults as string[]).map((folder) => folder.trim()).filter(Boolean))]
    if (folders.length > 20) return 'Use 20 eval results folders or fewer'
    const relative = folders.find((folder) => !folder.startsWith('/') && !folder.startsWith('~'))
    if (relative) return `"${relative}" must be a full path, starting with / or ~`

    return {monthlyCredits, evalResults: folders}
}

// Written to a temporary file and renamed, so a reader never sees half a file.
export async function saveSettings(settings: Settings): Promise<void> {
    const {settings: current} = await readSettings()
    const saved: SavedSettings = {
        monthly_credits: settings.monthlyCredits,
        eval_results: settings.evalResults,
        eval_sessions: current.evalSessions,
    }

    await mkdir(dirname(SETTINGS_PATH), {recursive: true})
    const temporary = `${SETTINGS_PATH}.${process.pid}.tmp`
    await writeFile(temporary, `${JSON.stringify(saved, null, 2)}\n`, 'utf-8')
    await rename(temporary, SETTINGS_PATH)
}
