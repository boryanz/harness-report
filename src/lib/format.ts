export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000)
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
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
