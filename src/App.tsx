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
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Harness report</h1>
      <p className="mt-1 text-sm text-muted-foreground">{sessions.length} sessions</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Tile label="Sessions" value={sessions.length} caption="in session-state" />
        <Tile label="High findings" value="—" caption="coming in Slice 3" tone="high" />
        <Tile label="Medium findings" value="—" caption="coming in Slice 3" tone="medium" />
        <Tile label="Implementation time" value="—" caption="coming in December" />
        <Tile label="AI credits" value="—" caption="coming in Slice 2" className="sm:col-span-2" />
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Sessions</h2>
      <div className="flex flex-col gap-2">
        {sessions.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </div>
    </main>
  )
}

export default App
