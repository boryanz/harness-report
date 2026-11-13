import {execFile} from 'node:child_process'
import {join} from 'node:path'
import {promisify} from 'node:util'
import {loadConfig} from './config.ts'

const run = promisify(execFile)

// Where Copilot keeps its sessions inside a sandbox
const SANDBOX_SESSIONS = '/home/agent/.copilot/session-state'
const TIMEOUT_MS = 120_000

// Copies each configured sandbox's sessions into <sandbox folder>/<name>/session-state. sbx cp creates the folder
// the first time and merges into it after that. A failure is only logged: the report still works from the last copy.
export async function syncSandboxes(): Promise<void> {
    const {sandboxFolder, sandboxes} = await loadConfig()
    for (const name of sandboxes) {
        try {
            await run('sbx', ['cp', `${name}:${SANDBOX_SESSIONS}`, `${join(sandboxFolder, name)}/`], {timeout: TIMEOUT_MS})
            console.log(`Synced sandbox sessions from ${name}`)
        } catch (error) {
            const reason = (error as {stderr?: string; message: string}).stderr?.trim() || (error as Error).message
            console.warn(`Couldn't sync sandbox ${name}, showing the last copy: ${reason}`)
        }
    }
}
