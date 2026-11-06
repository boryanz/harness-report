import { CalendarCheck, Coins, Hourglass, MessagesSquare } from 'lucide-react'
import { formatDuration } from '@/lib/format'
import { groupByDay, sessionDuration } from '@/lib/sessions'
import type { SessionSummary } from '../../shared/types.ts'
import ActivityChart from './ActivityChart.tsx'
import NeedsAttention from './NeedsAttention.tsx'
import Tile from './Tile.tsx'

type OverviewProps = {
  sessions: SessionSummary[]
}

function Overview({ sessions }: OverviewProps) {
  const days = groupByDay(sessions)
  const totalMs = sessions.reduce((total, session) => total + sessionDuration(session), 0)
  const waitingMs = sessions.reduce((total, session) => total + session.waitingMs, 0)
  const monthCredits = sessions.reduce((total, session) => total + session.monthCredits, 0)

  return (
    <>
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-4">
        <Tile label="Sessions" value={sessions.length} caption="this month" icon={MessagesSquare} color="var(--agent-1)" />
        <Tile
          label="Waiting for you"
          value={formatDuration(waitingMs)}
          caption={`of ${formatDuration(totalMs)} total`}
          icon={Hourglass}
          color="var(--waiting)"
        />
        <Tile
          label="Active days"
          value={days.length}
          caption={`of ${new Date().getDate()} so far`}
          icon={CalendarCheck}
          color="var(--agent-3)"
        />
        <Tile
          label="AI credits"
          value={Math.round(monthCredits).toLocaleString()}
          caption={`about ${Math.round(monthCredits / Math.max(sessions.length, 1))} per session`}
          icon={Coins}
          color="var(--agent-7)"
        />
      </section>

      <div className="mt-4 grid gap-4 lg:h-96 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <ActivityChart sessions={sessions} />
        <NeedsAttention />
      </div>
    </>
  )
}

export default Overview
