import {createServer} from 'node:http'

const sessions = ["Fix login crash", "Add journey data module", "Review PR", "Add something else"]

const server = createServer((request, response) => {
    if(request.url === '/api/sessions') {
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