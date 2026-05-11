import { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { FgbImage } from '@/components/FgbImage'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import { getActiveSeason } from '@/lib/queries/seasons'
import { getStandings } from '@/lib/queries/standings'

export const metadata: Metadata = {
  title: 'Classificação — FGB',
  description: 'Tabela de Classificação do Campeonato Gaúcho.',
}

// Top 4: zona de classificação direta ao mata-mata (verde forte)
// Top 5–8: zona de qualificação / repescagem (verde sutil)
// Demais: neutro
type Zone = 'classified' | 'qualifying' | 'neutral'

function getZone(pos: number): Zone {
  if (pos <= 4) return 'classified'
  if (pos <= 8) return 'qualifying'
  return 'neutral'
}

const ZONE_STYLES: Record<Zone, { rowBg: string; posBg: string; posColor: string; label?: string }> = {
  classified: {
    rowBg: 'rgba(34,160,80,0.06)',
    posBg: 'var(--fgb-green-700)',
    posColor: '#fff',
    label: 'Classificado',
  },
  qualifying: {
    rowBg: 'rgba(34,160,80,0.025)',
    posBg: 'var(--fgb-green-100)',
    posColor: 'var(--fgb-green-800)',
    label: 'Qualificação',
  },
  neutral: {
    rowBg: 'transparent',
    posBg: 'var(--fgb-ink-100)',
    posColor: 'var(--fgb-ink-600)',
  },
}

export default async function ClassificacaoPage() {
  const activeSeasonData = await getActiveSeason().catch(() => null)
  const activeSeason: any = activeSeasonData

  let standings: any[] = []

  if (activeSeason) {
    standings = await getStandings(activeSeason.id).catch(() => [])
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--fgb-ink-50)' }}>
      <PublicHeader />

      <div className="fgb-page-header-premium">
        <div className="bg-text">LEADERBOARD</div>
        <div className="max-w-4xl mx-auto px-4 relative text-center content">
          <div className="fgb-label" style={{ color: 'var(--yellow)', marginBottom: 12 }}>
            Temporada {activeSeason?.name ?? 'Atual'}
          </div>
          <h1 className="fgb-display fgb-h1 mb-4">Classificação</h1>
          <p className="font-body text-white/60 max-w-xl mx-auto text-sm leading-relaxed">
            Confira a tabela de pontuação, aproveitamento e resultados acumulados das equipes.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-14">
        <ScrollReveal>
          <div
            className="fgb-card bg-white overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            <div
              className="p-6 flex items-center justify-between flex-wrap gap-4"
              style={{ background: 'var(--fgb-green-50)', borderBottom: '1px solid var(--border)' }}
            >
              <h3 className="fgb-display text-2xl" style={{ color: 'var(--fgb-ink-900)' }}>
                Standings
              </h3>
              <div className="flex items-center gap-4 fgb-label" style={{ fontSize: 10, color: 'var(--fgb-ink-600)' }}>
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ background: 'var(--fgb-green-700)' }} />
                  Classificado
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ background: 'var(--fgb-green-100)' }} />
                  Qualificação
                </span>
              </div>
            </div>

            <div className="overflow-x-auto fgb-hide-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
                <thead>
                  <tr
                    className="fgb-label"
                    style={{
                      background: '#fff',
                      fontSize: 10,
                      color: 'var(--fgb-ink-500)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <th className="py-4 px-6 w-16 text-center">POS</th>
                    <th className="py-4 px-4 w-12 text-center"></th>
                    <th className="py-4 px-2">Equipe</th>
                    <th
                      className="py-4 px-2 text-center"
                      style={{ color: 'var(--fgb-ink-900)' }}
                      title="Pontos Classificatórios"
                    >
                      PTS
                    </th>
                    <th className="py-4 px-2 text-center" title="Jogos Disputados">J</th>
                    <th className="py-4 px-2 text-center" title="Vitórias">V</th>
                    <th className="py-4 px-2 text-center" title="Derrotas">D</th>
                    <th
                      className="py-4 px-2 text-center"
                      style={{ color: 'var(--fgb-green-700)' }}
                      title="Aproveitamento %"
                    >
                      %APV
                    </th>
                    <th className="py-4 px-2 text-center" title="Pontos Feitos" style={{ color: 'var(--fgb-ink-400)' }}>PF</th>
                    <th className="py-4 px-2 text-center" title="Pontos Sofridos" style={{ color: 'var(--fgb-ink-400)' }}>PS</th>
                    <th className="py-4 px-2 text-center" title="Saldo de Pontos" style={{ color: 'var(--fgb-ink-400)' }}>S</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium fgb-tabular">
                  {standings.map((team, index) => {
                    const pos = index + 1
                    const zone = getZone(pos)
                    const z = ZONE_STYLES[zone]
                    const saldo = team.pts_for - team.pts_against

                    return (
                      <tr
                        key={team.team_id}
                        className="transition-colors hover:brightness-95"
                        style={{ background: z.rowBg, borderBottom: '1px solid var(--fgb-ink-100)' }}
                      >
                        <td className="py-4 px-6 text-center">
                          <span
                            className="inline-flex items-center justify-center w-9 h-9 rounded-full"
                            style={{
                              background: z.posBg,
                              color: z.posColor,
                              fontFamily: 'var(--font-anton)',
                              fontSize: 16,
                              lineHeight: 1,
                            }}
                          >
                            {pos}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="w-9 h-9 rounded-full overflow-hidden mx-auto" style={{ border: '1px solid var(--border)' }}>
                            <FgbImage
                              variant="logo"
                              src={team.logo_url}
                              initials={(team.short_name || team.team_name || '??').slice(0, 2)}
                              alt={team.team_name}
                              tint="green"
                            />
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex flex-col">
                            <span
                              className="font-bold text-[15px]"
                              style={{ color: 'var(--fgb-ink-900)' }}
                            >
                              {team.team_name}
                            </span>
                            <span className="fgb-label mt-0.5" style={{ fontSize: 10, color: 'var(--fgb-ink-400)' }}>
                              {team.short_name}
                            </span>
                          </div>
                        </td>
                        <td
                          className="py-4 px-2 text-center"
                          style={{
                            fontFamily: 'var(--font-anton)',
                            fontSize: 20,
                            lineHeight: 1,
                            color: 'var(--fgb-ink-900)',
                          }}
                        >
                          {team.points}
                        </td>
                        <td className="py-4 px-2 text-center" style={{ color: 'var(--fgb-ink-500)' }}>
                          {team.games_played}
                        </td>
                        <td
                          className="py-4 px-2 text-center font-bold"
                          style={{ color: 'var(--fgb-green-700)' }}
                        >
                          {team.wins}
                        </td>
                        <td
                          className="py-4 px-2 text-center font-bold"
                          style={{ color: 'var(--fgb-red-600)' }}
                        >
                          {team.losses}
                        </td>
                        <td
                          className="py-4 px-2 text-center font-bold"
                          style={{ color: 'var(--fgb-green-700)' }}
                        >
                          {team.win_pct}%
                        </td>
                        <td
                          className="py-4 px-2 text-center text-xs"
                          style={{ color: 'var(--fgb-ink-400)', fontFamily: 'var(--font-mono)' }}
                        >
                          {team.pts_for}
                        </td>
                        <td
                          className="py-4 px-2 text-center text-xs"
                          style={{ color: 'var(--fgb-ink-400)', fontFamily: 'var(--font-mono)' }}
                        >
                          {team.pts_against}
                        </td>
                        <td
                          className="py-4 px-2 text-center text-xs font-bold"
                          style={{
                            color: saldo > 0 ? 'var(--fgb-green-700)' : saldo < 0 ? 'var(--fgb-red-600)' : 'var(--fgb-ink-500)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {saldo > 0 ? '+' : ''}{saldo}
                        </td>
                      </tr>
                    )
                  })}
                  {standings.length === 0 && (
                    <tr>
                      <td
                        colSpan={11}
                        className="py-16 text-center text-sm"
                        style={{ color: 'var(--fgb-ink-400)' }}
                      >
                        Nenhuma equipe registrou jogos ainda na classificação.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              className="p-4 fgb-label flex flex-wrap gap-4"
              style={{
                background: 'var(--fgb-ink-50)',
                borderTop: '1px solid var(--border)',
                fontSize: 10,
                color: 'var(--fgb-ink-500)',
              }}
            >
              <span>Classificação gerada oficialmente via Súmula</span>
              <span className="ml-auto" style={{ fontFamily: 'var(--font-mono)' }}>
                {standings.length} equipe{standings.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </ScrollReveal>
      </main>

      <PublicFooter />
    </div>
  )
}
