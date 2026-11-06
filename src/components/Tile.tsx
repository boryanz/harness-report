import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const TONES = {
  neutral: '',
  high: 'text-destructive',
  medium: 'text-amber-600 dark:text-amber-400',
}

type TileProps = {
  label: string
  value: string | number
  caption: string
  tone?: keyof typeof TONES
  className?: string
}

function Tile({ label, value, caption, tone = 'neutral', className }: TileProps) {
  return (
    <Card size="sm" className={className}>
      <CardHeader>
        <CardDescription className="text-xs font-medium uppercase tracking-wide">{label}</CardDescription>
        <div className={cn('text-3xl font-semibold tabular-nums', TONES[tone])}>{value}</div>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{caption}</CardContent>
    </Card>
  )
}

export default Tile
