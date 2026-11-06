import {createServer} from 'node:http'
import {loadSessions} from './adapters/copilot/loadSessions.ts'

const server = createServer(async (request, response) => {
    if(request.url === '/api/sessions') {
        const sessions = await loadSessions()
        response.writeHead(200, {'Content-Type': 'application/json'})
        response.end(JSON.stringify(sessions))
        return
    }

    response.writeHead(404, {'Content-Type': 'text/plain'})
    response.end()
})

server.listen(3001, '127.0.0.1', () => {
    console.log('Server is running on http://127.0.0.1:3001')
    })