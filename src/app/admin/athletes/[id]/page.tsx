import { prisma } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, User as UserIcon, Shield, CheckCircle, XCircle } from 'lucide-react'
import { updateAthlete, toggleFederationStatus, issueCard } from '../actions'
import { FileUpload } from '@/components/FileUpload'

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
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-[var(--gray)] mb-1'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-[var(--border)]">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)]">{title}</p>
    </div>
  )
}

export default async function AthleteProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const [athlete, teams] = await Promise.all([
      prisma.athlete.findUnique({
        where: { id },
        include: {
          team: { select: { id: true, name: true } },
          cards: { orderBy: { createdAt: 'desc' } },
          bidEntries: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true, type: true, status: true, reason: true, createdAt: true,
              championship: { select: { name: true } },
              teamFrom: { select: { name: true } },
              teamTo: { select: { name: true } },
            },
          },
          rosterEntries: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
              id: true, jerseyNumber: true, createdAt: true,
              gameRoster: {
                select: {
                  game: {
                    select: {
                      dateTime: true,
                      homeTeam: { select: { name: true } },
                      awayTeam: { select: { name: true } },
                      championship: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.team.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
    ])

    if (!athlete) notFound()

    const isFedActive = athlete.federationStatus === 'ACTIVE'
    const fmt = (d: Date | null | undefined) => d ? new Date(d).toISOString().split('T')[0] : ''

    return (
      <div className="space-y-6 pb-12 max-w-4xl">
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
            <p className="text-sm text-[var(--gray)] mt-0.5">{athlete.team?.name || 'Sem equipe'} · Reg. {athlete.registrationNumber || '–'}</p>
            <p className="text-[10px] text-[var(--gray)] mt-1">
              {athlete.rosterEntries.length} convocações · {athlete.cards.length} carteirinha{athlete.cards.length !== 1 ? 's' : ''}
            </p>
          </div>
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

        {/* Complete edit form */}
        <div className="fgb-card p-6">
          <p className="fgb-label text-[var(--gray)] mb-5" style={{ fontSize: 10 }}>Ficha completa do atleta</p>
          <form action={updateAthlete} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input type="hidden" name="id" value={athlete.id} />

            {/* ── Identificação ── */}
            <SectionTitle title="Identificação" />

            <Field label="Nome completo *">
              <input name="name" defaultValue={athlete.name} required className={inputCls} />
            </Field>
            <Field label="Número de registro">
              <input name="registrationNumber" type="number" defaultValue={athlete.registrationNumber ?? ''} className={inputCls} />
            </Field>
            <Field label="Registro anterior">
              <input name="registrationPrev" defaultValue={athlete.registrationPrev ?? ''} className={inputCls} />
            </Field>
            <Field label="Registro CBB">
              <input name="registrationCBB" defaultValue={athlete.registrationCBB ?? ''} className={inputCls} />
            </Field>
            <Field label="Equipe">
              <select name="teamId" defaultValue={athlete.teamId ?? ''} className={inputCls}>
                <option value="">Sem equipe</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Situação federativa">
              <select name="situation" defaultValue={athlete.situation} className={inputCls}>
                <option value="ACTIVE">Ativo</option>
                <option value="PENDING">Pendente</option>
                <option value="INACTIVE">Inativo</option>
                <option value="SUSPENDED">Suspenso</option>
              </select>
            </Field>

            {/* ── Dados pessoais ── */}
            <SectionTitle title="Dados pessoais" />

            <Field label="Data de nascimento">
              <input name="birthDate" type="date" defaultValue={fmt(athlete.birthDate)} className={inputCls} />
            </Field>
            <Field label="Cidade de nascimento">
              <input name="birthCity" defaultValue={athlete.birthCity ?? ''} className={inputCls} />
            </Field>
            <Field label="Sexo">
              <select name="sex" defaultValue={athlete.sex ?? ''} className={inputCls}>
                <option value="">Selecionar</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </Field>
            <Field label="Nacionalidade">
              <input name="nationality" defaultValue={athlete.nationality ?? 'Brasileira'} className={inputCls} />
            </Field>
            <Field label="Estado civil">
              <select name="maritalStatus" defaultValue={athlete.maritalStatus ?? ''} className={inputCls}>
                <option value="">Selecionar</option>
                <option value="SO">Solteiro(a)</option>
                <option value="CA">Casado(a)</option>
                <option value="SE">Separado(a)</option>
                <option value="VI">Viúvo(a)</option>
                <option value="DI">Divorciado(a)</option>
              </select>
            </Field>
            <Field label="Escolaridade">
              <input name="education" defaultValue={athlete.education ?? ''} className={inputCls} />
            </Field>

            {/* ── Posição / número ── */}
            <Field label="Posição">
              <select name="position" defaultValue={athlete.position ?? ''} className={inputCls}>
                <option value="">Selecionar</option>
                {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Nº camisa">
              <input name="jerseyNumber" type="number" min={0} max={99} defaultValue={athlete.jerseyNumber ?? ''} className={inputCls} />
            </Field>
            <Field label="Altura (m)">
              <input name="height" type="number" step="0.01" min={1} max={2.5} defaultValue={athlete.height ?? ''} className={inputCls} />
            </Field>
            <Field label="Peso (kg)">
              <input name="weight" type="number" step="0.1" min={30} max={200} defaultValue={athlete.weight ?? ''} className={inputCls} />
            </Field>

            {/* ── Documentos ── */}
            <SectionTitle title="Documentos" />

            <Field label="CPF">
              <input name="cpf" defaultValue={athlete.cpf ?? ''} className={inputCls} />
            </Field>
            <Field label="RG">
              <input name="rg" defaultValue={athlete.rg ?? ''} className={inputCls} />
            </Field>
            <Field label="Órgão expedidor RG">
              <input name="rgOrgan" defaultValue={athlete.rgOrgan ?? ''} className={inputCls} />
            </Field>
            <Field label="Data emissão RG">
              <input name="rgDate" type="date" defaultValue={fmt(athlete.rgDate)} className={inputCls} />
            </Field>

            {/* ── Contato ── */}
            <SectionTitle title="Contato" />

            <Field label="E-mail">
              <input name="email" type="email" defaultValue={(athlete as any).email ?? ''} className={inputCls} />
            </Field>
            <Field label="Celular">
              <input name="mobile" defaultValue={athlete.mobile ?? ''} className={inputCls} />
            </Field>
            <Field label="Telefone fixo">
              <input name="phone" defaultValue={athlete.phone ?? ''} className={inputCls} />
            </Field>

            {/* ── Endereço ── */}
            <SectionTitle title="Endereço" />

            <Field label="CEP">
              <input name="cep" defaultValue={athlete.cep ?? ''} className={inputCls} />
            </Field>
            <Field label="Estado (UF)">
              <input name="state" defaultValue={athlete.state ?? 'RS'} maxLength={2} className={inputCls} />
            </Field>
            <Field label="Cidade">
              <input name="city" defaultValue={athlete.city ?? ''} className={inputCls} />
            </Field>
            <Field label="Endereço">
              <input name="address" defaultValue={athlete.address ?? ''} className={inputCls} />
            </Field>
            <Field label="Número">
              <input name="addressNum" defaultValue={athlete.addressNum ?? ''} className={inputCls} />
            </Field>
            <Field label="Complemento">
              <input name="addressComp" defaultValue={athlete.addressComp ?? ''} className={inputCls} />
            </Field>

            {/* ── Família ── */}
            <SectionTitle title="Filiação" />

            <Field label="Nome da mãe">
              <input name="motherName" defaultValue={athlete.motherName ?? ''} className={inputCls} />
            </Field>
            <Field label="Nome do pai">
              <input name="fatherName" defaultValue={athlete.fatherName ?? ''} className={inputCls} />
            </Field>

            {/* ── Observações ── */}
            <SectionTitle title="Observações" />
            <div className="sm:col-span-2 lg:col-span-3">
              <textarea name="notes" defaultValue={athlete.notes ?? ''} rows={3}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--verde)] resize-none" />
            </div>

            <button type="submit" className="fgb-btn-primary h-10 rounded-xl sm:col-span-2 lg:col-span-3">
              Salvar alterações
            </button>
          </form>
        </div>

        {/* Photos & Documents (upload) */}
        <div className="fgb-card p-6">
          <p className="fgb-label text-[var(--gray)] mb-5" style={{ fontSize: 10 }}>Foto e documentos digitais</p>
          <form action={updateAthlete} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <input type="hidden" name="id" value={athlete.id} />
            <FileUpload fieldName="photoUrl" currentUrl={athlete.photoUrl} label="Foto do atleta" accept="image/*" variant="photo" />
            <FileUpload fieldName="docCPFUrl" currentUrl={athlete.docCPFUrl} label="CPF (digitalizado)" accept="image/*,application/pdf" variant="doc" />
            <FileUpload fieldName="docRGFrontUrl" currentUrl={athlete.docRGFrontUrl} label="RG — frente" accept="image/*,application/pdf" variant="doc" />
            <FileUpload fieldName="docRGBackUrl" currentUrl={athlete.docRGBackUrl} label="RG — verso" accept="image/*,application/pdf" variant="doc" />
            <FileUpload fieldName="docBirthCertUrl" currentUrl={athlete.docBirthCertUrl} label="Certidão de nascimento" accept="image/*,application/pdf" variant="doc" />
            <FileUpload fieldName="docOtherUrl" currentUrl={athlete.docOtherUrl} label="Outro documento" accept="image/*,application/pdf" variant="doc" />
            <div className="sm:col-span-2 lg:col-span-3">
              <button type="submit" className="fgb-btn-primary h-10 rounded-xl w-full sm:w-auto px-8">
                Salvar fotos / documentos
              </button>
            </div>
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
              <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Histórico de jogos (últimos 20)</p>
            </div>
            <div className="divide-y divide-[var(--border)] bg-white">
              {athlete.rosterEntries.map(entry => {
                const game = entry.gameRoster.game
                return (
                  <div key={entry.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[var(--black)]">
                        {game.homeTeam.name} <span className="text-[var(--gray)]">×</span> {game.awayTeam.name}
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
              <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Histórico de transferências — BID</p>
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
  } catch (error) {
    console.error('[ADMIN ATHLETE PROFILE ERROR]', error)
    return (
      <div className="fgb-card p-10 text-center">
        <p className="fgb-label text-[var(--red)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Erro ao carregar perfil do atleta.
        </p>
      </div>
    )
  }
}
