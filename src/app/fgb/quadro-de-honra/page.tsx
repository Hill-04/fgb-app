import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Quadro de Honra — FGB',
  description: 'O Quadro de Honra da FGB celebra os atletas, técnicos e dirigentes que deixaram sua marca na história do basquete gaúcho.',
}

const categoriasPremio = [
  {
    titulo: 'Atletas Imortais',
    icon: '🏆',
    badge: 'fgb-badge-yellow',
    cor: 'admin-card-yellow',
    desc: 'Os maiores atletas da história do basquete gaúcho, reconhecidos por sua contribuição ao esporte no RS.',
  },
  {
    titulo: 'Técnicos Homenageados',
    icon: '📋',
    badge: 'fgb-badge-verde',
    cor: 'admin-card-verde',
    desc: 'Treinadores que formaram gerações de atletas e moldaram o nível técnico do basquete gaúcho.',
  },
  {
    titulo: 'Dirigentes de Destaque',
    icon: '👑',
    badge: 'fgb-badge-red',
    cor: 'admin-card-red',
    desc: 'Gestores e dirigentes que dedicaram suas vidas ao crescimento da FGB e do basquete no estado.',
  },
  {
    titulo: 'Clubes Históricos',
    icon: '🏛️',
    badge: 'fgb-badge-orange',
    cor: 'admin-card-orange',
    desc: 'Clubes que foram pilares do desenvolvimento do basquete no Rio Grande do Sul ao longo das décadas.',
  },
]

export default function QuadroHonraPage() {
  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Legado · FGB</div>
          <h1 className="fgb-page-header-title">Quadro de Honra</h1>
          <p className="fgb-page-header-sub mx-auto">
            O Quadro de Honra da FGB celebra os atletas, técnicos e dirigentes que
            deixaram sua marca indelével na história do basquete gaúcho.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">

        {/* Destaque Hero */}
        <div className="fgb-card admin-card-yellow p-8 text-center mb-14">
          <div className="text-5xl mb-4">🌟</div>
          <div className="fgb-accent fgb-accent-yellow mx-auto mb-4" />
          <h2 className="fgb-display text-[28px] text-[var(--black)] mb-3">
            A Honraria Máxima do Basquete Gaúcho
          </h2>
          <p className="fgb-label text-[var(--gray)] max-w-lg mx-auto mb-6"
            style={{ textTransform: 'none', letterSpacing: 0 }}>
            Ingressar no Quadro de Honra da FGB é o maior reconhecimento que um atleta,
            técnico ou dirigente pode receber do basquete gaúcho. Os homenageados
            são escolhidos pela diretoria e clubes filiados da federação.
          </p>
          <a
            href="https://basquetegaucho.com.br/quadro-de-honra/"
            target="_blank"
            rel="noopener noreferrer"
            className="fgb-btn-primary"
          >
            Ver Quadro de Honra Completo →
          </a>
        </div>

        {/* Categorias de premiação */}
        <section className="mb-14">
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-yellow" />
              <h2 className="fgb-section-title">
                Categorias de <span className="yellow">Homenagem</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {categoriasPremio.map((cat, i) => (
              <div key={i} className={`fgb-card ${cat.cor} p-6`}>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{cat.icon}</span>
                  <span className={`fgb-badge ${cat.badge}`}>{cat.titulo.split(' ')[0]}</span>
                </div>
                <h3 className="fgb-display text-[18px] text-[var(--black)] mb-2">{cat.titulo}</h3>
                <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
                  {cat.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Verde */}
        <section className="fgb-cta" style={{ borderRadius: 8 }}>
          <div className="fgb-cta-pattern" />
          <div className="fgb-cta-inner text-center">
            <div className="text-4xl mb-4">🏅</div>
            <div className="fgb-accent fgb-accent-yellow mx-auto mb-4" />
            <h2 className="fgb-cta-h" style={{ fontSize: 'clamp(22px, 3vw, 38px)' }}>
              Uma <em>história de glórias</em>
            </h2>
            <p className="fgb-cta-sub">
              Acesse o site oficial da Federação Gaúcha de Basketball para conhecer
              todos os homenageados do Quadro de Honra e suas trajetórias.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="https://basquetegaucho.com.br/quadro-de-honra/"
                target="_blank"
                rel="noopener noreferrer"
                className="fgb-btn-primary"
              >
                Acessar Site Oficial →
              </a>
              <a href="/fgb/historia" className="fgb-btn-secondary">
                Ver História da FGB
              </a>
            </div>
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  )
}
