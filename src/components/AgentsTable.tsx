import { Badge } from '@/components/ui/badge'
import { agentColor } from '@/lib/agentColor'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AgentRun } from '../../shared/types.ts'

type AgentsTableProps = {
  agents: AgentRun[]
}

function AgentsTable({ agents }: AgentsTableProps) {
  if (agents.length === 0) {
    return <p className="text-xs text-muted-foreground">No subagents in this session.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead>Mode</TableHead>
          <TableHead>Started</TableHead>
          <TableHead className="text-right">Duration</TableHead>
          <TableHead className="text-right">Tool calls</TableHead>
          <TableHead className="text-right">Tokens</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow key={agent.id}>
            <TableCell>
              <Badge className={agentColor(agent.name)}>{agent.name}</Badge>
              {agent.displayName && agent.displayName !== agent.name && (
                <div className="mt-1 font-medium">{agent.displayName}</div>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{agent.mode}</Badge>
            </TableCell>
            <TableCell>{new Date(agent.start).toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums">{(agent.durationMs / 1000).toFixed(1)}s</TableCell>
            <TableCell className="text-right tabular-nums">{agent.toolCalls}</TableCell>
            <TableCell className="text-right tabular-nums">{agent.tokens.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default AgentsTable
