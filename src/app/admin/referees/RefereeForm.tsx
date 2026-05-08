'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Category = { id: string; name: string }
type Referee = {
  id?: string; name: string; licenseNumber?: string | null; email?: string | null
  phone?: string | null; mobile?: string | null; city?: string | null; state?: string | null
  status?: string; registrationNumber?: number | null; sex?: string | null
  birthDate?: Date | null; rg?: string | null; cpf?: string | null; cep?: string | null
  address?: string | null; motherName?: string | null; notes?: string | null
  photoUrl?: string | null; isActive?: boolean; categoryId?: string | null
}

export default function RefereeForm({ categories, referee }: { categories: Category[]; referee?: Referee }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({
    name: referee?.name || '',
    licenseNumber: referee?.licenseNumber || '',
    email: referee?.email || '',
    phone: referee?.phone || '',
    mobile: referee?.mobile || '',
    city: referee?.city || '',
    state: referee?.state || 'RS',
    status: referee?.status || 'ACTIVE',
    registrationNumber: referee?.registrationNumber?.toString() || '',
    sex: referee?.sex || '',
    birthDate: referee?.birthDate ? new Date(referee.birthDate).toISOString().split('T')[0] : '',
    rg: referee?.rg || '',
    cpf: referee?.cpf || '',
    cep: referee?.cep || '',
    address: referee?.address || '',
    motherName: referee?.motherName || '',
    notes: referee?.notes || '',
    photoUrl: referee?.photoUrl || '',
    categoryId: referee?.categoryId || '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const url = referee?.id ? `/api/admin/referees/${referee.id}` : '/api/admin/referees'
    const method = referee?.id ? 'PATCH' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    router.push('/admin/referees')
    router.refresh()
  }

  const inputCls = 'h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm w-full focus:outline-none focus:border-[var(--verde)]'
  const labelCls = 'text-[10px] font-black uppercase tracking-widest text-[var(--gray)]'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Identificação</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nome completo *</label>
            <input required value={form.name} onChange={set('name')} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Categoria de Arbitragem</label>
            <select value={form.categoryId} onChange={set('categoryId')} className={`mt-1 ${inputCls}`}>
              <option value="">Sem categoria</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Nº Registro / Licença</label>
            <input value={form.licenseNumber} onChange={set('licenseNumber')} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Sexo</label>
            <select value={form.sex} onChange={set('sex')} className={`mt-1 ${inputCls}`}>
              <option value="">Selecione</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Data de Nascimento</label>
            <input type="date" value={form.birthDate} onChange={set('birthDate')} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={set('status')} className={`mt-1 ${inputCls}`}>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Documentos</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={labelCls}>CPF</label><input value={form.cpf} onChange={set('cpf')} className={`mt-1 ${inputCls}`} /></div>
          <div><label className={labelCls}>RG</label><input value={form.rg} onChange={set('rg')} className={`mt-1 ${inputCls}`} /></div>
        </div>
      </section>

      <section className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Endereço e Contato</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className={labelCls}>CEP</label><input value={form.cep} onChange={set('cep')} className={`mt-1 ${inputCls}`} /></div>
          <div><label className={labelCls}>Estado</label><input value={form.state} onChange={set('state')} className={`mt-1 ${inputCls}`} /></div>
          <div><label className={labelCls}>Cidade</label><input value={form.city} onChange={set('city')} className={`mt-1 ${inputCls}`} /></div>
          <div className="sm:col-span-3"><label className={labelCls}>Endereço</label><input value={form.address} onChange={set('address')} className={`mt-1 ${inputCls}`} /></div>
          <div><label className={labelCls}>Celular</label><input value={form.mobile} onChange={set('mobile')} className={`mt-1 ${inputCls}`} /></div>
          <div><label className={labelCls}>Telefone</label><input value={form.phone} onChange={set('phone')} className={`mt-1 ${inputCls}`} /></div>
          <div><label className={labelCls}>E-mail</label><input type="email" value={form.email} onChange={set('email')} className={`mt-1 ${inputCls}`} /></div>
          <div><label className={labelCls}>Nome da Mãe</label><input value={form.motherName} onChange={set('motherName')} className={`mt-1 ${inputCls}`} /></div>
          <div className="sm:col-span-2"><label className={labelCls}>URL da Foto</label><input value={form.photoUrl} onChange={set('photoUrl')} className={`mt-1 ${inputCls}`} /></div>
        </div>
      </section>

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
