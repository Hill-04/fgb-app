interface CourtsFieldProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function CourtsField({ value, onChange, disabled = false }: CourtsFieldProps) {
  const isParallel = value >= 2

  return (
    <div className="space-y-4 p-6 bg-white/[0.02] border border-white/5 rounded-2xl transition-all hover:border-white/10 group">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-200 uppercase tracking-tight flex items-center gap-2">
             Quadras disponíveis por sede
          </label>
          <p className="text-xs text-slate-500 font-medium">
            Define se jogos serão sequenciais ou podem ocorrer simultaneamente.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-black/20 p-2 rounded-xl border border-white/5">
          <input
            type="number"
            min={1}
            max={6}
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
            {value === 1 ? 'quadra' : 'quadras'}
          </span>
        </div>
      </div>

      <div
        className={`rounded-xl px-4 py-3 text-xs flex items-start gap-3 transition-all duration-300 ${
          isParallel
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
        }`}
      >
        <div className="mt-0.5">
          {isParallel ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div>
          {isParallel ? (
            <>
              <span className="font-black uppercase tracking-wider mb-1 block">Modo Paralelo Ativo</span>
              O sistema vai distribuir os jogos em {value} quadras (A, B
              {value >= 3 ? ', C' : ''}
              {value >= 4 ? ', D...' : ''}) e otimizar os horários para reduzir a duração do evento.
            </>
          ) : (
            <>
              <span className="font-black uppercase tracking-wider mb-1 block">Modo Sequencial</span>
              Todos os jogos ocorrem em uma única quadra, um após o outro.
              Os horários serão calculados automaticamente para evitar sobreposições.
            </>
          )}
        </div>
      </div>

      {value > 4 && (
        <div className="flex items-center gap-2 text-[10px] text-amber-500 font-bold uppercase tracking-widest bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Atenção: {value} quadras é um número incomum. Confirme a disponibilidade do ginásio.
        </div>
      )}
    </div>
  )
}
