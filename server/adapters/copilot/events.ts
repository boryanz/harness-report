import {readFile} from 'node:fs/promises'

export type RawEvent = {
    type: string
    data: Record<string, unknown>
    id: string
    timestamp: string
    parentId: string | null
    agentId?: string
}

export async function readEvents(path: string): Promise<RawEvent[]> {
    const text = await readFile(path, 'utf-8')
    const events: RawEvent[] = []
    for (const line of text.split('\n')) {
        if (!line.trim()) continue
        try {
            events.push(JSON.parse(line))
        } catch {
            // Skip it: a running session can leave a half-written last line
        }
    }
    return events
}
