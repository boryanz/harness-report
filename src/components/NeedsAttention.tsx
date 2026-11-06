import { useEffect, useState } from 'react'
import { CircleAlert, CircleCheck, CopyX, Hourglass, Repeat, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { agentColor } from '@/lib/agentColor'
import { formatShortDate, formatTime } from '@/lib/format'
import type { Finding, FindingKind } from '../../shared/types.ts'

const KINDS: Record<FindingKind, { label: string; icon: LucideIcon }> = {
  'stuck-loop': { label: 'Stuck loop', icon: Repeat },
  'hung-call': { label: 'Hung tool call', icon: Hourglass },
  'identical-call': { label: 'Repeated call', icon: CopyX },
  'tool-failure': { label: 'Tool failure', icon: CircleAlert },
}

function FindingRow({ finding }: { finding: Finding }) {
  const { label, icon: Icon } = KINDS[finding.kind]
  const time = new Date(finding.time)

  return (
    <li>
      <a
        href={`#session-${finding.sessionId}`}
        className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-2.5 px-5 py-3 outline-none transition-colors hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6"
      >
        <Icon className="mt-0.5 size-3.5 text-destructive" aria-hidden />
        <div className="min-w-0">
          <div className="text-sm wrap-anywhere">
            <span className="font-medium text-destructive">{label}</span>{' '}
            <span>{finding.sessionName}</span>
            {finding.severity === 'high' && (
              <span className="ml-1.5 rounded-sm bg-destructive px-1.5 py-px text-xs font-medium text-white">High</span>
            )}
          </div>
          <div className="mt-1 font-mono text-xs wrap-anywhere">{finding.title}</div>
          {finding.detail && (
            <div className="mt-0.5 line-clamp-2 text-xs wrap-anywhere text-muted-foreground" title={finding.detail}>
              {finding.detail}
            </div>
          )}
          <div className="mt-1.5 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <span className="size-1.5" style={{ backgroundColor: agentColor(finding.agent) }} />
            <span className="text-foreground">{finding.agent}</span>
            <span>{formatShortDate(time)}, {formatTime(finding.time)}</span>
          </div>
        </div>
      </a>
    </li>
  )
}

function NeedsAttention() {
  const [findings, setFindings] = useState<Finding[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    async function loadFindings() {
      try {
        const response = await fetch('/api/findings')
        if (!response.ok) throw new Error(`Status ${response.status}`)
        const data: Finding[] = await response.json()
        setFindings(data)
      } catch {
        setFailed(true)
      }
    }

    loadFindings()
  }, [])

  const hasFindings = findings !== null && findings.length > 0

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-lg border lg:h-full ${hasFindings ? 'border-destructive/35 bg-destructive/5' : 'bg-card'}`}
    >
      <header className={`flex items-start gap-3 border-b px-5 py-4 sm:px-6 ${hasFindings ? 'border-destructive/25 bg-destructive/10' : ''}`}>
        <TriangleAlert className={`mt-0.5 size-4 shrink-0 ${hasFindings ? 'text-destructive' : 'text-muted-foreground'}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight">Needs attention</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Every tool failure, stuck loop, repeated call and hung call this month, newest first.</p>
        </div>
        {findings && (
          <span className={`shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-xs tabular-nums ${hasFindings ? 'bg-destructive/15 text-destructive' : 'text-muted-foreground'}`}>
            {findings.length} {findings.length === 1 ? 'finding' : 'findings'}
          </span>
        )}
      </header>

      {failed && <p className="px-5 py-4 text-xs text-muted-foreground sm:px-6">Couldn't load the findings.</p>}

      {!findings && !failed && (
        <div className="flex flex-col gap-2 px-5 py-4 sm:px-6">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}

      {findings?.length === 0 && (
        <p className="flex items-center gap-2 px-5 py-4 text-xs text-muted-foreground sm:px-6">
          <CircleCheck className="size-3.5" style={{ color: 'var(--agent-3)' }} aria-hidden />
          Nothing needs attention this month.
        </p>
      )}

      {hasFindings && (
        <ul className="max-h-96 min-h-0 flex-1 divide-y divide-destructive/20 overflow-y-auto lg:max-h-none">
          {findings.map((finding) => (
            <FindingRow key={finding.id} finding={finding} />
          ))}
        </ul>
      )}
    </section>
  )
}

export default NeedsAttention
