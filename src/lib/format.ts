export function formatDuration(ms: number): string {
  if (ms < 1000) return '<1s'

  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  if (seconds < 600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export function formatCredits(credits: number): string {
  return credits > 0 ? credits.toLocaleString([], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—'
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// A session can run past midnight, so show the start date when the days differ
export function formatTimeRange(start: string, end: string): string {
  const startDate = new Date(start)
  const sameDay = startDate.toDateString() === new Date(end).toDateString()
  const from = sameDay ? formatTime(start) : `${formatShortDate(startDate)}, ${formatTime(start)}`
  return `${from} – ${formatTime(end)}`
}

export function formatDay(date: Date): string {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}
