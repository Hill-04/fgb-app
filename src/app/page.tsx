import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#060810] text-slate-50 flex flex-col">
      {/* Header */}
      <header className="px-6 lg:px-14 h-20 flex items-center justify-between border-b border-white/[0.06] bg-[#060810]/90 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center gap-3" href="#">
          <div className="w-9 h-9 bg-orange-600 flex items-center justify-center rotate-45 shrink-0">
            <span className="font-display font-black text-white text-xs -rotate-45 tracking-tight">FGB</span>
          </div>
          <div className="hidden sm:block leading-none">
            <div className="font-display font-bold text-xs text-white tracking-[0.2em] uppercase">Federação Gaúcha</div>
            <div className="text-[10px] text-slate-500 tracking-widest uppercase mt-0.5">de Basquete</div>
          </div>
        </Link>
        <nav className="flex gap-6 items-center">
          <Link className="text-sm font-medium text-slate-400 hover:text-orange-400 transition-colors" href="/login">
            Entrar
          </Link>
          <Link href="/register">
            <Button className="bg-orange-600 hover:bg-orange-500 text-white h-9 px-5 text-sm font-semibold border-0 rounded-none transition-colors">
              Criar Conta
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {/* Decorative: basketball court lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
          <svg
            viewBox="0 0 900 800"
            className="absolute -right-32 top-0 w-[700px] h-[700px] opacity-[0.035]"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
          >
            {/* Outer court boundary */}
            <rect x="40" y="40" width="820" height="720" rx="4" />
            {/* Center circle */}
            <circle cx="450" cy="400" r="90" />
            <circle cx="450" cy="400" r="18" />
            {/* Half-court line */}
            <line x1="40" y1="400" x2="860" y2="400" strokeDasharray="10 8" />
            {/* Left key area */}
            <rect x="40" y="270" width="220" height="260" />
            <ellipse cx="260" cy="400" rx="90" ry="90" strokeDasharray="14 10" />
            {/* Left three-point arc (partial) */}
            <path d="M 40 155 A 340 340 0 0 1 40 645" />
            {/* Right key area */}
            <rect x="640" y="270" width="220" height="260" />
            <ellipse cx="640" cy="400" rx="90" ry="90" strokeDasharray="14 10" />
            {/* Right three-point arc (partial) */}
            <path d="M 860 155 A 340 340 0 0 0 860 645" />
          </svg>
          {/* Atmospheric glows */}
          <div className="absolute top-[-100px] right-[-50px] w-[500px] h-[500px] rounded-full bg-orange-600/[0.13] blur-[130px]" />
          <div className="absolute bottom-[-50px] left-[15%] w-[350px] h-[350px] rounded-full bg-orange-500/[0.06] blur-[100px]" />
        </div>

        {/* Hero */}
        <section className="relative z-10 pt-20 md:pt-32 lg:pt-44 pb-16 px-6 md:px-14">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-4xl">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 border border-orange-500/30 bg-orange-500/[0.08] px-3 py-1.5 mb-8 animate-fade-in"
                style={{ animationDelay: '0ms' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] font-bold text-orange-400 tracking-[0.2em] uppercase">
                  Novo Sistema Integrado · Temporada 2026
                </span>
              </div>

              {/* Headline */}
              <h1
                className="font-display font-black uppercase leading-none tracking-tight text-white mb-8 animate-fade-up"
                style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)', animationDelay: '80ms' }}
              >
                O Futuro do<br />
                <span className="text-orange-500">Basquete</span><br />
                Gaúcho
              </h1>

              <p
                className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 animate-fade-up"
                style={{ animationDelay: '160ms' }}
              >
                Automatize a organização de campeonatos. Inscrições digitais, definição de formatos
                e tabelas de jogos otimizadas com Inteligência Artificial.
              </p>

              <div
                className="flex flex-wrap gap-4 animate-fade-up"
                style={{ animationDelay: '240ms' }}
              >
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold h-12 px-10 text-base border-0 rounded-none shadow-[0_0_50px_-8px_rgba(234,88,12,0.6)] transition-all hover:shadow-[0_0_60px_-8px_rgba(234,88,12,0.8)]"
                  >
                    Criar Conta
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Button>
                </Link>
                <Link href="/admin/dashboard">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-slate-300 border-white/15 hover:bg-white/[0.06] hover:border-white/25 h-12 px-10 text-base rounded-none transition-all"
                  >
                    Painel da Federação
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="relative z-10 border-y border-white/[0.06] bg-white/[0.015] px-6 md:px-14 py-7">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center divide-x divide-white/[0.08] max-w-xl">
              {[
                { value: '12+', label: 'Campeonatos/Ano' },
                { value: '200+', label: 'Equipes Filiadas' },
                { value: 'IA', label: 'Agendamento Inteligente' },
              ].map((stat) => (
                <div key={stat.label} className="flex-1 text-center px-4 first:pl-0 last:pr-0">
                  <div className="font-display font-black text-3xl md:text-4xl text-white leading-none">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1.5 uppercase tracking-widest font-semibold">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="relative z-10 py-24 px-6 md:px-14">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <p className="text-[10px] text-orange-500 font-black tracking-[0.25em] uppercase mb-3">
                Plataforma
              </p>
              <h2 className="font-display font-black text-4xl md:text-5xl uppercase text-white tracking-tight">
                Funcionalidades
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06]">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  ),
                  title: 'Inscrição Digital',
                  desc: 'Equipes se inscrevem remotamente, informando categorias, ginásio e datas bloqueadas — sem burocracia.',
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: 'Otimização IA',
                  desc: 'Scheduling inteligente agrupa categorias, minimiza viagens e detecta conflitos automaticamente.',
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: 'Súmulas e Calendário',
                  desc: 'Tabelas e documentos no formato oficial da FGB gerados automaticamente com um clique.',
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="group p-8 bg-[#060810] border-t-2 border-t-transparent hover:border-t-orange-500 hover:bg-[#0d1420] transition-all duration-300"
                >
                  <div className="text-orange-500 mb-5 group-hover:scale-110 transition-transform w-fit">
                    {feat.icon}
                  </div>
                  <h3 className="font-display font-bold text-xl uppercase text-white mb-3 tracking-tight">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] bg-[#060810] py-6 px-6 md:px-14">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-orange-600 flex items-center justify-center rotate-45 shrink-0">
              <span className="font-display font-black text-white text-[8px] -rotate-45">FGB</span>
            </div>
            <p className="text-xs text-slate-600">Federação Gaúcha de Basquete</p>
          </div>
          <p className="text-xs text-slate-700">&copy; {new Date().getFullYear()} Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
