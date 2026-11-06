import { Bot, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { agentColor } from '@/lib/agentColor'
import { formatCredits, formatDuration } from '@/lib/format'
import { toolStatus } from '@/lib/sessions'
import { AgentEventList } from './EventLog.tsx'
import type { AgentRun, SessionSummary, ToolCall } from '../../shared/types.ts'

type AgentsTableProps = {
  session: SessionSummary
  agents: AgentRun[]
  toolCalls: ToolCall[]
}

type AgentRowProps = {
  agent: AgentRun
  toolCalls: ToolCall[]
  sessionStart: number
}

const COLUMNS =
  'grid grid-cols-[0.875rem_minmax(0,1fr)_4.5rem_4.5rem] items-start gap-x-3 sm:grid-cols-[0.875rem_minmax(0,1fr)_5rem_3.5rem_5rem]'

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

function AgentRow({ agent, toolCalls, sessionStart }: AgentRowProps) {
  const failed = toolCalls.filter((call) => toolStatus(call) === 'failed').length
  const details = agentDetails(agent)

  return (
    <li>
      <Collapsible>
        <CollapsibleTrigger
          className={`group ${COLUMNS} w-full px-2 py-2.5 text-left text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring`}
        >
          <ChevronRight className="mt-0.5 size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90 motion-reduce:transition-none" aria-hidden />
          <span className="min-w-0">
            <AgentBadge name={agent.label} />
            {(details || failed > 0) && (
              <span className="mt-1 block text-xs wrap-anywhere text-muted-foreground">
                {details}
                {details && failed > 0 && ' · '}
                {failed > 0 && <span className="font-medium text-destructive">{failed} failed</span>}
              </span>
            )}
          </span>
          <span className="text-right tabular-nums">{formatDuration(agent.durationMs)}</span>
          <span className="hidden text-right tabular-nums sm:block">{toolCalls.length}</span>
          <span className="text-right tabular-nums" title={`${agent.tokens.toLocaleString()} tokens`}>
            {formatCredits(agent.credits)}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
          <div className="px-2 pb-3">
            <AgentEventList toolCalls={toolCalls} sessionStart={sessionStart} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

function AgentsTable({ session, agents, toolCalls }: AgentsTableProps) {
  if (agents.length === 0) {
    return <p className="text-xs text-muted-foreground">No subagents in this session.</p>
  }

  return (
    <div>
      <div className={`${COLUMNS} border-b px-2 py-1.5 text-xs text-muted-foreground`}>
        <span />
        <span>Agent</span>
        <span className="text-right">Duration</span>
        <span className="hidden text-right sm:block">Tools</span>
        <span className="text-right">AI credits</span>
      </div>
      <ul className="divide-y">
        {agents.map((agent) => (
          <AgentRow
            key={agent.id}
            agent={agent}
            toolCalls={toolCalls.filter((call) => call.agentId === agent.id)}
            sessionStart={Date.parse(session.start)}
          />
        ))}
      </ul>
    </div>
  )
}

export default AgentsTable
