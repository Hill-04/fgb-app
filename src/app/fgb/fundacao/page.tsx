import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { AnimatedSection } from '@/components/public/AnimatedSection'
import { 
  History, 
  Target, 
  ShieldCheck, 
  Users, 
  ChevronRight, 
  FileText, 
  Calendar, 
  MapPin, 
  CheckCircle2 
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Fundação — Federação Gaúcha de Basketball',
  description: 'Conheça a história da fundação da FGB em 1952, os 22 clubes pioneiros e nossa missão institucional.',
}

const timeline = [
  {
    year: '1914',
    title: 'O Início',
    desc: 'Chegada do basquete em Porto Alegre através da ACM e Frank Long.',
    color: 'var(--verde-inst)'
  },
  {
    year: '1923',
    title: 'Primeira Liga',
    desc: 'Fundação da primeira liga de basquete sob regência de Arthan Teixeira.',
    color: 'var(--red-inst)'
  },
  {
    year: '1934',
    title: 'Bi-Campeão Nacional',
    desc: 'O RS conquista o Brasil pela primeira vez, consolidando a força do sul.',
    color: 'var(--yellow-inst)'
  },
  {
    year: '1952',
    title: 'Nascimento da FGB',
    desc: 'Em 18 de abril, 22 clubes fundam a Federação para gerir o esporte com autonomia.',
    color: 'var(--verde-inst)'
  }
]

const valores = [
  {
    icon: Target,
    title: 'Missão',
    desc: 'Fomentar e organizar a prática do basketball em todo território gaúcho, promovendo a excelência técnica e social.',
    accent: 'var(--verde-inst)'
  },
  {
    icon: ShieldCheck,
    title: 'Transparência',
    desc: 'Atuar com integridade e clareza em todos os processos administrativos e esportivos perante os clubes e a sociedade.',
    accent: 'var(--red-inst)'
  },
  {
    icon: Users,
    title: 'União',
    desc: 'Fortalecer os laços entre os clubes filiados, atletas e árbitros, construindo uma comunidade sólida e participativa.',
    accent: 'var(--yellow-inst)'
  }
]

