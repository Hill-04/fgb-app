import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Fundação — FGB',
  description: 'A fundação da Federação Gaúcha de Basketball em 18 de abril de 1952, em Porto Alegre, com 22 clubes fundadores e o 1º presidente José Carlos Daut.',
}

const marcosHistoricos = [
  {
    ano: '1934 – 1935',
    titulo: 'Bi-campeões Nacionais',
    desc: 'Antes mesmo de existir como federação formal, o Rio Grande do Sul já mostrava sua força conquistando dois títulos brasileiros consecutivos.',
    icon: '🏆',
    badge: 'fgb-badge-yellow',
    highlight: true,
  },
  {
    ano: '18 Abr 1952',
    titulo: 'Assembleia de Fundação',
    desc: 'Em Porto Alegre, com representantes de 22 clubes do estado, foi realizada a assembleia histórica que deu origem à Federação Gaúcha de Basketball.',
    icon: '🏛️',
    badge: 'fgb-badge-verde',
    highlight: false,
  },
  {
    ano: '1952',
    titulo: '1º Presidente Eleito',
    desc: 'José Carlos Daut foi eleito como primeiro presidente da FGB por aclamação dos clubes fundadores presentes na assembleia.',
    icon: '👤',
    badge: 'fgb-badge-verde',
    highlight: false,
  },
  {
    ano: '1952 – hoje',
    titulo: 'Mais de 70 Anos de História',
    desc: 'A FGB governa e organiza o basquete gaúcho continuamente há mais de 7 décadas, sendo a entidade esportiva mais longeva do basquete do RS.',
    icon: '📅',
    badge: 'fgb-badge-outline',
    highlight: false,
  },
]

const clubesFundadores = [
  'Grêmio Foot-Ball Porto Alegrense', 'Sport Club Internacional', 'SOGIPA', 'Juventude',
  'Americano F.C.', 'Caxias do Sul', 'Pelotas', 'Santa Maria', 'Rio Grande', 'Passo Fundo',
  'Novo Hamburgo', 'São Leopoldo', 'Canoas', 'Cachoeira do Sul', 'Bagé', 'Uruguaiana',
  'Santa Cruz do Sul', 'Lajeado', 'Cruz Alta', 'Erechim', 'Bento Gonçalves', 'Caxias',
]

export default function FundacaoPage() {
  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">18 de Abril de 1952 · Porto Alegre/RS</div>
          <h1 className="fgb-page-header-title">Fundação da FGB</h1>
          <p className="fgb-page-header-sub mx-auto">
            Em 18 de abril de 1952, 22 clubes gaúchos se reuniram em Porto Alegre para
            criar a entidade que organizaria o basquete do Rio Grande do Sul para sempre.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">

        {/* Stats strip */}
        <div className="fgb-stats-strip rounded overflow-hidden mb-14" style={{ border: '1px solid var(--border)' }}>
          {[
            { n: '1952', l: 'Ano de Fundação' },
            { n: '22', l: 'Clubes Fundadores' },
            { n: '70+', l: 'Anos de história' },
            { n: 'RS', l: 'Estado Sede' },
          ].map((s, i) => (
            <div key={i} className="fgb-stats-strip-item" style={{ background: '#fff' }}>
              <div className="fgb-stats-num" style={{ color: 'var(--verde)' }}>{s.n}</div>
              <div className="fgb-stats-label">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Marcos Históricos */}
        <section className="mb-14">
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-verde" />
              <h2 className="fgb-section-title">Marcos <span className="verde">Históricos</span></h2>
            </div>
          </div>

          <div className="space-y-4">
            {marcosHistoricos.map((m, i) => (
              <div key={i} className={`fgb-card p-6 flex items-start gap-5 ${m.highlight ? 'admin-card-yellow' : ''}`}>
                <span className="text-3xl flex-shrink-0">{m.icon}</span>
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`fgb-badge ${m.badge}`}>{m.ano}</span>
                    {m.highlight && <span className="fgb-badge fgb-badge-red">Destaque</span>}
                  </div>
                  <h3 className="fgb-display text-[16px] text-[var(--black)] mb-1">{m.titulo}</h3>
                  <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Primeiro Presidente */}
        <section className="mb-14">
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-red" />
              <h2 className="fgb-section-title">Primeiro <span className="red">Presidente</span></h2>
            </div>
          </div>
          <div className="fgb-card admin-card-verde p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--verde)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 36, flexShrink: 0,
            }}>
              👤
            </div>
            <div>
              <span className="fgb-badge fgb-badge-verde mb-3 inline-block">1º Presidente da FGB</span>
              <h3 className="fgb-display text-[28px] text-[var(--black)] mb-1">José Carlos Daut</h3>
              <p className="fgb-label text-[var(--verde)] mb-4">Eleito em 18 de Abril de 1952 · Porto Alegre/RS</p>
              <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0, maxWidth: 480 }}>
                José Carlos Daut liderou a assembleia de fundação e foi escolhido por aclamação
                como o primeiro presidente da Federação Gaúcha de Basketball, cargo que exerceu
                com dedicação nos primeiros anos da entidade.
              </p>
            </div>
          </div>
        </section>

        {/* Clubes Fundadores */}
        <section className="fgb-section fgb-section-alt rounded-lg mb-14" style={{ padding: '32px' }}>
          <div className="fgb-accent fgb-accent-red mb-3" />
          <h2 className="fgb-display text-[24px] text-[var(--black)] mb-8">
            Os 22 Clubes <span style={{ color: 'var(--red)' }}>Fundadores</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {clubesFundadores.map((clube, i) => (
              <div key={i} className="flex items-center gap-2 fgb-label bg-white p-3 rounded" style={{ border: '1px solid var(--border)' }}>
                <span className="font-black w-5 text-right flex-shrink-0" style={{ color: 'var(--red)', fontSize: 10 }}>{i + 1}.</span>
                <span style={{ color: 'var(--black)', letterSpacing: 0, textTransform: 'none', fontSize: 10 }}>{clube}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <a
            href="https://basquetegaucho.com.br/fundacao/"
            target="_blank"
            rel="noopener noreferrer"
            className="fgb-btn-primary"
          >
            Ver Página Oficial da Fundação →
          </a>
        </div>

      </main>

      <PublicFooter />
    </div>
  )
}
