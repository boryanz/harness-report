import {createServer} from 'node:http'
import {loadCreditUsage,loadFindings,loadSessionDetail,loadSessions} from './adapters/copilot/loadSessions.ts'
import type {IncomingMessage, ServerResponse} from 'node:http'
import type {SettingsResponse} from '../shared/types.ts'
import {loadConfig, readSettings, saveSettings, SETTINGS_PATH, validateSettings} from './config.ts'
import {checkFolders, loadEvals} from './evals/loadEvals.ts'
import {isLocalRequest, readJsonBody} from './localOnly.ts'
import {syncSandboxes} from './sandboxSync.ts'

async function settingsResponse(): Promise<SettingsResponse> {
    const {source, settings} = await readSettings()
    return {
        settings: {
            monthlyCredits: settings.monthlyCredits,
            evalResults: settings.evalResults,
            sandboxFolder: settings.sandboxFolder,
            sandboxes: settings.sandboxes,
        },
        source,
        file: SETTINGS_PATH,
        folders: await checkFolders(settings.evalResults),
    }
}

function sendText(response: ServerResponse, status: number, text = '') {
    response.writeHead(status, {'Content-Type': 'text/plain'})
    response.end(text)
}

async function handleSettings(request: IncomingMessage, response: ServerResponse) {
    if (request.method === 'PUT') {
        if (!isLocalRequest(request)) return sendText(response, 403, 'Settings can only be changed from this computer')

        const settings = validateSettings(await readJsonBody(request))
        if (typeof settings === 'string') return sendText(response, 400, settings)
        await saveSettings(settings)
        // A newly added sandbox shows up without a restart
        void syncSandboxes()
    } else if (request.method !== 'GET') {
        return sendText(response, 405)
    }

    response.writeHead(200, {'Content-Type': 'application/json'})
    response.end(JSON.stringify(await settingsResponse()))
}


const server = createServer(async (request, response) => {
    if(request.url === '/api/sessions') {
        const sessions = await loadSessions()
        response.writeHead(200, {'Content-Type': 'application/json'})
        response.end(JSON.stringify(sessions))
        return
    }

    if(request.url === '/api/credits') {
        try {
            const usage = await loadCreditUsage()
            response.writeHead(200, {'Content-Type': 'application/json'})
            response.end(JSON.stringify(usage))
        } catch (error) {
            console.error(error)
            response.writeHead(500, {'Content-Type': 'text/plain'})
            response.end()
        }
        return
    }

    if(request.url === '/api/evals') {
        try {
            const config = await loadConfig()
            const results = await loadEvals(config.evalResults)
            response.writeHead(200, {'Content-Type': 'application/json'})
            response.end(JSON.stringify(results))
        } catch (error) {
            console.error(error)
            response.writeHead(500, {'Content-Type': 'text/plain'})
            response.end()
        }
        return
    }

    if(request.url === '/api/settings') {
        try {
            await handleSettings(request, response)
        } catch (error) {
            console.error(error)
            sendText(response, 500, "Settings couldn't be read or saved")
        }
        return
    }

    if(request.url === '/api/findings') {
        try {
            const findings = await loadFindings()
            response.writeHead(200, {'Content-Type': 'application/json'})
            response.end(JSON.stringify(findings))
        } catch (error) {
            console.error(error)
            response.writeHead(500, {'Content-Type': 'text/plain'})
            response.end()
        }
        return
    }

    const match = request.url?.match(/^\/api\/sessions\/([\w-]+)$/)
    if (match) {
        const detail = await loadSessionDetail(match[1])
        if (detail) {
            response.writeHead(200, {'Content-Type': 'application/json'})
            response.end(JSON.stringify(detail))
            return
        }
    }

    response.writeHead(404, {'Content-Type': 'text/plain'})
    response.end()
})

const PORT = Number(process.env.PORT) || 3001

server.listen(PORT, '127.0.0.1', () => {
    console.log(`Server is running on http://127.0.0.1:${PORT}`)
    // Not awaited: the report answers right away from the last copy while the sync runs
    void syncSandboxes()
    })