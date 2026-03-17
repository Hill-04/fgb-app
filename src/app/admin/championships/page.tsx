"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { Trophy, Calendar, Users, Edit2, Trash2, Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = { id: string; name: string }
type Championship = {
  id: string; name: string; year: number; status: string; sex: string
  minTeamsPerCat: number; categories: Category[]; _count?: { registrations: number }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_AGES = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
const SEXES = ['masculino', 'feminino', 'misto']

const ALL_CATEGORIES = CATEGORY_AGES.flatMap(age => [
  { code: `SUB${age}M`, label: `Sub ${age}`, sex: 'masculino' },
  { code: `SUB${age}F`, label: `Sub ${age}`, sex: 'feminino' },
])

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho', REGISTRATION_OPEN: 'Inscrições Abertas',
  REGISTRATION_CLOSED: 'Inscrições Encerradas', VALIDATING: 'Validando',
  SCHEDULING: 'Agendamento', CONFIRMED: 'Confirmado', ONGOING: 'Em Andamento', COMPLETED: 'Finalizado',
}
const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  REGISTRATION_OPEN: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  REGISTRATION_CLOSED: 'bg-red-500/10 text-red-400 border-red-500/20',
  CONFIRMED: 'bg-green-500/10 text-green-400 border-green-500/20',
  ONGOING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

// ─── Default form state ────────────────────────────────────────────────────────

const defaultForm = () => ({
  name: '', year: new Date().getFullYear().toString(), sex: 'masculino',
  minTeamsPerCat: '3', categories: [] as string[],
  // Format
  format: 'todos_contra_todos', turns: '1', phases: '1', fieldControl: 'alternado',
  // Tiebreakers — ordered list toggles
  tiebreakers: ['pontos', 'saldo', 'confronto_direto', 'pontos_marcados'],
  // Relegation
  hasRelegation: false, relegationDown: '0', promotionUp: '0',
  // Playoff
  hasPlayoffs: false, playoffTeams: '4', playoffFormat: 'melhor_de_1', hasThirdPlace: true,
  // Blocks
  hasBlocks: false,
  // Dates
  regDeadline: '', startDate: '', endDate: '',
})

type FormState = ReturnType<typeof defaultForm>

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { title: 'Identificação', desc: 'Nome, ano e sexo' },
  { title: 'Categorias', desc: 'Sub 8 → Sub 20' },
  { title: 'Formato', desc: 'Estrutura e turnos' },
  { title: 'Playoffs', desc: 'Fase eliminatória' },
  { title: 'Datas', desc: 'Prazos e calendário' },
]

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-[#FF6B00]/15 border-[#FF6B00]/50 text-[#FF6B00]' : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'}`}>
      {children}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">{children}</p>
}

