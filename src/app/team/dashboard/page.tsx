import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TeamDashboard() {
  const stats = [
    {
      label: 'Status',
      value: 'Ativa',
      sub: 'Registro FGB atualizado',
      accentColor: 'border-t-orange-500',
      valueColor: 'text-orange-400',
    },
    {
      label: 'Jogos Pendentes',
      value: '0',
      sub: 'Próxima partida não agendada',
      accentColor: 'border-t-slate-600',
      valueColor: 'text-white',
    },
    {
      label: 'Categorias Ativas',
      value: '4',
      sub: 'Sub 12, Sub 13, Sub 15, Sub 17',
      accentColor: 'border-t-cyan-500',
      valueColor: 'text-white',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div>
        <p className="text-[10px] font-black text-orange-500 tracking-[0.25em] uppercase mb-2">
          Painel da Equipe
        </p>
        <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight text-white leading-none">
          Flyboys
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Gerencie inscrições, ginásio e calendário de jogos oficiais da FGB.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-[#0d1420] border border-white/[0.06] border-t-2 ${stat.accentColor} p-5 relative overflow-hidden`}
          >
            <div
              className="absolute bottom-0 right-2 font-display font-black text-[4.5rem] leading-none text-white/[0.02] pointer-events-none select-none"
              aria-hidden="true"
            >
              {stat.value}
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
            <div className={`font-display font-black text-4xl ${stat.valueColor} leading-none`}>
              {stat.value}
            </div>
            <p className="text-[11px] text-slate-600 mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Active Championship */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl uppercase text-white tracking-tight">
            Inscrições Abertas
          </h2>
          <Link
            href="/team/championships"
            className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-wider"
          >
            Ver todos →
          </Link>
        </div>

        <div className="border border-white/[0.06] border-l-2 border-l-orange-500 bg-[#0d1420] relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/[0.06] blur-[60px] rounded-full pointer-events-none" />

          {/* Top accent bar */}
          <div className="px-6 pt-5 pb-4 border-b border-white/[0.04]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display font-black text-2xl uppercase text-white tracking-tight leading-none mb-1">
                  Estadual 2026 — Masculino
                </h3>
                <p className="text-xs text-slate-500">Encerra em 15 de Abril de 2026</p>
              </div>
              <span className="shrink-0 inline-flex items-center text-[9px] font-black px-2.5 py-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-widest">
                Aberto
              </span>
            </div>
          </div>

          <div className="px-6 py-4">
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              A FGB convida sua equipe para o maior campeonato da temporada. Selecione as categorias,
              os fins de semana bloqueados e as informações do seu ginásio.
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              {['Mínimo 3 equipes/categoria', 'Categorias agrupadas', 'Scheduling por IA'].map((tag) => (
                <span key={tag} className="text-[10px] font-semibold text-slate-500 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>

            <Link href="/team/championships/estadual-2026/register">
              <Button className="bg-orange-600 hover:bg-orange-500 text-white font-bold h-10 px-7 border-0 rounded-none shadow-[0_0_30px_-8px_rgba(234,88,12,0.5)] transition-all hover:shadow-[0_0_40px_-8px_rgba(234,88,12,0.7)]">
                Realizar Inscrição
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
