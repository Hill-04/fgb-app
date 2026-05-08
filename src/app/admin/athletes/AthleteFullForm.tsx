'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']

type Team = { id: string; name: string }
type Category = { id: string; name: string }
type Athlete = {
  id?: string; name?: string; sex?: string | null; birthDate?: Date | null
  birthCity?: string | null; nationality?: string | null; education?: string | null
  maritalStatus?: string | null; cpf?: string | null; rg?: string | null
  rgOrgan?: string | null; rgDate?: Date | null; cep?: string | null
  state?: string | null; city?: string | null; address?: string | null
  addressNum?: string | null; addressComp?: string | null; fatherName?: string | null
  motherName?: string | null; phone?: string | null; mobile?: string | null
  email?: string; teamId?: string | null; position?: string | null
  height?: number | null; weight?: number | null; shirtNumber?: number | null
  jerseyNumber?: number | null; situation?: string; notes?: string | null; photoUrl?: string | null
}

export default function AthleteFullForm({
  teams, categories, athlete,
}: {
  teams: Team[]; categories: Category[]; athlete?: Athlete
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({
    name: athlete?.name || '',
    sex: athlete?.sex || 'Masculino',
    birthDate: athlete?.birthDate ? new Date(athlete.birthDate).toISOString().split('T')[0] : '',
    birthCity: athlete?.birthCity || '',
    nationality: athlete?.nationality || 'Brasileira',
    education: athlete?.education || '',
    maritalStatus: athlete?.maritalStatus || '',
    cpf: athlete?.cpf || '',
    rg: athlete?.rg || '',
    rgOrgan: athlete?.rgOrgan || '',
    rgDate: athlete?.rgDate ? new Date(athlete.rgDate).toISOString().split('T')[0] : '',
    cep: athlete?.cep || '',
    state: athlete?.state || 'RS',
    city: athlete?.city || '',
    address: athlete?.address || '',
    addressNum: athlete?.addressNum || '',
    addressComp: athlete?.addressComp || '',
    fatherName: athlete?.fatherName || '',
    motherName: athlete?.motherName || '',
    phone: athlete?.phone || '',
    mobile: athlete?.mobile || '',
    teamId: athlete?.teamId || '',
    position: athlete?.position || '',
    height: athlete?.height?.toString() || '',
    weight: athlete?.weight?.toString() || '',
    shirtNumber: (athlete?.shirtNumber ?? athlete?.jerseyNumber)?.toString() || '',
    situation: athlete?.situation || 'PENDING',
    notes: athlete?.notes || '',
    photoUrl: athlete?.photoUrl || '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent, saveWithoutValidation = false) {
    e.preventDefault()
    setSaving(true)
    const url = athlete?.id ? `/api/admin/athletes` : '/api/admin/athletes'
    // For new athletes use POST to /api/admin/athletes; for edit use PATCH to /api/admin/athletes/[id]
    const method = athlete?.id ? 'PATCH' : 'POST'
    const endpoint = athlete?.id ? `/api/admin/athletes/${athlete.id}` : '/api/admin/athletes'
    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, saveWithoutValidation }),
    })
    router.push('/admin/athletes')
    router.refresh()
  }

  const inputCls = 'h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm w-full focus:outline-none focus:border-[var(--verde)]'
  const labelCls = 'text-[10px] font-black uppercase tracking-widest text-[var(--gray)]'

  const Field = ({ label, name, type = 'text', required = false }: { label: string; name: string; type?: string; required?: boolean }) => (
    <div>
      <label className={labelCls}>{label}{required && ' *'}</label>
      <input type={type} required={required} value={form[name]} onChange={set(name)} className={`mt-1 ${inputCls}`} />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seção 1 — Identificação */}
      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Identificação</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className={labelCls}>Nome completo *</label>
            <input required value={form.name} onChange={set('name')} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Foto (URL)</label>
            <input value={form.photoUrl} onChange={set('photoUrl')} className={`mt-1 ${inputCls}`} placeholder="https://..." />
          </div>
          <div>
            <label className={labelCls}>Sexo *</label>
            <select required value={form.sex} onChange={set('sex')} className={`mt-1 ${inputCls}`}>
              <option value="">Selecione</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
          </div>
          <Field label="Data de Nascimento" name="birthDate" type="date" />
          <Field label="Cidade Natal" name="birthCity" />
          <div>
            <label className={labelCls}>Nacionalidade</label>
            <input value={form.nationality} onChange={set('nationality')} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Estado Civil</label>
            <select value={form.maritalStatus} onChange={set('maritalStatus')} className={`mt-1 ${inputCls}`}>
              <option value="">Selecione</option>
              {['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'].map(m =>
                <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Grau de Instrução</label>
            <select value={form.education} onChange={set('education')} className={`mt-1 ${inputCls}`}>
              <option value="">Selecione</option>
              {['Fundamental Incompleto', 'Fundamental Completo', 'Médio Incompleto', 'Médio Completo', 'Superior Incompleto', 'Superior Completo', 'Pós-graduação'].map(e =>
                <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Situação</label>
            <select value={form.situation} onChange={set('situation')} className={`mt-1 ${inputCls}`}>
              <option value="PENDING">Pendente</option>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="TRANSFERRED">Transferido</option>
            </select>
          </div>
        </div>
      </section>

      {/* Seção 2 — Documentos */}
      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Documentos</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="CPF *" name="cpf" required />
          <Field label="RG *" name="rg" required />
          <Field label="Órgão Expedidor" name="rgOrgan" />
          <Field label="Data Emissão RG" name="rgDate" type="date" />
        </div>
      </section>

      {/* Seção 3 — Endereço */}
      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Endereço</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="CEP" name="cep" />
          <Field label="Estado" name="state" />
          <Field label="Cidade" name="city" />
          <div className="sm:col-span-2"><Field label="Endereço" name="address" /></div>
          <Field label="Número" name="addressNum" />
          <div className="sm:col-span-3"><Field label="Complemento" name="addressComp" /></div>
        </div>
      </section>

      {/* Seção 4 — Família */}
      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Família</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome do Pai *" name="fatherName" required />
          <Field label="Nome da Mãe *" name="motherName" required />
        </div>
      </section>

      {/* Seção 5 — Contato */}
      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Contato</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Celular *" name="mobile" required />
          <Field label="Telefone" name="phone" />
        </div>
      </section>

      {/* Seção 6 — Clube e Categoria */}
      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Clube e Dados Esportivos</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelCls}>Clube *</label>
            <select required value={form.teamId} onChange={set('teamId')} className={`mt-1 ${inputCls}`}>
              <option value="">Selecione o clube</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Posição</label>
            <select value={form.position} onChange={set('position')} className={`mt-1 ${inputCls}`}>
              <option value="">Selecione</option>
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Field label="Nº Camisa" name="shirtNumber" type="number" />
          <Field label="Altura (m)" name="height" type="number" />
          <Field label="Peso (kg)" name="weight" type="number" />
        </div>
      </section>

      {/* Seção 7 — Observações */}
      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Observações</p>
        <textarea value={form.notes} onChange={set('notes')} rows={3}
          className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--verde)]" />
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => router.back()}
          className="h-11 rounded-xl border border-[var(--border)] px-6 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] hover:border-[var(--black)]">
          Cancelar
        </button>
        <button type="submit" disabled={saving}
          className="h-11 flex-1 rounded-xl bg-[var(--verde)] text-[10px] font-black uppercase tracking-widest text-white hover:bg-[var(--verde)]/90 disabled:opacity-60">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        <button type="button" disabled={saving}
          onClick={e => handleSubmit(e as any, true)}
          className="h-11 rounded-xl border border-[var(--border)] px-5 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] hover:border-yellow-400 hover:text-yellow-600 disabled:opacity-60">
          Salvar sem validar
        </button>
      </div>
    </form>
  )
}
