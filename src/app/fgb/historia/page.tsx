import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { AnimatedSection } from '@/components/public/AnimatedSection'
import { Trophy, Users, History, Milestone, Landmark } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Nossa História — Federação Gaúcha de Basketball',
  description: 'Conheça a centenária história do basquete no Rio Grande do Sul e a fundação da FGB em 1952.',
}

const clubesFundadores = [
  'Grêmio Foot-Ball Porto Alegrense', 'Sport Club Internacional', 'SOGIPA', 'G.W. Juventude', 'Americano F.C.',
  'Canto do Rio', 'Cruzeiro do Sul', 'Fuss-Ball Club Porto Alegre', 'Hebraica', 'Ipiranga', 'Nacional', 'São José',
  'Sarandi', 'Teresópolis', 'União', 'Vila Nova', 'Vasco da Gama', 'Vitória', 'A.A. Banco do Brasil',
  'A.C.M.', 'Câmara do Comércio', 'Faculdade de Direito',
]

const HISTORY_IMAGE = 'file:///C:/Users/braya/.gemini/antigravity/brain/32d0df04-a515-468c-86da-fea5b6987915/fgb_history_legacy_hero_1776285599022.png'

export default function HistoriaPage() {
  return (
    <div className="bg-[#050505] min-h-screen text-white/90 selection:bg-[var(--yellow)] selection:text-black">
      <PublicHeader />

      <main>
        {/* HERO SECTION: LEGACY IMPACT */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image 
              src={HISTORY_IMAGE} 
              alt="FGB Basketball Legacy" 
              fill 
              className="object-cover opacity-30 grayscale-[0.4]" 
              priority 
              unoptimized 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
          </div>

          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <AnimatedSection delay={1}>
              <span className="inline-block bg-[var(--yellow)] text-black px-4 py-1.5 fgb-label text-[10px] tracking-[0.3em] mb-8">
                ESTABELECIDA EM 1952
              </span>
              <h1 className="fgb-display text-5xl md:text-8xl lg:text-9xl leading-[0.85] uppercase mb-10">
                Nossa <br />
                <span className="text-white/20">História</span>
              </h1>
              <p className="fgb-label text-white/40 max-w-xl mx-auto leading-relaxed tracking-wider">
                MAIS DE UM SÉCULO DE PAIXÃO, DISPUTA E EXCELÊNCIA. CONSTRUINDO O FUTURO DO BASQUETE GAÚCHO SOBRE UM ALICERCE DE TRADIÇÃO.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* SECTION 1: AS RAÍZES (1914) */}
        <section className="py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <AnimatedSection delay={2}>
                <div className="relative aspect-square bg-white/[0.02] border border-white/5 p-2 overflow-hidden group">
                  <div className="absolute inset-0 bg-[var(--verde)]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <History className="absolute bottom-8 right-8 w-32 h-32 text-white/5" />
                  <div className="relative h-full w-full border border-white/5 bg-[#0A0A0A] p-12 flex flex-col justify-center">
                    <span className="fgb-display text-[var(--yellow)] text-8xl opacity-20 mb-4">1914</span>
                    <h2 className="fgb-display text-4xl uppercase mb-6">As Raízes <br />na ACM</h2>
                    <p className="fgb-label text-white/40 normal-case tracking-normal text-base leading-relaxed">
                      O basquete chegou ao Rio Grande do Sul através da ACM (Associação Cristã de Moços). 
                      O grande impulsionador foi <strong>Frank Long</strong>, vindo de Chicago, que introduziu o esporte 
                      em Porto Alegre. Em 1923, sob a regência de Arthan Teixeira, foi fundada a primeira liga.
                    </p>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={3}>
                <div className="space-y-10">
                  <div className="flex gap-6 items-start">
                    <div className="w-12 h-12 bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Landmark className="text-[var(--yellow)] w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="fgb-display text-xl uppercase mb-3">Pioneirismo Nacional</h3>
                      <p className="text-sm text-white/40 leading-relaxed font-light">
                        O Rio Grande do Sul foi um dos primeiros estados a abraçar o basquete de forma organizada, 
                        influenciado pelas correntes esportivas internacionais da época.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-start">
                    <div className="w-12 h-12 bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Users className="text-[var(--yellow)] w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="fgb-display text-xl uppercase mb-3">Criação da Primeira Liga</h3>
                      <p className="text-sm text-white/40 leading-relaxed font-light">
                        A fundação da liga em Caxias do Sul (1923) marcou o início das competições formais, 
                        lançando as bases para o que veria a ser a FGB décadas depois.
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* SECTION 2: A ERA DE OURO (1934-35) */}
        <section className="py-32 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <AnimatedSection delay={1}>
              <div className="max-w-3xl mx-auto mb-20">
                <Trophy className="w-16 h-16 text-[var(--yellow)] mx-auto mb-8" />
                <h2 className="fgb-display text-5xl md:text-7xl uppercase mb-10 leading-none">
                  Bi-Campeão <br /> <span className="text-[var(--yellow)]">Nacional</span>
                </h2>
                <p className="fgb-label text-white/40 normal-case tracking-normal text-lg leading-relaxed">
                  Em 1934 e 1935, a seleção de Porto Alegre conquistou o Brasileiro de Seleções 
                  consecutivamente. Uma história lendária que envolveu uma viagem de quatro dias 
                  de trem para enfrentar as potências de São Paulo e Rio de Janeiro.
                </p>
              </div>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { label: 'Vitória Épica', desc: 'Vencendo os paulistas em seu próprio solo (1934).' },
                { label: 'O Regresso', desc: 'Recepcionados como heróis na Estação de Porto Alegre.' },
                { label: 'Consolidação', desc: 'O título de 1935 confirmou a força absoluta no Sul.' },
              ].map((card, i) => (
                <AnimatedSection key={i} delay={(i + 2) as any}>
                  <div className="p-10 border border-white/5 bg-[#0A0A0A] hover:border-[var(--yellow)]/30 transition-all">
                    <h4 className="fgb-display text-base uppercase mb-4 text-[var(--yellow)]">{card.label}</h4>
                    <p className="text-xs text-white/30 leading-relaxed uppercase tracking-widest">{card.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: A FUNDAÇÃO (1950-52) */}
        <section className="py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <AnimatedSection delay={1}>
                <div className="space-y-8">
                  <div className="inline-block bg-[var(--yellow)]/10 text-[var(--yellow)] px-3 py-1 fgb-label text-[9px] tracking-widest uppercase">A Batalha pela Autonomia</div>
                  <h2 className="fgb-display text-5xl md:text-6xl uppercase leading-[0.9]">Fundação <br />da FGB</h2>
                  <p className="text-white/50 leading-relaxed">
                    Antes de 1952, o basquete era gerido pela FARG (Federação Atlética Rio-Grandense). 
                    A necessidade de autonomia levou à fundação oficial da FGB em 18 de abril de 1952.
                  </p>
                  <p className="text-white/50 leading-relaxed">
                    Com a liderança do <strong>Sr. José Carlos Daut</strong> e o apoio decisivo do jornal 
                    <em>Diário de Notícias</em>, 22 clubes se reuniram na Faculdade de Direito de Porto Alegre 
                    para registrar o nascimento da Federação.
                  </p>
                  <div className="pt-8">
                    <Milestone className="w-12 h-12 text-white/10 mb-4" />
                    <div className="fgb-label text-[10px] tracking-widest uppercase text-white/30">Primeiro Presidente</div>
                    <div className="fgb-display text-2xl uppercase mt-2">José Carlos Daut</div>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={2}>
                <div className="bg-[var(--verde)]/5 border border-[var(--verde)]/20 p-10 md:p-16 rounded-3xl relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--yellow)]/5 blur-[100px] rounded-full" />
                  <h3 className="fgb-display text-3xl uppercase mb-10 text-center">22 Clubes <br /> <span className="text-[var(--yellow)]">Fundadores</span></h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                    {clubesFundadores.map((clube, i) => (
                      <div key={i} className="flex items-center gap-3 group">
                        <span className="text-[10px] fgb-label text-white/20 group-hover:text-[var(--yellow)] transition-colors">{(i+1).toString().padStart(2, '0')}.</span>
                        <span className="fgb-display text-[11px] uppercase tracking-wider group-hover:pl-2 transition-all">{clube}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* SECTION 4: O FUTURO */}
        <section className="py-32 bg-[var(--verde)] text-white relative">
          <div className="absolute inset-0 bg-[#000]/10 mix-blend-overlay" />
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <AnimatedSection delay={1}>
              <h2 className="fgb-display text-4xl md:text-7xl leading-[0.9] uppercase mb-10">
                Honrando o passado, <br /> liderando o amanhã
              </h2>
              <p className="fgb-label text-white/60 text-xs tracking-[0.2em] mb-12 max-w-xl mx-auto leading-relaxed">
                A FEDERAÇÃO GAÚCHA DE BASKETBALL CONTINUA SUA MISSÃO DE DESENVOLVER E FOMENTAR O ESPORTE EM TODO O RIO GRANDE DO SUL.
              </p>
              <div className="flex justify-center gap-6">
                 <Link href="/campeonatos" className="bg-white text-[var(--verde)] px-10 py-4 fgb-display text-xs tracking-widest hover:bg-[var(--yellow)] hover:text-black transition-all">
                    VER CAMPEONATOS
                 </Link>
                 <Link href="/contato" className="border border-white/30 px-10 py-4 fgb-display text-xs tracking-widest hover:bg-white hover:text-[var(--verde)] transition-all">
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
