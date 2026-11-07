import {useEffect, useState} from 'react'
import type {SessionSummary} from '../shared/types.ts'
import { Activity, CalendarDays, FlaskConical, LayoutDashboard, type LucideIcon } from 'lucide-react'
import { formatDay } from '@/lib/format'
import { groupByDay } from '@/lib/sessions'
import EvalsScreen from './components/evals/EvalsScreen.tsx'
import Overview from './components/Overview.tsx'
import SessionRow from './components/SessionRow.tsx'

type View = 'overview' | 'evals'

const VIEWS: { id: View; label: string; icon: LucideIcon; color: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: 'var(--agent-1)' },
  { id: 'evals', label: 'Evals', icon: FlaskConical, color: 'var(--agent-7)' },
]

function App() {
  console.log('App rendered')
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [view, setView] = useState<View>('overview')

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
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2.5 px-4 sm:px-6">
          <span className="flex size-7 items-center justify-center rounded-md bg-(--agent-1) text-white">
            <Activity className="size-4" />
          </span>
          <h1 className="text-sm font-semibold tracking-tight">harness-report</h1>
          <nav className="ml-2 flex items-center gap-1" aria-label="Sections">
            {VIEWS.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                type="button"
                aria-current={view === id ? 'page' : undefined}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
                onClick={() => setView(id)}
              >
                <Icon className="size-3.5" style={{ color }} aria-hidden />
                {label}
              </button>
            ))}
          </nav>
          <span className="ml-auto hidden text-sm text-muted-foreground sm:inline">{month}</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {view === 'evals' && <EvalsScreen />}
        {view === 'overview' && <Overview sessions={sessions} />}

        {/* Hidden, not removed, so open sessions stay open when you come back */}
        <section hidden={view !== 'overview'} className="mt-4 overflow-hidden rounded-lg border bg-card">
          <header className="flex items-baseline justify-between gap-4 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Sessions</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Open a session for its timeline, agents and event log.</p>
            </div>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">{sessions.length} this month</span>
          </header>
          {groupByDay(sessions).map((day) => (
            <div key={day.date.toDateString()}>
              <div className="flex items-center justify-between border-y bg-muted/50 px-5 py-1.5 text-xs">
                <h3 className="flex items-center gap-1.5 font-medium">
                  <CalendarDays className="size-3.5" style={{ color: 'var(--agent-1)' }} aria-hidden />
                  {formatDay(day.date)}
                </h3>
                <span className="font-mono text-muted-foreground">
                  {day.sessions.length} {day.sessions.length === 1 ? 'session' : 'sessions'}
                </span>
              </div>
              <div className="divide-y">
                {day.sessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  )
}

export default App
