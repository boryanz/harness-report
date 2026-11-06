import { ChartColumn } from 'lucide-react'
import { Bar, BarChart, XAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatShortDate } from '@/lib/format'
import { dailyCounts } from '@/lib/sessions'
import type { SessionSummary } from '../../shared/types.ts'

const chartConfig = {
  sessions: { label: 'Sessions', color: 'var(--chart-1)' },
} satisfies ChartConfig

type ActivityChartProps = {
  sessions: SessionSummary[]
}

function ActivityChart({ sessions }: ActivityChartProps) {
  const data = dailyCounts(sessions)
  const ticks = [1, 8, 15, 22, data.length]

  return (
    <figure className="flex min-h-56 min-w-0 flex-col rounded-lg border bg-card">
      <figcaption className="border-b px-5 py-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
          <ChartColumn className="size-3.5" style={{ color: 'var(--agent-1)' }} aria-hidden />
          Sessions per day
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">Sessions by the day they last ran.</p>
      </figcaption>
      <ChartContainer config={chartConfig} className="aspect-auto min-h-0 w-full flex-1 px-4 py-3">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }} accessibilityLayer>
          <XAxis dataKey="day" ticks={ticks} interval={0} tickLine={false} tickMargin={6} />
          <ChartTooltip
            cursor={{ fill: 'var(--muted)' }}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => formatShortDate(payload[0].payload.date)}
              />
            }
          />
          <Bar dataKey="sessions" fill="var(--color-sessions)" radius={[2, 2, 0, 0]} maxBarSize={14} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </figure>
  )
}

export default ActivityChart
