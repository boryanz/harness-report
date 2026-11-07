import { useEffect, useState } from 'react'
import { Coins } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { CreditUsage } from '../../shared/types.ts'

const DAY_MS = 86_400_000

// The allowance resets on the 1st at 00:00 UTC, so the month is measured in UTC too.
function monthProgress(now: Date) {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()
  const start = Date.UTC(year, month, 1)
  const resets = new Date(Date.UTC(year, month + 1, 1))

  return {
    name: new Date(start).toLocaleDateString([], { month: 'long', timeZone: 'UTC' }),
    resets: resets.toLocaleDateString([], { day: '2-digit', month: 'short', timeZone: 'UTC' }),
    days: (resets.getTime() - start) / DAY_MS,
    elapsedDays: Math.max((now.getTime() - start) / DAY_MS, 0.5),
  }
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span>
      <span className="font-mono font-medium text-foreground">{value}</span> {label}
    </span>
  )
}

function CreditsTile() {
  const [usage, setUsage] = useState<CreditUsage | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    async function loadUsage() {
      const response = await fetch('/api/credits')
      if (!response.ok) {
        setFailed(true)
        return
      }
      const data: CreditUsage = await response.json()
      setUsage(data)
    }

    loadUsage()
  }, [])

  const month = monthProgress(new Date())

  if (!usage) {
    return (
      <div className="col-span-2 min-w-0 bg-card px-5 py-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Coins className="size-3.5 shrink-0" style={{ color: 'var(--agent-1)' }} aria-hidden />
          AI credits · {month.name}
        </div>
        {failed ? (
          <p className="mt-2 text-xs text-muted-foreground">Couldn't load credit usage.</p>
        ) : (
          <Skeleton className="mt-2 h-8 w-40" />
        )}
      </div>
    )
  }

  const { allowance: budget, used, premiumRequests } = usage
  const projected = (used / month.elapsedDays) * month.days
  const percent = budget ? (used / budget) * 100 : 0
  const atRisk = budget > 0 && (percent >= 75 || projected > budget)
  const color = atRisk ? 'var(--waiting)' : 'var(--agent-1)'
  const pace = `≈ ${Math.round(projected).toLocaleString()}`

  return (
    <div className="col-span-2 min-w-0 bg-card px-5 py-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Coins className="size-3.5 shrink-0" style={{ color }} aria-hidden />
        AI credits · {month.name}
      </div>
      <div className="mt-2 truncate font-mono text-2xl font-medium tracking-tight">
        {Math.round(used).toLocaleString()}
        {budget > 0 && <span className="ml-1.5 text-sm font-normal text-muted-foreground">/ {budget.toLocaleString()}</span>}
      </div>

      {budget > 0 && (
        <div
          className="mt-2.5 h-1.5 overflow-hidden rounded-sm bg-muted"
          role="progressbar"
          aria-label="AI credits used this month"
          aria-valuenow={Math.min(Math.round(percent), 100)}
        >
          <div className="h-full" style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }} />
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {budget > 0 && (
          <>
            <Stat value={`${Math.round(percent)}%`} label="used" />
            <Stat value={Math.round(Math.max(budget - used, 0)).toLocaleString()} label="left" />
          </>
        )}
        <span>
          on pace for <span className="font-mono font-medium text-foreground">{pace}</span>
        </span>
        <span>resets {month.resets}</span>
        <Stat value={premiumRequests.toLocaleString()} label="premium requests" />
      </div>
    </div>
  )
}

export default CreditsTile
