'use client'

import { useState } from 'react'

type Player = {
  id: string
  athleteId: string
  athleteName: string
  jerseyNumber: number | null
  teamId: string
  teamName: string
  points: number
  fouls: number
  assists: number
  reboundsOffensive: number
  reboundsDefensive: number
  reboundsTotal: number
  steals: number
  blocks: number
  turnovers: number
  twoPtMade: number
  twoPtAttempted: number
  threePtMade: number
  threePtAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  isStarter: boolean
  fouledOut: boolean
  disqualified: boolean
}

type TeamStats = {
  id: string
  teamId: string
  teamName: string
  points: number
  fouls: number
  timeoutsUsed: number
  reboundsTotal: number
  assists: number
  steals: number
  turnovers: number
  blocks: number
  twoPtMade: number
  twoPtAttempted: number
  threePtMade: number
  threePtAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
}

type PeriodScore = {
  id: string
  period: number
  homePoints: number
  awayPoints: number
}

type GameEvent = {
  id: string
  sequenceNumber: number
  period: number
  clockTime: string
  eventType: string
  teamName: string | null
  athleteName: string | null
  description: string
  pointsDelta: number | null
  isReverted: boolean
}

type Official = {
  id: string
  name: string
  officialType: string
  role: string
}

type RefereeAssignment = {
  id: string
  role: string
  referee: { name: string }
}

type SumulaData = {
  game: {
    id: string
    homeScore: number
    awayScore: number
    liveStatus: string
    status: string
    dateTime: string | null
    location: string | null
    championship: { name: string; year: number }
    category: { name: string }
    homeTeam: { id: string; name: string }
    awayTeam: { id: string; name: string }
  }
  boxScore: {
    players: Player[]
    teams: TeamStats[]
    periods: PeriodScore[]
  }
  events: GameEvent[]
  officials: Official[]
  referees: RefereeAssignment[]
  rosters: Array<{
    teamId: string
    teamName: string
    coachName: string | null
    players: Array<{
      jerseyNumber: number | null
      athleteName: string
      isStarter: boolean
      isCaptain: boolean
    }>
  }>
}

function pct(made: number, attempted: number) {
  if (!attempted) return '—'
  return `${Math.round((made / attempted) * 100)}%`
}

function periodLabel(p: number) {
  if (p <= 4) return `${p}º`
  return `OT${p - 4}`
}

