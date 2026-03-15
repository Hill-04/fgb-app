import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-[--bg-main] text-[--text-main] flex flex-col selection:bg-orange-500/20">
      {/* Header - Flat Dark Style */}
      <header className="px-6 lg:px-14 h-20 flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] bg-[#060606] sticky top-0 z-50">
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
        {/* Decorative Court Graphic (Right Side) */}
        <div className="absolute top-0 right-0 w-[50%] h-full overflow-hidden pointer-events-none opacity-[0.03] flex items-center justify-end z-0">
          {/* Half Court Graphic */}
          <svg width="800" height="800" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform translate-x-[20%]">
            {/* Out of bounds line */}
            <rect x="50" y="50" width="400" height="400" stroke="white" strokeWidth="2"/>
            {/* Center line (halfcourt line) */}
            <line x1="50" y1="250" x2="50" y2="450" stroke="white" strokeWidth="2"/>
            {/* Center circle */}
            <path d="M50 350 A100 100 0 0 0 50 150" stroke="white" strokeWidth="2" fill="none"/>
            {/* Paint / Free throw lane */}
            <rect x="250" y="150" width="200" height="200" stroke="white" strokeWidth="2"/>
            {/* Free throw circle (top half) */}
            <path d="M250 150 A100 100 0 0 1 250 350" stroke="white" strokeWidth="2" fill="none" strokeDasharray="10 10"/>
            {/* 3 point line */}
            <path d="M450 50 L350 50 A200 200 0 0 0 350 450 L450 450" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M50 250 L450 250" stroke="white" strokeWidth="1" strokeDasharray="5 5" opacity="0.5"/>
          </svg>
        </div>

        {/* Hero */}
        <section className="relative z-10 pt-24 md:pt-36 lg:pt-48 pb-20 px-6 md:px-14">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            
            <div className="flex flex-col items-start text-left">
              {/* Pill Badge */}
              <div
                className="inline-flex items-center gap-3 border border-[#FF6B00]/20 bg-[#FF6B00]/5 px-4 py-2 mb-10 animate-fade-in"
                style={{ animationDelay: '0ms' }}
              >
                <span className="w-1.5 h-1.5 rounded bg-[#FF6B00]" />
                <span className="text-[10px] font-bold text-[#FF6B00] tracking-[0.2em] uppercase">
                  NOVO SISTEMA INTEGRADO · TEMPORADA 2026
                </span>
              </div>

              {/* Headline */}
              <h1
                className="font-display font-black leading-[0.9] tracking-tighter text-white mb-8 animate-fade-up max-w-[800px] uppercase"
                style={{ fontSize: 'clamp(3rem, 7vw, 6.5rem)', animationDelay: '80ms' }}
              >
                O Futuro do<br />
                <span className="text-[#FF6B00] inline-block mt-[-0.1em]">Basquete</span><br />
                <span className="relative">
                  Gaúcho
                  <span className="absolute -bottom-2 left-0 w-24 h-1.5 bg-[#FF6B00] rounded-full opacity-50" />
                </span>
              </h1>

              <p
                className="text-[--text-secondary] text-lg max-w-xl leading-relaxed mb-12 animate-fade-up font-medium"
                style={{ animationDelay: '160ms' }}
              >
                Automatize a organização de campeonatos. Inscrições digitais, definição de formatos
                e tabelas de jogos otimizadas com Inteligência Artificial.
              </p>

              <div
                className="flex flex-col sm:flex-row items-center gap-4 animate-fade-up w-full sm:w-auto"
                style={{ animationDelay: '240ms' }}
              >
                <Link href="/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-[#FF6B00] hover:bg-[#CC5500] text-white font-bold h-14 px-10 text-base rounded transition-all"
                  >
                    Criar Conta
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Button>
                </Link>
                <Link href="/admin/dashboard" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto bg-transparent border-[rgba(255,255,255,0.1)] text-white hover:bg-white/5 hover:text-white h-14 px-10 text-base rounded transition-all"
                  >
                    Painel da Federação
                  </Button>
                </Link>
              </div>
            </div>

            {/* Empty column for graphic layout purposes */}
            <div className="hidden lg:block"></div>
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
        <section className="relative z-10 py-24 md:py-32 px-6 md:px-14 border-t border-[rgba(255,255,255,0.05)] bg-[#050505]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 md:mb-24">
              <p className="text-[11px] text-[#FF6B00] font-bold tracking-[0.3em] uppercase mb-4">
                Plataforma
              </p>
              <h2 className="font-display font-black text-4xl md:text-6xl uppercase text-white tracking-tight">
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
                  iconColor: 'bg-[#FF6B00]/10 text-[#FF6B00]'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: 'Otimização IA',
                  desc: 'Scheduling inteligente agrupa categorias, minimiza viagens e detecta conflitos automaticamente.',
                  iconColor: 'bg-[#8B5CF6]/10 text-[#A78BFA]'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: 'Súmulas e Calendário',
                  desc: 'Tabelas e documentos no formato oficial da FGB gerados automaticamente com um clique.',
                  iconColor: 'bg-[#3B82F6]/10 text-[#60A5FA]'
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="bg-[#111111] rounded-2xl p-8 hover:bg-[#151515] hover:shadow-[0_0_20px_rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.02)] transition-colors"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${feat.iconColor} mb-6`}>
                    {feat.icon}
                  </div>
                  
                  <h3 className="font-display font-bold text-xl text-[--text-main] mb-4 tracking-tight">
                    {feat.title}
                  </h3>
                  
                  <p className="text-sm text-[--text-secondary] leading-relaxed font-medium">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[rgba(255,255,255,0.05)] bg-[#060606] py-8 px-6 md:px-14">
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
