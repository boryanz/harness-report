import { useState } from 'react'
import { BookOpen, CircleSlash, Coins, FileWarning, FlaskConical, ListChecks, Settings, type LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useEvalResults } from '@/hooks/useEvalResults'
import { armStats, groupBySubject } from '@/lib/evals'
import type { EvalRun, RejectedEvalFile } from '../../../shared/types.ts'
import Tile from '../Tile.tsx'
import ContractGuide from './ContractGuide.tsx'
import EvalCard from './EvalCard.tsx'

type Page = 'results' | 'docs'

const PAGES: { id: Page; label: string; icon: LucideIcon; color: string }[] = [
  { id: 'results', label: 'Results', icon: ListChecks, color: 'var(--agent-3)' },
  { id: 'docs', label: 'Docs', icon: BookOpen, color: 'var(--agent-7)' },
]

function DocsLink({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="font-medium text-(--agent-7) underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
      Docs
    </button>
  )
}

function SetupHelp({ onOpenDocs, onOpenSettings }: { onOpenDocs: () => void; onOpenSettings: () => void }) {
  return (
    <section className="rounded-lg border bg-card px-5 py-4 text-sm">
      <h2 className="flex items-center gap-1.5 font-semibold tracking-tight">
        <FlaskConical className="size-3.5" style={{ color: 'var(--agent-7)' }} aria-hidden />
        No eval results yet
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Add the folder your eval tool writes result files into. What to write in them is explained in{' '}
        <DocsLink onOpen={onOpenDocs} />.
      </p>
      <button
        type="button"
        onClick={onOpenSettings}
        className="mt-3 flex h-8 items-center gap-1.5 rounded-md bg-(--agent-1) px-3 text-xs font-medium text-white outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Settings className="size-3.5" aria-hidden />
        Open Settings
      </button>
    </section>
  )
}

function RejectedFiles({ files, onOpenDocs }: { files: RejectedEvalFile[]; onOpenDocs: () => void }) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <header className="px-5 py-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
          <FileWarning className="size-3.5" style={{ color: 'var(--waiting)' }} aria-hidden />
          Files that couldn't be used
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">These don't follow the result format in <DocsLink onOpen={onOpenDocs} />, so they aren't scored.</p>
      </header>
      <ul className="divide-y border-t">
        {files.map((file) => (
          <li key={file.file} className="px-5 py-2.5 text-xs">
            <div className="font-mono wrap-anywhere">{file.file}</div>
            <div className="mt-0.5 wrap-anywhere text-muted-foreground">{file.reason}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function EvalsScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [page, setPage] = useState<Page>('results')

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center gap-1 self-start rounded-md border bg-card p-0.5" aria-label="Evals pages">
        {PAGES.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            type="button"
            aria-current={page === id ? 'page' : undefined}
            className="flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
            onClick={() => setPage(id)}
          >
            <Icon className="size-3.5" style={{ color }} aria-hidden />
            {label}
          </button>
        ))}
      </nav>
      {page === 'docs' ? <ContractGuide /> : <EvalResults onOpenDocs={() => setPage('docs')} onOpenSettings={onOpenSettings} />}
    </div>
  )
}

function EvalResults({ onOpenDocs, onOpenSettings }: { onOpenDocs: () => void; onOpenSettings: () => void }) {
  const { results, failed } = useEvalResults()

  if (!results) {
    return failed ? (
      <p className="text-sm text-muted-foreground">Couldn't load eval results.</p>
    ) : (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const subjects = groupBySubject(results.suites)
  const scored = subjects.filter((subject) => subject.history.length > 0)
  const latestRuns: EvalRun[] = scored.flatMap((subject) => subject.history[subject.history.length - 1].runs)
  const stats = armStats(latestRuns)
  const credits = latestRuns.reduce((total, run) => total + (run.credits ?? 0), 0)

  return (
    <div className="flex flex-col gap-4">
      {subjects.length === 0 && results.rejected.length === 0 && <SetupHelp onOpenDocs={onOpenDocs} onOpenSettings={onOpenSettings} />}

      {subjects.length > 0 && (
        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-4">
          <Tile label="Tested" value={subjects.length} caption="skills and agents" icon={FlaskConical} color="var(--agent-7)" />
          <Tile label="Scored runs" value={stats.ok} caption="in the latest suites" icon={ListChecks} color="var(--agent-3)" />
          <Tile label="Left out" value={stats.invalid + stats.errors} caption="invalid or failed runs" icon={CircleSlash} color="var(--waiting)" />
          <Tile label="Credits" value={Math.round(credits).toLocaleString()} caption="spent on the latest suites" icon={Coins} color="var(--agent-1)" />
        </section>
      )}

      {subjects.map((subject) => <EvalCard key={subject.key} evals={subject} />)}

      {results.rejected.length > 0 && <RejectedFiles files={results.rejected} onOpenDocs={onOpenDocs} />}
    </div>
  )
}

export default EvalsScreen
