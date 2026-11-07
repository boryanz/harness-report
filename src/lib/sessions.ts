import type { SessionSummary, ToolCall } from '../../shared/types.ts'

export type SessionDay = {
  date: Date
  sessions: SessionSummary[]
}

export function sessionDuration(session: SessionSummary): number {
  return Date.parse(session.end) - Date.parse(session.start)
}

// Newest day first, and newest session first within each day
export function groupByDay(sessions: SessionSummary[]): SessionDay[] {
  const newestFirst = [...sessions].sort((a, b) => Date.parse(b.end) - Date.parse(a.end))
  const days = new Map<string, SessionDay>()

  for (const session of newestFirst) {
    const date = new Date(session.end)
    const key = date.toDateString()
    const day = days.get(key) ?? { date, sessions: [] }
    day.sessions.push(session)
    days.set(key, day)
  }

  return [...days.values()]
}

// One entry for every day of the current month, including days with no sessions
export function dailyCounts(sessions: SessionSummary[]) {
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), index + 1)
    const count = sessions.filter((session) => new Date(session.end).toDateString() === date.toDateString()).length
    return { day: index + 1, sessions: count, date }
  })
}

export type CallStatus = 'ok' | 'failed' | 'unfinished'

export function toolStatus(call: ToolCall): CallStatus {
  if (call.rejected) return 'ok'
  if (call.success === null) return 'unfinished'
  return call.success ? 'ok' : 'failed'
}
