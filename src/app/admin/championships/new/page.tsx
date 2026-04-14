'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ChevronRight, Check, Plus } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_AGES = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
const SEXES = ['masculino', 'feminino', 'misto']

const ALL_CATEGORIES = CATEGORY_AGES.flatMap(age => [
  { code: `SUB${age}M`, label: `Sub ${age}`, sex: 'masculino' },
  { code: `SUB${age}F`, label: `Sub ${age}`, sex: 'feminino' },
])

const defaultForm = () => ({
  name: '', year: new Date().getFullYear().toString(), sex: 'masculino',
  minTeamsPerCat: '3', categories: [] as string[],
  format: 'todos_contra_todos', turns: '1', phases: '1', fieldControl: 'alternado',
  maxGamesPerTeamPerDay: '2', scheduleOptimizationMode: 'less_travel',
  tiebreakers: ['pontos', 'saldo', 'confronto_direto', 'pontos_marcados'],
  hasRelegation: false, relegationDown: '0', promotionUp: '0',
  hasPlayoffs: false, playoffTeams: '4', playoffFormat: 'melhor_de_1', hasThirdPlace: true,
  hasBlocks: false, regDeadline: '', startDate: '', endDate: '',
})

type FormState = ReturnType<typeof defaultForm>

const STEPS = [
  { title: 'Identificação', desc: 'Nome, ano e sexo' },
  { title: 'Categorias', desc: 'Sub 8 → Sub 20' },
  { title: 'Formato', desc: 'Estrutura e turnos' },
  { title: 'Playoffs', desc: 'Fase eliminatória' },
  { title: 'Datas', desc: 'Prazos e calendário' },
]

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-[var(--amarelo)]/15 border-[var(--amarelo)]/50 text-[var(--amarelo)]' : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'}`}>
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
        className={`relative w-10 h-5 rounded-full border transition-all ${checked ? 'bg-[var(--amarelo)] border-[var(--amarelo)]' : 'bg-white/5 border-white/10'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      <span className="text-sm text-slate-300 font-medium">{label}</span>
    </label>
  )
}

