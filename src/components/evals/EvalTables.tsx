import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { armRuns, armStats, compareScores, formatMargin, formatMetric, metricScore, noiseMargin, suiteArms, type Arm, type Difference } from '@/lib/evals'
import { formatDuration, formatShortDate } from '@/lib/format'
import type { EvalMetric, EvalSuite } from '../../../shared/types.ts'

const HEAD = 'h-8 text-xs font-normal text-muted-foreground'
const NUMBER_HEAD = `${HEAD} text-right`
const NUMBER = 'py-2 text-right font-mono text-xs tabular-nums'

const VERDICT_TEXT: Record<Difference['verdict'], string> = {
  better: 'text-(--agent-3)',
  worse: 'text-destructive',
  same: 'text-muted-foreground',
}

function DifferenceCell({ difference }: { difference: Difference | null }) {
  if (!difference) return <TableCell className={`${NUMBER} text-muted-foreground`}>—</TableCell>

  return (
    <TableCell className={`${NUMBER} ${VERDICT_TEXT[difference.verdict]}`}>
      {difference.text}
      {difference.withinNoise && <span className="ml-1.5 font-sans">within noise</span>}
    </TableCell>
  )
}

function CostRow({ label, arms, value, columns }: { label: string; arms: Arm[]; value: (arm: Arm) => string; columns: number }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="py-2 text-xs whitespace-normal text-muted-foreground">{label}</TableCell>
      {arms.map((arm) => (
        <TableCell key={arm ?? 'all'} className={NUMBER}>{value(arm)}</TableCell>
      ))}
      {Array.from({ length: columns }, (_, index) => <TableCell key={index} />)}
    </TableRow>
  )
}

export function ScoreTable({ suite }: { suite: EvalSuite }) {
  const arms = suiteArms(suite)
  const baseline = suite.baseline_arm
  const compared = baseline ? arms.filter((arm) => arm !== baseline) : []
  const stats = (arm: Arm) => armStats(armRuns(suite, arm))
  const score = (arm: Arm, metric: EvalMetric) => metricScore(armRuns(suite, arm), metric.id)
  const hasCredits = arms.some((arm) => stats(arm).credits !== null)
  const hasDuration = arms.some((arm) => stats(arm).durationS !== null)

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className={`${HEAD} w-full`}>Metric</TableHead>
          {arms.map((arm) => <TableHead key={arm ?? 'all'} className={NUMBER_HEAD}>{arm ?? 'Score'}</TableHead>)}
          {compared.map((arm) => (
            <TableHead key={arm} className={NUMBER_HEAD}>{compared.length > 1 ? `${arm} vs ${baseline}` : 'Difference'}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {suite.metrics.map((metric) => {
          const margin = noiseMargin(suite, metric)
          return (
            <TableRow key={metric.id} className="hover:bg-transparent">
              <TableCell className="py-2 text-xs whitespace-normal">
                {metric.label}
                {margin > 0 && <span className="ml-1.5 text-muted-foreground">{formatMargin(margin, metric.unit)} run to run</span>}
                {metric.better === 'lower' && <span className="ml-1.5 text-muted-foreground">lower is better</span>}
              </TableCell>
              {arms.map((arm) => (
                <TableCell key={arm ?? 'all'} className={NUMBER}>{formatMetric(score(arm, metric), metric.unit)}</TableCell>
              ))}
              {compared.map((arm) => (
                <DifferenceCell key={arm} difference={compareScores(score(arm, metric), score(baseline, metric), metric, margin)} />
              ))}
            </TableRow>
          )
        })}
        {hasCredits && (
          <CostRow
            label="Credits per run"
            arms={arms}
            columns={compared.length}
            value={(arm) => formatMetric(stats(arm).credits, 'credits')}
          />
        )}
        {hasDuration && (
          <CostRow
            label="Time per run"
            arms={arms}
            columns={compared.length}
            value={(arm) => {
              const seconds = stats(arm).durationS
              return seconds === null ? '—' : formatDuration(seconds * 1000)
            }}
          />
        )}
      </TableBody>
    </Table>
  )
}

export function CaseTable({ suite }: { suite: EvalSuite }) {
  const arms = suiteArms(suite)
  const named = suite.arms !== undefined
  const cases = [...new Set(suite.runs.map((run) => run.case))].sort()

  return (
    <Table>
      <TableHeader>
        {named && (
          <TableRow className="hover:bg-transparent">
            <TableHead className={HEAD} />
            {suite.metrics.map((metric) => (
              <TableHead key={metric.id} colSpan={arms.length} className={`${NUMBER_HEAD} border-l whitespace-normal`}>{metric.label}</TableHead>
            ))}
          </TableRow>
        )}
        <TableRow className="hover:bg-transparent">
          <TableHead className={`${HEAD} w-full`}>Case</TableHead>
          {suite.metrics.flatMap((metric) => arms.map((arm, index) => (
            <TableHead key={`${metric.id}-${arm}`} className={`${NUMBER_HEAD} ${index === 0 && named ? 'border-l' : ''}`}>
              {arm ?? metric.label}
            </TableHead>
          )))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {cases.map((name) => {
          const runs = suite.runs.filter((run) => run.case === name)
          return (
            <TableRow key={name} className="hover:bg-transparent">
              <TableCell className="py-2 font-mono text-xs">
                {name}
                {runs[0].type && <span className="ml-2 rounded-sm bg-muted px-1.5 py-px font-sans text-muted-foreground">{runs[0].type}</span>}
              </TableCell>
              {suite.metrics.flatMap((metric) => arms.map((arm, index) => {
                const armCaseRuns = arm === undefined ? runs : runs.filter((run) => run.arm === arm)
                return (
                  <TableCell key={`${metric.id}-${arm}`} className={`${NUMBER} ${index === 0 && named ? 'border-l' : ''}`}>
                    {formatMetric(metricScore(armCaseRuns, metric.id), metric.unit)}
                  </TableCell>
                )
              }))}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export function VersionTable({ history }: { history: EvalSuite[] }) {
  const latest = history[history.length - 1]
  const arm = suiteArms(latest).find((name) => name !== latest.baseline_arm)

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className={`${HEAD} w-full`}>Version{arm && ` (${arm})`}</TableHead>
          <TableHead className={NUMBER_HEAD}>Run</TableHead>
          {latest.metrics.map((metric) => <TableHead key={metric.id} className={`${NUMBER_HEAD} whitespace-normal`}>{metric.label}</TableHead>)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...history].reverse().map((suite) => (
          <TableRow key={suite.suite} className="hover:bg-transparent">
            <TableCell className="py-2 font-mono text-xs">{suite.subject.version}</TableCell>
            <TableCell className={NUMBER}>{formatShortDate(new Date(suite.started))}</TableCell>
            {latest.metrics.map((metric) => (
              <TableCell key={metric.id} className={NUMBER}>{formatMetric(metricScore(armRuns(suite, arm), metric.id), metric.unit)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
