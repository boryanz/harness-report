import type {IncomingMessage} from 'node:http'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function isLocal(url: string): boolean {
    try {
        return LOCAL_HOSTS.has(new URL(url).hostname)
    } catch {
        return false
    }
}

// Guards every request that changes something on disk. The server only listens on 127.0.0.1, but a web page in the
// same browser could still send it a request:
// - Host stops DNS rebinding, where another site's name is pointed at 127.0.0.1.
// - Origin stops another site's page from posting here. Browsers always send it on a POST or PUT, so a missing
//   Origin means a local tool such as curl.
// - Requiring JSON forces a CORS preflight, which this server never answers, so a plain HTML form can't post either.
export function isLocalRequest(request: IncomingMessage): boolean {
    const {host, origin} = request.headers
    if (!host || !isLocal(`http://${host}`)) return false
    if (origin && !isLocal(origin)) return false
    return request.headers['content-type']?.split(';')[0].trim() === 'application/json'
}

// Reads a small JSON body. Anything over the limit, or not JSON, comes back as undefined.
export async function readJsonBody(request: IncomingMessage, limit = 64 * 1024): Promise<unknown> {
    let size = 0
    const chunks: Buffer[] = []
    for await (const chunk of request) {
        size += chunk.length
        if (size > limit) return undefined
        chunks.push(chunk)
    }

    try {
        return JSON.parse(Buffer.concat(chunks).toString('utf-8'))
    } catch {
        return undefined
    }
}
