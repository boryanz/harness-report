type TileProps = {
  label: string
  value: string | number
  caption: string
  kind?: string
}

function Tile({ label, value, caption, kind = '' }: TileProps) {
  return (
    <div className={`tile ${kind}`}>
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
      <div className="cap">{caption}</div>
    </div>
  )
}

export default Tile
