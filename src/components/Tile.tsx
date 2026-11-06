type TileProps = {
  label: string
  value: string | number
  caption: string
}

function Tile({ label, value, caption }: TileProps) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground">{caption}</div>
    </div>
  )
}

export default Tile
