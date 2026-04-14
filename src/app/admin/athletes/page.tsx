import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { User as UserIcon, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

const POSITIONS = [
  { value: 'PG', label: 'PG – Armador' },
  { value: 'SG', label: 'SG – Ala-armador' },
  { value: 'SF', label: 'SF – Ala' },
  { value: 'PF', label: 'PF – Ala-pivô' },
  { value: 'C',  label: 'C – Pivô' },
  { value: 'COACH', label: 'Técnico' },
]

async function createAthlete(formData: FormData) {
  'use server'
  const name        = String(formData.get('name')        || '').trim()
  const document    = String(formData.get('document')    || '').trim()
  const teamId      = String(formData.get('teamId')      || '').trim()
  const position    = String(formData.get('position')    || '').trim()
  const jerseyRaw   = formData.get('jerseyNumber')
  const sex         = String(formData.get('sex')         || '').trim()
  const birthDate   = String(formData.get('birthDate')   || '').trim()
  const photoUrl    = String(formData.get('photoUrl')    || '').trim()

  if (!name) return

  await prisma.athlete.create({
    data: {
      name,
      document:     document     || null,
      teamId:       teamId       || null,
      position:     position     || null,
      jerseyNumber: jerseyRaw ? Number(jerseyRaw) : null,
      sex:          sex          || null,
      birthDate:    birthDate    ? new Date(birthDate) : null,
      photoUrl:     photoUrl     || null,
    }
  })
  revalidatePath('/admin/athletes')
}

async function issueCard(formData: FormData) {
  'use server'
  const athleteId = String(formData.get('athleteId') || '').trim()
  if (!athleteId) return

  const token      = randomUUID()
  const cardNumber = `FGB-${Date.now().toString(36).toUpperCase()}`

  await prisma.athleteIdCard.create({
    data: { athleteId, qrToken: token, cardNumber }
  })
  revalidatePath('/admin/athletes')
}

const inputCls = 'h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm w-full focus:outline-none focus:border-[var(--verde)]'

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

        {/* Form */}
        <div className="fgb-card p-5">
          <p className="fgb-label text-[var(--gray)] mb-4" style={{ fontSize: 10 }}>Novo atleta</p>
          <form action={createAthlete} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Row 1 */}
            <input name="name"     placeholder="Nome completo *"  required className={inputCls} />
            <input name="document" placeholder="CPF / RG"                  className={inputCls} />
            <select name="teamId" defaultValue="" className={inputCls}>
              <option value="">Sem equipe</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            {/* Row 2 */}
            <select name="position" defaultValue="" className={inputCls}>
              <option value="">Posição</option>
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <input
              name="jerseyNumber"
              type="number"
              min={0}
              max={99}
              placeholder="Nº camisa"
              className={inputCls}
            />
            <select name="sex" defaultValue="" className={inputCls}>
              <option value="">Sexo</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>

            {/* Row 3 */}
            <div>
              <label className="block text-[10px] font-black uppercase text-[var(--gray)] mb-1">Data de nascimento</label>
              <input name="birthDate" type="date" className={inputCls} />
            </div>
            <input name="photoUrl" placeholder="URL da foto (opcional)" className={inputCls + ' sm:col-span-2'} />

            <button
              type="submit"
              className="fgb-btn-primary h-10 rounded-xl sm:col-span-2 lg:col-span-3"
            >
              Cadastrar atleta
            </button>
          </form>
        </div>

        {/* List */}
        <div className="fgb-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-l)] flex items-center justify-between">
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Atletas registrados</p>
            <span className="text-[10px] font-black text-[var(--gray)]">{athletes.length} atleta{athletes.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-[var(--border)] bg-white">
            {athletes.length === 0 ? (
              <div className="p-10 text-center">
                <UserIcon className="w-10 h-10 text-[var(--gray)] mx-auto mb-2 opacity-30" />
                <p className="text-sm text-[var(--gray)]">Nenhum atleta cadastrado.</p>
              </div>
            ) : (
              athletes.map((athlete) => {
                const pos = POSITIONS.find(p => p.value === athlete.position)
                return (
                  <div key={athlete.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Avatar + info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden">
                        {athlete.photoUrl ? (
                          <img src={athlete.photoUrl} alt={athlete.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-[var(--gray)]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[var(--black)] uppercase leading-tight">{athlete.name}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          {athlete.jerseyNumber != null && (
                            <span className="text-[10px] font-black text-[var(--verde)]">#{athlete.jerseyNumber}</span>
                          )}
                          {pos && (
                            <span className="text-[10px] font-bold text-[var(--gray)] uppercase">{pos.value}</span>
                          )}
                          <span className="text-[10px] text-[var(--gray)]">
                            {athlete.document || 'Sem doc'} · {athlete.team?.name || 'Sem equipe'}
                          </span>
                          {athlete.sex && (
                            <span className="text-[10px] text-[var(--gray)] capitalize">{athlete.sex}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card */}
                    <div className="flex items-center gap-3 shrink-0">
                      {athlete.cards[0] ? (
                        <div className="flex items-center gap-3">
                          <img
                            alt="QR"
                            className="w-14 h-14 rounded-lg border border-[var(--border)]"
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${athlete.cards[0].qrToken}`}
                          />
                          <div>
                            <div className="flex items-center gap-1 mb-0.5">
                              <Shield className="w-3 h-3 text-[var(--verde)]" />
                              <p className="text-[9px] font-black uppercase text-[var(--verde)]">Carteirinha ativa</p>
                            </div>
                            <p className="text-xs font-bold text-[var(--black)]">{athlete.cards[0].cardNumber}</p>
                          </div>
                        </div>
                      ) : (
                        <form action={issueCard}>
                          <input type="hidden" name="athleteId" value={athlete.id} />
                          <button className="fgb-btn-outline h-9 rounded-xl text-xs" type="submit">
                            Gerar carteirinha
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )
              })
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
