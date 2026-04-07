import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { formatChampionshipStatus } from '@/lib/utils'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

const FGB_LOGO = 'https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png'

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
      category: { include: { championship: { select: { name: true } } } },
    },
  }).catch(() => [])

  // Ticker items — dobrar para loop contínuo
  const tickerBase = [
    ...championships.map((c) => ({
      text: c.name,
      badge: formatChampionshipStatus(c.status),
    })),
    { text: 'Seleção Gaúcha Sub-15', badge: 'Convocação aberta' },
    { text: 'FGB — Temporada 2026', badge: 'Plataforma oficial' },
    { text: 'Estadual Feminino 2026', badge: 'Em andamento' },
    { text: 'Arbitragem FGB', badge: 'Inscrições abertas' },
  ]
  // Duplicar para loop infinito sem pause
  const tickerItems = [...tickerBase, ...tickerBase]

  return (
    <div style={{ background: '#fff', color: '#111' }}>
      <PublicHeader />

      {/* ──────────────────────────────────────
          TICKER — laranja animado
      ────────────────────────────────────── */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {tickerItems.map((item, i) => (
            <span key={i} className="ticker-item">
              <span>{item.text}</span>
              <span className="ticker-badge">{item.badge}</span>
              <span className="ticker-sep">|</span>
            </span>
          ))}
        </div>
      </div>


      {/* ──────────────────────────────────────
          HERO — fundo escuro + quadra + stats 2×2
      ────────────────────────────────────── */}
      <section className="fgb-hero">

        {/* Left — conteúdo */}
        <div className="fgb-hero-left">
          <p className="fgb-label anim-fade-in" style={{ color: '#FF6B00', marginBottom: 16 }}>
            FGB · Season 2026 · Plataforma Oficial
          </p>

          <h1
            className="fgb-display anim-fade-up anim-delay-1"
            style={{
              color: '#fff',
              fontSize: 'clamp(36px, 5vw, 72px)',
              marginBottom: 20,
            }}
          >
            Federação<br />
            Gaúcha<br />
            <span style={{ color: '#FF6B00' }}>Basketball</span>
          </h1>

          <p
            className="anim-fade-up anim-delay-2"
            style={{
              color: '#888',
              fontSize: 14,
              lineHeight: 1.7,
              maxWidth: 300,
              marginBottom: 28,
            }}
          >
            Fundada em 18 de abril de 1952. Gerenciando o basquete
            gaúcho com tradição e inovação há mais de 70 anos.
          </p>

          <div className="flex flex-wrap gap-3 anim-fade-up anim-delay-3">
            <Link href="/campeonatos" className="btn-fgb-primary">
              Ver Campeonatos
            </Link>
            <Link
              href="/login"
              className="btn-fgb-secondary"
              style={{ color: '#fff', borderColor: '#444' }}
            >
              Área da Equipe
            </Link>
          </div>
        </div>

        {/* Right — stats grid + linhas de quadra */}
        <div className="fgb-hero-right">
          {/* SVG quadra de basquete */}
          <svg
            className="fgb-court-bg"
            viewBox="0 0 400 280"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          >
            <rect x="20" y="20" width="360" height="240" stroke="white" strokeWidth="2" fill="none" />
            <line x1="200" y1="20" x2="200" y2="260" stroke="white" strokeWidth="1" />
            <circle cx="200" cy="140" r="55" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="200" cy="140" r="8" stroke="white" strokeWidth="2" fill="none" />
            <rect x="20" y="90" width="110" height="100" stroke="white" strokeWidth="1.5" fill="none" />
            <rect x="270" y="90" width="110" height="100" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M 130 90 A 50 50 0 0 0 130 190" stroke="white" strokeWidth="1" fill="none" />
            <path d="M 270 90 A 50 50 0 0 1 270 190" stroke="white" strokeWidth="1" fill="none" />
          </svg>

          {/* Stats 2×2 */}
          <div className="fgb-stats-grid">
            {[
              { num: '1952', lbl: 'Fundação' },
              { num: '70+', lbl: 'Anos' },
              { num: '22', lbl: 'Fundadores' },
              { num: 'RS', lbl: 'Estado' },
            ].map((s, i) => (
              <div key={i} className="fgb-stat-box">
                <div className="fgb-stat-num">{s.num}</div>
                <div className="fgb-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ──────────────────────────────────────
          CAMPEONATOS ATIVOS
      ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-14">

        {/* Section header */}
        <div
          className="flex items-end justify-between mb-8 pb-3"
          style={{ borderBottom: '2px solid #111' }}
        >
          <div>
            <div className="section-sep" />
            <h2 className="fgb-display" style={{ fontSize: 28, color: '#111' }}>
              Campeonatos <span style={{ color: '#FF6B00' }}>Ativos</span>
            </h2>
          </div>
          <Link href="/campeonatos" className="fgb-label" style={{ color: '#FF6B00' }}>
            Ver todos →
          </Link>
        </div>

        {championships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {championships.map((c) => (
              <Link
                key={c.id}
                href={`/campeonatos/${c.id}`}
                className="fgb-card block overflow-hidden"
              >
                {/* Thumbnail escuro com texto do nome */}
                <div
                  className="relative flex items-center justify-center overflow-hidden"
                  style={{ height: 100, background: '#1A1A1A' }}
                >
                  {/* Letras gigantes em laranja transparente */}
                  <span
                    className="fgb-display"
                    style={{
                      fontSize: 64,
                      color: 'rgba(255,107,0,0.1)',
                      letterSpacing: '-0.04em',
                      userSelect: 'none',
                    }}
                  >
                    {c.name.substring(0, 3).toUpperCase()}
                  </span>
                  {/* Badge status */}
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <span className="badge-orange">
                      {formatChampionshipStatus(c.status)}
                    </span>
                  </div>
                  {/* Logo FGB no canto */}
                  <div style={{ position: 'absolute', bottom: 10, left: 10, width: 28, height: 28 }}>
                    <Image
                      src={FGB_LOGO}
                      alt="FGB"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Conteúdo */}
                <div style={{ padding: '16px 18px' }}>
                  <p className="fgb-label mb-1" style={{ color: '#aaa' }}>
                    Federação Gaúcha · {c.categories.length} categorias
                  </p>
                  <h3
                    className="fgb-display mb-3"
                    style={{ fontSize: 16, color: '#111', lineHeight: 1.1 }}
                  >
                    {c.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {c.categories.slice(0, 3).map((cat) => (
                      <span
                        key={cat.name}
                        className="fgb-label"
                        style={{
                          background: '#F7F7F7',
                          padding: '2px 8px',
                          fontSize: 9,
                          color: '#888',
                        }}
                      >
                        {cat.name}
                      </span>
                    ))}
                    {c.categories.length > 3 && (
                      <span className="fgb-label" style={{ fontSize: 9, color: '#bbb' }}>
                        +{c.categories.length - 3}
                      </span>
                    )}
                  </div>
                  <div
                    className="flex items-center justify-between pt-3"
                    style={{ borderTop: '0.5px solid #E5E5E5' }}
                  >
                    <span className="fgb-label" style={{ color: '#bbb' }}>
                      {c._count.registrations} equipes
                    </span>
                    <span className="fgb-label" style={{ color: '#FF6B00' }}>
                      Ver →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            className="text-center py-16"
            style={{ border: '0.5px solid #E5E5E5', background: '#F7F7F7' }}
          >
            <p className="fgb-label" style={{ color: '#bbb' }}>
              Nenhum campeonato ativo no momento
            </p>
          </div>
        )}
      </section>


      {/* ──────────────────────────────────────
          ÚLTIMOS RESULTADOS
      ────────────────────────────────────── */}
      {recentGames.length > 0 && (
        <section style={{ background: '#F7F7F7', borderTop: '0.5px solid #E5E5E5' }} className="py-14">
          <div className="max-w-7xl mx-auto px-6">

            <div
              className="flex items-end justify-between mb-8 pb-3"
              style={{ borderBottom: '2px solid #111' }}
            >
              <div>
                <div className="section-sep" />
                <h2 className="fgb-display" style={{ fontSize: 28, color: '#111' }}>
                  Últimos <span style={{ color: '#FF6B00' }}>Resultados</span>
                </h2>
              </div>
            </div>

            <div style={{ background: '#fff', border: '0.5px solid #E5E5E5' }}>
              {recentGames.map((game) => (
                <div key={game.id} className="fgb-score-row">
                  {/* Campeonato */}
                  <span
                    className="fgb-label hidden sm:block"
                    style={{
                      width: 140,
                      flexShrink: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: 9,
                      color: '#ccc',
                    }}
                  >
                    {game.category.championship.name}
                  </span>

                  {/* Placar */}
                  <div className="flex items-center gap-3 flex-1 justify-center">
                    <span
                      className="fgb-display flex-1 text-right"
                      style={{ fontSize: 14, color: '#111' }}
                    >
                      {game.homeTeam.name}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="fgb-score-num">{game.homeScore ?? '—'}</span>
                      <span className="fgb-label" style={{ color: '#ccc' }}>×</span>
                      <span className="fgb-score-num">{game.awayScore ?? '—'}</span>
                    </div>
                    <span
                      className="fgb-display flex-1"
                      style={{ fontSize: 14, color: '#111' }}
                    >
                      {game.awayTeam.name}
                    </span>
                  </div>

                  {/* Status */}
                  <span className="badge-outline flex-shrink-0">Encerrado</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* ──────────────────────────────────────
          ACESSO RÁPIDO — Estaduais e Cestinhas
      ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-14">
        <div
          className="flex items-end justify-between mb-8 pb-3"
          style={{ borderBottom: '2px solid #111' }}
        >
          <div>
            <div className="section-sep" />
            <h2 className="fgb-display" style={{ fontSize: 28, color: '#111' }}>
              Estaduais e <span style={{ color: '#FF6B00' }}>Cestinhas</span>
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: 'Estadual Masculino',
              desc: 'Tabela de classificação, jogos e resultados do campeonato estadual masculino.',
              href: '/campeonatos?filtro=masculino',
              accent: '#FF6B00',
            },
            {
              title: 'Estadual Feminino',
              desc: 'Classificação, calendário e resultados do campeonato estadual feminino.',
              href: '/campeonatos?filtro=feminino',
              accent: '#111',
            },
            {
              title: 'Cestinhas',
              desc: 'Ranking dos maiores pontuadores do basquete gaúcho na temporada.',
              href: '/campeonatos/cestinhas',
              accent: '#111',
            },
          ].map((item, i) => (
            <Link key={i} href={item.href} className="fgb-card block p-5">
              <div className="section-sep" style={{ background: item.accent, marginBottom: 10 }} />
              <h3 className="fgb-display mb-2" style={{ fontSize: 16, color: '#111' }}>
                {item.title}
              </h3>
              <p style={{ color: '#888', fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>
                {item.desc}
              </p>
              <span className="fgb-label" style={{ color: '#FF6B00' }}>
                Acessar →
              </span>
            </Link>
          ))}
        </div>
      </section>


      {/* ──────────────────────────────────────
          SOBRE / INSTITUCIONAL
      ────────────────────────────────────── */}
      <section
        style={{ background: '#F7F7F7', borderTop: '0.5px solid #E5E5E5' }}
        className="py-14"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div
            className="flex items-end justify-between mb-8 pb-3"
            style={{ borderBottom: '2px solid #111' }}
          >
            <div>
              <div className="section-sep" />
              <h2 className="fgb-display" style={{ fontSize: 28, color: '#111' }}>
                Sobre a <span style={{ color: '#FF6B00' }}>FGB</span>
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: 'História',
                desc: 'Fundada em 1952 com 22 clubes. Mais de 70 anos gerenciando o basquete gaúcho.',
                href: '/fgb/historia',
              },
              {
                title: 'Seleção Gaúcha',
                desc: 'Convocações, treinamentos e resultados das seleções nas competições nacionais.',
                href: '/selecao-gaucha',
              },
              {
                title: 'Regulamento',
                desc: 'Normas do estadual, categorias e idades, regimento de taxas oficiais.',
                href: '/fgb/regulamento',
              },
            ].map((card, i) => (
              <div key={i} className="fgb-card p-5" style={{ background: '#fff' }}>
                <h3 className="fgb-display mb-2" style={{ fontSize: 15, color: '#111' }}>
                  {card.title}
                </h3>
                <p style={{ color: '#888', fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>
                  {card.desc}
                </p>
                <Link href={card.href} className="fgb-label" style={{ color: '#FF6B00' }}>
                  Ver mais →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ──────────────────────────────────────
          CTA FINAL — fundo preto
      ────────────────────────────────────── */}
      <section style={{ background: '#111111' }} className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="fgb-label mb-5" style={{ color: '#FF6B00' }}>
            Plataforma Oficial FGB · Season 2026
          </p>
          <h2
            className="fgb-display mb-5"
            style={{
              color: '#fff',
              fontSize: 'clamp(28px, 4vw, 54px)',
            }}
          >
            Sua equipe no próximo<br />
            <span style={{ color: '#FF6B00' }}>campeonato gaúcho</span>
          </h2>
          <p
            style={{
              color: '#888',
              maxWidth: 480,
              margin: '0 auto 36px',
              lineHeight: 1.7,
              fontSize: 14,
            }}
          >
            Inscreva sua equipe, acompanhe jogos e resultados em tempo real
            pela plataforma oficial da Federação Gaúcha de Basketball.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register" className="btn-fgb-primary">
              Cadastrar Equipe
            </Link>
            <Link
              href="/campeonatos"
              className="btn-fgb-secondary"
              style={{ color: '#fff', borderColor: '#444' }}
            >
              Ver Campeonatos
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
