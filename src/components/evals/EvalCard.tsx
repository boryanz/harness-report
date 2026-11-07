import type { ReactNode } from 'react'
import { Bot, CalendarClock, ChevronRight, CircleSlash, GitCommitHorizontal, History, Info, ListChecks, LoaderCircle, Sparkles, Tag } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { armStats, type SubjectEvals } from '@/lib/evals'
import { formatShortDate, formatTime } from '@/lib/format'
import type { EvalSuite } from '../../../shared/types.ts'
import { CaseTable, ScoreTable, VersionTable } from './EvalTables.tsx'

type SectionProps = {
  icon: typeof History
  color: string
  title: string
  summary: string
  children: ReactNode
}

function Section({ icon: Icon, color, title, summary, children }: SectionProps) {
  return (
    <Collapsible className="border-t">
      <CollapsibleTrigger className="group flex w-full items-center gap-1.5 px-5 py-2.5 text-left text-xs outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90 motion-reduce:transition-none" aria-hidden />
        <Icon className="size-3.5 shrink-0" style={{ color }} aria-hidden />
        <span className="font-medium">{title}</span>
        <span className="ml-auto text-muted-foreground tabular-nums">{summary}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
        <div className="px-5 pb-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function LeftOutList({ suite }: { suite: EvalSuite }) {
  const runs = suite.runs.filter((run) => run.status !== 'ok')

  return (
    <ul className="divide-y rounded-md border bg-background text-xs">
      {runs.map((run, index) => (
        <li key={index} className="px-3 py-2">
          <span className="font-mono">{run.case}</span>
          <span className="text-muted-foreground">{[run.arm, run.rep && `#${run.rep}`, run.status].filter(Boolean).map((part) => ` · ${part}`)}</span>
          {run.reason && <div className="mt-0.5 wrap-anywhere text-muted-foreground">{run.reason}</div>}
        </li>
      ))}
    </ul>
  )
}

function Detail({ icon: Icon, color, label, children }: { icon: typeof History; color: string; label: string; children: ReactNode }) {
  return (
    <>
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" style={{ color }} aria-hidden />
        <span className="first-letter:uppercase">{label}</span>
      </dt>
      <dd>{children}</dd>
    </>
  )
}

function suiteTime(suite: EvalSuite): string {
  const time = suite.finished ?? suite.started
  return `${formatShortDate(new Date(time))}, ${formatTime(time)}`
}

function Running({ suite }: { suite: EvalSuite }) {
  return (
    <p className="flex items-center gap-1.5 border-t px-5 py-2.5 text-xs text-muted-foreground">
      <LoaderCircle className="size-3.5 shrink-0 animate-spin motion-reduce:animate-none" style={{ color: 'var(--waiting)' }} aria-hidden />
      <span>
        Running version <span className="font-mono text-foreground">{suite.subject.version}</span>:{' '}
        {suite.runs.length} {suite.runs.length === 1 ? 'run' : 'runs'} done, started {formatTime(suite.started)}
      </span>
    </p>
  )
}

function EvalCard({ evals }: { evals: SubjectEvals }) {
  const { subject, history, running } = evals
  const latest = history[history.length - 1]
  const Icon = subject.kind === 'agent' ? Bot : Sparkles
  const stats = latest ? armStats(latest.runs) : null
  const leftOut = stats ? stats.invalid + stats.errors : 0
  const labels = Object.entries(latest?.labels ?? {})

  return (
    <article className="overflow-hidden rounded-lg border bg-card">
      <header className="px-5 py-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
          <Icon className="size-3.5 shrink-0" style={{ color: subject.kind === 'agent' ? 'var(--agent-6)' : 'var(--agent-5)' }} aria-hidden />
          <span className="min-w-0 wrap-anywhere">{subject.name}</span>
          <span className="rounded-sm bg-muted px-1.5 py-px text-xs font-normal text-muted-foreground">{subject.kind}</span>
        </h2>
      </header>

      {latest && stats && (
        <Section
          icon={Info}
          color="var(--agent-1)"
          title="Details"
          summary={`${latest.subject.version.slice(0, 12)} · ${suiteTime(latest)}`}
        >
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1 text-xs sm:gap-x-8">
            <Detail icon={GitCommitHorizontal} color="var(--agent-1)" label="Version">
              <span className="font-mono break-all">{latest.subject.version}</span>
            </Detail>
            {labels.map(([name, value]) => (
              <Detail key={name} icon={Tag} color="var(--agent-4)" label={name}>
                <span className="wrap-anywhere">{value}</span>
              </Detail>
            ))}
            <Detail icon={CalendarClock} color="var(--agent-7)" label={latest.finished ? 'Finished' : 'Started'}>
              {suiteTime(latest)}
            </Detail>
            <Detail icon={ListChecks} color="var(--agent-3)" label="Runs">
              <span className="tabular-nums">
                {stats.ok} scored
                {leftOut > 0 && <span className="text-muted-foreground">, {leftOut} left out</span>}
              </span>
            </Detail>
          </dl>
        </Section>
      )}

      {running && <Running suite={running} />}

      {latest && (
        <>
          <div className="border-t px-5 py-2">
            <ScoreTable suite={latest} />
          </div>
          <Section
            icon={ListChecks}
            color="var(--agent-3)"
            title="Cases"
            summary={`${new Set(latest.runs.map((run) => run.case)).size} cases`}
          >
            <CaseTable suite={latest} />
          </Section>
          {leftOut > 0 && (
            <Section icon={CircleSlash} color="var(--waiting)" title="Runs left out" summary={`${leftOut} of ${latest.runs.length}`}>
              <LeftOutList suite={latest} />
            </Section>
          )}
          {history.length > 1 && (
            <Section icon={History} color="var(--agent-1)" title="Versions" summary={`${history.length} versions`}>
              <VersionTable history={history} />
            </Section>
          )}
        </>
      )}
    </article>
  )
}

export default EvalCard
