import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
]

const inputCls = 'h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm w-full focus:outline-none focus:border-[var(--verde)]'

async function createReferee(formData: FormData) {
  'use server'
  const name          = String(formData.get('name')          || '').trim()
  const licenseNumber = String(formData.get('licenseNumber') || '').trim()
  const phone         = String(formData.get('phone')         || '').trim()
  const email         = String(formData.get('email')         || '').trim()
  const city          = String(formData.get('city')          || '').trim()
  const state         = String(formData.get('state')         || '').trim()

  if (!name) return

  await prisma.referee.create({
    data: {
      name,
      licenseNumber: licenseNumber || null,
      phone:         phone         || null,
      email:         email         || null,
      city:          city          || null,
      state:         state         || null,
    }
  })
  revalidatePath('/admin/arbitragem')
}

async function assignReferee(formData: FormData) {
  'use server'
  const gameId    = String(formData.get('gameId')    || '').trim()
  const refereeId = String(formData.get('refereeId') || '').trim()
  const role      = String(formData.get('role')      || 'MAIN').trim()
  if (!gameId || !refereeId) return

  await prisma.refereeAssignment.create({
    data: { gameId, refereeId, role }
  })
  revalidatePath('/admin/arbitragem')
}

async function removeAssignment(formData: FormData) {
  'use server'
  const id = String(formData.get('id') || '').trim()
  if (!id) return
  await prisma.refereeAssignment.delete({ where: { id } })
  revalidatePath('/admin/arbitragem')
}

function proximityScore(referee: { city: string | null; state: string | null }, gameLocation: string): number {
  if (!gameLocation) return 3
  const loc = gameLocation.toLowerCase()
  if (referee.city && loc.includes(referee.city.toLowerCase())) return 1
  if (referee.state && loc.includes(referee.state.toLowerCase())) return 2
  return 3
}

