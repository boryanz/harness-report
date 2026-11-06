import { useState, type ReactNode } from 'react'
import { Bot, ChevronRight, ListTree, MessageCircleQuestion, Plug, Sparkles, User, Wrench, type LucideIcon } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { formatCallTime, formatOffset } from '@/lib/format'
import type { AgentRun, Prompt, RawToolCall, SessionSummary, ToolCall, ToolKind } from '../../shared/types.ts'

type Status = 'ok' | 'failed' | 'unfinished'

type Entry = {
  id: string
  kind: ToolKind | 'prompt'
  title: string
  detail: string | null
  time: string
  durationMs: number | null
  status: Status
  caller: string | null
  hint: string | null
  raw: RawToolCall | null
}

const ICONS: Record<Entry['kind'], LucideIcon> = {
  prompt: User,
  tool: Wrench,
  mcp: Plug,
  skill: Sparkles,
  subagent: Bot,
  ask: MessageCircleQuestion,
}

const KIND_COLORS: Record<Entry['kind'], string> = {
  prompt: 'var(--agent-1)',
  tool: 'var(--agent-3)',
  mcp: 'var(--agent-7)',
  skill: 'var(--agent-5)',
  subagent: 'var(--agent-6)',
  ask: 'var(--waiting)',
}

const KIND_LABELS: Partial<Record<Entry['kind'], string>> = {
  mcp: 'mcp',
  skill: 'skill',
  subagent: 'subagent',
  ask: 'asked you',
}

const STATUS_TEXT: Record<Status, string> = {
  ok: '',
  failed: 'text-destructive',
  unfinished: 'text-amber-600 dark:text-amber-400',
}

type EventLogProps = {
  session: SessionSummary
  toolCalls: ToolCall[]
  prompts: Prompt[]
  agents: AgentRun[]
}

function toolStatus(call: ToolCall): Status {
  if (call.rejected) return 'ok'
  if (call.success === null) return 'unfinished'
  return call.success ? 'ok' : 'failed'
}

function buildEntries(toolCalls: ToolCall[], prompts: Prompt[], agents: AgentRun[]): Entry[] {
  const promptEntries: Entry[] = prompts.map((prompt) => ({
    id: prompt.id,
    kind: 'prompt',
    title: 'prompt',
    detail: prompt.text,
    time: prompt.time,
    durationMs: null,
    status: 'ok',
    caller: null,
    hint: null,
    raw: null,
  }))

  const toolEntries: Entry[] = toolCalls.map((call) => {
    const status = toolStatus(call)
    return {
      id: call.id,
      kind: call.kind,
      title: call.title,
      detail: call.error ?? (status === 'unfinished' ? 'Never finished' : call.detail),
      time: call.start,
      durationMs: call.durationMs,
      status,
      caller: agents.find((agent) => agent.id === call.agentId)?.label ?? null,
      hint: call.hint,
      raw: call.raw,
    }
  })

  return [...promptEntries, ...toolEntries].sort((a, b) => Date.parse(a.time) - Date.parse(b.time))
}

const JSON_TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?/g

function tokenColor(token: RegExpMatchArray): string {
  if (token[2]) return 'var(--agent-1)'
  return token[1] ? 'var(--agent-3)' : 'var(--waiting)'
}

// Colours keys, strings and values. React escapes the text, so raw log content is safe to show.
function highlightJson(json: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let position = 0
  for (const token of json.matchAll(JSON_TOKEN)) {
    nodes.push(json.slice(position, token.index))
    nodes.push(<span key={token.index} style={{ color: tokenColor(token) }}>{token[1] ?? token[0]}</span>)
    if (token[2]) nodes.push(token[2])
    position = token.index + token[0].length
  }
  nodes.push(json.slice(position))
  return nodes
}

function CodeBlock({ label, json }: { label: string; json: string }) {
  return (
    <div>
      <div className="mb-1 font-sans text-muted-foreground">{label}</div>
      <pre className="max-h-72 overflow-auto rounded-sm border bg-card p-3 leading-relaxed">
        <code>{highlightJson(json)}</code>
      </pre>
    </div>
  )
}

const ROW_GRID =
  'grid w-full grid-cols-[3.75rem_1rem_minmax(0,1fr)_auto_0.875rem] items-start gap-x-2.5 px-3 py-2 text-left font-mono text-xs sm:grid-cols-[4.5rem_1rem_minmax(0,1fr)_auto_0.875rem]'

