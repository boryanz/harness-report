import { MessagesSquare, TriangleAlert } from 'lucide-react'
import type { SessionSummary } from '../../shared/types.ts'
import ActivityChart from './ActivityChart.tsx'
import CreditsTile from './CreditsTile.tsx'
import NeedsAttention from './NeedsAttention.tsx'
import Tile from './Tile.tsx'

type OverviewProps = {
  sessions: SessionSummary[]
}

function Overview({ sessions }: OverviewProps) {
  const degraded = sessions.filter((session) => session.status === 'degraded').length

  return (
    <>
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-4">
        <Tile label="Sessions" value={sessions.length} caption="this month" icon={MessagesSquare} color="var(--agent-1)" />
        <Tile
          label="Degraded sessions"
          value={degraded}
          caption={`of ${sessions.length} this month`}
          icon={TriangleAlert}
          color="var(--waiting)"
        />
        <CreditsTile />
      </section>

      <div className="mt-4 grid gap-4 lg:h-96 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <ActivityChart sessions={sessions} />
        <NeedsAttention />
      </div>
    </>
  )
}

export default Overview
