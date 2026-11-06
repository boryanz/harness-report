import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border bg-card text-card-foreground">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium">
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
        <span className="truncate">{session.name || session.id}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-3 pl-10 text-xs break-all text-muted-foreground">
        {session.id} · {session.cwd}
        {detail && <div className="mt-3"><AgentsTable agents={detail.agents} /></div>}
      </CollapsibleContent>
    </Collapsible>
  )
}

export default SessionRow
