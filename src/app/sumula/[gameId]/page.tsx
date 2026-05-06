import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

const LOGO_URL = 'https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png'

function fmt(v: number | null | undefined) {
  return (v ?? 0).toString()
}

function parseDescription(payloadJson: string | null): string {
  if (!payloadJson) return ''
  try {
    const p = JSON.parse(payloadJson)
    return p?.description ? String(p.description) : ''
  } catch {
    return ''
  }
}

export default async function SumulaPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      homeTeam: true,
      awayTeam: true,
      championship: true,
      category: true,
      rosters: {
        include: {
          team: true,
          players: {
            include: { athlete: true },
            orderBy: { jerseyNumber: 'asc' }
          }
        }
      },
      playerStatLines: {
        include: { athlete: true, team: true },
        orderBy: [{ teamId: 'asc' }, { points: 'desc' }]
      },
      events: {
        where: { isReverted: false },
        orderBy: [{ period: 'asc' }, { clockMs: 'desc' }],
        take: 200,
        include: { athlete: true, team: true }
      }
    }
  })

  if (!game) notFound()

  const homeStats = game.playerStatLines.filter(s => s.teamId === game.homeTeamId)
  const awayStats = game.playerStatLines.filter(s => s.teamId === game.awayTeamId)

  const gameDate = new Date(game.dateTime)
  const sumulaUrl = `https://fgb.app/sumula/${gameId}`

  const statCols = ['Jogador', '#', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TO', 'FC', '2PM/A', '3PM/A', 'LLM/A']
  function playerRow(s: typeof homeStats[0]) {
    const fg2a = (s.twoPtAttempted ?? 0)
    const fg2m = (s.twoPtMade ?? 0)
    const fg3a = (s.threePtAttempted ?? 0)
    const fg3m = (s.threePtMade ?? 0)
    const fta  = (s.freeThrowsAttempted ?? 0)
    const ftm  = (s.freeThrowsMade ?? 0)
    return [
      s.athlete.name,
      s.athlete.jerseyNumber?.toString() ?? '–',
      fmt(s.points),
      fmt(s.reboundsTotal),
      fmt(s.assists),
      fmt(s.steals),
      fmt(s.blocks),
      fmt(s.turnovers),
      fmt(s.fouls),
      `${fg2m}/${fg2a}`,
      `${fg3m}/${fg3a}`,
      `${ftm}/${fta}`,
    ]
  }

  const periodMap: Record<number, { home: number; away: number }> = {}
  for (const e of game.events) {
    if (e.homeScoreAfter == null || e.awayScoreAfter == null) continue
    const p = e.period ?? 1
    periodMap[p] = { home: e.homeScoreAfter, away: e.awayScoreAfter }
  }
  const periods = Object.keys(periodMap).map(Number).sort((a, b) => a - b)

  const EVENT_LABELS: Record<string, string> = {
    SHOT_MADE_2: '2PTS',
    SHOT_MADE_3: '3PTS',
    FREE_THROW_MADE: 'LL',
    SHOT_MISSED_2: 'Arremesso perdido (2)',
    SHOT_MISSED_3: 'Arremesso perdido (3)',
    FREE_THROW_MISSED: 'LL perdido',
    REBOUND_OFFENSIVE: 'Rebote ofensivo',
    REBOUND_DEFENSIVE: 'Rebote defensivo',
    FOUL_PERSONAL: 'Falta pessoal',
    FOUL_TECHNICAL: 'Falta técnica',
    TURNOVER: 'Perda de bola',
    STEAL: 'Roubo de bola',
    BLOCK: 'Bloqueio',
    ASSIST: 'Assistência',
    TIMEOUT: 'Tempo',
    PERIOD_START: 'Início de período',
    PERIOD_END: 'Fim de período',
    HALFTIME: 'Intervalo',
    GAME_END: 'Fim de jogo',
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif', fontSize: 12 }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .page-break { page-break-before: always; }
        }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; font-size: 11px; }
        th { background: #145530; color: white; font-weight: bold; font-size: 10px; text-transform: uppercase; }
        tr:nth-child(even) td { background: #f5f5f5; }
      `}</style>

      {/* Print button — hidden in print */}
      <div className="no-print bg-[#145530] text-white px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-bold">Súmula Oficial FGB</span>
        <div className="flex gap-3">
          <button onClick={() => window.print()}
            className="px-4 py-1.5 bg-white text-[#145530] rounded text-xs font-bold hover:bg-gray-100 transition-colors">
            Imprimir / Salvar PDF
          </button>
          <button onClick={() => {
              if (navigator.share) { navigator.share({ url: window.location.href, title: document.title }) }
              else { navigator.clipboard.writeText(window.location.href); alert('Link copiado!') }
            }}
            className="px-4 py-1.5 border border-white rounded text-xs font-bold hover:bg-white/10 transition-colors">
            Compartilhar
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div style={{ borderBottom: '3px solid #145530', paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_URL} alt="FGB" style={{ width: 60, height: 60, objectFit: 'contain' }} />
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, textTransform: 'uppercase', color: '#145530' }}>
                  Federação Gaúcha de Basketball
                </div>
                <div style={{ fontSize: 11, color: '#666' }}>
                  {game.championship?.name && `${game.championship.name} ${game.championship.year ?? ''} · `}
                  {game.category?.name && `${game.category.name} · `}
                  {gameDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  {game.venue && ` · ${game.venue}`}
                </div>
              </div>
            </div>
            <img
              alt="QR"
              style={{ width: 64, height: 64 }}
              src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(sumulaUrl)}`}
            />
          </div>
        </div>

        {/* Scoreboard */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#666', marginBottom: 4 }}>Casa</div>
            <div style={{ fontWeight: 900, fontSize: 20, textTransform: 'uppercase', color: '#145530' }}>{game.homeTeam.name}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 40, letterSpacing: 8, color: '#111' }}>
              {game.homeScore ?? 0} – {game.awayScore ?? 0}
            </div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
              {game.status === 'FINISHED' ? 'FINAL' : game.liveStatus ?? game.status}
            </div>
            {/* Period-by-period scores */}
            {periods.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <table style={{ width: 'auto', margin: '0 auto', fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#eee', color: '#333', minWidth: 80 }}>Time</th>
                      {periods.map(p => <th key={p} style={{ background: '#eee', color: '#333', minWidth: 32 }}>Q{p}</th>)}
                      <th style={{ background: '#eee', color: '#333' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>{game.homeTeam.name}</td>
                      {periods.map(p => <td key={p} style={{ textAlign: 'center' }}>{periodMap[p]?.home ?? '–'}</td>)}
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{game.homeScore ?? 0}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>{game.awayTeam.name}</td>
                      {periods.map(p => <td key={p} style={{ textAlign: 'center' }}>{periodMap[p]?.away ?? '–'}</td>)}
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{game.awayScore ?? 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#666', marginBottom: 4 }}>Visitante</div>
            <div style={{ fontWeight: 900, fontSize: 20, textTransform: 'uppercase', color: '#145530' }}>{game.awayTeam.name}</div>
          </div>
        </div>

        {/* Box Score — Home */}
        {homeStats.length > 0 && (
          <div>
            <div style={{ background: '#145530', color: 'white', padding: '6px 10px', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>
              {game.homeTeam.name} — Box Score
            </div>
            <table>
              <thead>
                <tr>{statCols.map(c => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {homeStats.map(s => {
                  const cells = playerRow(s)
                  return (
                    <tr key={s.id}>
                      {cells.map((c, i) => <td key={i} style={i === 0 ? { fontWeight: 'bold' } : { textAlign: 'center' }}>{c}</td>)}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Box Score — Away */}
        {awayStats.length > 0 && (
          <div>
            <div style={{ background: '#145530', color: 'white', padding: '6px 10px', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>
              {game.awayTeam.name} — Box Score
            </div>
            <table>
              <thead>
                <tr>{statCols.map(c => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {awayStats.map(s => {
                  const cells = playerRow(s)
                  return (
                    <tr key={s.id}>
                      {cells.map((c, i) => <td key={i} style={i === 0 ? { fontWeight: 'bold' } : { textAlign: 'center' }}>{c}</td>)}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Rosters (if no stat lines) */}
        {homeStats.length === 0 && awayStats.length === 0 && game.rosters.length > 0 && (
          <div className="page-break">
            <div style={{ background: '#145530', color: 'white', padding: '6px 10px', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>
              Elencos
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {game.rosters.map(roster => (
                <div key={roster.id}>
                  <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#145530' }}>{roster.team.name}</div>
                  <table>
                    <thead>
                      <tr><th>#</th><th>Atleta</th><th>Posição</th></tr>
                    </thead>
                    <tbody>
                      {roster.players.map(p => (
                        <tr key={p.id}>
                          <td style={{ textAlign: 'center', width: 32 }}>{p.jerseyNumber ?? '–'}</td>
                          <td>{p.athlete.name}</td>
                          <td>{p.athlete.position ?? '–'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Play-by-play */}
        {game.events.length > 0 && (
          <div className="page-break">
            <div style={{ background: '#145530', color: 'white', padding: '6px 10px', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>
              Lance a Lance
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 32 }}>Q</th>
                  <th style={{ width: 60 }}>Tempo</th>
                  <th>Evento</th>
                  <th>Atleta</th>
                  <th>Time</th>
                  <th>Placar</th>
                </tr>
              </thead>
              <tbody>
                {game.events.map(e => (
                  <tr key={e.id}>
                    <td style={{ textAlign: 'center' }}>{e.period ?? '–'}</td>
                    <td style={{ textAlign: 'center' }}>{e.clockTime ?? '–'}</td>
                    <td>{EVENT_LABELS[e.eventType] ?? e.eventType}{(() => { const d = parseDescription(e.payloadJson); return d ? ` — ${d}` : '' })()}</td>
                    <td>{e.athlete?.name ?? '–'}</td>
                    <td>{e.team?.name ?? '–'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {e.homeScoreAfter != null ? `${e.homeScoreAfter}–${e.awayScoreAfter}` : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '2px solid #145530', paddingTop: 12, marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#666' }}>
          <span>Súmula gerada em {new Date().toLocaleString('pt-BR')} · FGB – Federação Gaúcha de Basketball</span>
          <span style={{ color: '#145530', fontWeight: 'bold' }}>{sumulaUrl}</span>
        </div>
      </div>
    </div>
  )
}
