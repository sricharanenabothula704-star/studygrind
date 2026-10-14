export interface Cell {
  value: number
  title?: string
  /** future / empty cells render as a faint pinpoint */
  muted?: boolean
}

interface Props {
  cols: number
  rows: number
  /** row-major, length cols * rows */
  cells: Cell[]
  max?: number
  cell?: number
  className?: string
}

/** Halftone dot grid: dot area scales with value. Colour comes from currentColor. */
export default function DotGrid({ cols, rows, cells, max, cell = 14, className }: Props) {
  const m = max ?? Math.max(1, ...cells.map((c) => c.value))
  const rMax = cell / 2 - 0.5
  return (
    <svg
      viewBox={`0 0 ${cols * cell} ${rows * cell}`}
      className={className}
      fill="currentColor"
      role="img"
      aria-label="Study activity dot graph"
    >
      {cells.map((c, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const r = c.muted ? 0.6 : 0.9 + (rMax - 0.9) * Math.sqrt(Math.min(1, c.value / m))
        return (
          <circle key={i} cx={(col + 0.5) * cell} cy={(row + 0.5) * cell} r={r} opacity={c.muted ? 0.25 : 1}>
            {c.title && <title>{c.title}</title>}
          </circle>
        )
      })}
    </svg>
  )
}

/** Decorative halftone: tiny dots top-right growing to large dots bottom-left. */
export function HalftoneBackdrop({ cols = 28, rows = 12, className }: { cols?: number; rows?: number; className?: string }) {
  const cells: Cell[] = Array.from({ length: cols * rows }, (_, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    return { value: ((cols - 1 - c) / (cols - 1) + r / (rows - 1)) / 2 }
  })
  return <DotGrid cols={cols} rows={rows} cells={cells} max={1} className={className} />
}
