import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-[--bg-main] text-[--text-main] flex flex-col selection:bg-orange-500/20">
      {/* Header - Dark Premium Glass Style */}
      <header className="px-6 lg:px-14 h-20 flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] bg-[rgba(5,5,5,0.7)] backdrop-blur-2xl sticky top-0 z-50">
        <Link className="flex items-center gap-3 group" href="#">
          <div className="w-9 h-9 bg-gradient-to-br from-[#FF6B00] to-[#CC5500] flex items-center justify-center rounded-[10px] shadow-[0_4px_10px_rgba(255,107,0,0.2)] transition-transform duration-300 group-hover:scale-105 shrink-0">
            <span className="font-display font-black text-white text-xs tracking-tight">FGB</span>
          </div>
          <div className="hidden sm:block leading-none">
            <div className="font-display font-bold text-xs text-white tracking-[0.2em] uppercase">Federação Gaúcha</div>
            <div className="text-[10px] text-[--text-dim] tracking-widest uppercase mt-0.5">de Basquete</div>
          </div>
        </Link>
        <nav className="flex gap-6 items-center">
          <Link className="text-sm font-bold text-[--text-secondary] hover:text-white transition-colors" href="/login">
            Entrar
          </Link>
          <Link href="/register">
            <Button className="bg-[#FF6B00] hover:bg-[#CC5500] text-white h-9 px-6 text-sm font-bold rounded-full transition-all shadow-[0_4px_15px_-3px_rgba(255,107,0,0.4)] hover:shadow-[0_8px_20px_-5px_rgba(255,107,0,0.5)] hover:scale-105">
              Criar Conta
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {/* Decorative: Soft light backgrounds and a subtle grid */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          
          {/* Atmospheric glows - extremely subtle for dark mode */}
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-[#FF6B00]/[0.05] blur-[150px]" />
          <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/[0.04] blur-[120px]" />
        </div>

        {/* Hero */}
        <section className="relative z-10 pt-24 md:pt-36 lg:pt-48 pb-20 px-6 md:px-14">
          <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
            {/* Pill Badge */}
            <div
              className="inline-flex items-center gap-2 border border-[rgba(255,255,255,0.1)] bg-white/5 px-4 py-2 rounded-full mb-10 animate-fade-in shadow-sm"
              style={{ animationDelay: '0ms' }}
            >
              <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse shadow-[0_0_8px_rgba(255,107,0,0.5)]" />
              <span className="text-[11px] font-extrabold text-[--text-main] tracking-[0.2em] uppercase">
                Novo Sistema Integrado · 2026
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-display font-black leading-[1.05] tracking-tighter text-white mb-8 animate-fade-up max-w-5xl drop-shadow-lg"
              style={{ fontSize: 'clamp(3.5rem, 8vw, 6.5rem)', animationDelay: '80ms' }}
            >
              O Futuro do{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[--accent-sec]">
                Basquete
              </span>{' '}
              Gaúcho
            </h1>

            <p
              className="text-[--text-secondary] text-lg md:text-xl max-w-2xl leading-relaxed mb-12 animate-fade-up font-medium"
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
                  className="bg-[#FF6B00] hover:bg-[#CC5500] text-white font-bold h-14 px-10 text-base rounded-full shadow-[0_8px_20px_-6px_rgba(255,107,0,0.5)] transition-all hover:shadow-[0_12px_24px_-8px_rgba(255,107,0,0.6)] hover:scale-105"
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
                  className="bg-white/5 border-[rgba(255,255,255,0.1)] text-white hover:bg-white/10 hover:text-[#FF6B00] h-14 px-10 text-base rounded-full transition-all shadow-sm hover:scale-105 hover:border-[#FF6B00]/50"
                >
                  Painel da Federação
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats bar - Solid Clean Variant */}
        <section className="relative z-10 px-6 md:px-14 py-10">
          <div className="max-w-4xl mx-auto glass-panel rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-[rgba(255,255,255,0.05)]">
              {[
                { value: '12+', label: 'Campeonatos/Ano' },
                { value: '200+', label: 'Equipes Filiadas' },
                { value: 'IA', label: 'Agendamento Inteligente' },
              ].map((stat) => (
                <div key={stat.label} className="flex-1 w-full text-center px-4 pt-6 md:pt-0 first:pt-0">
                  <div className="font-display font-black text-4xl md:text-5xl text-[--text-main] leading-none tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-[--text-secondary] mt-3 uppercase tracking-[0.2em] font-bold">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features - Premium Dark Grid */}
        <section className="relative z-10 py-24 md:py-32 px-6 md:px-14">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 md:mb-24">
              <p className="text-[11px] text-[#FF6B00] font-bold tracking-[0.3em] uppercase mb-4">
                Plataforma
              </p>
              <h2 className="font-display font-black text-4xl md:text-6xl uppercase text-white tracking-tight drop-shadow-md">
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
                  color: 'from-[#FF6B00]/10 to-transparent',
                  iconColor: 'bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/20'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: 'Otimização IA',
                  desc: 'Scheduling inteligente agrupa categorias, minimiza viagens e detecta conflitos automaticamente.',
                  color: 'from-[#8B5CF6]/10 to-transparent',
                  iconColor: 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/20'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: 'Súmulas e Calendário',
                  desc: 'Tabelas e documentos no formato oficial da FGB gerados automaticamente com um clique.',
                  color: 'from-[#3B82F6]/10 to-transparent',
                  iconColor: 'bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/20'
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="group relative overflow-hidden glass-panel rounded-3xl p-8 hover:border-[rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-2 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)]"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center ${feat.iconColor} mb-6 transition-all duration-300 group-hover:scale-110 shadow-sm`}>
                    {feat.icon}
                  </div>
                  
                  <h3 className="relative z-10 font-display font-bold text-2xl text-[--text-main] mb-4 tracking-tight">
                    {feat.title}
                  </h3>
                  
                  <p className="relative z-10 text-base text-[--text-secondary] leading-relaxed font-medium">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[rgba(255,255,255,0.05)] bg-[rgba(5,5,5,0.8)] backdrop-blur-md py-8 px-6 md:px-14">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-[#FF6B00] to-[#CC5500] flex items-center justify-center rounded-md shrink-0">
              <span className="font-display font-black text-white text-[10px] tracking-tight">FGB</span>
            </div>
            <p className="text-sm text-[--text-dim] font-bold">Federação Gaúcha de Basquete</p>
          </div>
          <p className="text-sm text-[--text-dim] font-medium">&copy; {new Date().getFullYear()} Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
