import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { formatChampionshipStatus } from '@/lib/utils'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

const FGB_LOGO = 'https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png'

function getStatusStyle(status: string) {
  if (status === 'ONGOING') return 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/20'
  if (status === 'REGISTRATION_OPEN') return 'text-green-400 bg-green-500/10 border-green-500/20'
  if (status === 'FINISHED') return 'text-slate-400 bg-white/[0.05] border-white/[0.08]'
  return 'text-slate-500 bg-white/[0.03] border-white/[0.05]'
}

export default async function HomePage() {
  const championships = await prisma.championship.findMany({
    where: { status: { in: ['ONGOING', 'REGISTRATION_OPEN'] }, isSimulation: false },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      categories: { select: { name: true }, take: 4 },
      _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } },
    },
  }).catch(() => [])

  const recentGames = await prisma.game.findMany({
    where: { status: 'FINISHED' },
    orderBy: { dateTime: 'desc' },
    take: 6,
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      category: {
        include: { championship: { select: { name: true } } },
      },
    },
  }).catch(() => [])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      <PublicHeader />

      <main>

        {/* ═══════════════════════════════════════
            HERO SECTION
        ═══════════════════════════════════════ */}
        <section className="relative min-h-[90vh] flex items-center justify-center px-6 overflow-hidden">

          {/* Backgrounds */}
          <div className="absolute inset-0">
            {/* Grid de quadra */}
            <div className="absolute inset-0 court-pattern" />
            {/* Linhas de quadra SVG */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <svg viewBox="0 0 800 500" className="w-full h-full max-w-5xl">
                <rect x="40" y="40" width="720" height="420" stroke="white" strokeWidth="2" fill="none" />
                <line x1="400" y1="40" x2="400" y2="460" stroke="white" strokeWidth="1" />
                <circle cx="400" cy="250" r="60" stroke="white" strokeWidth="1.5" fill="none" />
                <circle cx="400" cy="250" r="8" stroke="white" strokeWidth="2" fill="none" />
                <rect x="40" y="140" width="140" height="220" stroke="white" strokeWidth="1.5" fill="none" />
                <rect x="620" y="140" width="140" height="220" stroke="white" strokeWidth="1.5" fill="none" />
                <path d="M 180 140 A 60 60 0 0 0 180 360" stroke="white" strokeWidth="1" fill="none" />
                <path d="M 620 140 A 60 60 0 0 1 620 360" stroke="white" strokeWidth="1" fill="none" />
              </svg>
            </div>
            {/* Glow laranja central */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(255,107,0,0.07)_0%,transparent_70%)]" />
            {/* Fade ao fundo */}
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
          </div>

          {/* Conteúdo */}
          <div className="relative max-w-5xl mx-auto text-center">

            {/* Logo com glow */}
            <div className="flex justify-center mb-8 animate-fade-in">
              <div className="relative w-20 h-20 md:w-28 md:h-28">
                <div className="absolute inset-0 rounded-full bg-[#FF6B00]/20 blur-2xl animate-pulse-orange" />
                <Image
                  src={FGB_LOGO}
                  alt="FGB - Federação Gaúcha de Basketball"
                  fill
                  className="object-contain relative z-10 drop-shadow-[0_0_24px_rgba(255,107,0,0.35)]"
                  priority
                  unoptimized
                />
              </div>
            </div>

            {/* Label */}
            <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.6em] text-[#FF6B00] mb-6 animate-fade-in delay-100">
              FGB · Plataforma Oficial · Season 2026
            </p>

            {/* H1 — mega impactante */}
            <h1
              className="font-black italic uppercase leading-[0.85] tracking-tight mb-6 animate-fade-up delay-200"
              style={{
                fontSize: 'clamp(3.5rem, 10vw, 9rem)',
                fontFamily: 'var(--font-display), sans-serif',
              }}
            >
              <span className="text-white">Federação</span>
              <br />
              <span className="text-white">Gaúcha</span>
              <br />
              <span className="text-gradient-orange">Basketball</span>
            </h1>

            {/* Subtítulo */}
            <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up delay-300">
              Fundada em 18 de abril de 1952, em Porto Alegre.
              Gerenciando o basquete gaúcho com tradição e inovação
              há mais de 70 anos.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 justify-center animate-fade-up delay-400">
              <Link
                href="/campeonatos"
                className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl text-sm transition-all duration-300 hover:scale-[1.04] hover:-translate-y-0.5 shadow-[0_8px_30px_rgba(255,107,0,0.35)] hover:shadow-[0_12px_40px_rgba(255,107,0,0.5)]"
              >
                Ver Campeonatos →
              </Link>
              <Link
                href="/login"
                className="bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] hover:border-white/[0.2] text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl text-sm transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
              >
                Área da Equipe
              </Link>
            </div>

            {/* Scroll indicator */}
            <div className="flex justify-center mt-16 animate-fade-in delay-500">
              <div className="flex flex-col items-center gap-1.5 opacity-30">
                <div className="w-[1px] h-8 bg-gradient-to-b from-transparent to-white" />
                <span className="text-[9px] uppercase tracking-[0.3em] text-white">scroll</span>
              </div>
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════
            STATS
        ═══════════════════════════════════════ */}
        <section className="py-10 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: '1952', label: 'Fundação', sub: 'Porto Alegre, RS' },
                { value: '70+', label: 'Anos de história', sub: 'de tradição gaúcha' },
                { value: '22', label: 'Clubes fundadores', sub: 'Grêmio, Inter, SOGIPA...' },
                { value: 'FGB', label: 'Federação oficial', sub: 'Rio Grande do Sul' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="relative bg-[#141414] border border-white/[0.07] rounded-2xl p-5 text-center hover:border-[#FF6B00]/20 transition-all duration-300 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.05)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <p
                    className="relative text-3xl md:text-4xl font-black italic uppercase text-[#FF6B00] group-hover:scale-105 transition-transform duration-300 tracking-tight"
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    {stat.value}
                  </p>
                  <p className="relative text-[10px] font-black uppercase tracking-widest text-white/70 mt-1">
                    {stat.label}
                  </p>
                  <p className="relative text-[9px] text-slate-600 mt-0.5 uppercase tracking-wide">
                    {stat.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════
            CAMPEONATOS ATIVOS
        ═══════════════════════════════════════ */}
        <section className="py-16 px-6 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto">

            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00] mb-2">
                  Temporada 2026
                </p>
                <h2
                  className="text-3xl md:text-5xl font-black italic uppercase text-white tracking-tight leading-none"
                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                >
                  Campeonatos<br />
                  <span className="text-slate-500">Ativos</span>
                </h2>
              </div>
              <Link
                href="/campeonatos"
                className="hidden md:flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-[#FF6B00] transition-colors duration-200 group"
              >
                Ver todos
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </Link>
            </div>

            {championships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {championships.map((c) => (
                  <Link
                    key={c.id}
                    href={`/campeonatos/${c.id}`}
                    className="group relative bg-[#141414] border border-white/[0.07] rounded-3xl p-6 overflow-hidden card-hover block"
                  >
                    {/* Corner glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(255,107,0,0.08),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative">
                      <div className="flex items-start justify-between mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center text-2xl group-hover:bg-[#FF6B00]/15 transition-all duration-300">
                          🏀
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full border ${getStatusStyle(c.status)}`}>
                          {formatChampionshipStatus(c.status)}
                        </span>
                      </div>

                      <h3
                        className="text-lg font-black italic uppercase text-white group-hover:text-[#FF6B00] transition-colors duration-300 leading-tight mb-2 tracking-tight"
                        style={{ fontFamily: 'var(--font-display), sans-serif' }}
                      >
                        {c.name}
                      </h3>

                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {c.categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat.name}
                            className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-500 border border-white/[0.06]"
                          >
                            {cat.name}
                          </span>
                        ))}
                        {c.categories.length > 3 && (
                          <span className="text-[9px] text-slate-700">+{c.categories.length - 3}</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                        <span className="text-[10px] text-slate-600 uppercase tracking-wider">
                          {c._count.registrations} equipes confirmadas
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] group-hover:translate-x-1 transition-transform duration-200">
                          Ver →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-[#141414] border border-white/[0.07] rounded-3xl p-12 text-center">
                <p className="text-3xl mb-4">🏀</p>
                <p className="text-slate-500 text-sm uppercase tracking-widest">
                  Nenhum campeonato ativo no momento
                </p>
              </div>
            )}
          </div>
        </section>


        {/* ═══════════════════════════════════════
            ÚLTIMOS RESULTADOS
        ═══════════════════════════════════════ */}
        {recentGames.length > 0 && (
          <section className="py-16 px-6 border-t border-white/[0.05]">
            <div className="max-w-7xl mx-auto">

              <div className="mb-10">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00] mb-2">
                  Ao vivo e recentes
                </p>
                <h2
                  className="text-3xl md:text-5xl font-black italic uppercase text-white tracking-tight"
                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                >
                  Últimos<br />
                  <span className="text-slate-500">Resultados</span>
                </h2>
              </div>

              <div className="bg-[#141414] border border-white/[0.07] rounded-3xl overflow-hidden">
                {recentGames.map((game, i) => (
                  <div
                    key={game.id}
                    className={`px-6 py-4 flex items-center justify-between hover:bg-white/[0.025] transition-all duration-200 ${
                      i < recentGames.length - 1 ? 'border-b border-white/[0.05]' : ''
                    }`}
                  >
                    {/* Badge campeonato */}
                    <span className="hidden sm:block text-[9px] font-black uppercase tracking-widest text-slate-700 bg-white/[0.04] px-2.5 py-1 rounded-full flex-shrink-0 w-36 truncate">
                      {game.category.championship.name.length > 18
                        ? game.category.championship.name.slice(0, 18) + '…'
                        : game.category.championship.name}
                    </span>

                    {/* Placar */}
                    <div className="flex items-center gap-4 flex-1 justify-center">
                      <span className="text-sm font-black uppercase text-white text-right flex-1 truncate">
                        {game.homeTeam.name}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xl font-black text-[#FF6B00] tabular-nums bg-[#FF6B00]/5 border border-[#FF6B00]/10 px-3 py-1 rounded-xl min-w-[2.75rem] text-center">
                          {game.homeScore ?? '—'}
                        </span>
                        <span className="text-slate-700 font-black text-sm">×</span>
                        <span className="text-xl font-black text-[#FF6B00] tabular-nums bg-[#FF6B00]/5 border border-[#FF6B00]/10 px-3 py-1 rounded-xl min-w-[2.75rem] text-center">
                          {game.awayScore ?? '—'}
                        </span>
                      </div>
                      <span className="text-sm font-black uppercase text-white flex-1 truncate">
                        {game.awayTeam.name}
                      </span>
                    </div>

                    {/* Status */}
                    <span className="text-[9px] font-black uppercase text-slate-600 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                      Encerrado
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}


        {/* ═══════════════════════════════════════
            ACESSO RÁPIDO
        ═══════════════════════════════════════ */}
        <section className="py-16 px-6 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: '🏟️',
                  title: 'Estadual Masculino',
                  desc: 'Classificação, jogos e resultados do campeonato estadual masculino.',
                  href: '/campeonatos?filtro=masculino',
                  label: 'Acessar tabela',
                },
                {
                  icon: '🏅',
                  title: 'Estadual Feminino',
                  desc: 'Classificação, calendário e resultados do estadual feminino.',
                  href: '/campeonatos?filtro=feminino',
                  label: 'Acessar tabela',
                },
                {
                  icon: '📊',
                  title: 'Cestinhas',
                  desc: 'Ranking dos maiores pontuadores do basquete gaúcho na temporada.',
                  href: '/campeonatos/cestinhas',
                  label: 'Ver ranking',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-[#141414] border border-white/[0.07] rounded-3xl p-6 hover:border-[#FF6B00]/20 transition-all duration-300 group card-hover"
                >
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 w-fit">
                    {item.icon}
                  </div>
                  <h3
                    className="text-base font-black italic uppercase text-white mb-2 group-hover:text-[#FF6B00] transition-colors duration-200 tracking-tight"
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-5">{item.desc}</p>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#FF6B00] hover:gap-3 transition-all duration-200"
                  >
                    {item.label} →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════
            INSTITUCIONAL
        ═══════════════════════════════════════ */}
        <section className="py-16 px-6 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Sobre a FGB',
                  desc: 'Fundada em 1952 com apoio de 22 clubes. Mais de 70 anos promovendo o basquete gaúcho.',
                  href: '/fgb/historia',
                  label: 'Nossa história',
                },
                {
                  title: 'Seleção Gaúcha',
                  desc: 'Acompanhe convocações, treinamentos e resultados das seleções nas competições nacionais.',
                  href: '/selecao-gaucha',
                  label: 'Ver seleção',
                },
                {
                  title: 'Documentos Oficiais',
                  desc: 'Regulamento desportivo, normas do estadual, categorias e idades, regimento de taxas.',
                  href: '/fgb/regulamento',
                  label: 'Ver documentos',
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-[#141414] border border-white/[0.07] rounded-3xl p-6 group hover:border-white/[0.12] transition-all duration-300"
                >
                  <h3
                    className="text-base font-black italic uppercase text-white mb-2 group-hover:text-[#FF6B00] transition-colors duration-200 tracking-tight"
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-5">{card.desc}</p>
                  <Link
                    href={card.href}
                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#FF6B00] hover:gap-3 transition-all duration-200"
                  >
                    {card.label} →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ═══════════════════════════════════════
            CTA FINAL
        ═══════════════════════════════════════ */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="relative bg-[#141414] border border-white/[0.07] rounded-3xl p-10 md:p-16 text-center overflow-hidden">

              {/* Decorações */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,107,0,0.07)_0%,transparent_65%)] pointer-events-none" />
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF6B00]/30 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF6B00]/20 to-transparent" />
              <div className="absolute inset-0 court-pattern opacity-50" />

              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FF6B00] mb-5">
                  Plataforma Oficial FGB
                </p>
                <h2
                  className="text-3xl md:text-6xl font-black italic uppercase text-white tracking-tight leading-none mb-5"
                  style={{ fontFamily: 'var(--font-display), sans-serif' }}
                >
                  Sua equipe no<br />
                  <span className="text-gradient-orange">próximo campeonato</span>
                </h2>
                <p className="text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed text-sm md:text-base">
                  Inscreva sua equipe, acompanhe jogos e resultados em tempo real.
                  Gestão completa de campeonatos pelo sistema oficial da FGB.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link
                    href="/register"
                    className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest px-10 py-4 rounded-2xl text-sm transition-all duration-300 hover:scale-[1.04] shadow-[0_8px_30px_rgba(255,107,0,0.35)] hover:shadow-[0_12px_40px_rgba(255,107,0,0.5)]"
                  >
                    Cadastrar Equipe
                  </Link>
                  <Link
                    href="/campeonatos"
                    className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white font-black uppercase tracking-widest px-10 py-4 rounded-2xl text-sm transition-all duration-300 hover:scale-[1.02]"
                  >
                    Ver Campeonatos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  )
}
