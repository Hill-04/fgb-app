import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Diretoria Executiva — FGB',
  description: 'Liderança e compromisso com a evolução do basketball gaúcho. Conheça a diretoria da FGB para a gestão 2024–2028.',
}

const diretores = [
  { name: 'Antônio Krebs Jr.', cargo: 'Presidente', sigla: 'AK' },
  { name: 'Mauro Dreher', cargo: 'Vice-Presidente', sigla: 'MD' },
  { name: 'Lizete Calloni', cargo: 'Secretária', sigla: 'LC' },
  { name: 'Melina Calloni Lopes', cargo: 'Secretária', sigla: 'ML' },
  { name: 'Gilson Hermann Kroeff', cargo: 'Diretor Jurídico', sigla: 'GK' },
  { name: 'Fernando Serpa', cargo: 'Comissão de Arbitragem', sigla: 'FS' },
  { name: 'José Luiz Barbosa', cargo: 'Comissão de Arbitragem', sigla: 'JB' },
]

export default function DiretoriaPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="fgb-stripe" />
      <PublicHeader />

      {/* HERO PREMIUM (SOURCE TRUTH STYLE) */}
      <header className="fgb-page-header-premium">
        <div className="bg-text">DIRETORIA</div>
        <div className="container-fgb content">
          <div className="fgb-fade-up">
            <span className="fgb-label" style={{ color: 'var(--yellow)', marginBottom: '16px', display: 'block' }}>
              Gestão FGB · 2024 – 2028
            </span>
            <h1 className="fgb-display fgb-h1 mb-4">Liderança <em className="not-italic text-[var(--yellow)]">&</em> Compromisso</h1>
            <p className="font-body text-white/60 max-w-xl mx-auto text-sm leading-relaxed">
              Formada por profissionais dedicados à excelência esportiva, transparência 
              administrativa e ao fomento do basquete em todo o Rio Grande do Sul.
            </p>
          </div>
        </div>
      </header>

      <main>
        {/* INTRO INSTITUCIONAL */}
        <section className="fgb-section-py bg-[#F8FAFC]">
          <div className="container-fgb grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="fgb-fade-up" style={{ animationDelay: '0.2s' }}>
              <span className="fgb-label text-[var(--verde)]">Governança</span>
              <h2 className="fgb-display fgb-h2 mt-4 mb-6 text-[var(--black)]">Estrutura de <span className="text-[var(--verde)]">Gestão</span></h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                A Federação Gaúcha de Basketball é liderada por uma equipe multidisciplinar comprometida com a profissionalização dos clubes e a massificação da modalidade. Nosso foco é elevar o patamar técnico das competições gaúchas no cenário nacional.
              </p>
              <div className="flex gap-4">
                 <div className="p-4 bg-white border border-slate-200 rounded-xl flex-1">
                    <div className="fgb-display text-2xl text-[var(--verde)]">2024</div>
                    <div className="fgb-label text-[9px] opacity-40">Ano Eleição</div>
                 </div>
                 <div className="p-4 bg-white border border-slate-200 rounded-xl flex-1">
                    <div className="fgb-display text-2xl text-[var(--verde)]">2028</div>
                    <div className="fgb-label text-[9px] opacity-40">Fim Mandato</div>
                 </div>
              </div>
            </div>
            <div className="relative fgb-fade-up" style={{ animationDelay: '0.3s' }}>
               <div className="aspect-square bg-[var(--verde)] rounded-3xl overflow-hidden shadow-2xl relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute inset-x-8 bottom-8">
                     <div className="fgb-label text-[var(--yellow)] mb-1">Assembleia Oficial</div>
                     <div className="fgb-display text-white text-xl">Gestão Eleita por Unanimidade</div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* BOARD GRID */}
        <section className="fgb-section-py container-fgb">
          <div className="text-center mb-16 fgb-fade-up">
            <h2 className="fgb-display fgb-h3 text-[var(--black)]">Composição da <span className="text-[var(--verde)]">Diretoria</span></h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {diretores.map((d, i) => (
              <div 
                key={i} 
                className="fgb-card-3xl fgb-fade-up" 
                style={{ animationDelay: `${0.1 * (i + 4)}s` }}
              >
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-white shadow-sm overflow-hidden text-2xl font-bold text-slate-400">
                  {d.sigla}
                </div>
                <div className="text-center">
                  <span className="fgb-badge-verde mb-2 inline-block">{d.cargo}</span>
                  <h3 className="fgb-display text-xl text-[var(--black)]">{d.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA CONTATO */}
        <section className="bg-[var(--black)] py-20 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full fgb-stripe opacity-50" />
           <div className="container-fgb text-center relative z-10">
              <h2 className="fgb-display fgb-h3 text-white mb-4">Dúvidas Administrativas?</h2>
              <p className="text-slate-400 mb-10 max-w-lg mx-auto text-sm">
                Entre em contato com nossa secretaria para informações sobre taxas, 
                regulamentos ou filiações de novos clubes.
              </p>
              <a href="mailto:fgb@basquetegaucho.com.br" className="fgb-btn-cut">
                 FALAR COM A SECRETARIA
              </a>
           </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
