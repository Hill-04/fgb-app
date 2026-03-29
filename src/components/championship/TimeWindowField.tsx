'use client'

import { validateTimeWindowConfig, generateSlotTimes, type BlockFormat } from '@/lib/championship/time-window'

interface TimeWindowFieldProps {
  value: {
    dayStartTime: string
    regularDayEndTime: string
    extendedDayEndTime: string
    slotDurationMinutes: number
    minRestSlotsPerTeam: number
    blockFormat: BlockFormat
  }
  onChange: (value: TimeWindowFieldProps['value']) => void
}

const BLOCK_FORMAT_OPTIONS: { value: BlockFormat; label: string; description: string }[] = [
  { value: 'SAT_SUN',     label: 'Sábado + Domingo',          description: '2 dias por bloco — padrão' },
  { value: 'FRI_SAT_SUN', label: 'Sexta + Sábado + Domingo', description: '3 dias — mais jogos por bloco' },
  { value: 'SAT_ONLY',    label: 'Apenas Sábado',             description: '1 dia por bloco — campeonato longo' },
]

export function TimeWindowField({ value, onChange }: TimeWindowFieldProps) {
  const validation = validateTimeWindowConfig(value)

  const regularSlots  = generateSlotTimes(value.dayStartTime, value.regularDayEndTime, value.slotDurationMinutes)
  const extendedSlots = generateSlotTimes(value.dayStartTime, value.extendedDayEndTime, value.slotDurationMinutes)

  function update(partial: Partial<typeof value>) {
    onChange({ ...value, ...partial })
  }

  return (
    <div className="space-y-6">
      {/* Formato de bloco */}
      <div className="space-y-3">
        <label className="text-sm font-semibold tracking-tight text-foreground/90">Formato do bloco de jogos</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BLOCK_FORMAT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ blockFormat: opt.value })}
              className={`group rounded-xl border p-4 text-left transition-all duration-200 ${
                value.blockFormat === opt.value
                  ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                  : 'border-border bg-card/50 hover:border-blue-400 hover:bg-muted/50'
              }`}
            >
              <div className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors">{opt.label}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Horários e Configurações */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Início do Dia</label>
          <input
            type="time"
            value={value.dayStartTime}
            onChange={e => update({ dayStartTime: e.target.value })}
            className="w-full h-10 rounded-lg border border-input bg-background/50 px-3 py-1.5 text-sm ring-offset-background
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Término (Regular)</label>
          <input
            type="time"
            value={value.regularDayEndTime}
            onChange={e => update({ regularDayEndTime: e.target.value })}
            className="w-full h-10 rounded-lg border border-input bg-background/50 px-3 py-1.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
          />
        </div>

        {value.blockFormat !== 'SAT_ONLY' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Término Sábado</label>
            <input
              type="time"
              value={value.extendedDayEndTime}
              onChange={e => update({ extendedDayEndTime: e.target.value })}
              className="w-full h-10 rounded-lg border border-input bg-background/50 px-3 py-1.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Slot (Minutos)</label>
          <input
            type="number"
            min={60}
            max={120}
            step={5}
            value={value.slotDurationMinutes}
            onChange={e => update({ slotDurationMinutes: parseInt(e.target.value) || 75 })}
            className="w-full h-10 rounded-lg border border-input bg-background/50 px-3 py-1.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Descanso Sl.</label>
          <input
            type="number"
            min={0}
            max={4}
            value={value.minRestSlotsPerTeam}
            onChange={e => update({ minRestSlotsPerTeam: parseInt(e.target.value) || 0 })}
            className="w-full h-10 rounded-lg border border-input bg-background/50 px-3 py-1.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
          />
        </div>
      </div>

      {/* Preview de slots calculados */}
      {validation.valid && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Capacidade Hidráulica do Ginásio:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
            <div className="space-y-2">
              <div className="font-bold text-emerald-900 flex items-center justify-between">
                <span>{value.blockFormat === 'FRI_SAT_SUN' ? 'Sextas e Domingos' : 'Fluxo Regular'}</span>
                <span className="bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 font-black">{regularSlots.length} slots</span>
              </div>
              <div className="text-emerald-700/80 font-medium">
                {regularSlots.join(' · ')}
              </div>
            </div>
            {value.blockFormat !== 'SAT_ONLY' && (
              <div className="space-y-2 border-l border-emerald-500/10 pl-6">
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>Sábados (Janela Estendida)</span>
                  <span className="bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 font-black">{extendedSlots.length} slots</span>
                </div>
                <div className="text-emerald-700/80 font-medium">
                  {extendedSlots.join(' · ')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Erros e avisos */}
      {validation.errors.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-4">
          <div className="flex items-center gap-2 text-xs font-black text-red-700 uppercase tracking-widest mb-2">
            ⚠️ Erros de Configuração
          </div>
          <div className="space-y-1">
            {validation.errors.map((e, i) => (
              <div key={i} className="text-sm text-red-700 font-medium ml-6 relative before:absolute before:left-[-1.5rem] before:content-['•']">{e}</div>
            ))}
          </div>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
          <div className="flex items-center gap-2 text-xs font-black text-amber-700 uppercase tracking-widest mb-1">
            💡 Recomendações Logísticas
          </div>
          {validation.warnings.map((w, i) => (
            <div key={i} className="text-sm text-amber-700 font-medium ml-6 relative before:absolute before:left-[-1.5rem] before:content-['→']">{w}</div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-blue-500/10 bg-blue-500/[0.02] p-4 flex items-start gap-3">
        <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-blue-400 bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-500">i</div>
        <div className="text-xs text-blue-800/80 leading-relaxed">
          <span className="font-bold text-blue-900">Regra de Calendário:</span> O sistema bloqueia automaticamente de Segunda a Quinta. Jogos são agendados exclusivamente em blocos de fim de semana para não impactar a rotina escolar dos atletas.
        </div>
      </div>
    </div>
  )
}
