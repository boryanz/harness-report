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
    <figure className="min-w-0">
      <figcaption className="mb-2 text-xs text-muted-foreground">Sessions per day</figcaption>
      <ChartContainer config={chartConfig} className="aspect-auto h-28 w-full">
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
          <Bar dataKey="sessions" fill="var(--color-sessions)" radius={[4, 4, 0, 0]} maxBarSize={12} />
        </BarChart>
      </ChartContainer>
    </figure>
  )
}

export default ActivityChart