function Toggle({ checked, onCheckedChange, label }: { checked: boolean; onCheckedChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button type="button" onClick={() => onCheckedChange(!checked)}
        className={`relative w-10 h-5 rounded-full border transition-all ${checked ? 'bg-[#FF6B00] border-[#FF6B00]' : 'bg-white/5 border-white/10'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      <span className="text-sm text-slate-300 font-medium">{label}</span>
    </label>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminChampionshipsPage() {
  const [championships, setChampionships] = useState<Championship[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [step, setStep] = useState(0)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm())
  const [formError, setFormError] = useState('')

  const setField = (key: keyof FormState, value: any) => setForm(f => ({ ...f, [key]: value }))

  const fetchChampionships = useCallback(async () => {
    try {
      const res = await fetch('/api/championships')
      if (res.ok) setChampionships(await res.json())
    } catch { } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchChampionships() }, [fetchChampionships])

  const openCreateDialog = () => {
    setEditingId(null); setForm(defaultForm()); setStep(0); setFormError(''); setShowDialog(true)
  }

  const openEditDialog = (c: Championship) => {
    setEditingId(c.id)
    setForm({ ...defaultForm(), name: c.name, year: c.year.toString(), sex: c.sex, minTeamsPerCat: c.minTeamsPerCat.toString(), categories: c.categories.map(cat => { const m = ALL_CATEGORIES.find(a => a.label.replace(' ', '') === cat.name.replace(' ', '')); return m ? m.code : cat.name }) })
    setStep(0); setFormError(''); setShowDialog(true)
  }

  const toggleCategory = (code: string) =>
    setField('categories', form.categories.includes(code) ? form.categories.filter(c => c !== code) : [...form.categories, code])

  const toggleTiebreaker = (key: string) => {
    const list = form.tiebreakers
    setField('tiebreakers', list.includes(key) ? list.filter(t => t !== key) : [...list, key])
  }

  const validateStep = () => {
    if (step === 0 && !form.name.trim()) { setFormError('O nome do campeonato é obrigatório.'); return false }
    if (step === 1 && form.categories.length === 0) { setFormError('Selecione ao menos uma categoria.'); return false }
    setFormError(''); return true
  }

  const nextStep = () => { if (!validateStep()) return; setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  const prevStep = () => { setFormError(''); setStep(s => Math.max(s - 1, 0)) }

  const handleSubmit = async () => {
    if (!validateStep()) return
    setSubmitLoading(true)
    try {
      const url = editingId ? `/api/championships/${editingId}` : '/api/championships'
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(), year: Number(form.year), sex: form.sex,
          minTeamsPerCat: Number(form.minTeamsPerCat), categories: form.categories,
          format: form.format, turns: Number(form.turns), phases: Number(form.phases),
          fieldControl: form.fieldControl, tiebreakers: form.tiebreakers.join(','),
          hasRelegation: form.hasRelegation, relegationDown: Number(form.relegationDown), promotionUp: Number(form.promotionUp),
          hasPlayoffs: form.hasPlayoffs, playoffTeams: Number(form.playoffTeams),
          playoffFormat: form.playoffFormat, hasThirdPlace: form.hasThirdPlace,
          hasBlocks: form.hasBlocks,
          regDeadline: form.regDeadline || new Date().toISOString(),
          startDate: form.startDate || null, endDate: form.endDate || null,
        })
      })
      if (res.ok) { setShowDialog(false); fetchChampionships() }
      else { const d = await res.json(); setFormError(d.error || 'Erro ao salvar') }
    } catch { setFormError('Erro de conexão') } finally { setSubmitLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apagar este campeonato e todas as inscrições?')) return
    const res = await fetch(`/api/championships/${id}`, { method: 'DELETE' })
    if (res.ok) fetchChampionships()
    else { const d = await res.json(); alert(d.error || 'Erro ao excluir') }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    await fetch(`/api/championships/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    fetchChampionships(); setUpdatingId(null)
  }

  // ─── Step renderers ──────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <SectionLabel>Nome da Competição</SectionLabel>
        <Input value={form.name} onChange={e => setField('name', e.target.value)}
          placeholder="Ex: Estadual 2026 Masculino"
          className="bg-white/[0.03] border-white/10 h-13 rounded-xl focus:border-[#FF6B00] text-white text-base" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <SectionLabel>Ano da Temporada</SectionLabel>
          <Input type="number" value={form.year} onChange={e => setField('year', e.target.value)}
            className="bg-white/[0.03] border-white/10 h-12 rounded-xl text-white" />
        </div>
        <div className="space-y-2">
          <SectionLabel>Mín. Equipes/Categoria</SectionLabel>
          <Input type="number" min="1" value={form.minTeamsPerCat} onChange={e => setField('minTeamsPerCat', e.target.value)}
            className="bg-white/[0.03] border-white/10 h-12 rounded-xl text-white" />
        </div>
      </div>
      <div className="space-y-3">
        <SectionLabel>Sexo da Competição</SectionLabel>
        <div className="flex gap-3">
          {SEXES.map(s => (
            <OptionButton key={s} active={form.sex === s} onClick={() => setField('sex', s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </OptionButton>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep1 = () => {
    const masc = ALL_CATEGORIES.filter(c => c.sex === 'masculino')
    const fem = ALL_CATEGORIES.filter(c => c.sex === 'feminino')
    const showBoth = form.sex === 'misto'
    const showMasc = form.sex === 'masculino' || showBoth
    const showFem = form.sex === 'feminino' || showBoth

    const CatGrid = ({ cats, label }: { cats: typeof masc; label: string }) => (
      <div>
        <SectionLabel>{label}</SectionLabel>
        <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
          {cats.map(cat => {
            const active = form.categories.includes(cat.code)
            return (
              <button type="button" key={cat.code} onClick={() => toggleCategory(cat.code)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${active ? 'bg-[#FF6B00]/15 border-[#FF6B00]/50 text-[#FF6B00]' : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/15'}`}>
                {active && <Check className="w-3 h-3" />}
                <span className="text-[10px] font-black tracking-tight">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    )

    return (
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
        {showMasc && <CatGrid cats={masc} label="Masculino" />}
        {showFem && <CatGrid cats={fem} label="Feminino" />}
        <p className="text-[10px] text-slate-500 text-center">{form.categories.length} categorias selecionadas</p>
      </div>
    )
  }

  const renderStep2 = () => (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
      <div className="space-y-3">
        <SectionLabel>Formato da Competição</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'todos_contra_todos', label: 'Pontos Corridos' },
            { value: 'eliminatorio', label: 'Mata-Mata' },
            { value: 'grupos_eliminatorio', label: 'Grupos + Mata-Mata' },
            { value: 'misto', label: 'Pontos + Playoffs' },
          ].map(o => <OptionButton key={o.value} active={form.format === o.value} onClick={() => setField('format', o.value)}>{o.label}</OptionButton>)}
        </div>
      </div>

      <div className="space-y-3">
        <SectionLabel>Número de Turnos</SectionLabel>
        <div className="flex gap-2">
          {[['1', 'Turno Único'], ['2', 'Turno + Returno'], ['3', 'Três Turnos']].map(([v, l]) =>
            <OptionButton key={v} active={form.turns === v} onClick={() => setField('turns', v)}>{l}</OptionButton>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <SectionLabel>Número de Fases</SectionLabel>
        <div className="flex gap-2">
          {['1', '2', '3'].map(v =>
            <OptionButton key={v} active={form.phases === v} onClick={() => setField('phases', v)}>{v} {v === '1' ? 'fase' : 'fases'}</OptionButton>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <SectionLabel>Mando de Campo</SectionLabel>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'alternado', label: 'Alternado' },
            { value: 'sede_fixa', label: 'Sede Fixa' },
            { value: 'sede_rotativa', label: 'Sede Rotativa' },
          ].map(o => <OptionButton key={o.value} active={form.fieldControl === o.value} onClick={() => setField('fieldControl', o.value)}>{o.label}</OptionButton>)}
        </div>
      </div>

      <div className="space-y-3">
        <SectionLabel>Critérios de Desempate (em ordem)</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'pontos', label: 'Pontos' },
            { key: 'saldo', label: 'Saldo de Pontos' },
            { key: 'confronto_direto', label: 'Confronto Direto' },
            { key: 'pontos_marcados', label: 'Pontos Marcados' },
          ].map(({ key, label }) => {
            const active = form.tiebreakers.includes(key)
            const idx = form.tiebreakers.indexOf(key)
            return (
              <button type="button" key={key} onClick={() => toggleTiebreaker(key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-all ${active ? 'bg-[#FF6B00]/10 border-[#FF6B00]/40 text-[#FF6B00]' : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/15'}`}>
                {active && <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white text-[9px] flex items-center justify-center font-black flex-shrink-0">{idx + 1}</span>}
                {!active && <span className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" />}
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <SectionLabel>Agrupamento de Categorias em Blocos</SectionLabel>
        <Toggle checked={form.hasBlocks} onCheckedChange={v => setField('hasBlocks', v)}
          label="Deixar a IA agrupar categorias por blocos de viagem" />
      </div>

      <div className="space-y-4">
        <SectionLabel>Rebaixamento / Promoção</SectionLabel>
        <Toggle checked={form.hasRelegation} onCheckedChange={v => setField('hasRelegation', v)} label="Habilitar rebaixamento/promoção" />
        {form.hasRelegation && (
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div><SectionLabel>Equipes que descem</SectionLabel>
              <Input type="number" min="0" value={form.relegationDown} onChange={e => setField('relegationDown', e.target.value)} className="bg-white/[0.03] border-white/10 h-11 rounded-xl text-white" /></div>
            <div><SectionLabel>Equipes que sobem</SectionLabel>
              <Input type="number" min="0" value={form.promotionUp} onChange={e => setField('promotionUp', e.target.value)} className="bg-white/[0.03] border-white/10 h-11 rounded-xl text-white" /></div>
          </div>
        )}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <Toggle checked={form.hasPlayoffs} onCheckedChange={v => setField('hasPlayoffs', v)} label="Este campeonato tem fase de playoffs" />

      {form.hasPlayoffs && (
        <div className="space-y-5 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
          <div className="space-y-3">
            <SectionLabel>Equipes classificadas</SectionLabel>
            <div className="flex gap-2">
              {['2', '4', '8'].map(v => <OptionButton key={v} active={form.playoffTeams === v} onClick={() => setField('playoffTeams', v)}>Top {v}</OptionButton>)}
            </div>
          </div>
          <div className="space-y-3">
            <SectionLabel>Formato das séries</SectionLabel>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'melhor_de_1', label: 'Melhor de 1' },
                { value: 'melhor_de_3', label: 'Melhor de 3' },
                { value: 'melhor_de_5', label: 'Melhor de 5' },
              ].map(o => <OptionButton key={o.value} active={form.playoffFormat === o.value} onClick={() => setField('playoffFormat', o.value)}>{o.label}</OptionButton>)}
            </div>
          </div>
          <Toggle checked={form.hasThirdPlace} onCheckedChange={v => setField('hasThirdPlace', v)} label="Disputa de 3º lugar" />
        </div>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <SectionLabel>Prazo de Inscrições</SectionLabel>
        <Input type="date" value={form.regDeadline} onChange={e => setField('regDeadline', e.target.value)}
          className="bg-white/[0.03] border-white/10 h-12 rounded-xl text-white" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <SectionLabel>Início do Campeonato</SectionLabel>
          <Input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)}
            className="bg-white/[0.03] border-white/10 h-12 rounded-xl text-white" />
        </div>
        <div className="space-y-2">
          <SectionLabel>Término Previsto</SectionLabel>
          <Input type="date" value={form.endDate} onChange={e => setField('endDate', e.target.value)}
            className="bg-white/[0.03] border-white/10 h-12 rounded-xl text-white" />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-[#FF6B00]/5 border border-[#FF6B00]/20 rounded-2xl p-5 space-y-2 text-sm">
        <p className="text-[#FF6B00] font-black uppercase tracking-widest text-[10px] mb-3">Resumo do Campeonato</p>
        <p className="text-slate-300"><span className="text-slate-500">Nome:</span> {form.name || '—'}</p>
        <p className="text-slate-300"><span className="text-slate-500">Sexo:</span> {form.sex}</p>
        <p className="text-slate-300"><span className="text-slate-500">Categorias:</span> {form.categories.length} selecionadas</p>
        <p className="text-slate-300"><span className="text-slate-500">Formato:</span> {form.format} · {form.turns} turno(s) · {form.phases} fase(s)</p>
        <p className="text-slate-300"><span className="text-slate-500">Mando:</span> {form.fieldControl}</p>
        <p className="text-slate-300"><span className="text-slate-500">Playoffs:</span> {form.hasPlayoffs ? `Sim — Top ${form.playoffTeams} (${form.playoffFormat})` : 'Não'}</p>
        <p className="text-slate-300"><span className="text-slate-500">Blocos IA:</span> {form.hasBlocks ? 'Sim' : 'Não'}</p>
      </div>
    </div>
  )

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4]

  // ─── Page JSX ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-2">Campeonatos</h1>
          <p className="text-[--text-secondary] font-medium uppercase tracking-widest text-[10px]">Gestão Geral da Temporada</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 h-12 rounded-xl shadow-lg shadow-orange-600/20 transition-all hover:scale-105">
          <Plus className="w-5 h-5 mr-2" /> Novo Campeonato
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-white/5 rounded-3xl" />)}
        </div>
      ) : championships.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center">
          <Trophy className="w-16 h-16 text-white/10 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhum campeonato ativo</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Crie o primeiro campeonato da temporada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {championships.map((c) => (
            <Card key={c.id} className="bg-[#121212] border-white/5 overflow-hidden group hover:border-[#FF6B00]/30 transition-all duration-300 rounded-3xl">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter">{c.name}</h3>
                      <Badge className={`px-3 py-1 text-[9px] font-black tracking-widest uppercase border ${STATUS_STYLES[c.status] || STATUS_STYLES.DRAFT}`}>{STATUS_LABELS[c.status] || c.status}</Badge>
                    </div>
                    <div className="flex gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#FF6B00]" /> {c.year}</span>
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#FF6B00]" /> {c._count?.registrations || 0} Inscrições</span>
                      <span className="capitalize">{c.sex}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)} className="h-9 w-9 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white"><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="h-9 w-9 rounded-xl hover:bg-red-500/5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-8">
                  {c.categories.map(cat => <span key={cat.id} className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.05] rounded-lg text-[9px] font-black text-slate-400 uppercase">{cat.name}</span>)}
                </div>
                <div className="pt-6 border-t border-white/5 flex gap-3">
                  <Link href={`/admin/championships/${c.id}/manage`} className="flex-1">
                    <Button className="w-full bg-white/5 hover:bg-white/10 text-white font-bold h-11 rounded-xl text-xs uppercase tracking-widest border border-white/10">Painel de Controle</Button>
                  </Link>
                  {c.status === 'DRAFT' && (
                    <Button onClick={() => handleStatusChange(c.id, 'REGISTRATION_OPEN')} disabled={updatingId === c.id}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold h-11 rounded-xl text-xs uppercase tracking-widest">
                      Abrir Inscrições
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Multi-step Modal ─── */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl bg-[#0A0A0A] border-white/10 text-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Step indicators */}
            <div className="flex border-b border-white/5">
              {STEPS.map((s, i) => (
                <div key={i} className={`flex-1 px-3 py-4 text-center border-b-2 transition-all ${i === step ? 'border-[#FF6B00] bg-[#FF6B00]/5' : i < step ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-transparent'}`}>
                  <p className={`text-[9px] font-black uppercase tracking-widest ${i === step ? 'text-[#FF6B00]' : i < step ? 'text-emerald-400' : 'text-slate-600'}`}>{s.title}</p>
                </div>
              ))}
            </div>

            <CardHeader className="px-8 pt-8 pb-4">
              <CardTitle className="text-2xl font-display font-black uppercase tracking-tight">
                {editingId ? 'Editar Campeonato' : STEPS[step].title}
              </CardTitle>
              <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{STEPS[step].desc}</CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {stepContent[step]()}

              {formError && (
                <p className="mt-4 text-red-500 text-xs font-bold uppercase tracking-widest bg-red-500/10 p-3 rounded-xl border border-red-500/20">{formError}</p>
              )}

              <div className="flex gap-4 pt-6 mt-6 border-t border-white/5">
                {step === 0 ? (
                  <Button variant="ghost" type="button" onClick={() => setShowDialog(false)} className="flex-1 h-12 font-bold text-slate-400 hover:text-white rounded-xl">Cancelar</Button>
                ) : (
                  <Button variant="ghost" type="button" onClick={prevStep} className="flex-1 h-12 font-bold text-slate-400 hover:text-white rounded-xl">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                )}
                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={nextStep} className="flex-1 bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest h-12 rounded-xl">
                    Próximo <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} disabled={submitLoading} className="flex-1 bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-orange-600/20">
                    {submitLoading ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Criar Campeonato')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>{children}</span>
}
