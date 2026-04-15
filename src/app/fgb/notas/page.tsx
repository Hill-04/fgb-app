import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { AnimatedSection } from '@/components/public/AnimatedSection'
import { FileDown, Search, Filter, FileText, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Notas Oficiais — Federação Gaúcha de Basketball',
  description: 'Acesse comunicados, convocações e tabelas oficiais da FGB. Download direto de documentos.',
}

const notasOficiais = [
  { 
    id: 1,
    numero: '065/2026', 
    titulo: 'Regulamento Geral de Competições — Temporada 2026', 
    data: '15/Abr/2026', 
    tipo: 'Regulamento', 
    tamanho: '1.2 MB',
    badge: 'fgb-badge-red' 
  },
  { 
    id: 2,
    numero: '064/2026', 
    titulo: 'Convocação Seleção Gaúcha Sub-15 Masculina', 
    data: '12/Abr/2026', 
    tipo: 'Convocação', 
    tamanho: '450 KB',
    badge: 'fgb-badge-verde' 
  },
  { 
    id: 3,
    numero: '063/2026', 
    titulo: 'Tabela Provisória — Estadual Adulto Masculino', 
    data: '10/Abr/2026', 
    tipo: 'Tabela', 
    tamanho: '890 KB',
    badge: 'fgb-badge-yellow' 
  },
  { 
    id: 4,
    numero: '062/2026', 
    titulo: 'Homologação de Arbitragem — Quartas de Final', 
    data: '08/Abr/2026', 
    tipo: 'Arbitragem', 
    tamanho: '320 KB',
    badge: 'fgb-badge-outline' 
  },
  { 
    id: 5,
    numero: '061/2026', 
    titulo: 'Nota de Pesar — Dr. Roberto Silva', 
    data: '05/Abr/2026', 
    tipo: 'Comunicado', 
    tamanho: '210 KB',
    badge: 'fgb-badge-outline' 
  },
]

export default function NotasPage() {
  return (
    <div className="bg-[#050505] min-h-screen text-white/90">
      <PublicHeader />

      <main>
        {/* HEADER SECTION */}
        <section className="bg-[var(--verde)] py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <AnimatedSection delay={1}>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                  <div className="fgb-label text-[var(--yellow)] text-[10px] tracking-[0.3em] mb-4 uppercase">Secretaria</div>
                  <h1 className="fgb-display text-5xl md:text-7xl uppercase leading-none text-white">Notas <br /> <span className="text-white/40">Oficiais</span></h1>
                </div>
                <p className="fgb-label text-white/60 max-w-sm normal-case tracking-normal text-sm leading-relaxed">
                  Documentação oficial, resoluções e convocações da FGB. Todos os arquivos estão disponíveis para download imediato em formato PDF.
                </p>
              </div>
            </AnimatedSection>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--verde)] via-[var(--yellow)] to-[var(--red)]" />
        </section>

        {/* SEARCH & FILTERS BAR */}
        <section className="bg-white/[0.02] border-b border-white/5 py-6">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-4 items-center justify-between">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                  type="text" 
                  placeholder="Buscar por número ou título..." 
                  className="w-full bg-white/5 border border-white/10 py-3 pl-11 pr-4 fgb-label text-xs focus:border-[var(--yellow)]/50 focus:outline-none transition-all"
                />
             </div>
             <div className="flex gap-4 w-full md:w-auto">
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 border border-white/10 px-6 py-3 fgb-label text-[10px] hover:bg-white/10 transition-all">
                  <Filter className="w-3 h-3" /> CATEGORIA
                </button>
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 border border-white/10 px-6 py-3 fgb-label text-[10px] hover:bg-white/10 transition-all">
                  <Calendar className="w-3 h-3" /> ANO: 2026
                </button>
             </div>
          </div>
        </section>

        {/* DOCUMENTS LIST */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="space-y-4">
              {notasOficiais.map((nota, i) => (
                <AnimatedSection key={nota.id} delay={((i % 4) + 1) as any}>
                  <div className="group bg-[#0A0A0A] border border-white/5 p-6 hover:border-[var(--yellow)]/30 hover:bg-white/[0.02] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--yellow)]/10 transition-colors">
                        <FileText className="w-6 h-6 text-white/30 group-hover:text-[var(--yellow)] transition-colors" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="fgb-label text-[10px] bg-white/5 px-2 py-0.5 border border-white/10 text-white/40">NOTA Nº {nota.numero}</span>
                          <span className={`fgb-label text-[9px] px-2 py-0.5 rounded-sm ${nota.badge} text-black font-bold uppercase`}>{nota.tipo}</span>
                        </div>
                        <h3 className="fgb-display text-lg tracking-wide group-hover:text-white transition-colors">{nota.titulo}</h3>
                        <div className="flex items-center gap-4 mt-2 text-white/30 text-[10px] fgb-label">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {nota.data}</span>
                          <span>TAMANHO: {nota.tamanho}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button className="flex items-center justify-center gap-3 bg-[var(--yellow)] text-black px-8 py-4 fgb-display text-[11px] tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap">
                      <FileDown className="w-4 h-4" /> DOWNLOAD PDF
                    </button>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* PAGINATION (Mock) */}
        <section className="pb-24">
           <div className="max-w-7xl mx-auto px-6 flex justify-center gap-2">
              {[1, 2, 3, '...', 12].map((p, i) => (
                <button key={i} className={`w-10 h-10 flex items-center justify-center fgb-display text-[10px] border border-white/10 ${i === 0 ? 'bg-[var(--yellow)] text-black' : 'hover:bg-white/5'}`}>
                  {p}
                </button>
              ))}
           </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
