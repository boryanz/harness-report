import type { CSSProperties } from 'react'
import { agentColor } from '@/lib/agentColor'
import { formatDuration, formatShortDate, formatTime } from '@/lib/format'
import type { AgentRun, SessionActivity, SessionSummary, Span } from '../../shared/types.ts'

const WAITING_STYLE: CSSProperties = {
  background: 'repeating-linear-gradient(135deg, var(--muted-foreground) 0 2px, transparent 2px 5px)',
}
const MAIN_STYLE: CSSProperties = { backgroundColor: 'var(--foreground)', opacity: 0.75 }

type Lane = {
  name: string
  spans: Span[]
  barStyle: CSSProperties
  dotStyle: CSSProperties
}

type SessionTimelineProps = {
  session: SessionSummary
  agents: AgentRun[]
  activity: SessionActivity
}

function spanMs(span: Span): number {
  return Date.parse(span.end) - Date.parse(span.start)
}

function agentSpan(agent: AgentRun): Span {
  return {
    start: agent.start,
    end: new Date(Date.parse(agent.start) + agent.durationMs).toISOString(),
  }
}

function buildLanes(agents: AgentRun[], activity: SessionActivity): Lane[] {
  const agentLabels = [...new Set(agents.map((agent) => agent.label))].sort()
  const agentLanes = agentLabels.map((label) => {
    const color = { backgroundColor: agentColor(label) }
    return {
      name: label,
      spans: agents.filter((agent) => agent.label === label).map(agentSpan),
      barStyle: color,
      dotStyle: color,
    }
  })

  const lanes = [
    { name: 'Waiting for you', spans: activity.waiting, barStyle: WAITING_STYLE, dotStyle: { backgroundColor: 'var(--muted-foreground)' } },
    { name: 'Main agent', spans: activity.main, barStyle: MAIN_STYLE, dotStyle: MAIN_STYLE },
    ...agentLanes,
  ]
  return lanes.filter((lane) => lane.spans.length > 0)
}

function SessionTimeline({ session, agents, activity }: SessionTimelineProps) {
  const lanes = buildLanes(agents, activity)
  if (lanes.length === 0) return null

  const start = Date.parse(session.start)
  const end = Math.max(Date.parse(session.end), ...agents.map((agent) => Date.parse(agentSpan(agent).end)))
  const total = end - start
  const percent = (ms: number) => Math.min(100, Math.max(0, (ms / total) * 100))

  const waitingMs = activity.waiting.reduce((sum, span) => sum + spanMs(span), 0)
  const middle = new Date(start + total / 2).toISOString()
  const multiDay = new Date(start).toDateString() !== new Date(end).toDateString()
  const axisLabel = (iso: string) => (multiDay ? `${formatShortDate(new Date(iso))}, ${formatTime(iso)}` : formatTime(iso))

  return (
    <figure>
      <figcaption className="mb-2 flex items-baseline justify-between gap-4 text-xs">
        <span className="text-muted-foreground">Timeline</span>
        {waitingMs > 0 && (
          <span className="text-muted-foreground tabular-nums">
            Waiting for you <span className="font-medium text-foreground">{formatDuration(waitingMs)}</span> of{' '}
            {formatDuration(total)} ({Math.round((waitingMs / total) * 100)}%)
          </span>
        )}
      </figcaption>

      <div className="flex flex-col gap-1.5">
        {lanes.map((lane) => (
          <div key={lane.name} className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-3 text-xs">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="size-1.5 shrink-0 rounded-full" style={lane.dotStyle} />
              <span className="truncate">{lane.name}</span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-sm bg-muted/70">
              {lane.spans.map((span) => (
                <div
                  key={span.start}
                  className="absolute inset-y-0 min-w-0.75 rounded-xs"
                  style={{
                    ...lane.barStyle,
                    left: `${percent(Date.parse(span.start) - start)}%`,
                    width: `${percent(spanMs(span))}%`,
                  }}
                  title={`${lane.name}: ${formatTime(span.start)} – ${formatTime(span.end)} (${formatDuration(spanMs(span))})`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 text-xs text-muted-foreground tabular-nums">
        <div className="col-start-2 flex justify-between gap-2">
          <span>{axisLabel(session.start)}</span>
          <span className="hidden sm:inline">{axisLabel(middle)}</span>
          <span>{axisLabel(new Date(end).toISOString())}</span>
        </div>
      </div>
    </figure>
  )
}

export default SessionTimeline
