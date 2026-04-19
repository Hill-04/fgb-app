import type { LiveGameTableModel, LiveTablePlayer } from './live-game-table-adapter'

const FGB = { verde: '#1B7340', vermelho: '#CC1016', amarelo: '#F5C200' }

function pct(made: number, att: number) {
  if (!att) return '—'
  return `${Math.round((made / att) * 100)}%`
}

function calcTotals(players: LiveTablePlayer[]) {
  return players.reduce((acc, p) => ({
    pts: acc.pts + p.points,
    reb: acc.reb + p.rebounds,
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
  }), { pts:0,reb:0,ast:0,stl:0,blk:0,tov:0,pf:0,fgm:0,fga:0,tpm:0,tpa:0,ftm:0,fta:0 })
}

function TeamTable({ team }: { team: LiveGameTableModel['home'] }) {
  const color = team.side === 'home' ? '#7FD4A0' : '#FF9999'
  const totals = calcTotals(team.players)
  const headers = ['#', 'Nome', 'S', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'FG%', '3P%', 'LL%']

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 13, fontWeight: 800, color, letterSpacing: 1,
        fontFamily: "'Barlow Condensed', 'Oswald', sans-serif",
        marginBottom: 8, textTransform: 'uppercase',
      }}>
        {team.name} — {team.score} pts
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ color: 'rgba(255,255,255,.4)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10 }}>
              {headers.map(h => (
                <th key={h} style={{
                  padding: '3px 6px', fontWeight: 600,
                  textAlign: h === 'Nome' ? 'left' : 'right',
                  borderBottom: '1px solid rgba(255,255,255,.08)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {team.players.map(p => {
              const fgm = p.twoPtMade + p.threePtMade
              const fga = p.twoPtAttempted + p.threePtAttempted
              return (
                <tr key={p.id} style={{
                  opacity: p.disqualified ? .4 : p.isOnCourt ? 1 : .65,
                  background: p.isOnCourt ? 'rgba(255,255,255,.04)' : 'transparent',
                }}>
                  <td style={{ padding: '3px 6px', color, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif" }}>{p.jerseyNumber ?? '--'}</td>
                  <td style={{ padding: '3px 6px', fontWeight: 500 }}>
                    {p.name}{p.disqualified ? ' 🔴' : ''}
                  </td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', color: 'rgba(255,255,255,.3)', fontSize: 10 }}>
                    {p.isStarter ? 'T' : 'R'}
                  </td>
                  <td style={{
                    padding: '3px 6px', textAlign: 'right',
                    fontWeight: p.points > 10 ? 700 : 400,
                    color: p.points >= 20 ? FGB.amarelo : p.points >= 10 ? '#FFF' : 'rgba(255,255,255,.6)',
                  }}>{p.points}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', color: 'rgba(255,255,255,.7)' }}>{p.rebounds}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', color: 'rgba(255,255,255,.7)' }}>{p.assists}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', color: 'rgba(255,255,255,.7)' }}>{p.steals}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', color: 'rgba(255,255,255,.7)' }}>{p.blocks}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', color: p.turnovers >= 4 ? '#FF8C00' : 'rgba(255,255,255,.7)' }}>{p.turnovers}</td>
                  <td style={{
                    padding: '3px 6px', textAlign: 'right',
                    color: p.fouls >= 5 ? '#FF4444' : p.fouls >= 4 ? FGB.amarelo : 'rgba(255,255,255,.7)',
                    fontWeight: p.fouls >= 4 ? 700 : 400,
                  }}>{p.fouls}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,.55)' }}>{pct(fgm, fga)}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,.55)' }}>{pct(p.threePtMade, p.threePtAttempted)}</td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,.55)' }}>{pct(p.freeThrowsMade, p.freeThrowsAttempted)}</td>
                </tr>
              )
            })}
            <tr style={{ borderTop: '1px solid rgba(255,255,255,.12)', fontWeight: 800, color, fontFamily: "'Barlow Condensed', sans-serif" }}>
              <td colSpan={3} style={{ padding: '4px 6px', fontSize: 11 }}>TOTAL</td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>{totals.pts}</td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>{totals.reb}</td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>{totals.ast}</td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>{totals.stl}</td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>{totals.blk}</td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>{totals.tov}</td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>{totals.pf}</td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>{pct(totals.fgm, totals.fga)}</td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>{pct(totals.tpm, totals.tpa)}</td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>{pct(totals.ftm, totals.fta)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function LiveBoxscoreFiba({ table }: { table: LiveGameTableModel }) {
  return (
    <div style={{
      borderRadius: '0 0 14px 14px',
      border: '1px solid rgba(255,255,255,.08)', borderTop: 'none',
      background: 'rgba(255,255,255,.04)', padding: 12,
    }}>
      <div style={{
        fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 12,
        fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, textTransform: 'uppercase',
      }}>
        BOXSCORE
      </div>
      <TeamTable team={table.home} />
      <TeamTable team={table.away} />
    </div>
  )
}
