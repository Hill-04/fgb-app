'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Send } from 'lucide-react'
import { toast } from 'sonner'

import { FileUpload } from '@/components/FileUpload'

type AthleteRequestFormData = {
  id?: string
  fullName?: string | null
  birthDate?: string | null
  documentNumber?: string | null
  cpf?: string | null
  rg?: string | null
  rgOrgan?: string | null
  rgDate?: string | null
  sex?: string | null
  nationality?: string | null
  maritalStatus?: string | null
  education?: string | null
  mobile?: string | null
  phone?: string | null
  email?: string | null
  motherName?: string | null
  fatherName?: string | null
  parentContactPhone?: string | null
  parentContactRole?: string | null
  photoUrl?: string | null
  docCPFFrontUrl?: string | null
  docCPFBackUrl?: string | null
  docRGFrontUrl?: string | null
  docRGBackUrl?: string | null
  docBirthCertUrl?: string | null
  docOtherUrl?: string | null
  cep?: string | null
  state?: string | null
  city?: string | null
  address?: string | null
  addressNum?: string | null
  addressComp?: string | null
  position?: string | null
  jerseyNumber?: number | string | null
  height?: number | string | null
  weight?: number | string | null
  requestedCategoryLabel?: string | null
  status?: string
}

type TeamAthleteRequestFormProps = {
  initialData?: AthleteRequestFormData
}

type FormState = {
  fullName: string
  requestedCategoryLabel: string
  birthDate: string
  sex: string
  nationality: string
  maritalStatus: string
  education: string
  cpf: string
  rg: string
  rgOrgan: string
  rgDate: string
  mobile: string
  email: string
  motherName: string
  fatherName: string
  parentContactPhone: string
  parentContactRole: 'MOTHER' | 'FATHER' | ''
  photoUrl: string
  docCPFFrontUrl: string
  docCPFBackUrl: string
  cep: string
  state: string
  city: string
  address: string
  addressNum: string
  addressComp: string
  position: string
  jerseyNumber: string
  height: string
  weight: string
  docRGFrontUrl: string
  docRGBackUrl: string
  docBirthCertUrl: string
  docOtherUrl: string
}

const inputClassName =
  'h-11 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--black)] outline-none transition-all focus:border-[var(--verde)]'

const selectClassName =
  'h-11 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--black)] outline-none transition-all focus:border-[var(--verde)]'

const labelClassName =
  'text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]'

const requiredHint = <span className="ml-1 text-[var(--red)]">*</span>

const sexOptions = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
]

const maritalStatusOptions = [
  'Solteiro(a)',
  'Casado(a)',
  'União estável',
  'Divorciado(a)',
  'Viúvo(a)',
]

const educationOptions = [
  'Ensino fundamental',
  'Ensino médio',
  'Ensino técnico',
  'Ensino superior',
  'Pós-graduação',
]

const positionOptions = ['Armador', 'Ala-armador', 'Ala', 'Ala-pivô', 'Pivô']

const ufOptions = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

