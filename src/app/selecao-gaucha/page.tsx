import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Selecao Gaucha — FGB',
  description: 'Selecoes gauchas de basketball - convocacoes, resultados e informacoes das categorias de base e adulto.',
}

const selecoes = [
  { cat: 'Sub 13', gen: 'Masculino', icon: '♂️', badge: 'fgb-badge-verde', desc: 'Representa o RS nas competicoes nacionais de base.' },
  { cat: 'Sub 13', gen: 'Feminino', icon: '♀️', badge: 'fgb-badge-yellow', desc: 'Compete no Campeonato Brasileiro de Selecoes.' },
  { cat: 'Sub 15', gen: 'Masculino', icon: '♂️', badge: 'fgb-badge-verde', desc: 'Uma das principais equipes jovens do basquete gaucho.' },
  { cat: 'Sub 15', gen: 'Feminino', icon: '♀️', badge: 'fgb-badge-yellow', desc: 'Formando as futuras representantes do basquete feminino.' },
  { cat: 'Sub 17', gen: 'Masculino', icon: '♂️', badge: 'fgb-badge-verde', desc: 'Categoria de projecao para atletas de elite.' },
  { cat: 'Sub 17', gen: 'Feminino', icon: '♀️', badge: 'fgb-badge-yellow', desc: 'Atletas gauchas destaques do cenario nacional.' },
  { cat: 'Adulto', gen: 'Masculino', icon: '♂️', badge: 'fgb-badge-red', desc: 'Principal selecao masculina do Rio Grande do Sul.' },
  { cat: 'Adulto', gen: 'Feminino', icon: '♀️', badge: 'fgb-badge-red', desc: 'Principal selecao feminina nas competicoes adultas.' },
]

export default function SelecaoGauchaPage() {
  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Rio Grande do Sul</div>
          <h1 className="fgb-page-header-title">Selecao Gaucha</h1>
          <p className="fgb-page-header-sub mx-auto">
            O Rio Grande do Sul possui uma das tradicoes mais ricas do basquete brasileiro.
            Bi-campeoes nacionais em 1934 e 1935, a selecao gaucha continua produzindo
            atletas de alto nivel.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {[
            { value: '1934', label: '1º Titulo Nacional', icon: '🏆', color: 'text-[var(--verde)]' },
            { value: '1935', label: '2º Titulo Nacional', icon: '🏅', color: 'text-[var(--red)]' },
            { value: 'RS', label: 'Potencia Nacional', icon: '⭐', color: 'text-[var(--yellow)]' },
          ].map((s, i) => (
            <div key={i} className="fgb-card text-center p-6 bg-[var(--gray-l)]">
              <div className="text-3xl mb-2">{s.icon}</div>
              <p className={`fgb-display text-[28px] mb-1 ${s.color}`}>{s.value}</p>
              <p className="fgb-label text-[var(--gray)]">{s.label}</p>
            </div>
          ))}
        </div>

        <section className="mb-14">
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-verde" />
              <h2 className="fgb-section-title">Selecoes <span className="verde">Ativas</span></h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {selecoes.map((sel, i) => (
              <div key={i} className={`fgb-card p-6 ${sel.badge.includes('red') ? 'admin-card-red' : sel.badge.includes('yellow') ? 'admin-card-yellow' : 'admin-card-verde'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{sel.icon}</span>
                    <h3 className="fgb-display text-[18px] text-[var(--black)]">{sel.cat}</h3>
                  </div>
                  <span className={`fgb-badge ${sel.badge}`}>{sel.gen}</span>
                </div>
                <p className="fgb-label text-[var(--gray)] mb-4" style={{ textTransform: 'none', letterSpacing: 0 }}>{sel.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="fgb-section-verde border border-[var(--border)] rounded-xl p-8 text-center max-w-3xl mx-auto">
          <div className="fgb-accent fgb-accent-yellow mx-auto mb-3" />
          <h2 className="fgb-display text-[22px] text-[var(--black)] mb-3">Convocacoes e Notas Oficiais</h2>
          <p className="fgb-label text-[var(--gray)] max-w-md mx-auto mb-6" style={{ textTransform: 'none', letterSpacing: 0 }}>
            As convocacoes oficiais das selecoes gauchas sao publicadas como notas oficiais
            da FGB. Acompanhe na pagina oficial de notas ou no portal principal.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="/fgb/notas" className="fgb-btn-primary">Ver Notas Oficiais</a>
            <a href="https://basquetegaucho.com.br/selecao-gaucha/" className="fgb-btn-secondary" style={{ color: 'var(--black)', borderColor: 'var(--border)' }}>Acessar Site Institucional</a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
