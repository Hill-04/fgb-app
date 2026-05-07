'use client'

import { useGameData, type PublicPlayerLine } from './game-data-provider'

function pct(made: number, attempted: number) {
  if (attempted === 0) return '--'
  return `${Math.round((made / attempted) * 100)}%`
}

function fraction(made: number, attempted: number) {
  return `${made}/${attempted}`
}

function formatMinutes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '--'

  if (value <= 48) {
    return `${value}:00`
  }

  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function PlayerRow({ player, isHomeTeam }: { player: PublicPlayerLine; isHomeTeam: boolean }) {
  const isDQ = player.disqualified || player.fouledOut

  return (
    <tr
      className={`border-t border-[var(--border)] transition-colors ${
        isDQ ? 'opacity-50' : isHomeTeam ? 'hover:bg-[var(--verde)]/5' : 'hover:bg-slate-50'
      }`}
    >
      <td className="px-2 py-2.5 text-center text-[10px]">
        {player.isStarter ? (
          <span className="text-[#F5C200]" title="Titular">
            *
          </span>
        ) : (
          <span className="text-[var(--gray)]" title="Banco">
            .
          </span>
        )}
      </td>
      <td className="px-2 py-2.5 text-center text-xs text-[var(--gray)]">
        {player.jerseyNumber ?? '--'}
      </td>
      <td className="px-3 py-2.5">
        <span
          className={`text-sm font-semibold ${
            isDQ ? 'line-through text-[var(--gray)]' : 'text-[var(--black)]'
          }`}
        >
          {player.name}
        </span>
        {isDQ ? (
          <span className="ml-2 rounded px-1 py-0.5 text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-600">
            {player.disqualified ? 'DQ' : 'FO'}
          </span>
        ) : null}
      </td>
      <td className="px-2 py-2.5 text-center text-xs font-semibold tabular-nums text-[var(--black)]">
        {formatMinutes(player.minutesPlayed)}
      </td>
      <td className="px-2 py-2.5 text-center text-sm font-black text-[var(--black)]">
        {player.points}
      </td>
      <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">
        {fraction(player.twoMade, player.twoAttempted)}
      </td>
      <td className="px-2 py-2.5 text-center text-[10px] text-[var(--gray)]">
        {pct(player.twoMade, player.twoAttempted)}
      </td>
      <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">
        {fraction(player.threeMade, player.threeAttempted)}
      </td>
      <td className="px-2 py-2.5 text-center text-[10px] text-[var(--gray)]">
        {pct(player.threeMade, player.threeAttempted)}
      </td>
      <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">
        {fraction(player.ftMade, player.ftAttempted)}
      </td>
      <td className="px-2 py-2.5 text-center text-[10px] text-[var(--gray)]">
        {pct(player.ftMade, player.ftAttempted)}
      </td>
      <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">
        {player.reboundsOffensive}
      </td>
      <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">
        {player.reboundsDefensive}
      </td>
      <td className="px-2 py-2.5 text-center text-xs font-semibold text-[var(--black)]">
        {player.rebounds}
      </td>
      <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">{player.assists}</td>
      <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">{player.turnovers}</td>
      <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">{player.steals}</td>
      <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">{player.blocks}</td>
      <td
        className={`px-2 py-2.5 text-center text-xs ${
          player.fouls >= 4 ? 'font-black text-red-600' : 'text-[var(--black)]'
        }`}
      >
        {player.fouls}
      </td>
      <td
        className={`px-2 py-2.5 text-center text-xs font-black ${
          player.efficiency > 0
            ? 'text-[var(--verde)]'
            : player.efficiency < 0
              ? 'text-[#CC1016]'
              : 'text-[var(--gray)]'
        }`}
      >
        {player.efficiency}
      </td>
    </tr>
  )
}

