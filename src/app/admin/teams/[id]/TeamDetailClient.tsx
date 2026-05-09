'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Shield, MapPin, Phone, Users, ChevronRight, Search,
  User as UserIcon, Mail, Save,
} from 'lucide-react'
import { FileUpload } from '@/components/FileUpload'
import { updateTeam } from './actions'
import { AthleteDrawer, type DrawerAthlete } from '@/components/AthleteDrawer'

type Team = {
  id: string
  name: string
  logoUrl: string | null
  city: string | null
  state: string | null
  phone: string | null
  sex: string | null
  members: { user: { name: string; email: string } }[]
}

type Props = {
  team: Team
  athletes: DrawerAthlete[]
}

const UF_LIST = ['RS','SC','PR','SP','RJ','MG','BA','GO','DF','AM','PA','CE','PE','RN','MT','MS','ES','AL','SE','PI','MA','PB','TO','RO','AC','AP','RR']

const inputCls = 'h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm w-full focus:outline-none focus:border-[var(--verde)]'
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-[var(--gray)] mb-1.5'

export function TeamDetailClient({ team, athletes }: Props) {
  const [open, setOpen] = useState<DrawerAthlete | null>(null)
  const [query, setQuery] = useState('')
  const [logoUrl, setLogoUrl] = useState(team.logoUrl ?? '')

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? athletes.filter(a =>
          a.name.toLowerCase().includes(q) ||
          a.document?.toLowerCase().includes(q) ||
          a.cpf?.toLowerCase().includes(q) ||
          a.position?.toLowerCase().includes(q) ||
          a.jerseyNumber?.toString().includes(q)
        )
      : athletes
    const groups: Record<string, DrawerAthlete[]> = {}
    for (const a of filtered) {
      const key = a.category || 'Sem categoria'
      groups[key] = groups[key] || []
      groups[key].push(a)
    }
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === 'Sem categoria') return 1
      if (b === 'Sem categoria') return -1
      return a.localeCompare(b)
    })
  }, [athletes, query])

  const headCoach = team.members[0]?.user

  return (
    <>
      <div className="space-y-6 pb-12 max-w-6xl">
        {/* Back */}
        <Link href="/admin/teams" className="inline-flex items-center gap-2 text-sm text-[var(--gray)] hover:text-[var(--verde)] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para equipes
        </Link>

        {/* Header card */}
        <div className="fgb-card p-6 flex flex-col md:flex-row gap-5 md:items-center">
          <div className="w-24 h-24 rounded-3xl bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              <Shield className="w-10 h-10 text-[var(--gray)]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--verde)]">Equipe filiada FGB</p>
            <h1 className="fgb-display text-3xl text-[var(--black)] mt-1 leading-none truncate">{team.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-[var(--gray)]">
              <span className="inline-flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[var(--verde)]" />{team.city || '—'}{team.state ? `, ${team.state}` : ''}</span>
              <span className="inline-flex items-center gap-1.5"><Phone className="w-3 h-3 text-[var(--verde)]" />{team.phone || '—'}</span>
              <span className="inline-flex items-center gap-1.5"><Users className="w-3 h-3 text-[var(--verde)]" />{athletes.length} atleta(s)</span>
              {headCoach && (
                <span className="inline-flex items-center gap-1.5"><Mail className="w-3 h-3 text-[var(--verde)]" />{headCoach.email}</span>
              )}
            </div>
          </div>
        </div>

        {/* Edit team form */}
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="fgb-card p-6">
            <p className="fgb-label text-[var(--gray)] mb-5" style={{ fontSize: 10 }}>Dados cadastrais</p>
            <form action={updateTeam} className="space-y-4">
              <input type="hidden" name="id" value={team.id} />

              <div>
                <label className={labelCls}>Nome da equipe</label>
                <input name="name" defaultValue={team.name} required className={inputCls} />
              </div>

              <div>
                <FileUpload
                  fieldName="logoUrl"
                  currentUrl={logoUrl}
                  label="Escudo / Logotipo"
                  accept="image/*"
                  variant="photo"
                  onUrlChange={(url) => setLogoUrl(url)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Cidade</label>
                  <input name="city" defaultValue={team.city ?? ''} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>UF</label>
                  <select name="state" defaultValue={team.state ?? 'RS'} className={inputCls}>
                    {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Modalidade</label>
                  <select name="sex" defaultValue={team.sex ?? 'masculino'} className={inputCls}>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Telefone / WhatsApp</label>
                  <input name="phone" defaultValue={team.phone ?? ''} className={inputCls} />
                </div>
              </div>

              <button type="submit" className="fgb-btn-primary h-11 rounded-xl w-full inline-flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Salvar alterações
              </button>
            </form>
          </div>

          {/* Athletes list */}
          <div className="space-y-4">
            <div className="fgb-card p-5">
              <div className="flex items-center justify-between mb-3 gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Atletas da equipe</p>
                  <h2 className="fgb-display text-xl text-[var(--black)] mt-1">Por categoria</h2>
                </div>
                <span className="text-[10px] font-black uppercase text-[var(--gray)]">
                  {athletes.length} total
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gray)]" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar por nome, CPF, posição, nº..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-[var(--border)] bg-white text-sm focus:outline-none focus:border-[var(--verde)]"
                />
              </div>
            </div>

            {grouped.length === 0 ? (
              <div className="fgb-card p-10 text-center">
                <UserIcon className="w-10 h-10 text-[var(--gray)] mx-auto opacity-30" />
                <p className="mt-3 text-sm text-[var(--gray)]">
                  {athletes.length === 0
                    ? 'Nenhum atleta vinculado a esta equipe.'
                    : `Nenhum atleta encontrado para "${query}".`}
                </p>
              </div>
            ) : (
              grouped.map(([category, list]) => (
                <div key={category} className="fgb-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--gray-l)] flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--black)]">{category}</p>
                    <span className="text-[10px] font-black uppercase text-[var(--gray)]">{list.length} atleta(s)</span>
                  </div>
                  <div className="divide-y divide-[var(--border)] bg-white">
                    {list.map(a => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setOpen(a)}
                        className="w-full px-5 py-3 flex items-center gap-3 hover:bg-[var(--gray-l)] transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--gray-l)] overflow-hidden flex items-center justify-center shrink-0">
                          {a.photoUrl ? (
                            <img src={a.photoUrl} alt={a.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-[var(--gray)]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-black uppercase text-[var(--black)] truncate">{a.name}</p>
                            {a.jerseyNumber != null && (
                              <span className="text-[10px] font-black text-[var(--verde)]">#{a.jerseyNumber}</span>
                            )}
                            {a.position && (
                              <span className="text-[10px] font-bold text-[var(--gray)] uppercase">{a.position}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-[var(--gray)] truncate mt-0.5">
                            {a.document || a.cpf || 'Sem documento'}
                            {a.email ? ` · ${a.email}` : ''}
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                          style={a.federationStatus === 'ACTIVE'
                            ? { background: 'rgba(27,115,64,0.12)', color: 'var(--verde)', border: '1px solid rgba(27,115,64,0.25)' }
                            : { background: 'rgba(180,0,0,0.08)', color: '#b44', border: '1px solid rgba(180,0,0,0.2)' }
                          }>
                          {a.federationStatus === 'ACTIVE' ? 'FGB' : 'Liberado'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[var(--gray)] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AthleteDrawer
        athlete={open}
        onClose={() => setOpen(null)}
        editHref={(id) => `/admin/athletes/${id}`}
      />
    </>
  )
}
