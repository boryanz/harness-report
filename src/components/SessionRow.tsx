import { ChevronRight, Coins, Folder, Hash } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCredits, formatDuration, formatTimeRange } from '@/lib/format'
import { sessionDuration } from '@/lib/sessions'
import {useEffect, useState} from 'react'
import AgentsTable from './AgentsTable.tsx'
import SessionTimeline from './SessionTimeline.tsx'
import StatusTag from './StatusTag.tsx'
import EventLog from './EventLog.tsx'
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

  // A finding links to #session-<id>, which opens the matching row
  useEffect(() => {
    function openFromHash() {
      if (window.location.hash === `#session-${session.id}`) setOpen(true)
    }

    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [session.id])

  return (
    <Collapsible id={`session-${session.id}`} className="scroll-mt-20" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group flex w-full items-center gap-3 px-5 py-3 text-left text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90 motion-reduce:transition-none" />
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate font-medium">{session.name || session.id}</span>
          <StatusTag status={session.status} />
        </span>
        <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">
          {formatTimeRange(session.start, session.end)}
        </span>
        <span className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground">
          {formatDuration(sessionDuration(session))}
        </span>
        <span className="hidden w-20 shrink-0 text-right font-mono text-xs text-muted-foreground sm:inline">
          {formatCredits(session.credits)} cr
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
        <div className="border-t bg-background/60 px-5 py-4 sm:pl-12">
          <dl className="grid gap-x-8 gap-y-1 text-xs sm:grid-cols-[auto_minmax(0,1fr)]">
            <dt className="flex items-center gap-1.5 text-muted-foreground"><Folder className="size-3.5" style={{ color: 'var(--agent-1)' }} aria-hidden />Directory</dt>
            <dd className="font-mono break-all">{session.cwd || '—'}</dd>
            <dt className="flex items-center gap-1.5 text-muted-foreground"><Hash className="size-3.5" style={{ color: 'var(--agent-3)' }} aria-hidden />Session</dt>
            <dd className="font-mono break-all">{session.id}</dd>
            <dt className="flex items-center gap-1.5 text-muted-foreground"><Coins className="size-3.5" style={{ color: 'var(--agent-7)' }} aria-hidden />AI credits</dt>
            <dd className="tabular-nums">{formatCredits(session.credits)}</dd>
          </dl>
          <div className="mt-4">
            {detail ? (
              <div className="flex flex-col gap-4">
                <SessionTimeline session={session} agents={detail.agents} activity={detail.activity} />
                <AgentsTable session={session} agents={detail.agents} toolCalls={detail.toolCalls} />
                <EventLog session={session} toolCalls={detail.toolCalls} prompts={detail.prompts} agents={detail.agents} />
              </div>
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
