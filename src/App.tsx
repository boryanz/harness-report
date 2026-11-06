import {useEffect, useState} from 'react'
import type {SessionSummary} from '../shared/types.ts'

function App() {
  console.log('App rendered')
  const [sessions, setSessions] = useState<SessionSummary[]>([])

  useEffect(() => {
    console.log('Fetching sessions')

    async function loadSessions() {
      const response = await fetch('/api/sessions')
      const data: SessionSummary[] = await response.json()
      setSessions(data)
    }

    loadSessions()
  }, [])

  return (
    <main>
      <h1>Harness report</h1>
      <ul>{sessions.map((session) => (
        <li key={session.id}>{session.name || session.id}</li>
      ))}</ul>
    </main>
  )
}

export default App
