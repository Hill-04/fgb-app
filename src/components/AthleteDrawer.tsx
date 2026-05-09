'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  X, ExternalLink, User as UserIcon, FileText,
  CheckCircle2, XCircle, Cake,
} from 'lucide-react'

export type DrawerAthlete = {
  id: string
  name: string
  photoUrl: string | null
  status: string
  federationStatus: string
  situation: string
  registrationNumber: number | null
  registrationCBB: string | null
  registrationPrev: string | null
  filiationDate: Date | null
  birthDate: Date | null
  birthCity: string | null
  sex: string | null
  nationality: string | null
  maritalStatus: string | null
  education: string | null
  position: string | null
  jerseyNumber: number | null
  height: number | null
  weight: number | null
  document: string | null
  cpf: string | null
  rg: string | null
  rgOrgan: string | null
  rgDate: Date | null
  email: string | null
  mobile: string | null
  phone: string | null
  cep: string | null
  state: string | null
  city: string | null
  address: string | null
  addressNum: string | null
  addressComp: string | null
  motherName: string | null
  fatherName: string | null
  notes: string | null
  docCPFUrl: string | null
  docRGFrontUrl: string | null
  docRGBackUrl: string | null
  docBirthCertUrl: string | null
  docOtherUrl: string | null
  category: string | null
}

const POSITION_LABEL: Record<string, string> = {
  PG: 'PG — Armador',
  SG: 'SG — Ala-armador',
  SF: 'SF — Ala',
  PF: 'PF — Ala-pivô',
  C:  'C — Pivô',
  COACH: 'Técnico',
}

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-[var(--border)] last:border-b-0">
      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)] pt-0.5 shrink-0">{label}</span>
      <span className="text-xs text-[var(--black)] text-right break-words">{value || '—'}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)] mb-2">{title}</p>
      <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-1">
        {children}
      </div>
    </div>
  )
}

function DocCard({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--gray-l)] p-3 flex items-center gap-3 opacity-60">
        <FileText className="w-4 h-4 text-[var(--gray)] shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)] truncate">{label}</p>
          <p className="text-[10px] text-[var(--gray)]">Não enviado</p>
        </div>
      </div>
    )
  }
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="rounded-xl border border-[var(--border)] bg-white p-3 flex items-center gap-3 hover:border-[var(--verde)] transition-colors">
      <FileText className="w-4 h-4 text-[var(--verde)] shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--black)] truncate">{label}</p>
        <p className="text-[10px] text-[var(--verde)] truncate">Abrir arquivo →</p>
      </div>
    </a>
  )
}

