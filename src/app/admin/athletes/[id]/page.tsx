import { prisma } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, User as UserIcon, Shield, CheckCircle, XCircle } from 'lucide-react'
import { updateAthlete, toggleFederationStatus, issueCard } from '../actions'

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

export default async function AthleteProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [athlete, teams] = await Promise.all([
    prisma.athlete.findUnique({
      where: { id },
      include: {
        team: true,
        cards: { orderBy: { createdAt: 'desc' } },
        bidEntries: {
          orderBy: { createdAt: 'desc' },
          include: { championship: true, teamFrom: true, teamTo: true }
        },
        rosterEntries: {
          include: {
            gameRoster: {
              include: {
                game: {
                  include: { homeTeam: true, awayTeam: true, championship: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      }
    }),
    prisma.team.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!athlete) notFound()

  const isFedActive = athlete.federationStatus === 'ACTIVE'
  const birthDateStr = athlete.birthDate
    ? new Date(athlete.birthDate).toISOString().split('T')[0]
    : ''

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      {/* Back */}
      <Link href="/admin/athletes" className="inline-flex items-center gap-2 text-sm text-[var(--gray)] hover:text-[var(--verde)] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para atletas
      </Link>

      {/* Header */}
      <div className="fgb-card p-5 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-[var(--gray-l)] border-2 border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden">
          {athlete.photoUrl ? (
            <img src={athlete.photoUrl} alt={athlete.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-10 h-10 text-[var(--gray)]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="fgb-display text-2xl text-[var(--black)]">{athlete.name}</h1>
            {isFedActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase"
                style={{ background: 'rgba(27,115,64,0.12)', color: 'var(--verde)', border: '1px solid rgba(27,115,64,0.25)' }}>
                <CheckCircle className="w-3 h-3" /> Registrado FGB
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase"
                style={{ background: 'rgba(180,0,0,0.08)', color: '#b44', border: '1px solid rgba(180,0,0,0.2)' }}>
                <XCircle className="w-3 h-3" /> Liberado
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--gray)] mt-0.5">{athlete.team?.name || 'Sem equipe'} · {athlete.document || 'Sem documento'}</p>
          <p className="text-[10px] text-[var(--gray)] mt-1">
            {athlete.rosterEntries.length} convocações · {athlete.cards.length} carteirinha{athlete.cards.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Federation toggle */}
        <form action={toggleFederationStatus} className="shrink-0">
          <input type="hidden" name="id" value={athlete.id} />
          <input type="hidden" name="current" value={athlete.federationStatus} />
          <button type="submit"
            className="h-9 px-4 rounded-xl text-[10px] font-black uppercase transition-colors border"
            style={isFedActive
              ? { borderColor: 'rgba(180,0,0,0.3)', color: '#b44', background: 'rgba(180,0,0,0.06)' }
              : { borderColor: 'rgba(27,115,64,0.35)', color: 'var(--verde)', background: 'rgba(27,115,64,0.08)' }
            }>
            {isFedActive ? 'Liberar da FGB' : 'Reativar na FGB'}
          </button>
        </form>
      </div>

      {/* Edit form */}
      <div className="fgb-card p-5">
        <p className="fgb-label text-[var(--gray)] mb-4" style={{ fontSize: 10 }}>Editar dados</p>
        <form action={updateAthlete} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="hidden" name="id" value={athlete.id} />
          <input name="name" defaultValue={athlete.name} placeholder="Nome completo *" required className={inputCls} />
          <input name="document" defaultValue={athlete.document || ''} placeholder="CPF / RG" className={inputCls} />
          <select name="teamId" defaultValue={athlete.teamId || ''} className={inputCls}>
            <option value="">Sem equipe</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select name="position" defaultValue={athlete.position || ''} className={inputCls}>
            <option value="">Posição</option>
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <input name="jerseyNumber" type="number" min={0} max={99} defaultValue={athlete.jerseyNumber ?? ''} placeholder="Nº camisa" className={inputCls} />
          <select name="sex" defaultValue={athlete.sex || ''} className={inputCls}>
            <option value="">Sexo</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
          </select>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--gray)] mb-1">Data de nascimento</label>
            <input name="birthDate" type="date" defaultValue={birthDateStr} className={inputCls} />
          </div>
          <input name="photoUrl" defaultValue={athlete.photoUrl || ''} placeholder="URL da foto (opcional)" className={inputCls} />
          <button type="submit" className="fgb-btn-primary h-10 rounded-xl sm:col-span-2">
            Salvar alterações
          </button>
        </form>
      </div>

      {/* Cards */}
      <div className="fgb-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-l)] flex items-center justify-between">
          <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Carteirinhas</p>
          <form action={issueCard}>
            <input type="hidden" name="athleteId" value={athlete.id} />
            <button type="submit" className="fgb-btn-outline h-8 rounded-xl text-[10px]">Nova carteirinha</button>
          </form>
        </div>
        <div className="divide-y divide-[var(--border)] bg-white">
          {athlete.cards.length === 0 ? (
            <div className="p-6 text-center text-sm text-[var(--gray)]">Nenhuma carteirinha emitida.</div>
          ) : (
            athlete.cards.map(card => (
              <div key={card.id} className="p-4 flex items-center gap-4">
                <img
                  alt="QR"
                  className="w-16 h-16 rounded-lg border border-[var(--border)]"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${card.qrToken}`}
                />
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Shield className="w-3.5 h-3.5 text-[var(--verde)]" />
                    <p className="text-xs font-black uppercase text-[var(--verde)]">{card.status}</p>
                  </div>
                  <p className="text-sm font-bold text-[var(--black)]">{card.cardNumber}</p>
                  <p className="text-[10px] text-[var(--gray)]">
                    Emitida {new Date(card.issuedAt).toLocaleDateString('pt-BR')}
                    {card.expiresAt && ` · Expira ${new Date(card.expiresAt).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Game history */}
      {athlete.rosterEntries.length > 0 && (
        <div className="fgb-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-l)]">
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Histórico de jogos</p>
          </div>
          <div className="divide-y divide-[var(--border)] bg-white">
            {athlete.rosterEntries.map(entry => {
              const game = entry.gameRoster.game
              return (
                <div key={entry.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--black)]">
                      {game.homeTeam.name} <span className="text-[var(--gray)]">x</span> {game.awayTeam.name}
                    </p>
                    <p className="text-[10px] text-[var(--gray)]">
                      {game.championship?.name || 'Amistoso'} · {new Date(game.dateTime).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full"
                    style={{ background: 'var(--gray-l)', color: 'var(--gray)' }}>
                    #{entry.jerseyNumber ?? '–'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* BID history */}
      {athlete.bidEntries.length > 0 && (
        <div className="fgb-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-l)]">
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Histórico de transferências (BID)</p>
          </div>
          <div className="divide-y divide-[var(--border)] bg-white">
            {athlete.bidEntries.map(entry => (
              <div key={entry.id} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[var(--black)]">
                    {entry.type === 'TRANSFER'
                      ? `${entry.teamFrom?.name || '—'} → ${entry.teamTo?.name || '—'}`
                      : entry.type}
                  </p>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--gray-l)', color: 'var(--gray)' }}>
                    {entry.status}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--gray)]">
                  {entry.championship?.name || ''} · {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
                  {entry.reason && ` · ${entry.reason}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