function TeamBoxScore({
  teamName,
  players,
  isHomeTeam,
}: {
  teamName: string
  players: PublicPlayerLine[]
  isHomeTeam: boolean
}) {
  const starters = players.filter((p) => p.isStarter)
  const bench = players.filter((p) => !p.isStarter)

  const totals = players.reduce(
    (acc, p) => ({
      minutesPlayed: acc.minutesPlayed + p.minutesPlayed,
      points: acc.points + p.points,
      twoMade: acc.twoMade + p.twoMade,
      twoAttempted: acc.twoAttempted + p.twoAttempted,
      threeMade: acc.threeMade + p.threeMade,
      threeAttempted: acc.threeAttempted + p.threeAttempted,
      ftMade: acc.ftMade + p.ftMade,
      ftAttempted: acc.ftAttempted + p.ftAttempted,
      reboundsOffensive: acc.reboundsOffensive + p.reboundsOffensive,
      reboundsDefensive: acc.reboundsDefensive + p.reboundsDefensive,
      rebounds: acc.rebounds + p.rebounds,
      assists: acc.assists + p.assists,
      turnovers: acc.turnovers + p.turnovers,
      steals: acc.steals + p.steals,
      blocks: acc.blocks + p.blocks,
      fouls: acc.fouls + p.fouls,
      efficiency: acc.efficiency + p.efficiency,
    }),
    {
      minutesPlayed: 0,
      points: 0,
      twoMade: 0,
      twoAttempted: 0,
      threeMade: 0,
      threeAttempted: 0,
      ftMade: 0,
      ftAttempted: 0,
      reboundsOffensive: 0,
      reboundsDefensive: 0,
      rebounds: 0,
      assists: 0,
      turnovers: 0,
      steals: 0,
      blocks: 0,
      fouls: 0,
      efficiency: 0,
    }
  )

  return (
    <div className="fgb-card overflow-hidden p-0">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <h2 className="fgb-display text-xl text-[var(--black)]">{teamName}</h2>
        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
          * Titular . Banco
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--gray-l)]">
              <th className="w-6 px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]" />
              <th className="w-8 px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                #
              </th>
              <th className="min-w-[140px] px-3 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                Atleta
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                Min
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                Pts
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]" colSpan={2}>
                2P
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]" colSpan={2}>
                3P
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]" colSpan={2}>
                LL
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                RBO
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                RBD
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                RBT
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                Ast
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                Tov
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                Rbo
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                Toc
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                Flt
              </th>
              <th className="px-2 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                Eff
              </th>
            </tr>
          </thead>
          <tbody>
            {starters.map((p) => (
              <PlayerRow key={p.athleteId} player={p} isHomeTeam={isHomeTeam} />
            ))}
            {bench.length > 0 ? (
              <>
                <tr>
                  <td
                    colSpan={20}
                    className="border-t border-[var(--border)] bg-[var(--gray-l)] px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--gray)]"
                  >
                    Banco
                  </td>
                </tr>
                {bench.map((p) => (
                  <PlayerRow key={p.athleteId} player={p} isHomeTeam={isHomeTeam} />
                ))}
              </>
            ) : null}
            {players.length === 0 ? (
              <tr>
                <td colSpan={20} className="px-4 py-6 text-center text-sm text-[var(--gray)]">
                  Nenhuma estatistica registrada.
                </td>
              </tr>
            ) : null}
            {players.length > 0 ? (
              <tr className="border-t-2 border-[var(--border)] bg-[var(--gray-l)]">
                <td
                  colSpan={3}
                  className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]"
                >
                  Totais
                </td>
                <td className="px-2 py-2.5 text-center text-xs font-semibold text-[var(--black)]">
                  {formatMinutes(totals.minutesPlayed)}
                </td>
                <td className="px-2 py-2.5 text-center text-sm font-black text-[var(--black)]">
                  {totals.points}
                </td>
                <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">
                  {fraction(totals.twoMade, totals.twoAttempted)}
                </td>
                <td className="px-2 py-2.5 text-center text-[10px] text-[var(--gray)]">
                  {pct(totals.twoMade, totals.twoAttempted)}
                </td>
                <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">
                  {fraction(totals.threeMade, totals.threeAttempted)}
                </td>
                <td className="px-2 py-2.5 text-center text-[10px] text-[var(--gray)]">
                  {pct(totals.threeMade, totals.threeAttempted)}
                </td>
                <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">
                  {fraction(totals.ftMade, totals.ftAttempted)}
                </td>
                <td className="px-2 py-2.5 text-center text-[10px] text-[var(--gray)]">
                  {pct(totals.ftMade, totals.ftAttempted)}
                </td>
                <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">
                  {totals.reboundsOffensive}
                </td>
                <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">
                  {totals.reboundsDefensive}
                </td>
                <td className="px-2 py-2.5 text-center text-xs font-semibold text-[var(--black)]">
                  {totals.rebounds}
                </td>
                <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">{totals.assists}</td>
                <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">{totals.turnovers}</td>
                <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">{totals.steals}</td>
                <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">{totals.blocks}</td>
                <td className="px-2 py-2.5 text-center text-xs text-[var(--black)]">{totals.fouls}</td>
                <td
                  className={`px-2 py-2.5 text-center text-xs font-black ${
                    totals.efficiency > 0
                      ? 'text-[var(--verde)]'
                      : totals.efficiency < 0
                        ? 'text-[#CC1016]'
                        : 'text-[var(--gray)]'
                  }`}
                >
                  {totals.efficiency}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function GameBoxScoreContent() {
  const { data, isLoading, error } = useGameData()

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 rounded-[28px] bg-[var(--gray-l)]" />
        <div className="h-48 rounded-[28px] bg-[var(--gray-l)]" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!data) return null

  const { boxScore, homeTeam, awayTeam } = data

  const hasStats = boxScore.homePlayers.length > 0 || boxScore.awayPlayers.length > 0

  if (!hasStats) {
    return (
      <div className="rounded-[28px] border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--gray)]">
        As estatisticas serao exibidas assim que o jogo comecar.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <TeamBoxScore teamName={homeTeam.name} players={boxScore.homePlayers} isHomeTeam={true} />
      <TeamBoxScore teamName={awayTeam.name} players={boxScore.awayPlayers} isHomeTeam={false} />
    </div>
  )
}
