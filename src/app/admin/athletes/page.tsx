import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

async function createAthlete(formData: FormData) {
  'use server'
  const name = String(formData.get('name') || '').trim()
  const document = String(formData.get('document') || '').trim()
  const teamId = String(formData.get('teamId') || '').trim()

  if (!name) return

  await prisma.athlete.create({
    data: {
      name,
      document: document || null,
      teamId: teamId || null,
    }
  })
  revalidatePath('/admin/athletes')
}

async function issueCard(formData: FormData) {
  'use server'
  const athleteId = String(formData.get('athleteId') || '').trim()
  if (!athleteId) return

  const token = randomUUID()
  const cardNumber = `FGB-${Date.now().toString(36).toUpperCase()}`

  await prisma.athleteIdCard.create({
    data: {
      athleteId,
      qrToken: token,
      cardNumber,
    }
  })
  revalidatePath('/admin/athletes')
}

export default async function AdminAthletesPage() {
  try {
    const [athletes, teams] = await Promise.all([
      prisma.athlete.findMany({
        orderBy: { createdAt: 'desc' },
        include: { team: true, cards: { orderBy: { createdAt: 'desc' }, take: 1 } }
      }),
      prisma.team.findMany({ orderBy: { name: 'asc' } }),
    ])

    return (
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="fgb-display text-3xl text-[var(--black)]">BID de Atletas</h1>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Registro oficial e carteirinha digital com QR.
          </p>
        </div>

        <div className="fgb-card p-5">
          <form action={createAthlete} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              name="name"
              placeholder="Nome do atleta"
              className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
            />
            <input
              name="document"
              placeholder="CPF/RG (opcional)"
              className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
            />
            <select
              name="teamId"
              className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
              defaultValue=""
            >
              <option value="">Sem equipe</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <button type="submit" className="fgb-btn-primary h-10 rounded-xl md:col-span-3">Cadastrar atleta</button>
          </form>
        </div>

        <div className="fgb-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-l)]">
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Atletas registrados</p>
          </div>
          <div className="divide-y divide-[var(--border)] bg-white">
            {athletes.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--gray)]">Nenhum atleta cadastrado.</div>
            ) : (
              athletes.map((athlete) => (
                <div key={athlete.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-[var(--black)]">{athlete.name}</p>
                    <p className="text-[11px] text-[var(--gray)]">
                      {athlete.document || 'Documento não informado'} · {athlete.team?.name || 'Sem equipe'}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {athlete.cards[0] ? (
                      <div className="flex items-center gap-3">
                        <img
                          alt="QR"
                          className="w-16 h-16 rounded-lg border border-[var(--border)]"
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${athlete.cards[0].qrToken}`}
                        />
                        <div>
                          <p className="text-[10px] font-black uppercase text-[var(--gray)]">Carteirinha</p>
                          <p className="text-xs font-bold">{athlete.cards[0].cardNumber}</p>
                        </div>
                      </div>
                    ) : (
                      <form action={issueCard}>
                        <input type="hidden" name="athleteId" value={athlete.id} />
                        <button className="fgb-btn-outline h-9 rounded-xl" type="submit">
                          Gerar carteirinha
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('[ADMIN ATHLETES ERROR]', error)
    return (
      <div className="fgb-card p-10 text-center">
        <p className="fgb-label text-[var(--red)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Erro ao carregar atletas.
        </p>
      </div>
    )
  }
}
