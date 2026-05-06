'use client'

type Shot = {
  x: number
  y: number
  made: boolean
  isThree: boolean
  teamId: string | null
}

interface ShotChartProps {
  shots: Shot[]
  homeTeamId: string
  awayTeamId: string
  homeColor?: string
  awayColor?: string
}

// FIBA half-court SVG: 500 × 470 viewBox
// Origin top-left. X and Y are 0-100 percentages.
// Court dims: 28m wide × 15m long (half = 14m displayed, full displayed as half)
const W = 500
const H = 470

function courtX(pct: number) { return (pct / 100) * W }
function courtY(pct: number) { return (pct / 100) * H }

export function ShotChart({ shots, homeTeamId, awayTeamId, homeColor = '#1B7340', awayColor = '#3052a5' }: ShotChartProps) {
  return (
    <div className="w-full max-w-[500px] mx-auto select-none">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ background: '#f5f0e8' }}>
        {/* Court outline */}
        <rect x="0" y="0" width={W} height={H} fill="#f5f0e8" stroke="#ccc" strokeWidth="2" />

        {/* Half-court line */}
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="#ccc" strokeWidth="1.5" />

        {/* Center circle */}
        <circle cx={W / 2} cy={H / 2} r="36" fill="none" stroke="#ccc" strokeWidth="1.5" />

        {/* Paint area (top) — 4.9m wide, 5.8m deep → ~87px wide, 196px deep */}
        <rect x={W / 2 - 87} y="0" width="174" height="196" fill="none" stroke="#aaa" strokeWidth="1.5" />

        {/* Free throw circle (top) */}
        <circle cx={W / 2} cy="196" r="72" fill="none" stroke="#aaa" strokeWidth="1.5" strokeDasharray="8 6" />
        <path d={`M ${W / 2 - 72} 196 A 72 72 0 0 0 ${W / 2 + 72} 196`} fill="none" stroke="#aaa" strokeWidth="1.5" />

        {/* Basket top */}
        <circle cx={W / 2} cy="52" r="9" fill="none" stroke="#888" strokeWidth="2" />
        <line x1={W / 2 - 9} y1="52" x2={W / 2 + 9} y2="52" stroke="#888" strokeWidth="1.5" />
        {/* Backboard */}
        <line x1={W / 2 - 30} y1="36" x2={W / 2 + 30} y2="36" stroke="#888" strokeWidth="3" />

        {/* 3-point arc top — radius ~177px from basket */}
        <path
          d="M 60 0 L 60 115 A 212 212 0 0 0 440 115 L 440 0"
          fill="none" stroke="#aaa" strokeWidth="1.5"
        />

        {/* Paint area (bottom) */}
        <rect x={W / 2 - 87} y={H - 196} width="174" height="196" fill="none" stroke="#aaa" strokeWidth="1.5" />

        {/* Free throw circle (bottom) */}
        <circle cx={W / 2} cy={H - 196} r="72" fill="none" stroke="#aaa" strokeWidth="1.5" strokeDasharray="8 6" />
        <path d={`M ${W / 2 - 72} ${H - 196} A 72 72 0 0 1 ${W / 2 + 72} ${H - 196}`} fill="none" stroke="#aaa" strokeWidth="1.5" />

        {/* Basket bottom */}
        <circle cx={W / 2} cy={H - 52} r="9" fill="none" stroke="#888" strokeWidth="2" />
        <line x1={W / 2 - 9} y1={H - 52} x2={W / 2 + 9} y2={H - 52} stroke="#888" strokeWidth="1.5" />
        {/* Backboard bottom */}
        <line x1={W / 2 - 30} y1={H - 36} x2={W / 2 + 30} y2={H - 36} stroke="#888" strokeWidth="3" />

        {/* 3-point arc bottom */}
        <path
          d={`M 60 ${H} L 60 ${H - 115} A 212 212 0 0 1 440 ${H - 115} L 440 ${H}`}
          fill="none" stroke="#aaa" strokeWidth="1.5"
        />

        {/* Shot markers */}
        {shots.map((shot, i) => {
          const cx = courtX(shot.x)
          const cy = courtY(shot.y)
          const color = shot.teamId === homeTeamId ? homeColor : awayColor
          return shot.made ? (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="7"
              fill={color}
              fillOpacity="0.75"
              stroke={color}
              strokeWidth="1"
            />
          ) : (
            <g key={i}>
              <line x1={cx - 6} y1={cy - 6} x2={cx + 6} y2={cy + 6} stroke={color} strokeWidth="2" strokeOpacity="0.7" />
              <line x1={cx + 6} y1={cy - 6} x2={cx - 6} y2={cy + 6} stroke={color} strokeWidth="2" strokeOpacity="0.7" />
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill={homeColor} fillOpacity="0.8" /></svg>
          Convertido
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12">
            <line x1="2" y1="2" x2="10" y2="10" stroke={homeColor} strokeWidth="2" />
            <line x1="10" y1="2" x2="2" y2="10" stroke={homeColor} strokeWidth="2" />
          </svg>
          Errado
        </span>
      </div>
    </div>
  )
}
