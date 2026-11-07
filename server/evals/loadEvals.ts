import {existsSync} from 'node:fs'
import {readdir, readFile} from 'node:fs/promises'
import {join} from 'node:path'
import type {EvalResults} from '../../shared/types.ts'
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

// One bad file is reported, and never stops the others from loading. Suites come back oldest first.
export async function loadEvals(folders: string[]): Promise<EvalResults> {
    const results: EvalResults = {suites: [], rejected: []}

    for (const folder of folders) {
        if (!existsSync(folder)) continue

        const names = await readdir(folder)
        for (const name of names.filter((file) => file.endsWith('.json'))) {
            const parsed = await readSuite(join(folder, name))
            if (parsed.ok) results.suites.push(parsed.suite)
            else results.rejected.push({file: join(folder, name), reason: parsed.reason})
        }
    }

    results.suites.sort((a, b) => Date.parse(a.started) - Date.parse(b.started))
    return results
}
