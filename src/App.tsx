import {useEffect, useState} from 'react'
import type {SessionSummary} from '../shared/types.ts'
import { Activity } from 'lucide-react'
import { formatDay } from '@/lib/format'
import { groupByDay } from '@/lib/sessions'
import Overview from './components/Overview.tsx'
import SessionRow from './components/SessionRow.tsx'

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

  const month = new Date().toLocaleDateString([], { month: 'long', year: 'numeric' })

  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2.5 px-4 sm:px-6">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-4" />
          </span>
          <h1 className="text-sm font-semibold tracking-tight">harness-report</h1>
          <span className="ml-auto text-sm text-muted-foreground">{month}</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Overview sessions={sessions} />

        <div className="mt-8 flex flex-col gap-6">
          {groupByDay(sessions).map((day) => (
            <section key={day.date.toDateString()}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="text-sm font-semibold tracking-tight">{formatDay(day.date)}</h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {day.sessions.length} {day.sessions.length === 1 ? 'session' : 'sessions'}
                </span>
              </div>
              <div className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
                {day.sessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  )
}

export default App