function RowContent({ entry, sessionStart }: { entry: Entry; sessionStart: number }) {
  const Icon = ICONS[entry.kind]
  const statusText = STATUS_TEXT[entry.status]
  const suffix = [KIND_LABELS[entry.kind], entry.caller && `via ${entry.caller}`].filter(Boolean).join(' · ')

  return (
    <>
      <span className="text-muted-foreground tabular-nums">{formatOffset(Date.parse(entry.time) - sessionStart)}</span>
      <Icon
        className={`mt-px size-3.5 ${statusText}`}
        style={entry.status === 'ok' ? { color: KIND_COLORS[entry.kind] } : undefined}
        aria-hidden
      />
      <span className="block min-w-0">
        <span className="block wrap-anywhere">
          <span className={statusText}>{entry.title}</span>
          {suffix && <span className="text-muted-foreground"> · {suffix}</span>}
        </span>
        {entry.detail && (
          <span className={`mt-0.5 line-clamp-2 font-sans wrap-anywhere ${statusText || 'text-muted-foreground'}`} title={entry.detail}>
            {entry.detail}
          </span>
        )}
      </span>
      <span className="text-right text-muted-foreground tabular-nums">
        {entry.durationMs !== null && formatCallTime(entry.durationMs)}
      </span>
      {entry.raw ? (
        <ChevronRight className="mt-px size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90 motion-reduce:transition-none" aria-hidden />
      ) : (
        <span />
      )}
    </>
  )
}

function EventRow({ entry, sessionStart }: { entry: Entry; sessionStart: number }) {
  if (!entry.raw) {
    return (
      <li className={ROW_GRID}>
        <RowContent entry={entry} sessionStart={sessionStart} />
      </li>
    )
  }

  return (
    <li>
      <Collapsible>
        <CollapsibleTrigger className={`group ${ROW_GRID} outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring`}>
          <RowContent entry={entry} sessionStart={sessionStart} />
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
          <div className="flex flex-col gap-3 border-t bg-muted/30 px-3 py-3 font-mono text-xs">
            {entry.hint && (
              <p className="font-sans">
                <span className="font-medium">Likely cause:</span> {entry.hint}
              </p>
            )}
            <CodeBlock label="Arguments sent" json={entry.raw.arguments} />
            {entry.raw.result ? (
              <CodeBlock label="Raw event from the Copilot log" json={entry.raw.result} />
            ) : (
              <p className="font-sans text-muted-foreground">The log has no result for this call.</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

function EventList({ entries, sessionStart, scroll = false }: { entries: Entry[]; sessionStart: number; scroll?: boolean }) {
  return (
    <ul className={`divide-y rounded-md border bg-background ${scroll ? 'max-h-120 overflow-y-auto' : ''}`}>
      {entries.map((entry) => (
        <EventRow key={entry.id} entry={entry} sessionStart={sessionStart} />
      ))}
    </ul>
  )
}

function EventLog({ session, toolCalls, prompts, agents }: EventLogProps) {
  const [open, setOpen] = useState(false)
  const [failuresOnly, setFailuresOnly] = useState(false)

  const entries = buildEntries(toolCalls, prompts, agents)
  if (entries.length === 0) return null

  const sessionStart = Date.parse(session.start)
  const problems = entries.filter((entry) => entry.status !== 'ok')
  const failed = problems.filter((entry) => entry.status === 'failed').length
  const unfinished = problems.length - failed

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90 motion-reduce:transition-none" />
        <ListTree className="size-3.5 shrink-0" style={{ color: 'var(--agent-3)' }} aria-hidden />
        <span className="font-medium">Event log</span>
        <span className="ml-auto text-muted-foreground tabular-nums">
          {toolCalls.length} tool {toolCalls.length === 1 ? 'call' : 'calls'}
          {failed > 0 && <> · <span className="font-medium text-destructive">{failed} failed</span></>}
          {unfinished > 0 && ` · ${unfinished} unfinished`}
        </span>
      </CollapsibleTrigger>

      {!open && problems.length > 0 && (
        <div className="mt-1">
          <EventList entries={problems} sessionStart={sessionStart} />
        </div>
      )}

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
        <label className="flex w-fit cursor-pointer items-center gap-1.5 py-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            className="size-3.5 accent-destructive"
            checked={failuresOnly}
            onChange={(event) => setFailuresOnly(event.target.checked)}
          />
          Failures only
        </label>
        {failuresOnly && problems.length === 0 ? (
          <p className="text-xs text-muted-foreground">No failures in this session.</p>
        ) : (
          <EventList entries={failuresOnly ? problems : entries} sessionStart={sessionStart} scroll />
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

export default EventLog
