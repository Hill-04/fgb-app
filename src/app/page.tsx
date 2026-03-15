import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-[--bg-main] text-[--text-main] flex flex-col selection:bg-orange-500/20">
      {/* Header - Premium Light Glass Style */}
      <header className="px-6 lg:px-14 h-20 flex items-center justify-between border-b border-slate-200 bg-white/70 backdrop-blur-2xl sticky top-0 z-50">
        <Link className="flex items-center gap-3 group" href="#">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center rounded-[10px] shadow-[0_4px_10px_rgba(234,88,12,0.2)] transition-transform duration-300 group-hover:scale-105 shrink-0">
            <span className="font-display font-black text-white text-xs tracking-tight">FGB</span>
          </div>
          <div className="hidden sm:block leading-none">
            <div className="font-display font-bold text-xs text-slate-800 tracking-[0.2em] uppercase">Federação Gaúcha</div>
            <div className="text-[10px] text-slate-500 tracking-widest uppercase mt-0.5">de Basquete</div>
          </div>
        </Link>
        <nav className="flex gap-6 items-center">
          <Link className="text-sm font-bold text-slate-600 hover:text-orange-600 transition-colors" href="/login">
            Entrar
          </Link>
          <Link href="/register">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white h-9 px-6 text-sm font-bold rounded-full transition-all shadow-md hover:shadow-lg hover:scale-105">
              Criar Conta
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {/* Decorative: Soft light backgrounds and a subtle grid */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          
          {/* Atmospheric glows - extremely subtle for light mode */}
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-orange-600/[0.03] blur-[150px]" />
          <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/[0.02] blur-[120px]" />
        </div>

        {/* Hero */}
        <section className="relative z-10 pt-24 md:pt-36 lg:pt-48 pb-20 px-6 md:px-14">
          <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
            {/* Pill Badge */}
            <div
              className="inline-flex items-center gap-2 border border-slate-200 bg-white px-4 py-2 rounded-full mb-10 animate-fade-in shadow-sm"
              style={{ animationDelay: '0ms' }}
            >
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(234,88,12,0.4)]" />
              <span className="text-[11px] font-extrabold text-slate-700 tracking-[0.2em] uppercase">
                Novo Sistema Integrado · 2026
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-display font-black leading-[1.05] tracking-tighter text-slate-900 mb-8 animate-fade-up max-w-5xl"
              style={{ fontSize: 'clamp(3.5rem, 8vw, 6.5rem)', animationDelay: '80ms' }}
            >
              O Futuro do{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-700">
                Basquete
              </span>{' '}
              Gaúcho
            </h1>

            <p
              className="text-slate-600 text-lg md:text-xl max-w-2xl leading-relaxed mb-12 animate-fade-up font-medium"
              style={{ animationDelay: '160ms' }}
            >
              Automatize a organização de campeonatos. Inscrições digitais, definição de formatos
              e tabelas de jogos otimizadas com Inteligência Artificial.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up"
              style={{ animationDelay: '240ms' }}
            >
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-14 px-10 text-base rounded-full shadow-[0_8px_20px_-6px_rgba(234,88,12,0.5)] transition-all hover:shadow-[0_12px_24px_-8px_rgba(234,88,12,0.6)] hover:scale-105"
                >
                  Criar Conta
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </Link>
              <Link href="/admin/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-orange-600 h-14 px-10 text-base rounded-full transition-all shadow-sm hover:scale-105 hover:border-orange-200"
                >
                  Painel da Federação
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats bar - Solid Clean Variant */}
        <section className="relative z-10 px-6 md:px-14 py-10">
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {[
                { value: '12+', label: 'Campeonatos/Ano' },
                { value: '200+', label: 'Equipes Filiadas' },
                { value: 'IA', label: 'Agendamento Inteligente' },
              ].map((stat) => (
                <div key={stat.label} className="flex-1 w-full text-center px-4 pt-6 md:pt-0 first:pt-0">
                  <div className="font-display font-black text-4xl md:text-5xl text-slate-900 leading-none tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-3 uppercase tracking-[0.2em] font-bold">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features - Premium Light Grid */}
        <section className="relative z-10 py-24 md:py-32 px-6 md:px-14">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 md:mb-24">
              <p className="text-[11px] text-orange-600 font-bold tracking-[0.3em] uppercase mb-4">
                Plataforma
              </p>
              <h2 className="font-display font-black text-4xl md:text-6xl uppercase text-slate-900 tracking-tight">
                Funcionalidades
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  ),
                  title: 'Inscrição Digital',
                  desc: 'Equipes se inscrevem remotamente, informando categorias, ginásio e datas bloqueadas — sem burocracia.',
                  color: 'from-orange-50 to-white',
                  iconColor: 'bg-orange-100 text-orange-600'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: 'Otimização IA',
                  desc: 'Scheduling inteligente agrupa categorias, minimiza viagens e detecta conflitos automaticamente.',
                  color: 'from-blue-50 to-white',
                  iconColor: 'bg-blue-100 text-blue-600'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: 'Súmulas e Calendário',
                  desc: 'Tabelas e documentos no formato oficial da FGB gerados automaticamente com um clique.',
                  color: 'from-purple-50 to-white',
                  iconColor: 'bg-purple-100 text-purple-600'
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="group relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-8 hover:border-slate-300 transition-all duration-300 hover:-translate-y-2 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)]"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center ${feat.iconColor} mb-6 transition-all duration-300 group-hover:scale-110 shadow-sm`}>
                    {feat.icon}
                  </div>
                  
                  <h3 className="relative z-10 font-display font-bold text-2xl text-slate-900 mb-4 tracking-tight">
                    {feat.title}
                  </h3>
                  
                  <p className="relative z-10 text-base text-slate-600 leading-relaxed font-medium">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200 bg-white py-8 px-6 md:px-14">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center rounded-md shrink-0">
              <span className="font-display font-black text-white text-[10px] tracking-tight">FGB</span>
            </div>
            <p className="text-sm text-slate-500 font-bold">Federação Gaúcha de Basquete</p>
          </div>
          <p className="text-sm text-slate-500 font-medium">&copy; {new Date().getFullYear()} Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
