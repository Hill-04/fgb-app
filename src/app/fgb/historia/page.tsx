import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'História da Federação — FGB',
  description: 'Conheça a história da Federação Gaúcha de Basketball, fundada em 18 de abril de 1952 em Porto Alegre, Rio Grande do Sul.',
}

const clubesFundadores = [
  'Grêmio Foot-Ball Porto Alegrense', 'Sport Club Internacional', 'SOGIPA', 'Juventude', 'Americano F.C.',
  'Caxias do Sul', 'Pelotas', 'Santa Maria', 'Rio Grande', 'Passo Fundo', 'Novo Hamburgo', 'São Leopoldo',
  'Canoas', 'Cachoeira do Sul', 'Bagé', 'Uruguaiana', 'Santa Cruz do Sul', 'Lajeado', 'Cruz Alta',
  'Erechim', 'Bento Gonçalves', 'Caxias',
]

export default function HistoriaPage() {
  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">FGB · Desde 1952</div>
          <h1 className="fgb-page-header-title">História da Federação</h1>
          <p className="fgb-page-header-sub mx-auto">
            A Federação Gaúcha de Basketball foi fundada em 18 de abril de 1952, em Porto Alegre,
            pelo 1º Presidente Sr. José Carlos Daut, com apoio de 22 clubes fundadores.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        {/* Timeline */}
        <section className="mb-14">
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-verde" />
              <h2 className="fgb-section-title">Marco <span className="verde">Histórico</span></h2>
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              { year: '1934–1935', icon: '🏆', title: 'Bi-campeões Nacionais', desc: 'O Rio Grande do Sul conquistou o título brasileiro por dois anos consecutivos.', highlight: true },
              { year: '1952', icon: '🏛️', title: 'Fundação da FGB', desc: 'Em 18 de abril, em Porto Alegre, é fundada a Federação.', highlight: false },
              { year: '1960–1980', icon: '📈', title: 'Expansão do Basquete', desc: 'Décadas de crescimento com novos clubes em todo o RS.', highlight: false },
              { year: '2000+', icon: '🚀', title: 'Era Moderna', desc: 'Modernização da gestão e consolidação de campeonatos base.', highlight: false },
              { year: '2026', icon: '💻', title: 'Plataforma Digital', desc: 'Sistema lançado para elevar a experiência dos clubes.', highlight: false },
            ].map((item, i) => (
              <div key={i} className={`fgb-card p-6 flex items-start gap-5 ${item.highlight ? 'admin-card-yellow' : ''}`}>
                <span className="text-3xl flex-shrink-0">{item.icon}</span>
                <div>
                  <div className="flex gap-2 items-center mb-2">
                    <span className={`fgb-badge ${item.highlight ? 'fgb-badge-yellow' : 'fgb-badge-verde'}`}>{item.year}</span>
                    {item.highlight && <span className="fgb-badge fgb-badge-red">Destaque</span>}
                  </div>
                  <h3 className="fgb-display text-[16px] text-[var(--black)] mb-1">{item.title}</h3>
                  <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Clubes Fundadores */}
        <section className="fgb-section fgb-section-alt rounded-lg mb-14" style={{ padding: '32px' }}>
          <div className="fgb-accent fgb-accent-red mx-auto mb-3" />
          <h2 className="fgb-display text-center text-[24px] mb-8">22 Clubes Fundadores</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {clubesFundadores.map((clube, i) => (
              <div key={i} className="flex items-center gap-2 fgb-label text-[9px] bg-white p-3 rounded shadow-sm">
                <span className="text-[var(--red)] font-black w-4 text-right flex-shrink-0">{i + 1}.</span>
                <span style={{ color: 'var(--black)', letterSpacing: 0 }}>{clube}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
