import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ChampionshipStandings({
  params
}: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const categories = await prisma.championshipCategory.findMany({
    where: { championshipId: id },
    include: {
      standings: {
        include: { team: { select: { name: true } } },
        orderBy: [
          { points: 'desc' },
          { diff: 'desc' },
          { pointsFor: 'desc' }
        ]
      }
    }
  }).catch(() => [])

  return (
    <div style={{ padding: 24 }}>
      {categories.length === 0 && (
        <p className="fgb-label" style={{ color: 'var(--gray)' }}>
          Nenhuma classificacao gerada ainda. Registre resultados na aba Jogos para atualizar.
        </p>
      )}

      {categories.map(cat => (
        <div key={cat.id} style={{ marginBottom: 28 }}>
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-verde" />
              <h2 className="fgb-section-title">{cat.name}</h2>
            </div>
          </div>

          {cat.standings.length === 0 ? (
            <p className="fgb-label" style={{ color: 'var(--gray)' }}>
              Sem jogos encerrados nesta categoria.
            </p>
          ) : (
            <div style={{
              background: '#fff',
              border: '1px solid var(--border)',
              overflowX: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--gray-l)' }}>
                    {['#','Equipe','J','V','D','Pts','Pro','Ctr','Sal'].map(h => (
                      <th key={h} style={{
                        padding: '8px 12px',
                        textAlign: h === 'Equipe' ? 'left' : 'center',
                        fontFamily: 'var(--font-display)',
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--gray)',
                        borderBottom: '1px solid var(--border)'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cat.standings.map((s, i) => (
                    <tr key={s.id} style={{
                      borderBottom: '1px solid var(--border)',
                      background: i % 2 === 0 ? '#fff' : 'var(--gray-l)'
                    }}>
                      <td style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        fontFamily: 'var(--font-display)',
                        fontSize: 12,
                        fontWeight: 700,
                        color: i < 3 ? 'var(--verde)' : 'var(--gray)'
                      }}>
                        {i + 1}
                      </td>
                      <td style={{
                        padding: '10px 12px',
                        fontFamily: 'var(--font-display)',
                        fontSize: 13,
                        fontWeight: 700
                      }}>
                        {s.team.name}
                      </td>
                      {[s.played, s.wins, s.losses, s.points, s.pointsFor, s.pointsAgainst, s.diff].map((v, j) => (
                        <td key={j} style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontFamily: 'var(--font-display)',
                          fontSize: 13,
                          color: j === 3 ? 'var(--verde)' : 'var(--tx)',
                          fontWeight: j === 3 ? 700 : 400
                        }}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

