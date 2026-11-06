import { Bot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { agentColor } from '@/lib/agentColor'
import { formatCredits, formatDuration } from '@/lib/format'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AgentRun } from '../../shared/types.ts'

type AgentsTableProps = {
  agents: AgentRun[]
}

function AgentBadge({ name }: { name: string }) {
  const color = agentColor(name)
  return (
    <Badge
      className="gap-1.5 rounded-sm text-foreground"
      style={{ backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)` }}
    >
      <Bot className="size-3" style={{ color }} aria-hidden />
      {name}
    </Badge>
  )
}

function agentDetails(agent: AgentRun): string {
  const runName = agent.displayName !== agent.name ? agent.displayName : ''
  const model = agent.label !== agent.model ? agent.model : ''
  return [runName, model, agent.mode].filter(Boolean).join(' · ')
}

function AgentsTable({ agents }: AgentsTableProps) {
  if (agents.length === 0) {
    return <p className="text-xs text-muted-foreground">No subagents in this session.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-8 w-full pl-0 text-xs font-normal text-muted-foreground">Agent</TableHead>
          <TableHead className="h-8 text-right text-xs font-normal text-muted-foreground">Duration</TableHead>
          <TableHead className="hidden h-8 text-right text-xs font-normal text-muted-foreground sm:table-cell">Tools</TableHead>
          <TableHead className="h-8 pr-0 text-right text-xs font-normal text-muted-foreground">AI credits</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow key={agent.id} className="hover:bg-transparent">
            <TableCell className="py-2.5 pl-0 whitespace-normal">
              <AgentBadge name={agent.label} />
              <div className="mt-1 text-xs wrap-anywhere text-muted-foreground">
                {agentDetails(agent)}
              </div>
            </TableCell>
            <TableCell className="py-2.5 text-right tabular-nums">{formatDuration(agent.durationMs)}</TableCell>
            <TableCell className="hidden py-2.5 text-right tabular-nums sm:table-cell">{agent.toolCalls}</TableCell>
            <TableCell className="py-2.5 pr-0 text-right tabular-nums" title={`${agent.tokens.toLocaleString()} tokens`}>
              {formatCredits(agent.credits)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default AgentsTable
