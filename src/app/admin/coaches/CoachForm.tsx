'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ROLES = [
  'Técnico', 'Técnico Auxiliar', 'Preparador Físico',
  'Fisioterapeuta', 'Médico', 'Dirigente', 'Massagista', 'Outros',
]

type Team = { id: string; name: string }
type Coach = {
  id?: string; teamId: string; name: string; email?: string | null; role: string; crefi?: string | null
  sex?: string | null; birthDate?: Date | null; rg?: string | null; cpf?: string | null
  cep?: string | null; state?: string | null; city?: string | null; address?: string | null
  addressNum?: string | null; addressComp?: string | null; fatherName?: string | null
  motherName?: string | null; phone?: string | null; phone2?: string | null; mobile?: string | null
  notes?: string | null; photoUrl?: string | null; isActive?: boolean; situation?: string
}

export default function CoachForm({ teams, coach }: { teams: Team[]; coach?: Coach }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({
    teamId: coach?.teamId || '',
    name: coach?.name || '',
    email: coach?.email || '',
    role: coach?.role || 'Técnico',
    crefi: coach?.crefi || '',
    sex: coach?.sex || '',
    birthDate: coach?.birthDate ? new Date(coach.birthDate).toISOString().split('T')[0] : '',
    rg: coach?.rg || '',
    cpf: coach?.cpf || '',
    cep: coach?.cep || '',
    state: coach?.state || 'RS',
    city: coach?.city || '',
    address: coach?.address || '',
    addressNum: coach?.addressNum || '',
    addressComp: coach?.addressComp || '',
    fatherName: coach?.fatherName || '',
    motherName: coach?.motherName || '',
    phone: coach?.phone || '',
    phone2: coach?.phone2 || '',
    mobile: coach?.mobile || '',
    notes: coach?.notes || '',
    photoUrl: coach?.photoUrl || '',
    situation: coach?.situation || 'ACTIVE',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const url = coach?.id ? `/api/admin/coaches/${coach.id}` : '/api/admin/coaches'
    const method = coach?.id ? 'PATCH' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, isActive: form.situation === 'ACTIVE' }) })
    router.push('/admin/coaches')
    router.refresh()
  }

  const inputCls = 'h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm w-full focus:outline-none focus:border-[var(--verde)]'
  const labelCls = 'text-[10px] font-black uppercase tracking-widest text-[var(--gray)]'

  const Field = ({ label, name, type = 'text', span = 1 }: { label: string; name: string; type?: string; span?: number }) => (
    <div className={span > 1 ? `sm:col-span-${span}` : ''}>
      <label className={labelCls}>{label}</label>
      <input type={type} value={form[name]} onChange={set(name)} className={`mt-1 ${inputCls}`} />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seção 1 — Identificação */}
      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Identificação</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nome completo *</label>
            <input required value={form.name} onChange={set('name')} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Clube *</label>
            <select required value={form.teamId} onChange={set('teamId')} className={`mt-1 ${inputCls}`}>
              <option value="">Selecione o clube</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Função *</label>
            <select required value={form.role} onChange={set('role')} className={`mt-1 ${inputCls}`}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>CREFI <span className="normal-case font-normal">(Reg. CREF/I)</span></label>
            <input value={form.crefi} onChange={set('crefi')} className={`mt-1 ${inputCls}`} placeholder="Ex: 012345-G/RS" />
          </div>
          <div>
            <label className={labelCls}>Sexo</label>
            <select value={form.sex} onChange={set('sex')} className={`mt-1 ${inputCls}`}>
              <option value="">Selecione</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
          </div>
          <Field label="Data de Nascimento" name="birthDate" type="date" />
          <div>
            <label className={labelCls}>Situação</label>
            <select value={form.situation} onChange={set('situation')} className={`mt-1 ${inputCls}`}>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
            </select>
          </div>
        </div>
      </section>

      {/* Seção 2 — Documentos */}
      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Documentos</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CPF" name="cpf" />
          <Field label="RG" name="rg" />
        </div>
      </section>

      {/* Seção 3 — Endereço */}
      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Endereço</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="CEP" name="cep" />
          <Field label="Estado" name="state" />
          <Field label="Cidade" name="city" />
          <Field label="Endereço" name="address" span={2} />
          <Field label="Número" name="addressNum" />
          <Field label="Complemento" name="addressComp" span={3} />
        </div>
      </section>

      {/* Seção 4 — Família */}
      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Família</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome do Pai" name="fatherName" />
          <Field label="Nome da Mãe" name="motherName" />
        </div>
      </section>

      {/* Seção 5 — Contato */}
      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Contato</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Celular" name="mobile" />
          <Field label="Telefone 1" name="phone" />
          <Field label="Telefone 2" name="phone2" />
          <Field label="E-mail" name="email" type="email" span={3} />
          <Field label="URL da Foto" name="photoUrl" span={3} />
        </div>
      </section>

      {/* Seção 6 — Observações */}
      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Observações</p>
        <textarea value={form.notes} onChange={set('notes')} rows={3}
          className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--verde)]" />
      </section>

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()}
          className="h-11 rounded-xl border border-[var(--border)] px-6 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] hover:border-[var(--black)]">
          Cancelar
        </button>
        <button type="submit" disabled={saving}
          className="h-11 flex-1 rounded-xl bg-[var(--verde)] text-[10px] font-black uppercase tracking-widest text-white hover:bg-[var(--verde)]/90 disabled:opacity-60">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
