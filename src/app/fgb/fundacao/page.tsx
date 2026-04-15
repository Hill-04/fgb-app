import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Fundação — FGB',
  description: 'Conheça a história e os valores da fundação da Federação Gaúcha de Basketball.',
}

const valores = [
  { titulo: 'Missão', desc: 'Fomentar e organizar o basquete no Rio Grande do Sul.', accent: 'fgb-accent-verde' },
  { titulo: 'Visão', desc: 'Ser referência nacional em gestão esportiva e formação.', accent: 'fgb-accent-yellow' },
  { titulo: 'Valores', desc: 'Integridade, paixão e união pelo esporte.', accent: 'fgb-accent-red' },
]

export default function FundacaoPage() {
  return (
    <div className="bg-[#F7F8F4] min-h-screen">
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">18 de Abril de 1952</div>
          <h1 className="fgb-page-header-title">Fundação</h1>
          <p className="fgb-page-header-sub mx-auto">
            O nascimento oficial da Federação Gaúcha de Basketball, fruto da visão 
            e coragem de 22 clubes pioneiros na assembleia histórica de Porto Alegre.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        
        {/* Intro */}
        <section className="mb-14">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                 <div className="fgb-accent fgb-accent-verde" />
                 <h2 className="fgb-display text-3xl mb-6">Um Marco Institucional</h2>
                 <p className="text-[var(--gray-d)] leading-relaxed mb-6">
                    A assembleia de fundação ocorreu na Faculdade de Direito de Porto Alegre, onde foi eleita a primeira diretoria liderada por José Carlos Daut. A partir desse momento, o basquete gaúcho ganhou sua tão sonhada autonomia técnica e administrativa.
                 </p>
              </div>
              <div className="fgb-card p-8 border-t-4 border-[var(--verde)] bg-white">
                 <div className="space-y-6">
                    <div>
                       <div className="fgb-label text-[9px] opacity-40 mb-1">DATA HISTÓRICA</div>
                       <div className="text-xl font-bold">18 de Abril de 1952</div>
                    </div>
                    <div>
                       <div className="fgb-label text-[9px] opacity-40 mb-1">LOCAL</div>
                       <div className="text-xl font-bold">Porto Alegre, RS</div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Valores */}
        <section className="mb-14">
           <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-yellow" />
              <h2 className="fgb-section-title">Nossos <span className="yellow">Valores</span></h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {valores.map((v, i) => (
                <div key={i} className="fgb-card p-10 text-center hover:scale-[1.02] transition-transform">
                   <div className={`fgb-accent mx-auto mb-6 ${v.accent}`} />
                   <h3 className="fgb-display text-2xl mb-4">{v.titulo}</h3>
                   <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
                      {v.desc}
                   </p>
                </div>
             ))}
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  )
}