export function AthleteDrawer({
  athlete,
  onClose,
  editHref,
}: {
  athlete: DrawerAthlete | null
  onClose: () => void
  editHref?: (id: string) => string
}) {
  useEffect(() => {
    if (!athlete) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [athlete, onClose])

  if (!athlete) return null

  const isFedActive = athlete.federationStatus === 'ACTIVE'
  const positionLabel = athlete.position ? (POSITION_LABEL[athlete.position] ?? athlete.position) : null

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Panel */}
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl bg-[var(--gray-l)] shadow-2xl border-l border-[var(--border)] flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-[var(--border)] bg-white">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl border-2 border-[var(--border)] bg-[var(--gray-l)] overflow-hidden flex items-center justify-center shrink-0">
              {athlete.photoUrl ? (
                <img src={athlete.photoUrl} alt={athlete.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-8 h-8 text-[var(--gray)]" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="fgb-display text-xl text-[var(--black)] leading-tight">{athlete.name}</h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {isFedActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                    style={{ background: 'rgba(27,115,64,0.12)', color: 'var(--verde)', border: '1px solid rgba(27,115,64,0.25)' }}>
                    <CheckCircle2 className="w-2.5 h-2.5" /> FGB
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                    style={{ background: 'rgba(180,0,0,0.08)', color: '#b44', border: '1px solid rgba(180,0,0,0.2)' }}>
                    <XCircle className="w-2.5 h-2.5" /> Liberado
                  </span>
                )}
                {athlete.jerseyNumber != null && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[var(--gray-l)] border border-[var(--border)] text-[var(--black)]">
                    #{athlete.jerseyNumber}
                  </span>
                )}
                {positionLabel && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[var(--gray-l)] border border-[var(--border)] text-[var(--gray)]">
                    {positionLabel}
                  </span>
                )}
                {athlete.category && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[var(--yellow)]/20 border border-[var(--amarelo)]/30 text-[var(--black)]">
                    {athlete.category}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 w-9 h-9 rounded-xl border border-[var(--border)] bg-white hover:border-[var(--verde)] flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-[var(--gray)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <Section title="Identificação federativa">
            <Row label="Registro FGB" value={athlete.registrationNumber ?? '—'} />
            <Row label="Registro CBB" value={athlete.registrationCBB} />
            <Row label="Registro anterior" value={athlete.registrationPrev} />
            <Row label="Situação" value={athlete.situation} />
            <Row label="Filiação" value={fmtDate(athlete.filiationDate)} />
          </Section>

          <Section title="Dados pessoais">
            <Row label="Nascimento" value={<span className="inline-flex items-center gap-1.5"><Cake className="w-3 h-3" />{fmtDate(athlete.birthDate)}</span>} />
            <Row label="Cidade nasc." value={athlete.birthCity} />
            <Row label="Sexo" value={athlete.sex} />
            <Row label="Nacionalidade" value={athlete.nationality} />
            <Row label="Estado civil" value={athlete.maritalStatus} />
            <Row label="Escolaridade" value={athlete.education} />
          </Section>

          <Section title="Posição em quadra">
            <Row label="Posição" value={positionLabel} />
            <Row label="Nº camisa" value={athlete.jerseyNumber ?? '—'} />
            <Row label="Altura" value={athlete.height ? `${athlete.height} m` : '—'} />
            <Row label="Peso" value={athlete.weight ? `${athlete.weight} kg` : '—'} />
          </Section>

          <Section title="Documentos">
            <Row label="CPF" value={athlete.cpf} />
            <Row label="RG" value={athlete.rg} />
            <Row label="Órgão / UF" value={athlete.rgOrgan} />
            <Row label="Emissão RG" value={fmtDate(athlete.rgDate)} />
            <Row label="Documento*" value={athlete.document} />
          </Section>

          <Section title="Contato">
            <Row label="E-mail" value={athlete.email ? <a href={`mailto:${athlete.email}`} className="text-[var(--verde)] hover:underline">{athlete.email}</a> : '—'} />
            <Row label="Celular" value={athlete.mobile} />
            <Row label="Telefone" value={athlete.phone} />
          </Section>

          <Section title="Endereço">
            <Row label="CEP" value={athlete.cep} />
            <Row label="Logradouro" value={[athlete.address, athlete.addressNum].filter(Boolean).join(', ')} />
            <Row label="Complemento" value={athlete.addressComp} />
            <Row label="Cidade / UF" value={[athlete.city, athlete.state].filter(Boolean).join(' / ')} />
          </Section>

          <Section title="Filiação">
            <Row label="Mãe" value={athlete.motherName} />
            <Row label="Pai" value={athlete.fatherName} />
          </Section>

          {athlete.notes && (
            <Section title="Observações">
              <div className="py-2 text-xs text-[var(--black)] whitespace-pre-line">{athlete.notes}</div>
            </Section>
          )}

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)] mb-2">Documentos digitais</p>
            <div className="grid grid-cols-2 gap-2">
              <DocCard label="CPF" url={athlete.docCPFUrl} />
              <DocCard label="RG (frente)" url={athlete.docRGFrontUrl} />
              <DocCard label="RG (verso)" url={athlete.docRGBackUrl} />
              <DocCard label="Cert. nascimento" url={athlete.docBirthCertUrl} />
              <DocCard label="Outro" url={athlete.docOtherUrl} />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-white flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-[var(--border)] bg-white text-[10px] font-black uppercase tracking-widest text-[var(--gray)] hover:border-[var(--verde)] transition-colors"
          >
            Fechar
          </button>
          {editHref && (
            <Link
              href={editHref(athlete.id)}
              className="h-10 px-5 rounded-xl bg-[var(--verde)] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#0f4627] transition-colors inline-flex items-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Editar perfil completo
            </Link>
          )}
        </div>
      </aside>
    </div>
  )
}
