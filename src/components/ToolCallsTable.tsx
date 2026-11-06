import { ChevronRight, CircleAlert, CircleDashed } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDuration, formatTime } from '@/lib/format'
import type { AgentRun, ToolCall } from '../../shared/types.ts'

type ToolCallsTableProps = {
  toolCalls: ToolCall[]
  agents: AgentRun[]
}

type ToolStats = {
  name: string
  calls: number
  failed: number
  totalMs: number
  finished: number
}

function statsByTool(toolCalls: ToolCall[]): ToolStats[] {
  const tools = new Map<string, ToolStats>()
  for (const call of toolCalls) {
    const tool = tools.get(call.name) ?? { name: call.name, calls: 0, failed: 0, totalMs: 0, finished: 0 }
    tool.calls += 1
    if (call.success === false) tool.failed += 1
    if (call.durationMs !== null) {
      tool.totalMs += call.durationMs
      tool.finished += 1
    }
    tools.set(call.name, tool)
  }
  return [...tools.values()].sort((a, b) => b.calls - a.calls)
}

function Problem({ call, caller }: { call: ToolCall; caller: string }) {
  const failed = call.success === false
  const Icon = failed ? CircleAlert : CircleDashed

  return (
    <li className="flex gap-2 py-2 text-xs">
      <Icon className={`mt-px size-3.5 shrink-0 ${failed ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'}`} />
      <div className="min-w-0">
        <div>
          <span className="font-mono font-medium">{call.name}</span>
          <span className="text-muted-foreground">
            {' '}· {failed ? 'failed' : 'never finished'} · {caller} · {formatTime(call.start)}
          </span>
        </div>
        {call.error && <div className="mt-0.5 line-clamp-2 wrap-anywhere text-muted-foreground" title={call.error}>{call.error}</div>}
      </div>
    </li>
  )
}

function ToolCallsTable({ toolCalls, agents }: ToolCallsTableProps) {
  if (toolCalls.length === 0) return null

  const callerName = (call: ToolCall) =>
    agents.find((agent) => agent.id === call.agentId)?.label ?? 'Main agent'
  const problems = toolCalls.filter((call) => call.success !== true)
  const failed = problems.filter((call) => call.success === false).length
  const unfinished = problems.length - failed

  return (
    <section>
      <Collapsible>
        <CollapsibleTrigger className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90 motion-reduce:transition-none" />
          <span className="font-medium">Tool calls</span>
          <span className="ml-auto text-muted-foreground tabular-nums">
            {toolCalls.length} {toolCalls.length === 1 ? 'call' : 'calls'}
            {failed > 0 && <> · <span className="font-medium text-destructive">{failed} failed</span></>}
            {unfinished > 0 && ` · ${unfinished} unfinished`}
          </span>
        </CollapsibleTrigger>

        {problems.length > 0 && (
          <ul className="divide-y">
            {problems.map((call) => (
              <Problem key={call.id} call={call} caller={callerName(call)} />
            ))}
          </ul>
        )}

        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
          <div className="pt-1">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 w-full pl-0 text-xs font-normal text-muted-foreground">Tool</TableHead>
                <TableHead className="h-8 text-right text-xs font-normal text-muted-foreground">Calls</TableHead>
                <TableHead className="h-8 text-right text-xs font-normal text-muted-foreground">Failed</TableHead>
                <TableHead className="h-8 pr-0 text-right text-xs font-normal text-muted-foreground">Avg time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statsByTool(toolCalls).map((tool) => (
                <TableRow key={tool.name} className="hover:bg-transparent">
                  <TableCell className="py-1.5 pl-0 font-mono text-xs wrap-anywhere whitespace-normal">{tool.name}</TableCell>
                  <TableCell className="py-1.5 text-right tabular-nums">{tool.calls}</TableCell>
                  <TableCell className="py-1.5 text-right tabular-nums">{tool.failed || '—'}</TableCell>
                  <TableCell className="py-1.5 pr-0 text-right tabular-nums">
                    {tool.finished > 0 ? formatDuration(tool.totalMs / tool.finished) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}

export default ToolCallsTable
