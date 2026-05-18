import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const LOGO_URL =
  '/images/fgb-logo.png'

function n(v: number | null | undefined) {
  return (v ?? 0).toString()
}

export default async function SumulaPage({
  params,
}: {
  params: Promise<{ gameId: string }>
}) {
  const { gameId } = await params

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      homeTeam: true,
      awayTeam: true,
      championship: { select: { name: true, year: true } },
      category: { select: { name: true } },
      periodScores: { orderBy: { period: 'asc' } },
      officials: { orderBy: { createdAt: 'asc' } },
      rosters: {
        include: {
          team: { select: { id: true, name: true } },
          players: {
            include: { athlete: true },
            orderBy: { jerseyNumber: 'asc' },
          },
        },
      },
      playerStatLines: {
        include: { athlete: true, team: true },
        orderBy: [{ teamId: 'asc' }, { points: 'desc' }],
      },
      events: {
        where: {
          isReverted: false,
          isCancelled: false,
          eventType: { in: ['SHOT_MADE_2', 'SHOT_MADE_3', 'FREE_THROW_MADE', 'SCORE_2', 'SCORE_3', 'FREE_THROW'] },
        },
        orderBy: [{ period: 'asc' }, { sequenceNumber: 'asc' }],
        include: { athlete: { select: { name: true, jerseyNumber: true } }, team: { select: { id: true, name: true } } },
        take: 400,
      },
    },
  })

  if (!game) notFound()

  // BLOCO 8 Fase Upload — última versão da súmula com PDF (se houver)
  const latestVersion = await prisma.gameOfficialReportVersion.findFirst({
    where: {
      report: { gameId },
      officialPdfUrl: { not: null },
    },
    orderBy: { version: 'desc' },
    select: { officialPdfUrl: true, sourceType: true, version: true },
  })

  const sumulaUrl = `https://fgb.app/sumula/${gameId}`
  const gameDate = new Date(game.dateTime)

  const homeStats = game.playerStatLines.filter(s => s.teamId === game.homeTeamId)
  const awayStats = game.playerStatLines.filter(s => s.teamId === game.awayTeamId)
  const homeRoster = game.rosters.find(r => r.teamId === game.homeTeamId)
  const awayRoster = game.rosters.find(r => r.teamId === game.awayTeamId)

  const periodLabels: Record<number, string> = { 1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4', 5: 'OT1', 6: 'OT2' }

  const periods = game.periodScores.filter(p => p.homePoints > 0 || p.awayPoints > 0)

  const officialByType = (type: string) =>
    game.officials.find(o => o.officialType === type)?.name ?? ''

  function teamTotal(stats: typeof homeStats) {
    return {
      min: stats.reduce((s, r) => s + r.minutesPlayed, 0),
      pts: stats.reduce((s, r) => s + r.points, 0),
      fg2m: stats.reduce((s, r) => s + r.twoPtMade, 0),
      fg2a: stats.reduce((s, r) => s + r.twoPtAttempted, 0),
      fg3m: stats.reduce((s, r) => s + r.threePtMade, 0),
      fg3a: stats.reduce((s, r) => s + r.threePtAttempted, 0),
      ftm: stats.reduce((s, r) => s + r.freeThrowsMade, 0),
      fta: stats.reduce((s, r) => s + r.freeThrowsAttempted, 0),
      rbo: stats.reduce((s, r) => s + r.reboundsOffensive, 0),
      rbd: stats.reduce((s, r) => s + r.reboundsDefensive, 0),
      reb: stats.reduce((s, r) => s + r.reboundsTotal, 0),
      ast: stats.reduce((s, r) => s + r.assists, 0),
      stl: stats.reduce((s, r) => s + r.steals, 0),
      blk: stats.reduce((s, r) => s + r.blocks, 0),
      to: stats.reduce((s, r) => s + r.turnovers, 0),
      pf: stats.reduce((s, r) => s + r.fouls, 0),
    }
  }

  function totalsCells(t: ReturnType<typeof teamTotal>) {
    return [
      '—', 'TOTAIS', '—', t.min, t.pts,
      `${t.fg2m}/${t.fg2a}`, `${t.fg3m}/${t.fg3a}`, `${t.ftm}/${t.fta}`,
      t.rbo, t.rbd, t.reb, t.ast, t.stl, t.blk, t.to, t.pf,
    ]
  }

  const homeTot = teamTotal(homeStats)
  const awayTot = teamTotal(awayStats)

  const statCols = ['#', 'Atleta', 'Pos', 'MIN', 'PTS', '2PT', '3PT', 'LL', 'RBO', 'RBD', 'REB', 'AST', 'STL', 'BLK', 'TO', 'PF']

  function playerRow(s: (typeof homeStats)[0]) {
    return [
      s.athlete.jerseyNumber?.toString() ?? '–',
      s.athlete.name + (s.isStarter ? '  ★' : ''),
      s.athlete.position ?? '–',
      n(s.minutesPlayed),
      n(s.points),
      `${n(s.twoPtMade)}/${n(s.twoPtAttempted)}`,
      `${n(s.threePtMade)}/${n(s.threePtAttempted)}`,
      `${n(s.freeThrowsMade)}/${n(s.freeThrowsAttempted)}`,
      n(s.reboundsOffensive),
      n(s.reboundsDefensive),
      n(s.reboundsTotal),
      n(s.assists),
      n(s.steals),
      n(s.blocks),
      n(s.turnovers),
      n(s.fouls),
    ]
  }

  const thStyle = {
    background: '#145530',
    color: 'white',
    fontWeight: 700,
    fontSize: 9,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    padding: '5px 6px',
    border: '1px solid #0f3d22',
    textAlign: 'center' as const,
  }
  const tdStyle = (bold = false, center = true) => ({
    border: '1px solid #ddd',
    padding: '4px 6px',
    fontSize: 10,
    fontWeight: bold ? 700 : 400,
    textAlign: center ? 'center' as const : 'left' as const,
  })
  const totRowStyle = {
    background: '#f0f7f3',
    fontWeight: 700,
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
      `}</style>

      {/* Toolbar — hidden in print */}
      <div className="no-print bg-[#145530] text-white px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-bold">Súmula Oficial FGB</span>
        <div className="flex gap-3">
          {latestVersion?.officialPdfUrl && (
            <a
              href={latestVersion.officialPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 bg-[#F5C200] text-[#145530] rounded text-xs font-bold hover:bg-yellow-300"
            >
              {latestVersion.sourceType === 'UPLOADED'
                ? `Baixar Súmula PDF (v${latestVersion.version} • enviada)`
                : `Baixar Súmula PDF (v${latestVersion.version})`}
            </a>
          )}
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-white text-[#145530] rounded text-xs font-bold hover:bg-fgb-ink-100"
          >
            Imprimir / Salvar PDF
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ url: window.location.href, title: document.title })
              } else {
                navigator.clipboard.writeText(window.location.href)
                alert('Link copiado!')
              }
            }}
            className="px-4 py-1.5 border border-white rounded text-xs font-bold hover:bg-white/10"
          >
            Compartilhar
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* ── CABEÇALHO ── */}
        <div style={{ borderBottom: '3px solid #145530', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_URL} alt="FGB" style={{ width: 56, height: 56, objectFit: 'contain' }} />
              <div>
                <div style={{ fontWeight: 900, fontSize: 16, textTransform: 'uppercase', color: '#145530' }}>
                  Federação Gaúcha de Basketball
                </div>
                <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                  SÚMULA OFICIAL DE JOGO
                </div>
                <div style={{ fontSize: 10, color: '#777', marginTop: 2 }}>
                  {game.championship?.name}
                  {game.championship?.year ? ` ${game.championship.year}` : ''}
                  {game.category?.name ? ` · ${game.category.name}` : ''}
                  {' · '}
                  {gameDate.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {game.venue ? ` · ${game.venue}` : ''}
                  {game.attendance ? ` · ${game.attendance.toLocaleString('pt-BR')} espectadores` : ''}
                </div>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="QR"
              style={{ width: 60, height: 60 }}
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(sumulaUrl)}`}
            />
          </div>
        </div>

        {/* ── PLACAR GERAL ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 16,
            alignItems: 'center',
            background: '#f9fafb',
            border: '1px solid #e0e0e0',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888', marginBottom: 4 }}>Casa</div>
            <div style={{ fontWeight: 900, fontSize: 18, textTransform: 'uppercase', color: '#145530' }}>
              {game.homeTeam.name}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 44, letterSpacing: 4, color: '#111' }}>
              {game.homeScore ?? 0}&nbsp;–&nbsp;{game.awayScore ?? 0}
            </div>
            <div style={{ fontSize: 9, color: '#888', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              {game.status === 'FINISHED' ? 'Final' : game.liveStatus ?? game.status}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888', marginBottom: 4 }}>Visitante</div>
            <div style={{ fontWeight: 900, fontSize: 18, textTransform: 'uppercase', color: '#145530' }}>
              {game.awayTeam.name}
            </div>
          </div>
        </div>

        {/* ── PLACAR POR PERÍODO ── */}
        {periods.length > 0 && (
          <div>
            <div style={{ background: '#145530', color: 'white', padding: '5px 10px', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              Placar por Período
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left', minWidth: 120 }}>Time</th>
                  {periods.map(p => (
                    <th key={p.period} style={{ ...thStyle, minWidth: 36 }}>{periodLabels[p.period] ?? `P${p.period}`}</th>
                  ))}
                  <th style={{ ...thStyle, background: '#0f3d22' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...tdStyle(true, false) }}>{game.homeTeam.name}</td>
                  {periods.map(p => <td key={p.period} style={tdStyle()}>{p.homePoints}</td>)}
                  <td style={{ ...tdStyle(true), background: '#e8f4ed' }}>{game.homeScore ?? 0}</td>
                </tr>
                <tr>
                  <td style={{ ...tdStyle(true, false) }}>{game.awayTeam.name}</td>
                  {periods.map(p => <td key={p.period} style={tdStyle()}>{p.awayPoints}</td>)}
                  <td style={{ ...tdStyle(true), background: '#e8f4ed' }}>{game.awayScore ?? 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── BOX SCORE — MANDANTE ── */}
        {homeStats.length > 0 && (
          <div>
            <div style={{ background: '#145530', color: 'white', padding: '5px 10px', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              {game.homeTeam.name} — Box Score
              {homeRoster?.coachName ? <span style={{ fontWeight: 400, marginLeft: 12, fontSize: 9 }}>Técnico: {homeRoster.coachName}{homeRoster.assistantCoachName ? ` · Ass.: ${homeRoster.assistantCoachName}` : ''}</span> : null}
            </div>
            <table>
              <thead>
                <tr>{statCols.map(c => <th key={c} style={{ ...thStyle, textAlign: c === 'Atleta' ? 'left' : 'center' }}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {homeStats.map((s, i) => {
                  const cells = playerRow(s)
                  return (
                    <tr key={s.id} style={i % 2 === 1 ? { background: '#f9f9f9' } : {}}>
                      {cells.map((c, j) => (
                        <td key={j} style={tdStyle(j === 1, j !== 1)}>{c}</td>
                      ))}
                    </tr>
                  )
                })}
                <tr style={totRowStyle}>
                  {totalsCells(homeTot).map((c, j) => (
                    <td key={j} style={tdStyle(true, j !== 1)}>{c}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── BOX SCORE — VISITANTE ── */}
        {awayStats.length > 0 && (
          <div>
            <div style={{ background: '#145530', color: 'white', padding: '5px 10px', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              {game.awayTeam.name} — Box Score
              {awayRoster?.coachName ? <span style={{ fontWeight: 400, marginLeft: 12, fontSize: 9 }}>Técnico: {awayRoster.coachName}{awayRoster.assistantCoachName ? ` · Ass.: ${awayRoster.assistantCoachName}` : ''}</span> : null}
            </div>
            <table>
              <thead>
                <tr>{statCols.map(c => <th key={c} style={{ ...thStyle, textAlign: c === 'Atleta' ? 'left' : 'center' }}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {awayStats.map((s, i) => {
                  const cells = playerRow(s)
                  return (
                    <tr key={s.id} style={i % 2 === 1 ? { background: '#f9f9f9' } : {}}>
                      {cells.map((c, j) => (
                        <td key={j} style={tdStyle(j === 1, j !== 1)}>{c}</td>
                      ))}
                    </tr>
                  )
                })}
                <tr style={totRowStyle}>
                  {totalsCells(awayTot).map((c, j) => (
                    <td key={j} style={tdStyle(true, j !== 1)}>{c}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── PONTOS MARCADOS (LANCE A LANCE) ── */}
        {game.events.length > 0 && (
          <div>
            <div style={{ background: '#145530', color: 'white', padding: '5px 10px', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              Pontos Marcados — Lance a Lance ({game.events.length})
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 36 }}>Q</th>
                  <th style={{ ...thStyle, width: 60 }}>Tempo</th>
                  <th style={{ ...thStyle, width: 56 }}>Tipo</th>
                  <th style={{ ...thStyle, width: 36 }}>Pts</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Atleta</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Equipe</th>
                  <th style={{ ...thStyle, width: 80 }}>Placar</th>
                </tr>
              </thead>
              <tbody>
                {game.events.map((e, i) => {
                  const typeLabel =
                    e.eventType === 'SHOT_MADE_2' || e.eventType === 'SCORE_2' ? '2 PTS' :
                    e.eventType === 'SHOT_MADE_3' || e.eventType === 'SCORE_3' ? '3 PTS' :
                    e.eventType === 'FREE_THROW_MADE' || e.eventType === 'FREE_THROW' ? 'Lance Livre' :
                    e.eventType
                  const points =
                    e.pointsDelta ??
                    (e.eventType === 'SHOT_MADE_2' || e.eventType === 'SCORE_2' ? 2 :
                     e.eventType === 'SHOT_MADE_3' || e.eventType === 'SCORE_3' ? 3 :
                     e.eventType === 'FREE_THROW_MADE' || e.eventType === 'FREE_THROW' ? 1 : 0)
                  const isHomeTeam = e.team?.id === game.homeTeamId
                  return (
                    <tr key={e.id} style={i % 2 === 1 ? { background: '#f9f9f9' } : {}}>
                      <td style={tdStyle()}>{e.period ?? '–'}</td>
                      <td style={tdStyle()}>{e.clockTime ?? '–'}</td>
                      <td style={{ ...tdStyle(true), color: isHomeTeam ? '#145530' : '#b21a1a' }}>{typeLabel}</td>
                      <td style={tdStyle(true)}>+{points}</td>
                      <td style={tdStyle(false, false)}>
                        {e.athlete?.jerseyNumber != null && (
                          <span style={{ display: 'inline-block', minWidth: 20, fontWeight: 700, color: '#145530' }}>#{e.athlete.jerseyNumber}</span>
                        )}{' '}
                        {e.athlete?.name ?? '—'}
                      </td>
                      <td style={tdStyle(false, false)}>{e.team?.name ?? '—'}</td>
                      <td style={{ ...tdStyle(true), whiteSpace: 'nowrap' }}>
                        {e.homeScoreAfter != null && e.awayScoreAfter != null
                          ? `${e.homeScoreAfter}–${e.awayScoreAfter}`
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ fontSize: 9, color: '#888', marginTop: 4, fontStyle: 'italic' }}>
              Eventos registrados durante o jogo via mesa eletrônica. Ordenado por período e sequência.
            </div>
          </div>
        )}

        {/* ── ELENCOS (se não há estatísticas) ── */}
        {homeStats.length === 0 && awayStats.length === 0 && game.rosters.length > 0 && (
          <div>
            <div style={{ background: '#145530', color: 'white', padding: '5px 10px', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              Elencos
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {game.rosters.map(roster => (
                <div key={roster.id}>
                  <div style={{ fontWeight: 700, fontSize: 11, color: '#145530', marginBottom: 4 }}>{roster.team.name}</div>
                  {(roster.coachName || roster.assistantCoachName) && (
                    <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>
                      {roster.coachName ? `Técnico: ${roster.coachName}` : ''}
                      {roster.assistantCoachName ? ` · Ass.: ${roster.assistantCoachName}` : ''}
                    </div>
                  )}
                  <table>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: 32 }}>#</th>
                        <th style={{ ...thStyle, textAlign: 'left' }}>Atleta</th>
                        <th style={{ ...thStyle, width: 40 }}>Pos.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.players.map(p => (
                        <tr key={p.id}>
                          <td style={tdStyle()}>{p.jerseyNumber ?? '–'}</td>
                          <td style={tdStyle(false, false)}>{p.athlete.name}</td>
                          <td style={tdStyle()}>{p.athlete.position ?? '–'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ÁRBITROS E OFICIAIS DE MESA ── */}
        {game.officials.length > 0 && (
          <div>
            <div style={{ background: '#145530', color: 'white', padding: '5px 10px', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              Árbitros e Oficiais de Mesa
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left', width: '30%' }}>Função</th>
                  <th style={{ ...thStyle, textAlign: 'left', width: '35%' }}>Nome</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: '35%' }}>Assinatura</th>
                </tr>
              </thead>
              <tbody>
                {game.officials.map((o, i) => (
                  <tr key={o.officialType} style={i % 2 === 1 ? { background: '#f9f9f9' } : {}}>
                    <td style={tdStyle(true, false)}>{o.role}</td>
                    <td style={tdStyle(false, false)}>{o.name}</td>
                    <td style={{ ...tdStyle(), height: 28 }}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── ASSINATURAS DAS EQUIPES ── */}
        <div>
          <div style={{ background: '#145530', color: 'white', padding: '5px 10px', fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Assinatura das Comissões Técnicas
          </div>
          <table>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left', width: '25%' }}>Equipe</th>
                <th style={{ ...thStyle, textAlign: 'left', width: '25%' }}>Técnico</th>
                <th style={{ ...thStyle, textAlign: 'center', width: '25%' }}>Assinatura</th>
                <th style={{ ...thStyle, textAlign: 'left', width: '25%' }}>Assistente</th>
              </tr>
            </thead>
            <tbody>
              {[
                { team: game.homeTeam, roster: homeRoster, label: 'Mandante' },
                { team: game.awayTeam, roster: awayRoster, label: 'Visitante' },
              ].map(({ team, roster, label }) => (
                <tr key={team.id}>
                  <td style={{ ...tdStyle(true, false) }}>
                    {team.name}
                    <div style={{ fontSize: 8, color: '#888', fontWeight: 400 }}>{label}</div>
                  </td>
                  <td style={tdStyle(false, false)}>{roster?.coachName ?? '—'}</td>
                  <td style={{ ...tdStyle(), height: 32 }}></td>
                  <td style={tdStyle(false, false)}>{roster?.assistantCoachName ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── RODAPÉ ── */}
        <div style={{ borderTop: '2px solid #145530', paddingTop: 10, marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: '#888' }}>
          <span>
            Súmula gerada em {new Date().toLocaleString('pt-BR')} · FGB – Federação Gaúcha de Basketball
          </span>
          <span style={{ color: '#145530', fontWeight: 700 }}>{sumulaUrl}</span>
        </div>
      </div>
    </div>
  )
}