export default async function AdminArbitragemPage() {
  try {
    const [referees, games, assignments] = await Promise.all([
      prisma.referee.findMany({ orderBy: { name: 'asc' } }),
      prisma.game.findMany({
        where: {
          dateTime: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            lte: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { dateTime: 'asc' },
        take: 50,
        select: {
          id: true,
          dateTime: true,
          venue: true,
          location: true,
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
        },
      }),
      prisma.refereeAssignment.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          referee: { select: { id: true, name: true, city: true, state: true } },
          game: {
            select: {
              id: true,
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
            },
          },
        },
        take: 40,
      }),
    ])

    // Group assignments by game
    const assignmentsByGame = new Map<string, typeof assignments>()
    for (const a of assignments) {
      const arr = assignmentsByGame.get(a.gameId) ?? []
      arr.push(a)
      assignmentsByGame.set(a.gameId, arr)
    }

    const ROLE_LABEL: Record<string, string> = { MAIN: 'Principal', ASSISTANT: 'Assistente', SCORER: 'Mesa' }

    return (
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="fgb-display text-3xl text-[var(--black)]">Arbitragem</h1>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Cadastro de árbitros e escala por jogo.
          </p>
        </div>

        {/* Referee registration */}
        <div className="fgb-card p-5">
          <p className="fgb-label text-[var(--gray)] mb-4" style={{ fontSize: 10 }}>Cadastrar árbitro</p>
          <form action={createReferee} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input name="name"          placeholder="Nome completo *" required className={inputCls} />
            <input name="licenseNumber" placeholder="Nº licença (opcional)"      className={inputCls} />
            <input name="phone"         placeholder="Telefone"                   className={inputCls} />
            <input name="email"         type="email" placeholder="E-mail"        className={inputCls} />
            <input name="city"          placeholder="Cidade"                     className={inputCls} />
            <select name="state" defaultValue="" className={inputCls}>
              <option value="">Estado</option>
              {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
            <button type="submit" className="fgb-btn-primary h-10 rounded-xl sm:col-span-2 lg:col-span-3">
              Cadastrar árbitro
            </button>
          </form>
        </div>

        {/* Referee list */}
        <div className="fgb-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-l)] flex items-center justify-between">
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Árbitros cadastrados</p>
            <span className="text-[10px] font-black text-[var(--gray)]">{referees.length} árbitro{referees.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-[var(--border)] bg-white">
            {referees.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--gray)]">Nenhum árbitro cadastrado.</div>
            ) : (
              referees.map(ref => (
                <div key={ref.id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[var(--black)]">{ref.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0 mt-0.5">
                      {ref.licenseNumber && <span className="text-[10px] text-[var(--gray)]">Lic. {ref.licenseNumber}</span>}
                      {(ref.city || ref.state) && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--gray)]">
                          <MapPin className="w-2.5 h-2.5" />
                          {[ref.city, ref.state].filter(Boolean).join(' – ')}
                        </span>
                      )}
                      {ref.phone && <span className="text-[10px] text-[var(--gray)]">{ref.phone}</span>}
                      {ref.email && <span className="text-[10px] text-[var(--gray)]">{ref.email}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Schedule assignment */}
        <div className="fgb-card p-5">
          <p className="fgb-label text-[var(--gray)] mb-4" style={{ fontSize: 10 }}>Escalar árbitro para jogo</p>
          <form action={assignReferee} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select name="gameId" className={inputCls} defaultValue="">
              <option value="">Selecionar jogo</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.homeTeam.name} x {game.awayTeam.name} · {new Date(game.dateTime).toLocaleDateString('pt-BR')}
                  {game.venue ? ` · ${game.venue}` : ''}
                </option>
              ))}
            </select>
            <select name="refereeId" className={inputCls} defaultValue="">
              <option value="">Selecionar árbitro</option>
              {referees.map((ref) => (
                <option key={ref.id} value={ref.id}>
                  {ref.name}{ref.city ? ` (${ref.city}${ref.state ? `/${ref.state}` : ''})` : ''}
                </option>
              ))}
            </select>
            <select name="role" className={inputCls} defaultValue="MAIN">
              <option value="MAIN">Principal</option>
              <option value="ASSISTANT">Assistente</option>
              <option value="SCORER">Mesa</option>
            </select>
            <button type="submit" className="fgb-btn-primary h-10 rounded-xl md:col-span-3">
              Adicionar à escala
            </button>
          </form>
        </div>

        {/* Games with their assignments + proximity suggestions */}
        <div className="space-y-4">
          <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Jogos e escalas (próximos 30 dias)</p>
          {games.length === 0 ? (
            <div className="fgb-card p-8 text-center text-sm text-[var(--gray)]">Nenhum jogo encontrado.</div>
          ) : games.map(game => {
            const gameAssignments = assignmentsByGame.get(game.id) ?? []
            const gameLocation = game.venue || game.location || ''

            // Sort referees by proximity to this game
            const sortedReferees = [...referees]
              .map(r => ({ ...r, score: proximityScore(r, gameLocation) }))
              .sort((a, b) => a.score - b.score)

            const nearby = sortedReferees.filter(r =>
              r.score <= 2 && !gameAssignments.some(a => a.refereeId === r.id)
            ).slice(0, 3)

            return (
              <div key={game.id} className="fgb-card overflow-hidden">
                {/* Game header */}
                <div className="px-5 py-3 bg-[var(--gray-l)] border-b border-[var(--border)] flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-[var(--black)] uppercase">
                      {game.homeTeam.name} <span className="text-[var(--gray)] font-normal">x</span> {game.awayTeam.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-[var(--gray)]">
                        {new Date(game.dateTime).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {gameLocation && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--gray)]">
                          <MapPin className="w-2.5 h-2.5" /> {gameLocation}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full"
                    style={{ background: 'var(--gray-l)', border: '1px solid var(--border)', color: 'var(--gray)' }}>
                    {gameAssignments.length} escalado{gameAssignments.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {/* Current assignments */}
                  {gameAssignments.length > 0 && (
                    <div className="space-y-1.5">
                      {gameAssignments.map(a => (
                        <div key={a.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(27,115,64,0.1)', color: 'var(--verde)', border: '1px solid rgba(27,115,64,0.2)' }}>
                              {ROLE_LABEL[a.role] ?? a.role}
                            </span>
                            <span className="text-sm font-bold text-[var(--black)]">{a.referee.name}</span>
                            {(a.referee.city || a.referee.state) && (
                              <span className="text-[10px] text-[var(--gray)]">
                                <MapPin className="w-2.5 h-2.5 inline" /> {[a.referee.city, a.referee.state].filter(Boolean).join('/')}
                              </span>
                            )}
                          </div>
                          <form action={removeAssignment}>
                            <input type="hidden" name="id" value={a.id} />
                            <button type="submit" className="text-[9px] text-[var(--gray)] hover:text-red-500 transition-colors">
                              Remover
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Proximity suggestions */}
                  {nearby.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black uppercase text-[var(--gray)] mb-1.5">
                        Sugestões por proximidade
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {nearby.map(r => (
                          <div key={r.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                            style={{ background: r.score === 1 ? 'rgba(27,115,64,0.1)' : 'rgba(245,194,0,0.12)',
                                     color: r.score === 1 ? 'var(--verde)' : '#9a7800',
                                     border: `1px solid ${r.score === 1 ? 'rgba(27,115,64,0.25)' : 'rgba(245,194,0,0.3)'}` }}>
                            <MapPin className="w-2.5 h-2.5" />
                            {r.name}
                            {r.city && <span className="opacity-60">· {r.city}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {gameAssignments.length === 0 && nearby.length === 0 && (
                    <p className="text-[10px] text-[var(--gray)]">Nenhum árbitro escalado.</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[ADMIN ARBITRAGEM ERROR]', msg)
    return (
      <div className="fgb-card p-10 text-center space-y-2">
        <p className="fgb-label text-[var(--red)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Erro ao carregar arbitragem.
        </p>
        <p className="text-xs text-[var(--gray)] font-mono break-all">{msg}</p>
      </div>
    )
  }
}
