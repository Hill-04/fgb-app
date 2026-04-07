import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

const FGB_LOGO = 'https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png'

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'Rascunho',
    REGISTRATION_OPEN: 'Inscrições Abertas',
    ONGOING: 'Em Andamento',
    FINISHED: 'Finalizado',
    CANCELLED: 'Cancelado',
  }
  return map[status] ?? status
}

function getStatusColor(status: string) {
  if (status === 'ONGOING') return 'bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20'
  if (status === 'REGISTRATION_OPEN') return 'bg-green-500/10 text-green-400 border border-green-500/20'
  if (status === 'FINISHED') return 'bg-white/[0.06] text-slate-400 border border-white/[0.08]'
  return 'bg-white/[0.04] text-slate-500 border border-white/[0.06]'
}

export default async function HomePage() {
  const activeChampionships = await prisma.championship.findMany({
    where: { status: { in: ['ONGOING', 'REGISTRATION_OPEN'] }, isSimulation: false },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      categories: { select: { name: true }, take: 4 },
      _count: { select: { registrations: true, games: true } },
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
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />

      <main>
        {/* HERO */}
        <section className="relative py-28 px-6 text-center overflow-hidden">
          {/* Background radial */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,107,0,0.07)_0%,_transparent_70%)] pointer-events-none" />
          {/* Court lines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.025]">
            <svg width="100%" height="100%" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="100" y="50" width="600" height="500" stroke="white" strokeWidth="2" />
              <line x1="400" y1="50" x2="400" y2="550" stroke="white" strokeWidth="1" />
              <circle cx="400" cy="300" r="80" stroke="white" strokeWidth="2" />
              <rect x="260" y="50" width="280" height="180" stroke="white" strokeWidth="1.5" />
              <rect x="260" y="370" width="280" height="180" stroke="white" strokeWidth="1.5" />
              <circle cx="400" cy="300" r="15" stroke="white" strokeWidth="2" />
            </svg>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative w-24 h-24">
                <Image
                  src={FGB_LOGO}
                  alt="FGB Logo"
                  fill
                  className="object-contain drop-shadow-[0_0_30px_rgba(255,107,0,0.3)]"
                  priority
                  unoptimized
                />
              </div>
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#FF6B00] mb-5 animate-fade-in">
              FGB Season 2026 · Plataforma Oficial
            </p>
            <h1 className="text-5xl md:text-7xl font-black italic uppercase text-white tracking-tight leading-[0.9] mb-6 animate-fade-up" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              Federação Gaúcha<br />
              <span className="text-[#FF6B00]">de Basketball</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Fundada em 18 de abril de 1952. Promovendo o basquete gaúcho com
              tradição, excelência e inovação há mais de 70 anos.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/campeonatos"
                className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl text-sm transition-all hover:scale-[1.02] shadow-[0_8px_30px_rgba(255,107,0,0.3)]"
              >
                🏀 Ver Campeonatos
              </Link>
              <Link
                href="/login"
                className="bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl text-sm transition-all hover:scale-[1.02]"
              >
                Área da Equipe
              </Link>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '1952', label: 'Fundação' },
              { value: '70+', label: 'Anos de história' },
              { value: 'RS', label: 'Rio Grande do Sul' },
              { value: 'FGB', label: 'Federação oficial' },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-[#141414] border border-white/[0.08] rounded-3xl p-6 text-center hover:border-[#FF6B00]/20 transition-all group"
              >
                <p className="text-3xl font-black italic uppercase text-[#FF6B00] group-hover:scale-105 transition-transform" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                  {stat.value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CAMPEONATOS EM DESTAQUE */}
        {activeChampionships.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 py-16 border-t border-white/[0.05]">
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6B00] mb-2">
                  Temporada 2026
                </p>
                <h2 className="text-3xl font-black italic uppercase text-white tracking-tight" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                  Campeonatos Ativos
                </h2>
              </div>
              <Link
                href="/campeonatos"
                className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] hover:underline hidden md:block"
              >
                Ver todos →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {activeChampionships.map((c) => (
                <Link
                  key={c.id}
                  href={`/campeonatos/${c.id}`}
                  className="group bg-[#141414] border border-white/[0.08] hover:border-[#FF6B00]/30 rounded-3xl p-6 transition-all hover:shadow-[0_8px_40px_rgba(255,107,0,0.06)]"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center text-xl">
                      🏀
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${getStatusColor(c.status)}`}>
                      {getStatusLabel(c.status)}
                    </span>
                  </div>
                  <h3 className="text-base font-black italic uppercase text-white group-hover:text-[#FF6B00] transition-colors leading-tight mb-2" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                    {c.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 mb-5">
                    {c.categories.map((cat) => cat.name).join(' · ')}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      {c._count.registrations} equipes · {c._count.games} jogos
                    </span>
                    <span className="text-[10px] font-black text-[#FF6B00] uppercase tracking-widest">
                      Ver →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ÚLTIMOS RESULTADOS */}
        {recentGames.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 py-16 border-t border-white/[0.05]">
            <div className="mb-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6B00] mb-2">
                Resultados
              </p>
              <h2 className="text-3xl font-black italic uppercase text-white tracking-tight" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                Últimos Jogos
              </h2>
            </div>
            <div className="bg-[#141414] border border-white/[0.08] rounded-3xl overflow-hidden">
              {recentGames.map((game, i) => (
                <div
                  key={game.id}
                  className="px-6 py-4 flex items-center justify-between border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 bg-white/[0.04] px-2.5 py-1 rounded-full flex-shrink-0 hidden sm:block">
                      {game.category.championship.name.length > 20
                        ? game.category.championship.name.slice(0, 20) + '…'
                        : game.category.championship.name}
                    </span>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-sm font-black uppercase text-white truncate flex-1 text-right">
                        {game.homeTeam.name}
                      </span>
                      <span className="text-xl font-black text-[#FF6B00] flex-shrink-0 tabular-nums px-2 bg-[#FF6B00]/5 rounded-xl">
                        {game.homeScore ?? '—'} × {game.awayScore ?? '—'}
                      </span>
                      <span className="text-sm font-black uppercase text-white truncate flex-1">
                        {game.awayTeam.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-500 bg-white/[0.05] border border-white/[0.06] px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                    Encerrado
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CLASSIFICAÇÃO RÁPIDA */}
        <section className="max-w-7xl mx-auto px-6 py-16 border-t border-white/[0.05]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: '🏟️',
                title: 'Estadual Masculino',
                desc: 'Acompanhe a tabela de classificação, jogos e resultados do estadual masculino.',
                link: '/campeonatos?filtro=masculino',
                label: 'Acessar Tabela →',
              },
              {
                icon: '🏅',
                title: 'Estadual Feminino',
                desc: 'Resultados, classificação e calendário do campeonato estadual feminino.',
                link: '/campeonatos?filtro=feminino',
                label: 'Acessar Tabela →',
              },
              {
                icon: '📊',
                title: 'Cestinhas',
                desc: 'Ranking dos maiores pontuadores do basquete gaúcho na temporada.',
                link: '/campeonatos/cestinhas',
                label: 'Ver Ranking →',
              },
            ].map((card, i) => (
              <div key={i} className="bg-[#141414] border border-white/[0.08] rounded-3xl p-6 hover:border-white/[0.15] transition-all group">
                <div className="text-3xl mb-4">{card.icon}</div>
                <h3 className="text-base font-black italic uppercase text-white mb-2 group-hover:text-[#FF6B00] transition-colors" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-5">{card.desc}</p>
                <Link
                  href={card.link}
                  className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] hover:underline"
                >
                  {card.label}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* INFO INSTITUCIONAL */}
        <section className="max-w-7xl mx-auto px-6 py-16 border-t border-white/[0.05]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: 'Sobre a FGB',
                desc: 'A Federação Gaúcha de Basketball foi fundada em 18 de abril de 1952, em Porto Alegre, com apoio de 22 clubes fundadores. Mais de 70 anos gerenciando o basquete gaúcho.',
                link: '/fgb/historia',
                label: 'Nossa história →',
              },
              {
                title: 'Seleção Gaúcha',
                desc: 'Acompanhe as convocações, treinamentos e resultados das seleções gaúchas nas competições nacionais e internacionais.',
                link: '/selecao-gaucha',
                label: 'Ver seleção →',
              },
              {
                title: 'Regulamento',
                desc: 'Acesse o regulamento desportivo, normas do estadual, categorias e idades e regimento de taxas oficiais da FGB.',
                link: '/fgb/regulamento',
                label: 'Ver documentos →',
              },
            ].map((card, i) => (
              <div key={i} className="bg-[#141414] border border-white/[0.08] rounded-3xl p-6">
                <h3 className="text-base font-black italic uppercase text-white mb-3" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-5">{card.desc}</p>
                <Link
                  href={card.link}
                  className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] hover:underline"
                >
                  {card.label}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* CTA EQUIPES */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="relative bg-[#141414] border border-white/[0.08] rounded-3xl p-10 md:p-14 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,107,0,0.06)_0%,_transparent_70%)] pointer-events-none" />
            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00] mb-4">
                Plataforma de Gestão
              </p>
              <h2 className="text-3xl md:text-5xl font-black italic uppercase text-white tracking-tight mb-4" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                Sua equipe no<br />próximo campeonato
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
                Inscreva sua equipe, acompanhe jogos e resultados em tempo real
                pela plataforma oficial da FGB.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/register"
                  className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl text-sm transition-all hover:scale-[1.02] shadow-[0_8px_30px_rgba(255,107,0,0.25)]"
                >
                  Cadastrar Equipe
                </Link>
                <Link
                  href="/campeonatos"
                  className="bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl text-sm transition-all"
                >
                  Ver Campeonatos
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
