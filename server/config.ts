import {existsSync} from 'node:fs'
import {readFile} from 'node:fs/promises'
import {homedir} from 'node:os'
import {join} from 'node:path'
import {parse} from 'smol-toml'

const CONFIG_PATH = process.env.HARNESS_REPORT_CONFIG || join(homedir(), '.config', 'harness-report', 'config.toml')
const DEFAULT_EVAL_SESSIONS = '~/.copilot-evals'

type TomlConfig = {
    report?: {monthly_credits?: number}
    evals?: {results?: string; sessions?: string}
}

export type Config = {
    monthlyCredits: number
    evalSessions: string | null
}

function expandHome(path: string): string {
    return path.startsWith('~') ? join(homedir(), path.slice(1)) : path
}

// A missing file or setting falls back to no allowance and no evals, so the app still works with no config.
export async function loadConfig(): Promise<Config> {
    if (!existsSync(CONFIG_PATH)) return {monthlyCredits: 0, evalSessions: null}

    const toml = parse(await readFile(CONFIG_PATH, 'utf-8')) as TomlConfig
    return {
        monthlyCredits: Number(toml.report?.monthly_credits ?? 0),
        evalSessions: toml.evals?.results ? expandHome(toml.evals.sessions ?? DEFAULT_EVAL_SESSIONS) : null
    }
}
