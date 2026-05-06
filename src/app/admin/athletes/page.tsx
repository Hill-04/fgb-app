import { prisma } from '@/lib/db'
import Link from 'next/link'
import { User as UserIcon, Shield, CheckCircle, XCircle } from 'lucide-react'
import { createAthlete, toggleFederationStatus, issueCard } from './actions'

export const dynamic = 'force-dynamic'

const POSITIONS = [
  { value: 'PG', label: 'PG – Armador' },
  { value: 'SG', label: 'SG – Ala-armador' },
  { value: 'SF', label: 'SF – Ala' },
  { value: 'PF', label: 'PF – Ala-pivô' },
  { value: 'C',  label: 'C – Pivô' },
  { value: 'COACH', label: 'Técnico' },
]

const inputCls = 'h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm w-full focus:outline-none focus:border-[var(--verde)]'

export default async function AdminAthletesPage() {
  try {
    const [athletes, teams] = await Promise.all([
      prisma.athlete.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          team: true,
          cards: { orderBy: { createdAt: 'desc' }, take: 1 },
          rosterEntries: { select: { id: true } },
        }
      }),
      prisma.team.findMany({ orderBy: { name: 'asc' } }),
    ])

    const activeFed = athletes.filter(a => a.federationStatus === 'ACTIVE').length
    const inactiveFed = athletes.filter(a => a.federationStatus !== 'ACTIVE').length

    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="fgb-display text-3xl text-[var(--black)]">BID de Atletas</h1>
            <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
              Registro oficial, carteirinha digital e status de federação.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-4 mt-1">
            <div className="text-center">
              <p className="text-xl font-black text-[var(--verde)]">{activeFed}</p>
              <p className="text-[9px] font-black uppercase text-[var(--gray)]">Na FGB</p>
            </div>
            <div className="w-px h-8 bg-[var(--border)]" />
            <div className="text-center">
              <p className="text-xl font-black text-[var(--gray)]">{inactiveFed}</p>
              <p className="text-[9px] font-black uppercase text-[var(--gray)]">Liberados</p>
            </div>
          </div>
        </div>

        {/* Create form */}
        <div className="fgb-card p-5">
          <p className="fgb-label text-[var(--gray)] mb-4" style={{ fontSize: 10 }}>Novo atleta</p>
          <form action={createAthlete} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input name="name"     placeholder="Nome completo *"  required className={inputCls} />
            <input name="document" placeholder="CPF / RG"                  className={inputCls} />
            <select name="teamId" defaultValue="" className={inputCls}>
              <option value="">Sem equipe</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select name="position" defaultValue="" className={inputCls}>
              <option value="">Posição</option>
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <input name="jerseyNumber" type="number" min={0} max={99} placeholder="Nº camisa" className={inputCls} />
            <select name="sex" defaultValue="" className={inputCls}>
              <option value="">Sexo</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
            <div>
              <label className="block text-[10px] font-black uppercase text-[var(--gray)] mb-1">Data de nascimento</label>
              <input name="birthDate" type="date" className={inputCls} />
            </div>
            <input name="photoUrl" placeholder="URL da foto (opcional)" className={inputCls + ' sm:col-span-2'} />
            <button type="submit" className="fgb-btn-primary h-10 rounded-xl sm:col-span-2 lg:col-span-3">
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
                const isFedActive = athlete.federationStatus === 'ACTIVE'
                const gamesCount = athlete.rosterEntries.length
                return (
                  <div key={athlete.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar + info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden">
                        {athlete.photoUrl ? (
                          <img src={athlete.photoUrl} alt={athlete.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-[var(--gray)]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-black text-[var(--black)] uppercase leading-tight truncate">{athlete.name}</p>
                          {/* Federation status badge */}
                          {isFedActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                              style={{ background: 'rgba(27,115,64,0.12)', color: 'var(--verde)', border: '1px solid rgba(27,115,64,0.25)' }}>
                              <CheckCircle className="w-2.5 h-2.5" /> FGB
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                              style={{ background: 'rgba(180,0,0,0.08)', color: '#b44', border: '1px solid rgba(180,0,0,0.2)' }}>
                              <XCircle className="w-2.5 h-2.5" /> Liberado
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0 mt-0.5">
                          {athlete.jerseyNumber != null && (
                            <span className="text-[10px] font-black text-[var(--verde)]">#{athlete.jerseyNumber}</span>
                          )}
                          {pos && <span className="text-[10px] font-bold text-[var(--gray)] uppercase">{pos.value}</span>}
                          <span className="text-[10px] text-[var(--gray)]">{athlete.team?.name || 'Sem equipe'}</span>
                          {gamesCount > 0 && (
                            <span className="text-[10px] text-[var(--gray)]">{gamesCount} jogo{gamesCount !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Federation toggle */}
                      <form action={toggleFederationStatus}>
                        <input type="hidden" name="id" value={athlete.id} />
                        <input type="hidden" name="current" value={athlete.federationStatus} />
                        <button type="submit"
                          className="h-8 px-3 rounded-xl text-[10px] font-black uppercase transition-colors border"
                          style={isFedActive
                            ? { borderColor: 'rgba(180,0,0,0.3)', color: '#b44', background: 'rgba(180,0,0,0.06)' }
                            : { borderColor: 'rgba(27,115,64,0.35)', color: 'var(--verde)', background: 'rgba(27,115,64,0.08)' }
                          }>
                          {isFedActive ? 'Liberar' : 'Reativar FGB'}
                        </button>
                      </form>

                      {/* Card */}
                      {athlete.cards[0] ? (
                        <div className="flex items-center gap-2">
                          <img
                            alt="QR"
                            className="w-10 h-10 rounded-lg border border-[var(--border)]"
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${athlete.cards[0].qrToken}`}
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-[var(--verde)]" />
                              <p className="text-[9px] font-black uppercase text-[var(--verde)]">Carteirinha</p>
                            </div>
                            <p className="text-[10px] font-bold text-[var(--black)]">{athlete.cards[0].cardNumber}</p>
                          </div>
                        </div>
                      ) : (
                        <form action={issueCard}>
                          <input type="hidden" name="athleteId" value={athlete.id} />
                          <button className="h-8 px-3 rounded-xl text-[10px] font-black uppercase border border-[var(--border)] text-[var(--gray)] hover:border-[var(--verde)] hover:text-[var(--verde)] transition-colors" type="submit">
                            Gerar carteirinha
                          </button>
                        </form>
                      )}

                      {/* Profile link */}
                      <Link href={`/admin/athletes/${athlete.id}`}
                        className="h-8 px-3 rounded-xl text-[10px] font-black uppercase border border-[var(--border)] text-[var(--gray)] hover:border-[var(--verde)] hover:text-[var(--verde)] transition-colors flex items-center">
                        Ver perfil
                      </Link>
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
