import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { SessionSummary } from '../../shared/types.ts'

type SessionRowProps = {
  session: SessionSummary
}

function SessionRow({ session }: SessionRowProps) {
  return (
    <Collapsible className="rounded-lg border bg-card text-card-foreground">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium">
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
        <span className="truncate">{session.name || session.id}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-3 pl-10 text-xs break-all text-muted-foreground">
        {session.id} · {session.cwd}
      </CollapsibleContent>
    </Collapsible>
  )
}

export default SessionRow
