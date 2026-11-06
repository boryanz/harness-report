import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDuration, formatTimeRange } from '@/lib/format'
import { sessionDuration } from '@/lib/sessions'
import {useEffect, useState} from 'react'
import AgentsTable from './AgentsTable.tsx'
import type { SessionDetail, SessionSummary } from '../../shared/types.ts'

type SessionRowProps = {
  session: SessionSummary
}

function SessionRow({ session }: SessionRowProps) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<SessionDetail | null>(null)

  useEffect(() => {
    if(!open || detail) return
    
    async function loadSessionDetail() {
      const response = await fetch(`/api/sessions/${session.id}`)
      const data: SessionDetail = await response.json()
      setDetail(data)
    }

    loadSessionDetail()
  }, [open, detail, session.id])

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group flex w-full items-center gap-3 px-4 py-3 text-left text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90 motion-reduce:transition-none" />
        <span className="min-w-0 flex-1 truncate font-medium">{session.name || session.id}</span>
        <span className="hidden shrink-0 text-xs text-muted-foreground tabular-nums sm:inline">
          {formatTimeRange(session.start, session.end)}
        </span>
        <span className="w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
          {formatDuration(sessionDuration(session))}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
        <div className="border-t bg-muted/30 px-4 py-4 sm:pl-11">
          <dl className="grid gap-x-8 gap-y-1 text-xs sm:grid-cols-[auto_minmax(0,1fr)]">
            <dt className="text-muted-foreground">Directory</dt>
            <dd className="font-mono break-all">{session.cwd || '—'}</dd>
            <dt className="text-muted-foreground">Session</dt>
            <dd className="font-mono break-all">{session.id}</dd>
          </dl>
          <div className="mt-4">
            {detail ? (
              <AgentsTable agents={detail.agents} session={session} />
            ) : (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default SessionRow