function toStr(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

function toDateInput(v: unknown): string {
  if (!v) return ''
  const s = String(v)
  if (s.includes('T')) return s.slice(0, 10)
  return s
}

function buildInitialState(initial?: AthleteRequestFormData): FormState {
  return {
    fullName: toStr(initial?.fullName),
    requestedCategoryLabel: toStr(initial?.requestedCategoryLabel),
    birthDate: toDateInput(initial?.birthDate),
    sex: toStr(initial?.sex),
    nationality: toStr(initial?.nationality) || 'Brasileira',
    maritalStatus: toStr(initial?.maritalStatus),
    education: toStr(initial?.education),
    cpf: toStr(initial?.cpf) || toStr(initial?.documentNumber),
    rg: toStr(initial?.rg),
    rgOrgan: toStr(initial?.rgOrgan),
    rgDate: toDateInput(initial?.rgDate),
    mobile: toStr(initial?.mobile) || toStr(initial?.phone),
    email: toStr(initial?.email),
    motherName: toStr(initial?.motherName),
    fatherName: toStr(initial?.fatherName),
    parentContactPhone: toStr(initial?.parentContactPhone),
    parentContactRole:
      initial?.parentContactRole === 'MOTHER' || initial?.parentContactRole === 'FATHER'
        ? initial.parentContactRole
        : '',
    photoUrl: toStr(initial?.photoUrl),
    docCPFFrontUrl: toStr(initial?.docCPFFrontUrl),
    docCPFBackUrl: toStr(initial?.docCPFBackUrl),
    cep: toStr(initial?.cep),
    state: toStr(initial?.state),
    city: toStr(initial?.city),
    address: toStr(initial?.address),
    addressNum: toStr(initial?.addressNum),
    addressComp: toStr(initial?.addressComp),
    position: toStr(initial?.position),
    jerseyNumber: toStr(initial?.jerseyNumber),
    height: toStr(initial?.height),
    weight: toStr(initial?.weight),
    docRGFrontUrl: toStr(initial?.docRGFrontUrl),
    docRGBackUrl: toStr(initial?.docRGBackUrl),
    docBirthCertUrl: toStr(initial?.docBirthCertUrl),
    docOtherUrl: toStr(initial?.docOtherUrl),
  }
}

function SectionHeader({
  index,
  total,
  icon,
  title,
  optional,
}: {
  index: number
  total: number
  icon: string
  title: string
  optional?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xl leading-none" aria-hidden>
          {icon}
        </span>
        <div>
          <p className="fgb-label text-[var(--verde)]" style={{ fontSize: 10 }}>
            Seção {index} de {total}
          </p>
          <h2 className="fgb-display text-xl leading-none text-[var(--black)]">{title}</h2>
        </div>
      </div>
      {optional && (
        <span className="rounded-full border border-[var(--border)] bg-[var(--gray-l)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
          Opcional
        </span>
      )}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm space-y-5">
      {children}
    </section>
  )
}

export function TeamAthleteRequestForm({ initialData }: TeamAthleteRequestFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [pendingIntent, setPendingIntent] = useState<'draft' | 'submit' | null>(null)
  const [form, setForm] = useState<FormState>(() => buildInitialState(initialData))

  const isEditing = Boolean(initialData?.id)
  const SECTIONS_TOTAL = 9

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const validate = (intent: 'draft' | 'submit'): string => {
    // Rascunho: só nome é obrigatório (deixa equipe salvar incompleto)
    if (!form.fullName.trim()) return 'Informe o nome completo do atleta.'
    if (intent === 'draft') return ''

    // Submit: validar todos os obrigatórios
    if (!form.birthDate) return 'Informe a data de nascimento.'
    if (!form.sex) return 'Selecione o sexo do atleta.'
    if (!form.nationality.trim()) return 'Informe a nacionalidade.'
    if (!form.maritalStatus) return 'Selecione o estado civil.'
    if (!form.education) return 'Selecione a escolaridade.'
    if (!form.cpf.trim()) return 'Informe o CPF.'
    if (!form.rg.trim()) return 'Informe o RG.'
    if (!form.rgOrgan.trim()) return 'Informe o órgão expedidor do RG.'
    if (!form.rgDate) return 'Informe a data de emissão do RG.'
    if (!form.mobile.trim()) return 'Informe o celular de contato.'
    if (!form.motherName.trim()) return 'Informe o nome da mãe.'
    if (!form.fatherName.trim()) return 'Informe o nome do pai.'
    if (!form.parentContactPhone.trim()) return 'Informe o telefone de contato da filiação.'
    if (!form.parentContactRole) return 'Selecione se o contato é da mãe ou do pai.'
    if (!form.photoUrl) return 'Envie a foto do atleta.'
    if (!form.docCPFFrontUrl) return 'Envie a foto do CPF (frente).'
    if (!form.docCPFBackUrl) return 'Envie a foto do CPF (verso).'
    return ''
  }

  const buildPayload = () => ({
    fullName: form.fullName,
    // documentNumber é o identificador-chave usado pelo backend (mantemos = CPF)
    documentNumber: form.cpf || form.rg,
    cpf: form.cpf || null,
    rg: form.rg || null,
    rgOrgan: form.rgOrgan || null,
    rgDate: form.rgDate || null,
    birthDate: form.birthDate,
    sex: form.sex || null,
    nationality: form.nationality || null,
    maritalStatus: form.maritalStatus || null,
    education: form.education || null,
    mobile: form.mobile || null,
    phone: form.mobile || null, // compat: phone legado = mobile
    email: form.email || null,
    motherName: form.motherName || null,
    fatherName: form.fatherName || null,
    parentContactPhone: form.parentContactPhone || null,
    parentContactRole: form.parentContactRole || null,
    photoUrl: form.photoUrl || null,
    docCPFFrontUrl: form.docCPFFrontUrl || null,
    docCPFBackUrl: form.docCPFBackUrl || null,
    cep: form.cep || null,
    state: form.state || null,
    city: form.city || null,
    address: form.address || null,
    addressNum: form.addressNum || null,
    addressComp: form.addressComp || null,
    position: form.position || null,
    jerseyNumber: form.jerseyNumber || null,
    height: form.height || null,
    weight: form.weight || null,
    docRGFrontUrl: form.docRGFrontUrl || null,
    docRGBackUrl: form.docRGBackUrl || null,
    docBirthCertUrl: form.docBirthCertUrl || null,
    docOtherUrl: form.docOtherUrl || null,
    requestedCategoryLabel: form.requestedCategoryLabel || null,
  })

  const submit = (intent: 'draft' | 'submit') => {
    const validationError = validate(intent)
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      return
    }

    setError('')
    setPendingIntent(intent)
    startTransition(async () => {
      try {
        const isDraft = intent === 'draft'
        const body = {
          ...buildPayload(),
          status: 'DRAFT',
        }

        let requestId = initialData?.id || null

        if (isEditing) {
          const update = await fetch(`/api/team/athletes/requests/${initialData?.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          const updateData = await update.json()
          if (!update.ok) throw new Error(updateData.error || 'Erro ao salvar solicitação.')
          requestId = updateData.id
        } else {
          const create = await fetch('/api/team/athletes/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          const createData = await create.json()
          if (!create.ok) throw new Error(createData.error || 'Erro ao criar solicitação.')
          requestId = createData.id
        }

        if (!isDraft && requestId) {
          const submitResponse = await fetch(`/api/team/athletes/requests/${requestId}/submit`, {
            method: 'POST',
          })
          const submitData = await submitResponse.json()
          if (!submitResponse.ok) throw new Error(submitData.error || 'Erro ao enviar solicitação.')
          toast.success('Solicitação enviada para análise da federação.')
        } else {
          toast.success('Rascunho salvo com sucesso.')
        }

        router.push(requestId ? `/team/athletes/requests/${requestId}` : '/team/athletes/requests')
        router.refresh()
      } catch (submissionError: any) {
        const message = submissionError.message || 'Erro ao salvar solicitação.'
        setError(message)
        toast.error(message)
      } finally {
        setPendingIntent(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--yellow)]/20 bg-[var(--yellow)]/10 px-4 py-4 text-sm text-[var(--black)]">
        Revise os dados com cuidado. O envio cria a fila oficial de análise da federação.
        Campos marcados com <span className="text-[var(--red)]">*</span> são obrigatórios.
      </div>

      {/* Seção 1 — Identificação */}
      <Card>
        <SectionHeader index={1} total={SECTIONS_TOTAL} icon="📋" title="Identificação" />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className={labelClassName}>Nome completo{requiredHint}</span>
            <input
              className={inputClassName}
              placeholder="Nome completo do atleta"
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>Categoria pretendida</span>
            <input
              className={inputClassName}
              placeholder="Ex: Sub-15 feminino"
              value={form.requestedCategoryLabel}
              onChange={(e) => set('requestedCategoryLabel', e.target.value)}
            />
          </label>
        </div>
      </Card>

      {/* Seção 2 — Dados pessoais */}
      <Card>
        <SectionHeader index={2} total={SECTIONS_TOTAL} icon="👤" title="Dados pessoais" />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className={labelClassName}>Data de nascimento{requiredHint}</span>
            <input
              className={inputClassName}
              type="date"
              value={form.birthDate}
              onChange={(e) => set('birthDate', e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>Sexo{requiredHint}</span>
            <select
              className={selectClassName}
              value={form.sex}
              onChange={(e) => set('sex', e.target.value)}
            >
              <option value="">Selecione</option>
              {sexOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>Nacionalidade{requiredHint}</span>
            <input
              className={inputClassName}
              placeholder="Brasileira"
              value={form.nationality}
              onChange={(e) => set('nationality', e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>Estado civil{requiredHint}</span>
            <select
              className={selectClassName}
              value={form.maritalStatus}
              onChange={(e) => set('maritalStatus', e.target.value)}
            >
              <option value="">Selecione</option>
              {maritalStatusOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className={labelClassName}>Escolaridade{requiredHint}</span>
            <select
              className={selectClassName}
              value={form.education}
              onChange={(e) => set('education', e.target.value)}
            >
              <option value="">Selecione</option>
              {educationOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {/* Seção 3 — Documentos */}
      <Card>
        <SectionHeader index={3} total={SECTIONS_TOTAL} icon="📑" title="Documentos" />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className={labelClassName}>CPF{requiredHint}</span>
            <input
              className={inputClassName}
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => set('cpf', e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>RG{requiredHint}</span>
            <input
              className={inputClassName}
              placeholder="0000000000"
              value={form.rg}
              onChange={(e) => set('rg', e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>Órgão expedidor do RG{requiredHint}</span>
            <input
              className={inputClassName}
              placeholder="SSP/RS"
              value={form.rgOrgan}
              onChange={(e) => set('rgOrgan', e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>Data de emissão do RG{requiredHint}</span>
            <input
              className={inputClassName}
              type="date"
              value={form.rgDate}
              onChange={(e) => set('rgDate', e.target.value)}
            />
          </label>
        </div>
      </Card>

      {/* Seção 4 — Contato */}
      <Card>
        <SectionHeader index={4} total={SECTIONS_TOTAL} icon="📱" title="Contato" />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className={labelClassName}>Celular{requiredHint}</span>
            <input
              className={inputClassName}
              placeholder="(51) 99999-9999"
              value={form.mobile}
              onChange={(e) => set('mobile', e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>E-mail</span>
            <input
              className={inputClassName}
              type="email"
              placeholder="atleta@exemplo.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </label>
        </div>
      </Card>

      {/* Seção 5 — Filiação */}
      <Card>
        <SectionHeader index={5} total={SECTIONS_TOTAL} icon="👨‍👩‍👧" title="Filiação" />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className={labelClassName}>Nome da mãe{requiredHint}</span>
            <input
              className={inputClassName}
              placeholder="Nome completo da mãe"
              value={form.motherName}
              onChange={(e) => set('motherName', e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>Nome do pai{requiredHint}</span>
            <input
              className={inputClassName}
              placeholder="Nome completo do pai"
              value={form.fatherName}
              onChange={(e) => set('fatherName', e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>Telefone de contato (responsável){requiredHint}</span>
            <input
              className={inputClassName}
              placeholder="(51) 99999-9999"
              value={form.parentContactPhone}
              onChange={(e) => set('parentContactPhone', e.target.value)}
            />
          </label>
          <div className="space-y-2">
            <span className={labelClassName}>Esse contato é de:{requiredHint}</span>
            <div className="flex gap-3">
              {(['MOTHER', 'FATHER'] as const).map((role) => {
                const checked = form.parentContactRole === role
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => set('parentContactRole', role)}
                    className={
                      'flex-1 h-11 rounded-xl border px-4 text-sm font-medium transition-all ' +
                      (checked
                        ? 'border-[var(--verde)] bg-[var(--verde)]/10 text-[var(--verde)] font-black'
                        : 'border-[var(--border)] bg-white text-[var(--gray)] hover:border-[var(--verde)]')
                    }
                  >
                    {role === 'MOTHER' ? 'Mãe' : 'Pai'}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Seção 6 — Uploads obrigatórios */}
      <Card>
        <SectionHeader index={6} total={SECTIONS_TOTAL} icon="📸" title="Uploads obrigatórios" />
        <div className="grid gap-5 md:grid-cols-3">
          <FileUpload
            fieldName="photoUrl"
            label="Foto do atleta *"
            variant="photo"
            accept="image/*"
            currentUrl={form.photoUrl || null}
            onUrlChange={(url) => set('photoUrl', url)}
          />
          <FileUpload
            fieldName="docCPFFrontUrl"
            label="CPF (frente) *"
            variant="doc"
            accept="image/*,application/pdf"
            currentUrl={form.docCPFFrontUrl || null}
            onUrlChange={(url) => set('docCPFFrontUrl', url)}
          />
          <FileUpload
            fieldName="docCPFBackUrl"
            label="CPF (verso) *"
            variant="doc"
            accept="image/*,application/pdf"
            currentUrl={form.docCPFBackUrl || null}
            onUrlChange={(url) => set('docCPFBackUrl', url)}
          />
        </div>
      </Card>

      {/* Seção 7 — Endereço (opcional) */}
      <Card>
        <SectionHeader index={7} total={SECTIONS_TOTAL} icon="🏠" title="Endereço" optional />
        <div className="grid gap-4 md:grid-cols-6">
          <label className="space-y-2 md:col-span-2">
            <span className={labelClassName}>CEP</span>
            <input
              className={inputClassName}
              placeholder="00000-000"
              value={form.cep}
              onChange={(e) => set('cep', e.target.value)}
            />
          </label>
          <label className="space-y-2 md:col-span-1">
            <span className={labelClassName}>UF</span>
            <select
              className={selectClassName}
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
            >
              <option value="">--</option>
              {ufOptions.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 md:col-span-3">
            <span className={labelClassName}>Cidade</span>
            <input
              className={inputClassName}
              placeholder="Cidade"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
            />
          </label>
          <label className="space-y-2 md:col-span-4">
            <span className={labelClassName}>Endereço</span>
            <input
              className={inputClassName}
              placeholder="Rua, avenida, etc."
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />
          </label>
          <label className="space-y-2 md:col-span-1">
            <span className={labelClassName}>Número</span>
            <input
              className={inputClassName}
              placeholder="123"
              value={form.addressNum}
              onChange={(e) => set('addressNum', e.target.value)}
            />
          </label>
          <label className="space-y-2 md:col-span-1">
            <span className={labelClassName}>Complemento</span>
            <input
              className={inputClassName}
              placeholder="Apto, bloco"
              value={form.addressComp}
              onChange={(e) => set('addressComp', e.target.value)}
            />
          </label>
        </div>
      </Card>

      {/* Seção 8 — Esportivo (opcional) */}
      <Card>
        <SectionHeader index={8} total={SECTIONS_TOTAL} icon="🏀" title="Esportivo" optional />
        <div className="grid gap-4 md:grid-cols-4">
          <label className="space-y-2">
            <span className={labelClassName}>Posição</span>
            <select
              className={selectClassName}
              value={form.position}
              onChange={(e) => set('position', e.target.value)}
            >
              <option value="">--</option>
              {positionOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>Nº camisa</span>
            <input
              className={inputClassName}
              type="number"
              min={0}
              max={99}
              placeholder="00"
              value={form.jerseyNumber}
              onChange={(e) => set('jerseyNumber', e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>Altura (m)</span>
            <input
              className={inputClassName}
              type="number"
              step="0.01"
              min={0}
              placeholder="1.78"
              value={form.height}
              onChange={(e) => set('height', e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClassName}>Peso (kg)</span>
            <input
              className={inputClassName}
              type="number"
              step="0.1"
              min={0}
              placeholder="72.5"
              value={form.weight}
              onChange={(e) => set('weight', e.target.value)}
            />
          </label>
        </div>
      </Card>

      {/* Seção 9 — Outros documentos (opcional) */}
      <Card>
        <SectionHeader index={9} total={SECTIONS_TOTAL} icon="📎" title="Outros documentos" optional />
        <div className="grid gap-5 md:grid-cols-2">
          <FileUpload
            fieldName="docRGFrontUrl"
            label="RG (frente)"
            variant="doc"
            accept="image/*,application/pdf"
            currentUrl={form.docRGFrontUrl || null}
            onUrlChange={(url) => set('docRGFrontUrl', url)}
          />
          <FileUpload
            fieldName="docRGBackUrl"
            label="RG (verso)"
            variant="doc"
            accept="image/*,application/pdf"
            currentUrl={form.docRGBackUrl || null}
            onUrlChange={(url) => set('docRGBackUrl', url)}
          />
          <FileUpload
            fieldName="docBirthCertUrl"
            label="Certidão de nascimento"
            variant="doc"
            accept="image/*,application/pdf"
            currentUrl={form.docBirthCertUrl || null}
            onUrlChange={(url) => set('docBirthCertUrl', url)}
          />
          <FileUpload
            fieldName="docOtherUrl"
            label="Outro documento"
            variant="doc"
            accept="image/*,application/pdf"
            currentUrl={form.docOtherUrl || null}
            onUrlChange={(url) => set('docOtherUrl', url)}
          />
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-[var(--red)]/20 bg-[var(--red)]/10 px-4 py-3 text-sm font-bold text-[var(--red)]">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => submit('draft')}
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] transition-all hover:text-[var(--black)] disabled:opacity-60"
        >
          {isPending && pendingIntent === 'draft' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending && pendingIntent === 'draft' ? 'Salvando...' : 'Salvar rascunho'}
        </button>
        <button
          type="button"
          onClick={() => submit('submit')}
          disabled={isPending}
          className="fgb-btn-primary inline-flex h-11 items-center justify-center gap-2 px-5 text-[10px]"
        >
          {isPending && pendingIntent === 'submit' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isPending && pendingIntent === 'submit' ? 'Enviando...' : 'Enviar solicitação'}
        </button>
      </div>
    </div>
  )
}