export default function FundacaoPage() {
  return (
    <div className="bg-[#FFFFFF] min-h-screen font-sans selection:bg-[#D9E2D3] selection:text-[#1F2A1F]" style={{
      '--verde-inst': '#1F6B3A',
      '--verde-dark': '#14532D',
      '--red-inst': '#B42318',
      '--yellow-inst': '#D4A017',
      '--text-main': '#1F2A1F',
      '--text-sub': '#4E5B4E',
      '--border-light': '#D9E2D3',
      '--bg-alt': '#F7F8F4'
    } as any}>
      
      {/* O Header original é dark, mas combina como uma moldura de autoridade */}
      <PublicHeader />

      <main className="text-[var(--text-main)]">
        
        {/* 1. HERO SECTION */}
        <section className="relative pt-32 pb-24 overflow-hidden border-b border-[var(--border-light)]">
          <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
            <AnimatedSection delay={1}>
              <div className="flex flex-col items-center">
                <span className="text-[var(--verde-inst)] font-bold uppercase tracking-[0.4em] text-[10px] mb-6">
                  Federação Gaúcha
                </span>
                <h1 className="text-6xl md:text-8xl font-extrabold text-[var(--text-main)] mb-8 tracking-tight">
                  Fundação
                </h1>
                
                {/* Linha Tricolor Divisional */}
                <div className="flex w-32 h-1.5 rounded-full overflow-hidden mb-12">
                   <div className="flex-1 bg-[var(--verde-inst)]" />
                   <div className="flex-1 bg-[var(--red-inst)]" />
                   <div className="flex-1 bg-[var(--yellow-inst)]" />
                </div>

                <p className="text-[var(--text-sub)] text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                  Construída sobre o compromisso de 22 clubes pioneiros, a FGB nasceu em 1952 para dar voz e autonomia ao basquete gaúcho.
                </p>
              </div>
            </AnimatedSection>
          </div>
          
          {/* Subtle Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none z-0">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[var(--verde-inst)] rounded-full" />
          </div>
        </section>

        {/* 2. INTRODUÇÃO */}
        <section className="py-24 bg-[var(--bg-alt)]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <AnimatedSection delay={1}>
                <h2 className="text-3xl font-extrabold mb-8 leading-tight">
                  Um marco na gestão <br />
                  <span className="text-[var(--verde-inst)]">esportiva do Sul.</span>
                </h2>
                <div className="space-y-6 text-[var(--text-sub)] leading-relaxed">
                  <p>
                    A necessidade de uma entidade dedicada exclusivamente ao basquete surgiu após anos sob a tutela da FARG. Clubes de todo o estado buscavam uma federação que entendesse as particularidades da nossa quadra.
                  </p>
                  <p>
                    Em 18 de abril de 1952, na Faculdade de Direito de Porto Alegre, o idealismo de <strong>José Carlos Daut</strong> tornou-se realidade, oficializando o basquete como uma força independente.
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={2}>
                <div className="bg-white p-10 border border-[var(--border-light)] shadow-sm rounded-sm">
                   <div className="space-y-8">
                      <div className="flex items-start gap-4">
                         <div className="w-10 h-10 bg-[var(--bg-alt)] flex items-center justify-center rounded-full text-[var(--verde-inst)]">
                            <Calendar className="w-5 h-5" />
                         </div>
                         <div>
                            <div className="text-[9px] uppercase font-bold tracking-widest text-[var(--text-sub)] opacity-60 mb-1">DATA HISTÓRICA</div>
                            <div className="text-base font-bold">18 de Abril de 1952</div>
                         </div>
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="w-10 h-10 bg-[var(--bg-alt)] flex items-center justify-center rounded-full text-[var(--red-inst)]">
                            <MapPin className="w-5 h-5" />
                         </div>
                         <div>
                            <div className="text-[9px] uppercase font-bold tracking-widest text-[var(--text-sub)] opacity-60 mb-1">LOCAL DA ASSEMBLEIA</div>
                            <div className="text-base font-bold">Porto Alegre, RS</div>
                         </div>
                      </div>
                      <div className="flex items-start gap-4">
                         <div className="w-10 h-10 bg-[var(--bg-alt)] flex items-center justify-center rounded-full text-[var(--yellow-inst)]">
                            <Users className="w-5 h-5" />
                         </div>
                         <div>
                            <div className="text-[9px] uppercase font-bold tracking-widest text-[var(--text-sub)] opacity-60 mb-1">PIONEIRISMO</div>
                            <div className="text-base font-bold">22 Clubes Fundadores</div>
                         </div>
                      </div>
                   </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* 3. HISTÓRIA (TIMELINE) */}
        <section className="py-32">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-extrabold mb-4">Marcos Institucionais</h2>
              <div className="w-12 h-1 bg-[var(--verde-inst)] mx-auto" />
            </div>

            <div className="relative border-l-2 border-[var(--border-light)] ml-4 md:ml-0 md:mx-auto md:w-[2px] space-y-20">
              {timeline.map((item, i) => (
                <div key={i} className="relative">
                  {/* Dot */}
                  <div className="absolute left-[-9px] md:left-[-9px] top-6 w-4 h-4 rounded-full border-4 border-white shadow-sm flex items-center justify-center" style={{ backgroundColor: item.color }} />
                  
                  {/* Card Content */}
                  <AnimatedSection delay={((i % 4) + 1) as any} className={`md:w-[45%] ${i % 2 === 0 ? 'md:ml-auto md:pl-10 text-left' : 'md:mr-auto md:pr-10 md:text-right'}`}>
                    <div className="bg-white border border-[var(--border-light)] p-8 hover:shadow-md transition-shadow relative">
                       <span className="text-2xl font-black mb-2 block" style={{ color: item.color }}>{item.year}</span>
                       <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                       <p className="text-[var(--text-sub)] text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </AnimatedSection>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. VALORES */}
        <section className="py-24 bg-[var(--bg-alt)] border-t border-[var(--border-light)]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              {valores.map((v, i) => (
                <AnimatedSection key={i} delay={((i % 3) + 1) as any}>
                  <div className="bg-white p-10 border border-[var(--border-light)] hover:translate-y-[-4px] transition-transform duration-300 h-full relative group">
                    {/* Color Accent Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5" style={{ backgroundColor: v.accent }} />
                    
                    <v.icon className="w-10 h-10 mb-8 opacity-40" style={{ color: v.accent }} />
                    <h3 className="text-2xl font-bold mb-4">{v.title}</h3>
                    <p className="text-[var(--text-sub)] text-sm leading-relaxed">{v.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* 5. CTA FINAL */}
        <section className="py-32 text-center">
          <div className="max-w-4xl mx-auto px-6">
            <AnimatedSection delay={1}>
               <h2 className="text-4xl font-extrabold mb-10 leading-tight">
                 Transparência e liderança <br /> <span className="text-[var(--text-sub)] opacity-40">pelo basquete gaúcho.</span>
               </h2>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/fgb/diretoria" className="w-full sm:w-auto px-10 py-4 bg-[var(--verde-inst)] text-white font-bold rounded-sm hover:bg-[var(--verde-dark)] transition-colors shadow-sm flex items-center justify-center gap-2 group">
                    CONHEÇA A DIRETORIA <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link href="/contato" className="w-full sm:w-auto px-10 py-4 border border-[var(--border-light)] text-[var(--text-main)] font-bold rounded-sm hover:bg-[var(--bg-alt)] transition-colors">
                    FALE CONOSCO
                  </Link>
               </div>
            </AnimatedSection>
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  )
}
