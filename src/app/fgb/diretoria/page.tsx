import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Diretoria — FGB',
  description: 'Conheça a diretoria da Federação Gaúcha de Basketball, eleita para a gestão 2024–2028.',
}

const cargos = [
  { name: 'Antônio Krebs Jr.', cargo: 'Presidente', badge: 'fgb-badge-verde', icon: '👤' },
  { name: 'Mauro Dreher', cargo: 'Vice-Presidente', badge: 'fgb-badge-verde', icon: '👤' },
  { name: 'Lizete Calloni', cargo: 'Secretária', badge: 'fgb-badge-yellow', icon: '📝' },
  { name: 'Melina Calloni Lopes', cargo: 'Secretária', badge: 'fgb-badge-yellow', icon: '📝' },
  { name: 'Gilson Hermann Kroeff', cargo: 'Diretor Jurídico', badge: 'fgb-badge-red', icon: '⚖️' },
  { name: 'Fernando Serpa', cargo: 'Comissão de Arbitragem', badge: 'fgb-badge-orange', icon: '🏁' },
  { name: 'José Luiz Barbosa', cargo: 'Comissão de Arbitragem', badge: 'fgb-badge-orange', icon: '🏁' },
]

export default function DiretoriaPage() {
  return (
    <div className="bg-[#F7F8F4] min-h-screen">
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Gestão FGB · 2024–2028</div>
          <h1 className="fgb-page-header-title">Diretoria</h1>
          <p className="fgb-page-header-sub mx-auto">
            Conheça os dirigentes eleitos dedicados ao desenvolvimento e à excelência 
            do basketball em todo o estado do Rio Grande do Sul.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        
        <section className="mb-14">
           <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-verde" />
              <h2 className="fgb-section-title">Composição da <span className="verde">Diretoria</span></h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cargos.map((c, i) => (
              <div key={i} className="fgb-card p-6 flex items-start gap-4 admin-card-verde">
                <div className="w-12 h-12 bg-[var(--gray-l)] flex items-center justify-center rounded-full text-2xl">
                  {c.icon}
                </div>
                <div>
                   <div className="mb-1">
                      <span className={`fgb-badge ${c.badge}`}>{c.cargo}</span>
                   </div>
                   <h3 className="fgb-display text-lg text-[var(--black)]">{c.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Informações de Sede e Contato integradas no design standard */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
           <div className="fgb-card p-8 border-t-4 border-[var(--verde)]">
              <h3 className="fgb-display text-xl mb-6">Secretaria FGB</h3>
              <div className="space-y-4">
                 <div className="flex gap-4">
                    <span className="opacity-40">📞</span>
                    <div>
                       <div className="fgb-label text-[9px] opacity-40 mb-1">Telefone</div>
                       <a href="tel:+555432233858" className="fgb-label text-xs hover:text-[var(--verde)] transition-colors">(54) 3223-3858</a>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <span className="opacity-40">✉️</span>
                    <div>
                       <div className="fgb-label text-[9px] opacity-40 mb-1">E-mail</div>
                       <a href="mailto:fgb@basquetegaucho.com.br" className="fgb-label text-xs hover:text-[var(--verde)] transition-colors">fgb@basquetegaucho.com.br</a>
                    </div>
                 </div>
              </div>
           </div>

           <div className="fgb-card p-8 border-t-4 border-[var(--yellow)]">
              <h3 className="fgb-display text-xl mb-6">Sede Oficial</h3>
              <div className="space-y-4">
                 <div className="flex gap-4">
                    <span className="opacity-40">📍</span>
                    <div>
                       <div className="fgb-label text-[9px] opacity-40 mb-1">Endereço</div>
                       <p className="fgb-label text-xs" style={{ textTransform: 'none', letterSpacing: 0 }}>Rua Marechal Floriano, 388 · Centro</p>
                       <p className="fgb-label text-xs" style={{ textTransform: 'none', letterSpacing: 0 }}>Caxias do Sul · RS</p>
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
