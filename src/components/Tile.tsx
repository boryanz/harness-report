import type { LucideIcon } from 'lucide-react'

type TileProps = {
  label: string
  value: string | number
  caption: string
  icon: LucideIcon
  color: string
}

function Tile({ label, value, caption, icon: Icon, color }: TileProps) {
  return (
    <div className="min-w-0 bg-card px-5 py-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 shrink-0" style={{ color }} aria-hidden />
        {label}
      </div>
      <div className="mt-2 truncate font-mono text-2xl font-medium tracking-tight">{value}</div>
      <div className="mt-1 truncate text-xs text-muted-foreground">{caption}</div>
    </div>
  )
}

export default Tile
