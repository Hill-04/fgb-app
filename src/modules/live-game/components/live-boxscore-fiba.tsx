import type { LiveGameTableModel, LiveTablePlayer } from './live-game-table-adapter'

function calcTotals(players: LiveTablePlayer[]) {
  return players.reduce(
    (acc, player) => ({
      points: acc.points + player.points,
      rebounds: acc.rebounds + player.rebounds,
      assists: acc.assists + player.assists,
      steals: acc.steals + player.steals,
      blocks: acc.blocks + player.blocks,
      turnovers: acc.turnovers + player.turnovers,
      fouls: acc.fouls + player.fouls,
    }),
    { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0 }
  )
}

function BoxTable({
  team,
}: {
  team: LiveGameTableModel['home']
}) {
  const totals = calcTotals(team.players)
  const tone = team.side === 'home' ? 'text-[#8fbfff]' : 'text-[#ffb4c1]'

  return (
    <div className="mb-4">
      <div className={`mb-2 text-[13px] font-extrabold uppercase tracking-[0.08em] ${tone}`}>
        {team.name.toUpperCase()} — {team.score} pts
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px] text-white/80">
          <thead>
            <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.08em] text-white/40">
              {['#', 'Nome', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'FG', '3P', 'LL'].map((header) => (
                <th key={header} className={`px-1.5 py-2 font-semibold ${header === 'Nome' ? 'text-left' : 'text-right'}`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.players.map((player) => {
              const fgMade = player.twoPtMade + player.threePtMade
              const fgAttempted = player.twoPtAttempted + player.threePtAttempted
              const fgPct = fgAttempted > 0 ? Math.round((fgMade / fgAttempted) * 100) : 0

              return (
                <tr
                  key={player.id}
                  className={`${
                    player.disqualified
                      ? 'opacity-45'
                      : player.isOnCourt
                        ? 'bg-white/[0.04]'
                        : 'opacity-70'
                  }`}
                >
                  <td className={`px-1.5 py-1.5 font-black ${tone}`}>{player.jerseyNumber ?? '--'}</td>
                  <td className="px-1.5 py-1.5 font-medium">
                    {player.name}
                    {player.disqualified ? ' 🔴' : ''}
                  </td>
                  <td className={`px-1.5 py-1.5 text-right ${player.points > 10 ? 'font-black text-[#f5c849]' : ''}`}>{player.points}</td>
                  <td className="px-1.5 py-1.5 text-right">{player.rebounds}</td>
                  <td className="px-1.5 py-1.5 text-right">{player.assists}</td>
                  <td className="px-1.5 py-1.5 text-right">{player.steals}</td>
                  <td className="px-1.5 py-1.5 text-right">{player.blocks}</td>
                  <td className={`px-1.5 py-1.5 text-right ${player.turnovers > 2 ? 'text-[#ff9640]' : ''}`}>{player.turnovers}</td>
                  <td className={`px-1.5 py-1.5 text-right ${player.fouls >= 4 ? 'text-[#ff6464]' : player.fouls >= 3 ? 'text-[#f5c849]' : ''}`}>
                    {player.fouls}
                  </td>
                  <td className="px-1.5 py-1.5 text-right text-[10px]">
                    {fgMade}/{fgAttempted}
                    <span className="text-white/30"> {fgPct}%</span>
                  </td>
                  <td className="px-1.5 py-1.5 text-right text-[10px]">
                    {player.threePtMade}/{player.threePtAttempted}
                  </td>
                  <td className="px-1.5 py-1.5 text-right text-[10px]">
                    {player.freeThrowsMade}/{player.freeThrowsAttempted}
                  </td>
                </tr>
              )
            })}
            <tr className={`border-t border-white/10 text-[11px] font-black ${tone}`}>
              <td colSpan={2} className="px-1.5 py-2">TOTAL</td>
              <td className="px-1.5 py-2 text-right">{totals.points}</td>
              <td className="px-1.5 py-2 text-right">{totals.rebounds}</td>
              <td className="px-1.5 py-2 text-right">{totals.assists}</td>
              <td className="px-1.5 py-2 text-right">{totals.steals}</td>
              <td className="px-1.5 py-2 text-right">{totals.blocks}</td>
              <td className="px-1.5 py-2 text-right">{totals.turnovers}</td>
              <td className="px-1.5 py-2 text-right">{totals.fouls}</td>
              <td colSpan={3} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function LiveBoxscoreFiba({ table }: { table: LiveGameTableModel }) {
  return (
    <div className="rounded-b-[14px] border border-t-0 border-white/8 bg-white/[0.04] p-3">
      <div className="mb-3 text-[11px] uppercase tracking-[0.1em] text-white/45">
        BOXSCORE
      </div>
      <BoxTable team={table.home} />
      <BoxTable team={table.away} />
    </div>
  )
}
