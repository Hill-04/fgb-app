import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { getLiveGames, getRecentResults } from '@/lib/queries/games'
import { formatChampionshipStatus } from '@/lib/utils'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { SponsorsStrip } from '@/components/public/SponsorsStrip'

const FGB_LOGO = 'https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png'
const GALLERY_IMAGES = [
  'https://basquetegaucho.com.br/wp-content/uploads/2024/04/436798402_17959816394740627_7133097296869973522_n.jpg',
  'https://basquetegaucho.com.br/wp-content/uploads/2024/04/436953622_17959816355740627_4207539994510205825_n.jpg',
  'https://basquetegaucho.com.br/wp-content/uploads/2024/04/436783444_17959816358740627_458700201676952614_n.jpg',
  'https://basquetegaucho.com.br/wp-content/uploads/2024/04/436770135_17959816367740627_7240870606236286883_n.jpg',
  'https://basquetegaucho.com.br/wp-content/uploads/2024/04/436799064_17959816340740627_3850140963121385520_n.jpg',
  'https://basquetegaucho.com.br/wp-content/uploads/2024/04/436783538_17959816376740627_400857416916956698_n.jpg',
]

export default async function HomePage() {
  const championships = await prisma.championship.findMany({
    where: {
      status: { in: ['ONGOING', 'REGISTRATION_OPEN'] },
      isSimulation: false,
      NOT: { name: { startsWith: 'TESTE' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      categories: { select: { name: true }, take: 4 },
      _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } },
    },
  }).catch(() => [])

  const recentGames = await getRecentResults(6).catch(() => [])
  const liveGames = await getLiveGames().catch(() => [])

  const allCategories = await prisma.championshipCategory.findMany({
    where: { championship: { status: { in: ['ONGOING', 'REGISTRATION_OPEN'] }, isSimulation: false, NOT: { name: { startsWith: 'TESTE' } } } },
    distinct: ['name'],
    select: { name: true },
    orderBy: { name: 'asc' },
  }).catch(() => [])

  const featuredChampionship = await prisma.championship.findFirst({
    where: { status: 'ONGOING', isSimulation: false, NOT: { name: { startsWith: 'TESTE' } } },
    orderBy: { createdAt: 'desc' },
    include: {
      categories: { select: { name: true } },
      _count: {
        select: {
          registrations: { where: { status: 'CONFIRMED' } },
          games: true,
        }
      }
    },
  }).catch(() => null) ?? await prisma.championship.findFirst({
    where: { status: 'REGISTRATION_OPEN', isSimulation: false, NOT: { name: { startsWith: 'TESTE' } } },
    orderBy: { createdAt: 'desc' },
    include: {
      categories: { select: { name: true } },
      _count: {
        select: {
          registrations: { where: { status: 'CONFIRMED' } },
          games: true,
        }
      }
    },
  }).catch(() => null)

  const featuredTeams = await prisma.team.findMany({
    where: { OR: [{ logoUrl: { not: null } }, { name: { not: '' } }] },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: { id: true, name: true, logoUrl: true },
  }).catch(() => [])

  const sponsors = await prisma.sponsor.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: { id: true, name: true, logoUrl: true, websiteUrl: true },
  }).catch(() => [])

  return (
    <>
      <PublicHeader />
      <main>
        <section className="fgb-hero">
          <div style={{
            position:'absolute', left:-80, top:-80, width:400, height:400,
            background:'radial-gradient(circle,rgba(27,115,64,0.2) 0%,transparent 70%)',
            pointerEvents:'none', zIndex:1
          }} />

          <div className="fgb-hero-left" style={{ padding: '60px 40px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p className="fgb-label fgb-anim-up" style={{ color: 'var(--yellow)', marginBottom: 16 }}>
              FGB · Season 2026 · Plataforma Oficial
            </p>

            <h1 className="fgb-display fgb-anim-up fgb-delay-1" style={{ color: '#fff', fontSize: 'clamp(36px, 5vw, 72px)', marginBottom: 20 }}>
              Federação<br />
              Gaúcha<br />
              <em style={{ fontStyle: 'normal', color: 'var(--yellow)' }}>Basketball</em>
            </h1>

            <p className="fgb-anim-up fgb-delay-2" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, maxWidth: 300, marginBottom: 28, fontFamily: 'var(--font-body)' }}>
              Fundada em 18 de abril de 1952. Gerenciando o basquete
              gaúcho com tradição e inovação há mais de 70 anos.
            </p>

            <div className="flex flex-wrap gap-3 fgb-anim-up fgb-delay-3" style={{ display: 'flex', gap: 12 }}>
              <Link href="/campeonatos" className="fgb-btn-primary">
                Ver Campeonatos
              </Link>
              <Link href="/login" className="fgb-btn-secondary">
                Área da Equipe
              </Link>
            </div>
          </div>

          <div className="fgb-hero-right" style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#1a1a1a', height: '100%' }}>
              {[
                { n: '1952', l: 'Fundação' },
                { n: '70+', l: 'Anos' },
                { n: '22', l: 'Fundadores' },
                { n: 'RS', l: 'Gaúcho' },
              ].map(s => (
                <div key={s.n} style={{ background: '#141414', padding: '32px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 900, color: 'var(--yellow)', lineHeight: 1 }}>
                    {s.n}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em', color: '#555', marginTop: 5 }}>
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="fgb-hero-tricolor" />

        <section className="fgb-section">
          <div className="max-w-7xl mx-auto">
            <div className="fgb-section-header">
              <div>
                <div className="fgb-accent fgb-accent-verde" />
                <h2 className="fgb-section-title">
                  Portal <span className="verde">FGB</span>
                </h2>
              </div>
              <Link href="/fgb/notas" className="fgb-section-link">Notas Oficiais →</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  title: 'Notas Oficiais',
                  desc: 'Comunicados, resoluções, tabelas e convocações.',
                  href: '/fgb/notas',
                  accent: 'var(--red)',
                  image: GALLERY_IMAGES[0],
                },
                {
                  title: 'Informativos',
                  desc: 'Boletins técnicos, regulamentos e comunicados.',
                  href: '/fgb/regulamento',
                  accent: 'var(--yellow)',
                  image: GALLERY_IMAGES[1],
                },
                {
                  title: 'Seleção Gaúcha',
                  desc: 'Convocações e atividades oficiais das seleções.',
                  href: '/selecao-gaucha',
                  accent: 'var(--verde)',
                  image: GALLERY_IMAGES[2],
                },
                {
                  title: 'Calendário',
                  desc: 'Calendário geral de competições e fases.',
                  href: '/calendario',
                  accent: 'var(--primary)',
                  image: GALLERY_IMAGES[3],
                },
                {
                  title: 'Campeonatos',
                  desc: 'Estaduais, categorias de base e torneios oficiais.',
                  href: '/campeonatos',
                  accent: 'var(--secondary)',
                  image: GALLERY_IMAGES[4],
                },
                {
                  title: 'Galeria de Fotos',
                  desc: 'Momentos marcantes do basquete gaúcho.',
                  href: '/galeria',
                  accent: 'var(--verde-dark)',
                  image: GALLERY_IMAGES[5],
                },
              ].map((item) => (
                <Link key={item.title} href={item.href} className="fgb-card group relative overflow-hidden">
                  <div className="absolute inset-0">
                    <Image src={item.image} alt={item.title} fill className="object-cover opacity-30 group-hover:opacity-40 transition-opacity" unoptimized />
                    <div className="absolute inset-0" style={{
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)'
                    }} />
                  </div>
                  <div className="relative p-5">
                    <span className="fgb-badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', marginBottom: 12 }}>
                      {item.title}
                    </span>
                    <h3 className="fgb-display mb-2" style={{ fontSize: 16, color: '#fff' }}>{item.title}</h3>
                    <p className="fgb-label" style={{ color: 'rgba(255,255,255,0.65)', textTransform: 'none', letterSpacing: 0 }}>{item.desc}</p>
                    <span className="fgb-label mt-3 inline-flex" style={{ color: item.accent }}>Acessar →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {liveGames.length > 0 && (
          <div style={{ background: 'var(--black2)', borderBottom: '2px solid var(--red)' }}>
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 overflow-x-auto fgb-hide-scrollbar">
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--red)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--red)]" />
                </span>
                <span className="fgb-label" style={{ color: 'var(--red)', fontSize: 9, letterSpacing: '0.2em' }}>JOGOS DE HOJE</span>
              </div>
              <div className="h-4 w-px bg-white/10 flex-shrink-0" />
              {liveGames.map((game: any) => (
                <div key={game.id} className="flex items-center gap-3 flex-shrink-0 px-4 py-1.5 rounded-full" style={{ background: game.status === 'live' ? 'rgba(204,16,22,0.15)' : 'rgba(255,255,255,0.05)', border: game.status === 'live' ? '1px solid rgba(204,16,22,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                  {game.status === 'live' && (
                    <span className="fgb-label" style={{ color: 'var(--red)', fontSize: 8, letterSpacing: '0.15em' }}>● AO VIVO</span>
                  )}
                  <span className="fgb-display" style={{ fontSize: 11, color: '#fff', letterSpacing: '0.02em' }}>
                    {game.home_team?.name}
                    {game.home_score != null ? <span style={{ color: 'var(--yellow)', margin: '0 6px' }}>{game.home_score} × {game.away_score}</span> : <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 6px' }}>vs</span>}
                    {game.away_team?.name}
                  </span>
                  <span className="fgb-label" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8 }}>OFICIAL</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {featuredChampionship && (
          <section style={{ background: 'var(--verde)', borderBottom: '4px solid var(--verde-dark)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="fgb-badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}>
                    {formatChampionshipStatus(featuredChampionship.status)}
                  </span>
                  <span className="fgb-label" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, letterSpacing: '0.2em' }}>EM DESTAQUE · 2026</span>
                </div>
                <h2 className="fgb-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', color: '#fff', lineHeight: 1.05, marginBottom: 12 }}>
                  {featuredChampionship.name}
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {featuredChampionship.categories.map((cat) => (
                    <span key={cat.name} className="fgb-badge" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', border: 'none', fontSize: 9 }}>
                      {cat.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="fgb-display" style={{ fontSize: 28, color: 'var(--yellow)', lineHeight: 1 }}>{featuredChampionship._count.registrations}</p>
                    <p className="fgb-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, marginTop: 2 }}>EQUIPES</p>
                  </div>
                  <div>
                    <p className="fgb-display" style={{ fontSize: 28, color: 'var(--yellow)', lineHeight: 1 }}>{featuredChampionship._count.games}</p>
                    <p className="fgb-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, marginTop: 2 }}>JOGOS</p>
                  </div>
                  <div>
                    <p className="fgb-display" style={{ fontSize: 28, color: 'var(--yellow)', lineHeight: 1 }}>{featuredChampionship.categories.length}</p>
                    <p className="fgb-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, marginTop: 2 }}>CATEGORIAS</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 items-start md:items-end">
                <Link href={`/campeonatos/${featuredChampionship.id}`} className="fgb-btn-primary" style={{ background: 'var(--yellow)', color: 'var(--black)', border: 'none', fontWeight: 900 }}>
                  Ver Campeonato →
                </Link>
                <Link href="/campeonatos" className="fgb-btn-secondary" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}>
                  Todos os Campeonatos
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="fgb-section">
          <div className="max-w-7xl mx-auto">
            <div className="fgb-section-header">
              <div>
                <div className="fgb-accent fgb-accent-verde" />
                <h2 className="fgb-section-title">
                  Campeonatos <span className="verde">ATIVOS</span>
                </h2>
              </div>
              <Link href="/campeonatos" className="fgb-section-link">Ver todos →</Link>
            </div>

            {allCategories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto fgb-hide-scrollbar mb-6 pb-1">
                <Link href="/campeonatos" className="fgb-badge fgb-badge-verde flex-shrink-0">
                  Todos
                </Link>
                {allCategories.map((cat) => (
                  <Link key={cat.name} href={`/campeonatos?categoria=${encodeURIComponent(cat.name)}`} className="fgb-badge fgb-badge-outline flex-shrink-0 hover:border-[var(--verde)] hover:text-[var(--verde)] transition-colors">
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            {championships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {championships.map((c) => (
                  <Link key={c.id} href={`/campeonatos/${c.id}`} className="fgb-card admin-card-verde">
                    <div className="relative flex items-center justify-center overflow-hidden" style={{ height: 100, background: 'var(--black2)' }}>
                      <span className="fgb-display" style={{ fontSize: 64, color: 'rgba(255,255,255,0.03)', letterSpacing: '-0.04em', userSelect: 'none' }}>
                        {c.name?.substring(0, 3).toUpperCase() || 'FGB'}
                      </span>
                      <div style={{ position: 'absolute', top: 10, right: 10 }}>
                        <span className="fgb-badge fgb-badge-verde">
                          {formatChampionshipStatus(c.status)}
                        </span>
                      </div>
                      <div style={{ position: 'absolute', bottom: 10, left: 10, width: 28, height: 28 }}>
                        <Image src={FGB_LOGO} alt="FGB" fill className="object-contain" unoptimized />
                      </div>
                    </div>

                    <div style={{ padding: '16px 18px' }}>
                      <p className="fgb-label mb-1" style={{ color: 'var(--gray)' }}>
                        FGB · {c.categories.length} categorias
                      </p>
                      <h3 className="fgb-display mb-3" style={{ fontSize: 16, color: 'var(--black)', lineHeight: 1.1 }}>
                        {c.name}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {c.categories.slice(0, 3).map((cat) => (
                          <span key={cat.name} className="fgb-badge fgb-badge-outline">
                            {cat.name}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3" style={{ borderTop: '0.5 solid var(--border)' }}>
                        <span className="fgb-label" style={{ color: 'var(--gray)' }}>{c._count?.registrations || 0} equipes</span>
                        <span className="fgb-label" style={{ color: 'var(--verde)' }}>Ver →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16" style={{ border: '1px solid var(--border)', background: 'var(--gray-l)', borderRadius: 4 }}>
                <p className="fgb-label" style={{ color: 'var(--gray)' }}>Nenhum campeonato ativo no momento</p>
              </div>
            )}
          </div>
        </section>

        {recentGames.length > 0 && (
          <section className="fgb-section fgb-section-alt" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="max-w-7xl mx-auto">
              <div className="fgb-section-header">
                <div>
                  <div className="fgb-accent fgb-accent-red" />
                  <h2 className="fgb-section-title">
                    Últimos <span className="red">Resultados</span>
                  </h2>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid var(--border)' }}>
                {recentGames.map((game: any, idx: number) => (
                  <Link href={`/jogos/${game.id}`} key={game.id} style={{ display: 'flex', textDecoration: 'none', alignItems: 'center', padding: '12px 16px', borderBottom: idx < recentGames.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }} className="hover:bg-slate-50 transition-colors">
                    <span className="fgb-label hidden sm:block" style={{ width: 140, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--gray)' }}>
                      OFICIAL FGB
                    </span>

                    <div className="flex items-center gap-3 flex-1 justify-center">
                      <span className="fgb-display flex-1 text-right" style={{ fontSize: 13, color: 'var(--black)' }}>{game.home_team?.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="fgb-score-num">{game.home_score ?? '—'}</span>
                        <span className="fgb-label" style={{ color: 'var(--gray)' }}>×</span>
                        <span className="fgb-score-num">{game.away_score ?? '—'}</span>
                      </div>
                      <span className="fgb-display flex-1" style={{ fontSize: 13, color: 'var(--black)' }}>{game.away_team?.name}</span>
                    </div>

                    <span className="fgb-badge fgb-badge-outline flex-shrink-0 hide-mobile text-blue-600 bg-blue-50 border-blue-200 ml-4">
                      SÚMULA →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="fgb-stats-strip">
          {[
            { n: '1952', l: 'Fundação' },
            { n: '70+', l: 'Anos de história' },
            { n: '22', l: 'Clubes fundadores' },
            { n: 'RS', l: 'Federação oficial' },
          ].map(s => (
            <div key={s.n} className="fgb-stats-strip-item">
              <div className="fgb-stats-num">{s.n}</div>
              <div className="fgb-stats-label">{s.l}</div>
            </div>
          ))}
        </section>

        <section className="fgb-section">
          <div className="max-w-7xl mx-auto">
            <div className="fgb-section-header">
              <div>
                <div className="fgb-accent fgb-accent-verde" />
                <h2 className="fgb-section-title">
                  Acesso <span className="verde">Rápido</span>
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: 'Estadual Masculino', desc: 'Tabela de classificação, jogos e resultados.', href: '/campeonatos?filtro=masculino', accent: 'var(--verde)', card: 'admin-card-verde' },
                { title: 'Estadual Feminino', desc: 'Classificação, calendário e resultados.', href: '/campeonatos?filtro=feminino', accent: 'var(--red)', card: 'admin-card-red' },
                { title: 'Cestinhas', desc: 'Ranking dos maiores pontuadores da temporada.', href: '/campeonatos/cestinhas', accent: 'var(--yellow)', card: 'admin-card-yellow' },
              ].map((item, i) => (
                <Link key={i} href={item.href} className={`fgb-card block p-5 ${item.card}`}>
                  <h3 className="fgb-display mb-2" style={{ fontSize: 16, color: 'var(--black)' }}>{item.title}</h3>
                  <p style={{ color: 'var(--gray)', fontSize: 12, lineHeight: 1.6, marginBottom: 16, fontFamily: 'var(--font-body)' }}>{item.desc}</p>
                  <span className="fgb-label" style={{ color: item.accent }}>Acessar →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Seção de cestinhas — exibida apenas quando houver dados reais conectados */}

        <section className="fgb-section fgb-section-verde" style={{ borderTop: '1px solid rgba(27,115,64,0.1)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="fgb-section-header">
              <div>
                <div className="fgb-accent fgb-accent-verde" />
                <h2 className="fgb-section-title">
                  Sobre a <span className="verde">FGB</span>
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: 'História', desc: 'Fundada em 1952 com 22 clubes. Mais de 70 anos gerenciando o basquete gaúcho.', href: '/fgb/historia' },
                { title: 'Seleção Gaúcha', desc: 'Convocações, treinamentos e resultados das seleções nas competições nacionais.', href: '/selecao-gaucha' },
                { title: 'Regulamento', desc: 'Normas do estadual, categorias e idades, regimento de taxas oficiais.', href: '/fgb/regulamento' },
              ].map((card, i) => (
                <div key={i} className="fgb-card admin-card-verde p-5">
                  <h3 className="fgb-display mb-2" style={{ fontSize: 15, color: 'var(--black)' }}>{card.title}</h3>
                  <p style={{ color: 'var(--gray)', fontSize: 12, lineHeight: 1.6, marginBottom: 16, fontFamily: 'var(--font-body)' }}>{card.desc}</p>
                  <Link href={card.href} className="fgb-label" style={{ color: 'var(--verde)' }}>Ver mais →</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="fgb-section fgb-section-alt" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="fgb-section-header">
              <div>
                <div className="fgb-accent fgb-accent-red" />
                <h2 className="fgb-section-title">
                  Atualizações <span className="red">Oficiais</span>
                </h2>
              </div>
              <a href="https://basquetegaucho.com.br/notas-oficiais/" target="_blank" rel="noopener noreferrer" className="fgb-section-link">
                Ver no site oficial →
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: 'Nota Oficial de Pesar', type: 'Notas Oficiais', date: '2025' },
                { title: 'Classificação Final — Estadual de Base 2025', type: 'Informativos', date: '2025' },
                { title: 'Boletim Sul Brasileiro de Clubes 2025', type: 'Notas Oficiais', date: '2025' },
              ].map((item) => (
                <div key={item.title} className="fgb-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="fgb-badge fgb-badge-outline">{item.type}</span>
                    <span className="fgb-label" style={{ color: 'var(--gray)' }}>{item.date}</span>
                  </div>
                  <h3 className="fgb-display text-[16px] text-[var(--black)] mb-2">{item.title}</h3>
                  <p className="fgb-label" style={{ color: 'var(--gray)', textTransform: 'none', letterSpacing: 0 }}>
                    Comunicado oficial publicado pela FGB.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="fgb-section">
          <div className="max-w-7xl mx-auto">
            <div className="fgb-section-header">
              <div>
                <div className="fgb-accent fgb-accent-yellow" />
                <h2 className="fgb-section-title">
                  Galeria <span className="yellow">Gaúcha</span>
                </h2>
              </div>
              <Link href="/galeria" className="fgb-section-link">Ver todas →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {GALLERY_IMAGES.map((src, i) => (
                <div key={src} className={`relative overflow-hidden rounded-lg ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`} style={{ aspectRatio: '1 / 1' }}>
                  <Image src={src} alt="FGB Galeria" fill className="object-cover hover:scale-105 transition-transform duration-500" unoptimized />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="fgb-section fgb-section-verde" style={{ borderTop: '1px solid rgba(27,115,64,0.12)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="fgb-section-header">
              <div>
                <div className="fgb-accent fgb-accent-verde" />
                <h2 className="fgb-section-title">
                  Clubes & <span className="verde">Escudos</span>
                </h2>
              </div>
              <Link href="/campeonatos" className="fgb-section-link">Ver clubes →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {featuredTeams.length > 0 ? featuredTeams.map((team) => (
                <div key={team.id} className="fgb-card p-4 flex flex-col items-center text-center">
                  <div className="relative w-16 h-16 rounded-full bg-white shadow-sm border border-[var(--border)] overflow-hidden flex items-center justify-center mb-3">
                    {team.logoUrl ? (
                      <Image src={team.logoUrl} alt={team.name} fill className="object-contain" unoptimized />
                    ) : (
                      <span className="fgb-display" style={{ fontSize: 18, color: 'var(--verde-dark)' }}>
                        {team.name?.slice(0, 2).toUpperCase() || '??'}
                      </span>
                    )}
                  </div>
                  <p className="fgb-label" style={{ color: 'var(--black)', textTransform: 'none', letterSpacing: 0 }}>{team.name}</p>
                </div>
              )) : (
                <div className="col-span-full text-center fgb-label" style={{ color: 'var(--gray)' }}>
                  Em breve, escudos e clubes cadastrados.
                </div>
              )}
            </div>
          </div>
        </section>

        <SponsorsStrip sponsors={sponsors} />

        <section className="fgb-cta">
          <div className="fgb-cta-pattern" />
          <div className="fgb-cta-inner max-w-7xl mx-auto">
            <div className="fgb-accent fgb-accent-yellow mx-auto mb-4" />
            <h2 className="fgb-cta-h">
              Sua equipe no<br /><em>próximo campeonato</em>
            </h2>
            <p className="fgb-cta-sub">
              Inscreva sua equipe, acompanhe jogos e resultados em tempo real
              pela plataforma oficial da Federação Gaúcha de Basketball.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/register" className="fgb-btn-primary">Cadastrar Equipe</Link>
              <Link href="/campeonatos" className="fgb-btn-secondary">Ver Campeonatos</Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  )
}
