import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'História da Federação — FGB',
  description: 'A jornada do basquete gaúcho, desde as raízes em 1914 até a consolidação de uma das federações mais tradicionais do Brasil.',
}

const marcos = [
  { 
    ano: '1914', 
    titulo: 'As Raízes', 
    desc: 'O basquete chega ao RS via ACM, com Frank Long introduzindo o esporte em Porto Alegre.', 
    badge: 'fgb-badge-verde' 
  },
  { 
    ano: '1934 – 1935', 
    titulo: 'O Bi-Campeonato Nacional', 
    desc: 'O Rio Grande do Sul conquista o Brasil duas vezes seguidas, superando as potências do centro do país.', 
    badge: 'fgb-badge-yellow' 
  },
  { 
    ano: '18 Abr 1952', 
    titulo: 'Fundação da FGB', 
    desc: '22 clubes se reúnem para fundar a Federação Gaúcha de Basketball, buscando autonomia técnica.', 
    badge: 'fgb-badge-red' 
  },
  { 
    ano: '1970 – 1980', 
    titulo: 'Expansão e Consolidação', 
    desc: 'O basquete interiorano ganha força com clubes icônicos surgindo em diversas regiões do estado.', 
    badge: 'fgb-badge-outline' 
  },
]

export default function HistoriaPage() {
  return (
    <div className="bg-[#F7F8F4] min-h-screen">
      <PublicHeader />

      {/* HEADER PADRÃO DESIGN SYSTEM */}
      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Tradição e Legado</div>
          <h1 className="fgb-page-header-title">História da Federação</h1>
          <p className="fgb-page-header-sub mx-auto">
            Uma jornada épica de mais de um século, marcada por pioneirismo, conquistas 
            expressivas e a paixão inabalável dos gaúchos pelo basketball.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        
        {/* Narrativa Section */}
        <section className="mb-16">
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-verde" />
              <h2 className="fgb-section-title">O Início de <span className="verde">Tudo</span></h2>
            </div>
          </div>
          <div className="prose prose-fgb max-w-none text-[var(--gray-d)] leading-relaxed space-y-4">
             <p>
               A história do basketball no Rio Grande do Sul é uma das mais ricas e antigas do Brasil. Tudo começou em 1914, quando o esporte foi introduzido em Porto Alegre por meio da ACM (Associação Cristã de Moços), sob a liderança do instrutor Frank Long.
             </p>
             <p>
               Rapidamente, o "bola ao cesto" cativou o público gaúcho, espalhando-se para clubes tradicionais que viam na modalidade uma alternativa dinâmica e técnica aos esportes de campo.
             </p>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="mb-16">
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-red" />
              <h2 className="fgb-section-title">Linha do <span className="red">Tempo</span></h2>
            </div>
          </div>
          
          <div className="space-y-4">
            {marcos.map((marco, i) => (
              <div key={i} className="fgb-card p-6 border-l-4" style={{ borderLeftColor: i % 2 === 0 ? 'var(--verde)' : 'var(--yellow)' }}>
                <div className="flex items-center gap-2 mb-2">
                   <span className={`fgb-badge ${marco.badge}`}>{marco.ano}</span>
                </div>
                <h3 className="fgb-display text-lg text-[var(--black)] mb-2">{marco.titulo}</h3>
                <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
                  {marco.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="fgb-section-yellow rounded-xl p-8 text-center border border-[var(--border)] shadow-sm">
           <div className="text-4xl mb-4">📜</div>
           <h2 className="fgb-display text-[22px] text-[var(--black)] mb-2">Fundação da FGB</h2>
           <p className="fgb-label text-[var(--gray)] max-w-md mx-auto mb-6" style={{ textTransform: 'none', letterSpacing: 0 }}>
             Saiba mais detalhes sobre a mítica assembleia de 1952 que oficializou a federação.
           </p>
           <a href="/fgb/fundacao" className="fgb-btn-primary">
             Ver Página da Fundação →
           </a>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
