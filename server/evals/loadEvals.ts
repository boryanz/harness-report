import {readdir, readFile, stat} from 'node:fs/promises'
import {join} from 'node:path'
import type {EvalResults, FolderCheck} from '../../shared/types.ts'
import {expandHome} from '../config.ts'
import {validateSuite, type Parsed} from './validateSuite.ts'

function parseSuite(text: string): Parsed {
    let value: unknown
    try {
        value = JSON.parse(text)
    } catch {
        return {ok: false, reason: 'Not valid JSON'}
    }

    return validateSuite(value)
}

async function readSuite(path: string): Promise<Parsed> {
    try {
        return parseSuite(await readFile(path, 'utf-8'))
    } catch {
        return {ok: false, reason: 'The file could not be read'}
    }
}

// Result files directly in the folder, or null when the folder doesn't exist or isn't a folder.
async function resultFiles(folder: string): Promise<string[] | null> {
    try {
        if (!(await stat(folder)).isDirectory()) return null
        return (await readdir(folder)).filter((name) => name.endsWith('.json'))
    } catch {
        return null
    }
}

// For Settings: whether each folder, as typed, exists and how many result files it holds.
export async function checkFolders(folders: string[]): Promise<FolderCheck[]> {
    return Promise.all(folders.map(async (path) => {
        const files = await resultFiles(expandHome(path))
        return {path, found: files !== null, resultFiles: files?.length ?? 0}
    }))
}

// One bad file is reported, and never stops the others from loading. Suites come back oldest first.
export async function loadEvals(folders: string[]): Promise<EvalResults> {
    const results: EvalResults = {suites: [], rejected: []}

    for (const folder of folders) {
        for (const name of (await resultFiles(folder)) ?? []) {
            const parsed = await readSuite(join(folder, name))
            if (parsed.ok) results.suites.push(parsed.suite)
            else results.rejected.push({file: join(folder, name), reason: parsed.reason})
        }
    }

    results.suites.sort((a, b) => Date.parse(a.started) - Date.parse(b.started))
    return results
}
