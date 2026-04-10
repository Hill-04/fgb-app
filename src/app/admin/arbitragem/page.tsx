import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

async function createReferee(formData: FormData) {
  'use server'
  const name = String(formData.get('name') || '').trim()
  const licenseNumber = String(formData.get('licenseNumber') || '').trim()
  const phone = String(formData.get('phone') || '').trim()

  if (!name) return

  await prisma.referee.create({
    data: { name, licenseNumber: licenseNumber || null, phone: phone || null }
  })
  revalidatePath('/admin/arbitragem')
}

async function assignReferee(formData: FormData) {
  'use server'
  const gameId = String(formData.get('gameId') || '').trim()
  const refereeId = String(formData.get('refereeId') || '').trim()
  const role = String(formData.get('role') || 'MAIN').trim()
  if (!gameId || !refereeId) return

  await prisma.refereeAssignment.create({
    data: { gameId, refereeId, role }
  })
  revalidatePath('/admin/arbitragem')
}

export default async function AdminArbitragemPage() {
  try {
    const [referees, games, assignments] = await Promise.all([
      prisma.referee.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.game.findMany({
        orderBy: { dateTime: 'asc' },
        take: 20,
        include: { homeTeam: true, awayTeam: true, category: true }
      }),
      prisma.refereeAssignment.findMany({
        orderBy: { createdAt: 'desc' },
        include: { referee: true, game: { include: { homeTeam: true, awayTeam: true } } },
        take: 20
      })
    ])

    return (
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="fgb-display text-3xl text-[var(--black)]">Arbitragem</h1>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Cadastro e escala de árbitros por jogo.
          </p>
        </div>

        <div className="fgb-card p-5">
          <form action={createReferee} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input name="name" placeholder="Nome do árbitro" className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
            <input name="licenseNumber" placeholder="Licença (opcional)" className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
            <input name="phone" placeholder="Telefone (opcional)" className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" />
            <button type="submit" className="fgb-btn-primary h-10 rounded-xl md:col-span-3">Cadastrar árbitro</button>
          </form>
        </div>

        <div className="fgb-card p-5">
          <form action={assignReferee} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select name="gameId" className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" defaultValue="">
              <option value="">Selecionar jogo</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.homeTeam.name} x {game.awayTeam.name} · {new Date(game.dateTime).toLocaleString('pt-BR')}
                </option>
              ))}
            </select>
            <select name="refereeId" className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" defaultValue="">
              <option value="">Selecionar árbitro</option>
              {referees.map((ref) => (
                <option key={ref.id} value={ref.id}>{ref.name}</option>
              ))}
            </select>
            <select name="role" className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm" defaultValue="MAIN">
              <option value="MAIN">Principal</option>
              <option value="ASSISTANT">Assistente</option>
              <option value="SCORER">Mesa</option>
            </select>
            <button type="submit" className="fgb-btn-primary h-10 rounded-xl md:col-span-3">Adicionar à escala</button>
          </form>
        </div>

        <div className="fgb-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-l)]">
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Últimas escalas</p>
          </div>
          <div className="divide-y divide-[var(--border)] bg-white">
            {assignments.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--gray)]">Nenhuma escala registrada.</div>
            ) : (
              assignments.map((item) => (
                <div key={item.id} className="p-6">
                  <p className="text-sm font-black text-[var(--black)]">{item.referee.name} · {item.role}</p>
                  <p className="text-[11px] text-[var(--gray)]">
                    {item.game.homeTeam.name} x {item.game.awayTeam.name}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('[ADMIN ARBITRAGEM ERROR]', error)
    return (
      <div className="fgb-card p-10 text-center">
        <p className="fgb-label text-[var(--red)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Erro ao carregar arbitragem.
        </p>
      </div>
    )
  }
}
