import {useEffect, useState} from 'react'
import type {SessionSummary} from '../shared/types.ts'
import SessionRow from './components/SessionRow.tsx'
import Tile from './components/Tile.tsx'

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
      <div className="sub">{sessions.length} sessions</div>

      <div className="tiles">
        <Tile label="Sessions" value={sessions.length} caption="in session-state" kind="t-neutral" />
        <Tile label="High findings" value="—" caption="coming in Slice 3" kind="t-high" />
        <Tile label="Medium findings" value="—" caption="coming in Slice 3" kind="t-medium" />
        <Tile label="Implementation time" value="—" caption="coming in December" kind="t-impl" />
        <Tile label="AI credits" value="—" caption="coming in Slice 2" kind="budget" />
      </div>

      <h2>Sessions</h2>
      {sessions.map((session) => (
        <SessionRow key={session.id} session={session} />
      ))}
    </main>
  )
}

export default App
