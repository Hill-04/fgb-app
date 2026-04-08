interface MaxDelegationLoadFieldProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function MaxDelegationLoadField({ value, onChange, disabled = false }: MaxDelegationLoadFieldProps) {
  return (
    <div className="space-y-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl transition-all hover:border-white/10 group">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-200 uppercase tracking-tight flex items-center gap-2">
             Carga Máxima por Delegação (Dia)
          </label>
          <p className="text-xs text-slate-500 font-medium">
            Número máximo de jogos que um clube/cidade pode ter no mesmo dia (cross-categoria).
          </p>
        </div>

        <div className="flex items-center gap-4 bg-black/20 p-2 rounded-xl border border-white/5">
          <input
            type="number"
            min={1}
            max={8}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10)
              if (!isNaN(parsed) && parsed >= 1) {
                onChange(parsed)
              }
            }}
            className="w-16 bg-transparent border-none text-right font-display font-black text-xl text-[var(--amarelo)] 
                       focus:outline-none focus:ring-0
                       disabled:opacity-50"
          />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l border-white/10 pl-4 pr-2">
            {value === 1 ? 'jogo' : 'jogos'}
          </span>
        </div>
      </div>

      <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl px-4 py-3 text-xs flex items-start gap-3">
        <div className="mt-0.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <span className="font-black uppercase tracking-wider mb-1 block">Regra de Viabilidade Logística</span>
          Evita que delegações com equipes em múltiplas categorias (ex: Sub12 e Sub15) fiquem sobrecarregadas. 
          O recomendável é **2 jogos** por dia.
        </div>
      </div>
    </div>
  )
}
