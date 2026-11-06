import { formatDuration, formatShortDate } from '@/lib/format'
import { groupByDay, sessionDuration } from '@/lib/sessions'
import type { SessionSummary } from '../../shared/types.ts'
import ActivityChart from './ActivityChart.tsx'
import Tile from './Tile.tsx'

type OverviewProps = {
  sessions: SessionSummary[]
}

function Overview({ sessions }: OverviewProps) {
  const days = groupByDay(sessions)
  const totalMs = sessions.reduce((total, session) => total + sessionDuration(session), 0)
  const longestMs = Math.max(0, ...sessions.map(sessionDuration))

  return (
    <section className="grid gap-6 rounded-2xl border bg-card p-5 shadow-xs sm:p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        <Tile label="Sessions" value={sessions.length} caption="this month" />
        <Tile label="Session time" value={formatDuration(totalMs)} caption="includes idle time" />
        <Tile label="Active days" value={days.length} caption={`of ${new Date().getDate()} so far`} />
        <Tile
          label="Last active"
          value={days[0] ? formatShortDate(days[0].date) : '—'}
          caption={`longest session ${formatDuration(longestMs)}`}
        />
      </div>
      <ActivityChart sessions={sessions} />
    </section>
  )
}

export default Overview
