import { Badge } from '@/components/ui/badge'
import { agentColor } from '@/lib/agentColor'
import { formatDuration, formatTime } from '@/lib/format'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AgentRun, SessionSummary } from '../../shared/types.ts'

type AgentsTableProps = {
  agents: AgentRun[]
  session: SessionSummary
}

function AgentBadge({ name }: { name: string }) {
  const color = agentColor(name)
  return (
    <Badge
      className="gap-1.5 text-foreground"
      style={{ backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)` }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </Badge>
  )
}

function AgentTimeline({ agent, session }: { agent: AgentRun; session: SessionSummary }) {
  const sessionStart = Date.parse(session.start)
  const span = Date.parse(session.end) - sessionStart
  const left = Math.min(100, Math.max(0, ((Date.parse(agent.start) - sessionStart) / span) * 100))
  const width = Math.min(100 - left, (agent.durationMs / span) * 100)

  return (
    <div
      className="relative h-1.5 min-w-32 rounded-full bg-muted"
      title={`Started ${formatTime(agent.start)}, ran for ${formatDuration(agent.durationMs)}`}
    >
      <div
        className="absolute inset-y-0 min-w-1.5 rounded-full"
        style={{ left: `${left}%`, width: `${width}%`, backgroundColor: agentColor(agent.name) }}
      />
    </div>
  )
}

function AgentsTable({ agents, session }: AgentsTableProps) {
  if (agents.length === 0) {
    return <p className="text-xs text-muted-foreground">No subagents in this session.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-8 pl-0 text-xs font-normal text-muted-foreground">Agent</TableHead>
          <TableHead className="hidden h-8 w-full text-xs font-normal text-muted-foreground sm:table-cell">
            When in session
          </TableHead>
          <TableHead className="h-8 text-right text-xs font-normal text-muted-foreground">Duration</TableHead>
          <TableHead className="hidden h-8 text-right text-xs font-normal text-muted-foreground sm:table-cell">Tools</TableHead>
          <TableHead className="h-8 pr-0 text-right text-xs font-normal text-muted-foreground">Tokens</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow key={agent.id} className="hover:bg-transparent">
            <TableCell className="py-2.5 pl-0">
              <AgentBadge name={agent.name} />
              <div className="mt-1 text-xs text-muted-foreground">
                {agent.displayName && agent.displayName !== agent.name && `${agent.displayName} · `}
                {agent.mode}
              </div>
            </TableCell>
            <TableCell className="hidden py-2.5 sm:table-cell">
              <AgentTimeline agent={agent} session={session} />
            </TableCell>
            <TableCell className="py-2.5 text-right tabular-nums">{formatDuration(agent.durationMs)}</TableCell>
            <TableCell className="hidden py-2.5 text-right tabular-nums sm:table-cell">{agent.toolCalls}</TableCell>
            <TableCell className="py-2.5 pr-0 text-right tabular-nums">{agent.tokens.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default AgentsTable