function TeamTable({ players, teamName, teamId, homeTeamId }: {
  players: Player[]
  teamName: string
  teamId: string
  homeTeamId: string
}) {
  const tone = teamId === homeTeamId ? 'text-[#8fbfff]' : 'text-[#ffb4c1]'
  const teamPlayers = players.filter(p => p.teamId === teamId)
  const totals = teamPlayers.reduce((acc, p) => ({
    pts: acc.pts + p.points,
    reb: acc.reb + p.reboundsTotal,
    ast: acc.ast + p.assists,
    stl: acc.stl + p.steals,
    blk: acc.blk + p.blocks,
    tov: acc.tov + p.turnovers,
    pf: acc.pf + p.fouls,
    fgm: acc.fgm + p.twoPtMade + p.threePtMade,
    fga: acc.fga + p.twoPtAttempted + p.threePtAttempted,
    tpm: acc.tpm + p.threePtMade,
    tpa: acc.tpa + p.threePtAttempted,
    ftm: acc.ftm + p.freeThrowsMade,
    fta: acc.fta + p.freeThrowsAttempted,
  }), { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 })

  const headers = ['#', 'Atleta', 'S', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'FG%', '3P%', 'LL%']

  return (
    <div className="mb-6">
      <div className={`mb-2 text-[13px] font-extrabold uppercase tracking-[0.08em] ${tone}`}>
        {teamName.toUpperCase()}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px] text-white/80">
          <thead>
            <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.08em] text-white/40">
              {headers.map(h => (
                <th key={h} className={`px-1.5 py-2 font-semibold ${h === 'Atleta' ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teamPlayers
              .sort((a, b) => (b.isStarter ? 1 : 0) - (a.isStarter ? 1 : 0) || (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99))
              .map(p => (
                <tr key={p.id} className={`border-b border-white/4 ${p.disqualified || p.fouledOut ? 'opacity-40' : ''}`}>
                  <td className={`px-1.5 py-1.5 font-black ${tone}`}>{p.jerseyNumber ?? '--'}</td>
                  <td className="px-1.5 py-1.5">
                    {p.athleteName}
                    {p.isStarter && <span className="ml-1 text-[9px] text-white/30">T</span>}
                    {p.fouledOut && <span className="ml-1 text-[#ff6464]">●</span>}
                    {p.disqualified && <span className="ml-1 text-[#ff6464] font-black">DQ</span>}
                  </td>
                  <td className="px-1.5 py-1.5 text-center text-[10px] text-white/30">{p.isStarter ? 'T' : 'R'}</td>
                  <td className={`px-1.5 py-1.5 text-right font-black ${p.points >= 20 ? 'text-[#f5c849]' : p.points >= 10 ? 'text-white' : 'text-white/60'}`}>{p.points}</td>
                  <td className="px-1.5 py-1.5 text-right">{p.reboundsTotal}</td>
                  <td className="px-1.5 py-1.5 text-right">{p.assists}</td>
                  <td className="px-1.5 py-1.5 text-right">{p.steals}</td>
                  <td className="px-1.5 py-1.5 text-right">{p.blocks}</td>
                  <td className={`px-1.5 py-1.5 text-right ${p.turnovers >= 4 ? 'text-[#ff9640]' : ''}`}>{p.turnovers}</td>
                  <td className={`px-1.5 py-1.5 text-right ${p.fouls >= 5 ? 'text-[#ff5e5e] font-black' : p.fouls >= 4 ? 'text-[#f5c849]' : ''}`}>{p.fouls}</td>
                  <td className="px-1.5 py-1.5 text-right text-[10px]">{pct(p.twoPtMade + p.threePtMade, p.twoPtAttempted + p.threePtAttempted)}</td>
                  <td className="px-1.5 py-1.5 text-right text-[10px]">{pct(p.threePtMade, p.threePtAttempted)}</td>
                  <td className="px-1.5 py-1.5 text-right text-[10px]">{pct(p.freeThrowsMade, p.freeThrowsAttempted)}</td>
                </tr>
              ))}
            <tr className={`border-t border-white/15 text-[11px] font-black ${tone}`}>
              <td colSpan={3} className="px-1.5 py-2">TOTAL</td>
              <td className="px-1.5 py-2 text-right">{totals.pts}</td>
              <td className="px-1.5 py-2 text-right">{totals.reb}</td>
              <td className="px-1.5 py-2 text-right">{totals.ast}</td>
              <td className="px-1.5 py-2 text-right">{totals.stl}</td>
              <td className="px-1.5 py-2 text-right">{totals.blk}</td>
              <td className="px-1.5 py-2 text-right">{totals.tov}</td>
              <td className="px-1.5 py-2 text-right">{totals.pf}</td>
              <td className="px-1.5 py-2 text-right">{pct(totals.fgm, totals.fga)}</td>
              <td className="px-1.5 py-2 text-right">{pct(totals.tpm, totals.tpa)}</td>
              <td className="px-1.5 py-2 text-right">{pct(totals.ftm, totals.fta)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EventRow({ event }: { event: GameEvent }) {
  if (event.isReverted) return null
  const isScore = ['SHOT_MADE_2', 'SHOT_MADE_3', 'FREE_THROW_MADE'].includes(event.eventType)
  const isFoul = event.eventType.includes('FOUL')
  const isControl = ['GAME_START', 'PERIOD_START', 'PERIOD_END', 'HALFTIME_START', 'HALFTIME_END', 'GAME_END'].includes(event.eventType)

  return (
    <tr className={`border-b border-white/4 text-[11px] ${isControl ? 'bg-white/[0.03] text-white/40 italic' : ''}`}>
      <td className="px-2 py-1.5 text-white/30">{event.period}º</td>
      <td className="px-2 py-1.5 text-white/30 tabular-nums">{event.clockTime}</td>
      <td className={`px-2 py-1.5 font-medium ${isScore ? 'text-[#f5c849]' : isFoul ? 'text-[#ff9640]' : 'text-white/70'}`}>
        {event.description}
      </td>
      <td className="px-2 py-1.5 text-right text-white/30 text-[10px]">{event.teamName ?? '—'}</td>
    </tr>
  )
}

export function SumulaEletronicoView({ data }: { data: SumulaData }) {
  const [activeTab, setActiveTab] = useState<'boxscore' | 'pbp' | 'roster' | 'assinaturas'>('boxscore')
  const { game, boxScore, events, officials, referees, rosters } = data

  const homeTeamStats = boxScore.teams.find(t => t.teamId === game.homeTeam.id)
  const awayTeamStats = boxScore.teams.find(t => t.teamId === game.awayTeam.id)

  const sortedEvents = [...events].sort((a, b) => b.sequenceNumber - a.sequenceNumber)

  const exportPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFontSize(14)
    doc.text(`SÚMULA OFICIAL — FGB`, 14, 16)
    doc.setFontSize(10)
    doc.text(`${game.championship.name} ${game.championship.year} · ${game.category.name}`, 14, 23)
    doc.text(
      `${game.homeTeam.name}  ${game.homeScore}  ×  ${game.awayScore}  ${game.awayTeam.name}`,
      14, 30
    )
    doc.text(
      `Data: ${game.dateTime ? new Date(game.dateTime).toLocaleDateString('pt-BR') : '—'}  |  Local: ${game.location ?? '—'}`,
      14, 37
    )

    // Parciais
    const periodCols = boxScore.periods.map(p => periodLabel(p.period))
    const homeRow = ['Mandante', game.homeTeam.name, ...boxScore.periods.map(p => p.homePoints), game.homeScore]
    const awayRow = ['Visitante', game.awayTeam.name, ...boxScore.periods.map(p => p.awayPoints), game.awayScore]
    autoTable(doc, {
      startY: 44,
      head: [['Equipe', 'Nome', ...periodCols, 'Total']],
      body: [homeRow, awayRow],
      theme: 'grid',
      headStyles: { fillColor: [15, 30, 60] },
    })

    // Box score jogadores
    const playerHead = ['#', 'Atleta', 'Equipe', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'FG%', '3P%', 'LL%']
    const playerRows = boxScore.players.map(p => [
      p.jerseyNumber ?? '--',
      p.athleteName,
      p.teamName,
      p.points,
      p.reboundsTotal,
      p.assists,
      p.steals,
      p.blocks,
      p.turnovers,
      p.fouls,
      pct(p.twoPtMade + p.threePtMade, p.twoPtAttempted + p.threePtAttempted),
      pct(p.threePtMade, p.threePtAttempted),
      pct(p.freeThrowsMade, p.freeThrowsAttempted),
    ])
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 6,
      head: [playerHead],
      body: playerRows,
      theme: 'striped',
      headStyles: { fillColor: [15, 30, 60] },
    })

    doc.save(`sumula-${game.homeTeam.name}-x-${game.awayTeam.name}.pdf`)
  }

  const tabs = [
    { id: 'boxscore', label: '📊 Box Score' },
    { id: 'pbp', label: '📋 Play-by-Play' },
    { id: 'roster', label: '👥 Escalações' },
    { id: 'assinaturas', label: '✍️ Assinaturas' },
  ] as const

  return (
    <div className="space-y-5">
      {/* Header oficial */}
      <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(135deg,#0b111d,#11192d)] p-6 shadow-[0_24px_60px_rgba(4,10,22,0.45)]">
        <div className="text-center">
          <div className="text-[11px] font-black uppercase tracking-[0.34em] text-[#f5c849]">
            FGB · Súmula Eletrônica Oficial
          </div>
          <div className="mt-1 text-[11px] text-white/40">
            {game.championship.name} {game.championship.year} · {game.category.name}
          </div>
          {game.dateTime && (
            <div className="mt-1 text-[11px] text-white/30">
              {new Date(game.dateTime).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              {game.location ? ` · ${game.location}` : ''}
            </div>
          )}
        </div>

        {/* Placar principal */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <div className="text-[13px] font-black uppercase tracking-[0.1em] text-[#8fbfff]">Mandante</div>
            <div className="mt-1 text-[22px] font-black text-white">{game.homeTeam.name}</div>
            {homeTeamStats && (
              <div className="mt-1 text-[11px] text-white/40">
                FG {pct(homeTeamStats.twoPtMade + homeTeamStats.threePtMade, homeTeamStats.twoPtAttempted + homeTeamStats.threePtAttempted)}
                · 3P {pct(homeTeamStats.threePtMade, homeTeamStats.threePtAttempted)}
                · LL {pct(homeTeamStats.freeThrowsMade, homeTeamStats.freeThrowsAttempted)}
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="flex items-center gap-3">
              <span className="text-[72px] font-black leading-none text-white">{game.homeScore}</span>
              <span className="text-[36px] font-black text-white/30">×</span>
              <span className="text-[72px] font-black leading-none text-white">{game.awayScore}</span>
            </div>
            {/* Parciais */}
            {boxScore.periods.length > 0 && (
              <div className="mt-2 flex justify-center gap-3">
                {boxScore.periods.map(p => (
                  <div key={p.period} className="text-center">
                    <div className="text-[9px] font-black uppercase text-white/30">{periodLabel(p.period)}</div>
                    <div className="text-[13px] font-black text-white/60">{p.homePoints}–{p.awayPoints}</div>
                  </div>
                ))}
              </div>
            )}
            <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
              game.liveStatus === 'FINAL_OFFICIAL' ? 'bg-emerald-500/20 text-emerald-400'
              : game.liveStatus === 'LIVE' ? 'bg-red-500/20 text-red-400'
              : 'bg-white/10 text-white/40'
            }`}>
              {game.liveStatus === 'FINAL_OFFICIAL' ? 'Oficial' : game.liveStatus === 'LIVE' ? '● AO VIVO' : game.liveStatus}
            </div>
          </div>

          <div className="flex-1 text-center">
            <div className="text-[13px] font-black uppercase tracking-[0.1em] text-[#ffb4c1]">Visitante</div>
            <div className="mt-1 text-[22px] font-black text-white">{game.awayTeam.name}</div>
            {awayTeamStats && (
              <div className="mt-1 text-[11px] text-white/40">
                FG {pct(awayTeamStats.twoPtMade + awayTeamStats.threePtMade, awayTeamStats.twoPtAttempted + awayTeamStats.threePtAttempted)}
                · 3P {pct(awayTeamStats.threePtMade, awayTeamStats.threePtAttempted)}
                · LL {pct(awayTeamStats.freeThrowsMade, awayTeamStats.freeThrowsAttempted)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={exportPdf}
            className="rounded-xl bg-[#f5c849] px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-black"
          >
            Baixar PDF Oficial
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-hidden rounded-[14px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
        <div className="flex gap-1 px-2 pt-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-t-[8px] border-b-2 px-2 py-2 text-[11px] font-bold uppercase tracking-[0.04em] transition ${
                activeTab === tab.id
                  ? 'border-b-[#f5c849] bg-white/10 text-[#f5c849]'
                  : 'border-b-transparent bg-white/[0.03] text-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Box Score */}
          {activeTab === 'boxscore' && (
            <div>
              {boxScore.players.length === 0 ? (
                <p className="text-center text-sm text-white/30 py-8">Nenhum dado de atleta registrado ainda.</p>
              ) : (
                <>
                  <TeamTable
                    players={boxScore.players}
                    teamName={game.homeTeam.name}
                    teamId={game.homeTeam.id}
                    homeTeamId={game.homeTeam.id}
                  />
                  <TeamTable
                    players={boxScore.players}
                    teamName={game.awayTeam.name}
                    teamId={game.awayTeam.id}
                    homeTeamId={game.homeTeam.id}
                  />
                </>
              )}
            </div>
          )}

          {/* Play-by-Play */}
          {activeTab === 'pbp' && (
            <div>
              {sortedEvents.length === 0 ? (
                <p className="text-center text-sm text-white/30 py-8">Nenhum evento registrado ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.08em] text-white/30">
                        <th className="px-2 py-2 text-left">Per.</th>
                        <th className="px-2 py-2 text-left">Tempo</th>
                        <th className="px-2 py-2 text-left">Evento</th>
                        <th className="px-2 py-2 text-right">Equipe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEvents.map(e => <EventRow key={e.id} event={e} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Escalações */}
          {activeTab === 'roster' && (
            <div className="grid gap-6 md:grid-cols-2">
              {rosters.map(roster => (
                <div key={roster.teamId}>
                  <div className={`mb-3 text-[13px] font-extrabold uppercase tracking-[0.08em] ${
                    roster.teamId === game.homeTeam.id ? 'text-[#8fbfff]' : 'text-[#ffb4c1]'
                  }`}>
                    {roster.teamName}
                  </div>
                  {roster.coachName && (
                    <div className="mb-2 text-[11px] text-white/40">Técnico: {roster.coachName}</div>
                  )}
                  <div className="space-y-1">
                    {roster.players.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-white/6 bg-white/[0.03] px-3 py-2">
                        <span className={`w-7 text-center text-[11px] font-black ${
                          roster.teamId === game.homeTeam.id ? 'text-[#8fbfff]' : 'text-[#ffb4c1]'
                        }`}>
                          {p.jerseyNumber ?? '--'}
                        </span>
                        <span className="flex-1 text-[12px] text-white/80">{p.athleteName}</span>
                        <div className="flex gap-1">
                          {p.isStarter && (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase text-white/40">Titular</span>
                          )}
                          {p.isCaptain && (
                            <span className="rounded-full bg-[#f5c849]/20 px-2 py-0.5 text-[9px] font-black uppercase text-[#f5c849]">Cap.</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Assinaturas */}
          {activeTab === 'assinaturas' && (
            <div>
              {/* Árbitros */}
              <div className="mb-6">
                <div className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Árbitros</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {referees.length > 0 ? referees.map(r => (
                    <div key={r.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-[11px] text-white/40 uppercase tracking-widest">{r.role}</div>
                      <div className="mt-1 text-[14px] font-bold text-white">{r.referee.name}</div>
                      <div className="mt-4 border-t border-white/10 pt-3 text-[10px] text-white/20">Assinatura</div>
                    </div>
                  )) : officials.filter(o => o.officialType === 'REFEREE').map(o => (
                    <div key={o.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-[11px] text-white/40 uppercase tracking-widest">{o.role}</div>
                      <div className="mt-1 text-[14px] font-bold text-white">{o.name}</div>
                      <div className="mt-4 border-t border-white/10 pt-3 text-[10px] text-white/20">Assinatura</div>
                    </div>
                  ))}
                  {referees.length === 0 && officials.filter(o => o.officialType === 'REFEREE').length === 0 && (
                    <p className="text-sm text-white/30">Árbitros não definidos.</p>
                  )}
                </div>
              </div>

              {/* Representantes das equipes */}
              <div>
                <div className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Representantes das Equipes</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[game.homeTeam, game.awayTeam].map(team => (
                    <div key={team.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-[11px] text-white/40 uppercase tracking-widest">
                        {team.id === game.homeTeam.id ? 'Mandante' : 'Visitante'}
                      </div>
                      <div className="mt-1 text-[14px] font-bold text-white">{team.name}</div>
                      <div className="mt-1 text-[11px] text-white/30">
                        {rosters.find(r => r.teamId === team.id)?.coachName ?? 'Técnico não definido'}
                      </div>
                      <div className="mt-4 border-t border-white/10 pt-3 text-[10px] text-white/20">Assinatura</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mesário */}
              <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <div className="text-[11px] text-white/40 uppercase tracking-widest">Mesário / Anotador</div>
                {officials.filter(o => o.officialType !== 'REFEREE').map(o => (
                  <div key={o.id} className="mt-1 text-[14px] font-bold text-white">{o.name} <span className="text-[11px] text-white/30">· {o.role}</span></div>
                ))}
                <div className="mt-4 border-t border-white/10 pt-3 text-[10px] text-white/20">Assinatura</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