export default function NewChampionshipPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState<FormState>(defaultForm())

  const setField = (key: keyof FormState, value: any) => setForm(f => ({ ...f, [key]: value }))

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
      const res = await fetch('/api/championships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          year: Number(form.year),
          minTeamsPerCat: Number(form.minTeamsPerCat),
          turns: Number(form.turns),
          phases: Number(form.phases),
          maxGamesPerTeamPerDay: Number(form.maxGamesPerTeamPerDay),
          relegationDown: Number(form.relegationDown),
          promotionUp: Number(form.promotionUp),
          playoffTeams: Number(form.playoffTeams),
          tiebreakers: form.tiebreakers.join(','),
          regDeadline: form.regDeadline || new Date().toISOString(),
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        })
      })
      if (res.ok) router.push('/admin/championships')
      else { const d = await res.json(); setFormError(d.error || 'Erro ao salvar') }
    } catch { setFormError('Erro de conexão') } finally { setSubmitLoading(false) }
  }

  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <SectionLabel>Nome da Competição</SectionLabel>
        <Input value={form.name} onChange={e => setField('name', e.target.value)}
          placeholder="Ex: Estadual 2026 Masculino"
          className="bg-white/[0.03] border-white/10 h-13 rounded-xl focus:border-[var(--amarelo)] text-white text-base" />
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
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${active ? 'bg-[var(--amarelo)]/15 border-[var(--amarelo)]/50 text-[var(--amarelo)]' : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/15'}`}>
                {active && <Check className="w-3 h-3" />}
                <span className="text-[10px] font-black tracking-tight">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    )

    return (
      <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1">
        {showMasc && <CatGrid cats={masc} label="Masculino" />}
        {showFem && <CatGrid cats={fem} label="Feminino" />}
      </div>
    )
  }

  const renderStep2 = () => (
    <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="space-y-4">
        <SectionLabel>Formato da Competição</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: 'todos_contra_todos', label: 'Pontos Corridos', desc: 'As equipes jogam entre si e a classificação é definida pela tabela geral.' },
            { value: 'eliminatorio', label: 'Mata-Mata', desc: 'Séries eliminatórias desde o início. Quem perde está fora.' },
            { value: 'grupos_eliminatorio', label: 'Grupos + Mata-Mata', desc: 'Fase inicial em grupos seguida por eliminatórias.' },
            { value: 'misto', label: 'Pontos + Playoffs', desc: 'Fase regular de pontos seguidos por mata-mata final.' },
          ].map(o => (
            <button key={o.value} type="button" onClick={() => setField('format', o.value)}
              className={`p-4 rounded-2xl border text-left transition-all ${form.format === o.value ? 'bg-[var(--amarelo)]/10 border-[var(--amarelo)]/50' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-black uppercase tracking-widest ${form.format === o.value ? 'text-[var(--amarelo)]' : 'text-slate-300'}`}>{o.label}</span>
                {form.format === o.value && <Check className="w-4 h-4 text-[var(--amarelo)]" />}
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">{o.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <SectionLabel>Turnos</SectionLabel>
          <Input type="number" min="1" value={form.turns} onChange={e => setField('turns', e.target.value)} className="bg-white/[0.03] border-white/10 h-11 rounded-xl text-white" />
        </div>
        <div className="space-y-2">
          <SectionLabel>Fases</SectionLabel>
          <Input type="number" min="1" value={form.phases} onChange={e => setField('phases', e.target.value)} className="bg-white/[0.03] border-white/10 h-11 rounded-xl text-white" />
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Como a fase funciona</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Em formatos de todos contra todos, cada fase repete o ciclo completo da categoria. Ex.: 3 fases = cada equipe reencontra as demais 3 vezes, com espaçamento equilibrado entre as etapas.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <SectionLabel>Máx. jogos por equipe/categoria no dia</SectionLabel>
          <Input type="number" min="1" max="6" value={form.maxGamesPerTeamPerDay} onChange={e => setField('maxGamesPerTeamPerDay', e.target.value)} className="bg-white/[0.03] border-white/10 h-11 rounded-xl text-white" />
        </div>
        <div className="space-y-2">
          <SectionLabel>Estratégia da IA</SectionLabel>
          <div className="flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-bold text-white">
            Menos viagens
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Como a IA vai montar a fase regular</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          A IA vai priorizar menos deslocamentos, concentrando o máximo de jogos viáveis em cada viagem e deixando a sexta como último recurso.
        </p>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <Toggle checked={form.hasPlayoffs} onCheckedChange={v => setField('hasPlayoffs', v)} label="Este campeonato tem fase de playoffs (Mata-Mata Final)" />
      {form.hasPlayoffs && (
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div><SectionLabel>Equipes Top</SectionLabel>
          <Input type="number" value={form.playoffTeams} onChange={e => setField('playoffTeams', e.target.value)} className="bg-white/[0.03] border-white/10 h-11 rounded-xl text-white" /></div>
          <div><SectionLabel>Formato</SectionLabel>
          <select value={form.playoffFormat} onChange={e => setField('playoffFormat', e.target.value)} className="w-full bg-[#121212] border-white/10 h-11 rounded-xl text-white px-3">
            <option value="melhor_de_1">Melhor de 1</option>
            <option value="melhor_de_3">Melhor de 3</option>
            <option value="melhor_de_5">Melhor de 5</option>
          </select></div>
        </div>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <SectionLabel>Início</SectionLabel>
          <Input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)}
            className="bg-white/[0.03] border-white/10 h-11 rounded-xl text-white" />
        </div>
        <div className="space-y-2">
          <SectionLabel>Inscrições até</SectionLabel>
          <Input type="date" value={form.regDeadline} onChange={e => setField('regDeadline', e.target.value)}
            className="bg-white/[0.03] border-white/10 h-11 rounded-xl text-white" />
        </div>
      </div>
    </div>
  )

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4]

  return (
    <div className="space-y-8 max-w-[800px] mx-auto pb-20 pt-10 px-4 animate-in fade-in duration-500">
      <header className="flex items-center gap-4 mb-10">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-xl border border-white/5 hover:bg-white/5 text-slate-400">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight leading-none">Novo Campeonato</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2">Configuração da nova competição</p>
        </div>
      </header>

      <Card className="bg-[#0A0A0A] border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="flex border-b border-white/5">
          {STEPS.map((s, i) => (
            <div key={i} className={`flex-1 py-4 text-center border-b-2 transition-all ${i === step ? 'border-[var(--amarelo)] bg-[var(--amarelo)]/5' : i < step ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-transparent'}`}>
              <p className={`text-[8px] font-black uppercase tracking-widest ${i === step ? 'text-[var(--amarelo)]' : i < step ? 'text-emerald-400' : 'text-slate-600'}`}>{s.title}</p>
            </div>
          ))}
        </div>

        <CardHeader className="px-10 pt-10 pb-4">
          <CardTitle className="text-2xl font-display font-black uppercase tracking-tight text-white">{STEPS[step].title}</CardTitle>
          <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{STEPS[step].desc}</CardDescription>
        </CardHeader>

        <CardContent className="px-10 pb-10">
          {stepContent[step]()}
          {formError && <p className="mt-6 text-red-500 text-xs font-bold uppercase tracking-widest bg-red-500/10 p-4 rounded-2xl border border-red-500/20">{formError}</p>}
        </CardContent>

        <footer className="px-10 py-6 border-t border-white/5 bg-[#0D0D0D]">
          <div className="flex gap-4">
            <Button disabled={step === 0} variant="ghost" onClick={prevStep} className="flex-1 h-14 font-black uppercase tracking-widest text-slate-500 hover:text-white rounded-2xl">
              Voltar
            </Button>
            <Button onClick={step < STEPS.length - 1 ? nextStep : handleSubmit} disabled={submitLoading} className="flex-1 bg-[var(--amarelo)] hover:bg-[var(--orange-dark)] text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg shadow-orange-600/20">
              {submitLoading ? 'Salvando...' : step < STEPS.length - 1 ? 'Próximo' : 'Criar Campeonato'}
            </Button>
          </div>
        </footer>
      </Card>
    </div>
  )
}
