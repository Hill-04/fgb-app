'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Pencil, Plus, Shield, Trash2 } from 'lucide-react'

type Category = { id: string; name: string }
type Team = { id: string; name: string }

type BlockedDateEntry = {
  id?: string
  startDate: string
  endDate: string
  reason?: string | null
  affectsAllCats?: boolean
}

type AthleteEntry = {
  id?: string
  athleteName: string
  athleteDoc?: string | null
  categoryIds: string[]
}

type Registration = {
  id: string
  team: { id: string; name: string }
  categories: Category[]
  status: 'PENDING' | 'CONFIRMED'
  observations?: string | null
  coachName?: string | null
  coachPhone?: string | null
  coachEmail?: string | null
  coachMultiTeam?: boolean
  blockedDates: BlockedDateEntry[]
  athletePlayers: Array<Omit<AthleteEntry, 'categoryIds'> & { categoryIds: string | string[] }>
}

type Championship = {
  id: string
  name: string
  regDeadline: string | null
  status: string
}

const emptyBlockedDraft = {
  startDate: '',
  endDate: '',
  reason: '',
  affectsAllCats: false,
}

const emptyAthleteDraft = {
  athleteName: '',
  athleteDoc: '',
  categoryIds: [] as string[],
}

export default function RegistrationsPage() {
  const params = useParams()
  const id = params.id as string

  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [championship, setChampionship] = useState<Championship | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingReg, setEditingReg] = useState<Registration | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const [formTeamId, setFormTeamId] = useState('')
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([])
  const [formStatus, setFormStatus] = useState<'PENDING' | 'CONFIRMED'>('PENDING')
  const [observations, setObservations] = useState('')
  const [coachName, setCoachName] = useState('')
  const [coachPhone, setCoachPhone] = useState('')
  const [coachEmail, setCoachEmail] = useState('')
  const [coachMultiTeam, setCoachMultiTeam] = useState(false)
  const [blockedDates, setBlockedDates] = useState<BlockedDateEntry[]>([])
  const [athletePlayers, setAthletePlayers] = useState<AthleteEntry[]>([])
  const [blockedDraft, setBlockedDraft] = useState(emptyBlockedDraft)
  const [athleteDraft, setAthleteDraft] = useState(emptyAthleteDraft)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [registrationsResponse, teamsResponse, championshipResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/championships/${id}/registrations`),
          fetch('/api/admin/teams'),
          fetch(`/api/championships/${id}`),
          fetch(`/api/championships/${id}/categories`),
        ])

        if (registrationsResponse.ok) {
          setRegistrations(await registrationsResponse.json())
        }
        if (teamsResponse.ok) {
          setAllTeams(await teamsResponse.json())
        }
        if (championshipResponse.ok) {
          setChampionship(await championshipResponse.json())
        }
        if (categoriesResponse.ok) {
          setAllCategories(await categoriesResponse.json())
        }
      } catch (error) {
        console.error('Error loading registrations page:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const registrationStatus = useMemo(() => {
    const now = new Date()
    if (!championship?.regDeadline) {
      return { label: 'Prazo não definido', className: 'text-orange-600 bg-orange-50 border-orange-200' }
    }

    return new Date(championship.regDeadline) > now
      ? { label: 'Inscrições Abertas', className: 'text-green-600 bg-green-50 border-green-200' }
      : { label: 'Inscrições Encerradas', className: 'text-red-600 bg-red-50 border-red-200' }
  }, [championship])

  const resetForm = () => {
    setEditingReg(null)
    setFormTeamId('')
    setFormCategoryIds([])
    setFormStatus('PENDING')
    setObservations('')
    setCoachName('')
    setCoachPhone('')
    setCoachEmail('')
    setCoachMultiTeam(false)
    setBlockedDates([])
    setAthletePlayers([])
    setBlockedDraft(emptyBlockedDraft)
    setAthleteDraft(emptyAthleteDraft)
    setFormError('')
  }

  const refreshRegistrations = async () => {
    const response = await fetch(`/api/championships/${id}/registrations`)
    if (response.ok) {
      setRegistrations(await response.json())
    }
  }

  const openNew = () => {
    resetForm()
    setShowModal(true)
  }

  const openEdit = (registration: Registration) => {
    resetForm()
    setEditingReg(registration)
    setFormTeamId(registration.team.id)
    setFormCategoryIds(registration.categories.map((category) => category.id))
    setFormStatus(registration.status)
    setObservations(registration.observations || '')
    setCoachName(registration.coachName || '')
    setCoachPhone(registration.coachPhone || '')
    setCoachEmail(registration.coachEmail || '')
    setCoachMultiTeam(Boolean(registration.coachMultiTeam))
    setBlockedDates(
      (registration.blockedDates || []).map((blockedDate) => ({
        id: blockedDate.id,
        startDate: blockedDate.startDate.slice(0, 10),
        endDate: blockedDate.endDate.slice(0, 10),
        reason: blockedDate.reason || '',
        affectsAllCats: blockedDate.affectsAllCats ?? false,
      }))
    )
    setAthletePlayers(
      (registration.athletePlayers || []).map((athlete) => ({
        id: athlete.id,
        athleteName: athlete.athleteName,
        athleteDoc: athlete.athleteDoc || '',
        categoryIds:
          typeof athlete.categoryIds === 'string'
            ? (() => {
                try {
                  const parsed = JSON.parse(athlete.categoryIds)
                  return Array.isArray(parsed) ? parsed.map(String) : []
                } catch {
                  return []
                }
              })()
            : athlete.categoryIds,
      }))
    )
    setShowModal(true)
  }

  const handleDelete = async (registrationId: string) => {
    if (!confirm('Deseja realmente excluir esta inscrição?')) {
      return
    }

    const response = await fetch(`/api/championships/${id}/registrations/${registrationId}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      await refreshRegistrations()
      return
    }

    alert('Erro ao excluir inscrição.')
  }

  const handleAddBlockedDate = () => {
    if (!blockedDraft.startDate || !blockedDraft.endDate) {
      setFormError('Informe data inicial e final do período bloqueado.')
      return
    }

    setBlockedDates((current) => [
      ...current,
      {
        startDate: blockedDraft.startDate,
        endDate: blockedDraft.endDate,
        reason: blockedDraft.reason,
        affectsAllCats: blockedDraft.affectsAllCats,
      },
    ])
    setBlockedDraft(emptyBlockedDraft)
    setFormError('')
  }

  const handleAddAthlete = () => {
    if (!athleteDraft.athleteName || athleteDraft.categoryIds.length === 0) {
      setFormError('Informe o nome do atleta e selecione ao menos uma categoria.')
      return
    }

    setAthletePlayers((current) => [
      ...current,
      {
        athleteName: athleteDraft.athleteName,
        athleteDoc: athleteDraft.athleteDoc,
        categoryIds: athleteDraft.categoryIds,
      },
    ])
    setAthleteDraft(emptyAthleteDraft)
    setFormError('')
  }

  const handleSubmit = async () => {
    if (!formTeamId) {
      setFormError('Selecione uma equipe.')
      return
    }
    if (formCategoryIds.length === 0) {
      setFormError('Selecione ao menos uma categoria.')
      return
    }

    setSubmitLoading(true)
    setFormError('')

    const payload = {
      teamId: formTeamId,
      categoryIds: formCategoryIds,
      status: formStatus,
      observations,
      coachName,
      coachPhone,
      coachEmail,
      coachMultiTeam,
      blockedDates,
      athletePlayers,
    }

    const response = await fetch(
      editingReg
        ? `/api/championships/${id}/registrations/${editingReg.id}`
        : `/api/championships/${id}/registrations`,
      {
        method: editingReg ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setFormError(data.error || 'Erro ao salvar inscrição.')
      setSubmitLoading(false)
      return
    }

    await refreshRegistrations()
    setSubmitLoading(false)
    setShowModal(false)
    resetForm()
  }

  if (loading || !championship) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--verde)]" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gray)]">Carregando inscrições</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="fgb-display text-4xl text-[var(--black)] leading-none">Inscrições</h2>
          <p className="fgb-label mt-1 text-[var(--gray)]" style={{ fontSize: 10, letterSpacing: 2 }}>
            {registrations.length} equipe(s) inscrita(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest shadow-sm ${registrationStatus.className}`}>
            {registrationStatus.label}
          </span>
          <button
            onClick={openNew}
            className="flex h-11 items-center gap-2 rounded-xl bg-[var(--amarelo)] px-5 text-[10px] font-black uppercase tracking-widest text-[var(--black)] shadow-sm transition-all hover:bg-[#E66000]"
          >
            <Plus className="h-4 w-4" />
            Adicionar Inscrição
          </button>
        </div>
      </div>

      <div className="fgb-card overflow-hidden bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-[var(--gray-l)]">
            <tr className="border-b border-[var(--border)]">
              <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Equipe</th>
              <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Categorias</th>
              <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Restrições</th>
              <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Status</th>
              <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Ações</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((registration) => (
              <tr key={registration.id} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--gray-l)]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-100 bg-orange-50">
                      <Shield className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase text-[var(--black)]">{registration.team.name}</p>
                      <p className="text-[10px] text-[var(--gray)]">
                        {registration.coachName ? `Técnico: ${registration.coachName}` : 'Sem técnico informado'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {registration.categories.map((category) => (
                      <span
                        key={category.id}
                        className="rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-[8px] font-black uppercase tracking-widest text-[var(--gray)] shadow-sm"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1 text-[10px] text-[var(--gray)]">
                    <p>{registration.blockedDates?.length || 0} bloqueio(s)</p>
                    <p>{registration.athletePlayers?.length || 0} atleta(s) multi-cat</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm ${
                      registration.status === 'CONFIRMED'
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-orange-200 bg-orange-50 text-orange-600'
                    }`}
                  >
                    {registration.status === 'CONFIRMED' ? 'Confirmado' : 'Pendente'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(registration)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--gray)] transition-all hover:bg-orange-50 hover:text-orange-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(registration.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--gray)] transition-all hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {registrations.length === 0 && (
          <div className="p-16 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
              Nenhuma inscrição cadastrada ainda
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-2xl">
            <div className="border-b border-[var(--border)] bg-[var(--gray-l)] px-8 py-6">
              <h3 className="fgb-display text-3xl text-[var(--black)] leading-none">
                {editingReg ? 'Editar Inscrição' : 'Nova Inscrição'}
              </h3>
              <p className="fgb-label mt-1 text-[var(--gray)]" style={{ fontSize: 10, letterSpacing: 2 }}>
                Gestão completa de logística, bloqueios e atletas multi-categoria
              </p>
            </div>

            <div className="max-h-[70vh] space-y-8 overflow-y-auto px-8 py-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Equipe</label>
                  <select
                    disabled={Boolean(editingReg)}
                    value={formTeamId}
                    onChange={(event) => setFormTeamId(event.target.value)}
                    className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--gray-l)] px-4 text-sm font-bold text-[var(--black)] outline-none focus:border-[var(--verde)] disabled:opacity-60"
                  >
                    <option value="">Selecionar equipe...</option>
                    {allTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Status</label>
                  <div className="flex gap-2">
                    {(['PENDING', 'CONFIRMED'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormStatus(status)}
                        className={`flex-1 rounded-xl border px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                          formStatus === status
                            ? status === 'CONFIRMED'
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : 'border-orange-200 bg-orange-50 text-orange-600'
                            : 'border-[var(--border)] bg-white text-[var(--gray)]'
                        }`}
                      >
                        {status === 'CONFIRMED' ? 'Confirmado' : 'Pendente'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <section className="space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gray)]">Categorias</p>
                  <h4 className="mt-1 text-lg font-black text-[var(--black)]">Selecione as categorias da equipe</h4>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  {allCategories.map((category) => {
                    const active = formCategoryIds.includes(category.id)
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() =>
                          setFormCategoryIds((current) =>
                            active ? current.filter((categoryId) => categoryId !== category.id) : [...current, category.id]
                          )
                        }
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                          active
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-[var(--border)] bg-white text-[var(--gray)]'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest">{category.name}</span>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4 rounded-[24px] border border-[var(--border)] bg-[var(--gray-l)] p-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gray)]">Responsável</p>
                    <h4 className="mt-1 text-lg font-black text-[var(--black)]">Dados do técnico</h4>
                  </div>
                  <input value={coachName} onChange={(event) => setCoachName(event.target.value)} placeholder="Nome do técnico" className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[var(--verde)]" />
                  <input value={coachPhone} onChange={(event) => setCoachPhone(event.target.value)} placeholder="Telefone" className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[var(--verde)]" />
                  <input value={coachEmail} onChange={(event) => setCoachEmail(event.target.value)} placeholder="E-mail" className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[var(--verde)]" />
                  <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--gray)]">
                    <input type="checkbox" checked={coachMultiTeam} onChange={(event) => setCoachMultiTeam(event.target.checked)} />
                    Este técnico comanda outras equipes neste campeonato
                  </label>
                </div>

                <div className="space-y-4 rounded-[24px] border border-[var(--border)] bg-[var(--gray-l)] p-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gray)]">Observações</p>
                    <h4 className="mt-1 text-lg font-black text-[var(--black)]">Restrições gerais da equipe</h4>
                  </div>
                  <textarea
                    value={observations}
                    onChange={(event) => setObservations(event.target.value)}
                    rows={7}
                    placeholder="Descreva ginásio, logística, observações médicas ou outras restrições relevantes."
                    className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--verde)]"
                  />
                </div>
              </section>

              <section className="space-y-5 rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gray)]">Datas Bloqueadas</p>
                    <h4 className="mt-1 text-lg font-black text-[var(--black)]">Adicionar período bloqueado</h4>
                    <p className="text-sm text-[var(--gray)]">Ative a opção abaixo se a equipe não puder comparecer de forma alguma na data informada.</p>
                  </div>
                  <button type="button" onClick={handleAddBlockedDate} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--black)] px-4 text-[10px] font-black uppercase tracking-widest text-white">
                    <Plus className="h-4 w-4" />
                    Adicionar Período Bloqueado
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <input type="date" value={blockedDraft.startDate} onChange={(event) => setBlockedDraft((current) => ({ ...current, startDate: event.target.value }))} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none focus:border-[var(--verde)]" />
                  <input type="date" value={blockedDraft.endDate} onChange={(event) => setBlockedDraft((current) => ({ ...current, endDate: event.target.value }))} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none focus:border-[var(--verde)]" />
                  <input value={blockedDraft.reason} onChange={(event) => setBlockedDraft((current) => ({ ...current, reason: event.target.value }))} placeholder="Motivo (opcional)" className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none focus:border-[var(--verde)] md:col-span-2" />
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-3 text-sm text-[var(--gray)]">
                  <input type="checkbox" checked={blockedDraft.affectsAllCats} onChange={(event) => setBlockedDraft((current) => ({ ...current, affectsAllCats: event.target.checked }))} />
                  Afeta todas as categorias desta equipe?
                </label>

                <div className="space-y-2">
                  {blockedDates.length === 0 && <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-4 text-sm text-[var(--gray)]">Nenhum bloqueio cadastrado ainda.</p>}
                  {blockedDates.map((blockedDate, index) => (
                    <div key={`${blockedDate.startDate}-${blockedDate.endDate}-${index}`} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-3">
                      <div>
                        <p className="text-sm font-black text-[var(--black)]">{blockedDate.startDate} até {blockedDate.endDate}</p>
                        <p className="text-[10px] text-[var(--gray)]">{blockedDate.reason || 'Sem motivo informado'}{blockedDate.affectsAllCats ? ' · Afeta todas as categorias' : ''}</p>
                      </div>
                      <button type="button" onClick={() => setBlockedDates((current) => current.filter((_, currentIndex) => currentIndex !== index))} className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--gray)] transition-all hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-5 rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gray)]">Atletas em Múltiplas Categorias</p>
                    <h4 className="mt-1 text-lg font-black text-[var(--black)]">Adicionar atleta multi-categoria</h4>
                  </div>
                  <button type="button" onClick={handleAddAthlete} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--amarelo)] px-4 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">
                    <Plus className="h-4 w-4" />
                    Adicionar Atleta
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <input value={athleteDraft.athleteName} onChange={(event) => setAthleteDraft((current) => ({ ...current, athleteName: event.target.value }))} placeholder="Nome do atleta" className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none focus:border-[var(--verde)]" />
                  <input value={athleteDraft.athleteDoc} onChange={(event) => setAthleteDraft((current) => ({ ...current, athleteDoc: event.target.value }))} placeholder="Documento (CPF/RG)" className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none focus:border-[var(--verde)]" />
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  {allCategories.map((category) => {
                    const selected = athleteDraft.categoryIds.includes(category.id)
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() =>
                          setAthleteDraft((current) => ({
                            ...current,
                            categoryIds: selected
                              ? current.categoryIds.filter((categoryId) => categoryId !== category.id)
                              : [...current.categoryIds, category.id],
                          }))
                        }
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                          selected
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-[var(--border)] bg-[var(--gray-l)] text-[var(--gray)]'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest">{category.name}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="space-y-2">
                  {athletePlayers.length === 0 && <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-4 text-sm text-[var(--gray)]">Nenhum atleta multi-categoria cadastrado ainda.</p>}
                  {athletePlayers.map((athlete, index) => (
                    <div key={`${athlete.athleteName}-${index}`} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-3">
                      <div>
                        <p className="text-sm font-black text-[var(--black)]">{athlete.athleteName}</p>
                        <p className="text-[10px] text-[var(--gray)]">
                          {athlete.athleteDoc || 'Sem documento'} ·{' '}
                          {athlete.categoryIds.map((categoryId) => allCategories.find((category) => category.id === categoryId)?.name || categoryId).join(', ')}
                        </p>
                      </div>
                      <button type="button" onClick={() => setAthletePlayers((current) => current.filter((_, currentIndex) => currentIndex !== index))} className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--gray)] transition-all hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {formError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-600">
                  {formError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--gray-l)] px-8 py-5">
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] transition-all hover:text-[var(--black)]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitLoading}
                className="rounded-xl bg-[var(--black)] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-60"
              >
                {submitLoading ? 'Salvando...' : 'Salvar inscrição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
