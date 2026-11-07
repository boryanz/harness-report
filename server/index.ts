import {createServer} from 'node:http'
import {loadCreditUsage,loadFindings,loadSessionDetail,loadSessions} from './adapters/copilot/loadSessions.ts'
import {loadConfig} from './config.ts'
import {loadEvals} from './evals/loadEvals.ts'


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

server.listen(3001, '127.0.0.1', () => {
    console.log('Server is running on http://127.0.0.1:3001')
    })