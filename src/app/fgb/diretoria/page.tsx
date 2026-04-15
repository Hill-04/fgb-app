import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { AnimatedSection } from '@/components/public/AnimatedSection'
import { Mail, Phone, MapPin, Building2, Clock, Instagram, Linkedin, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Diretoria — FGB',
  description: 'Conheça a liderança responsável pela estratégia e crescimento da Federação Gaúcha de Basketball.',
}

const DIRECTOR_IMAGE = 'file:///C:/Users/braya/.gemini/antigravity/brain/32d0df04-a515-468c-86da-fea5b6987915/fgb_director_portrait_style_1776288273037.png'

const diretoriaExecutiva = [
  { name: 'Antônio Krebs Jr.', role: 'Presidente', image: DIRECTOR_IMAGE },
  { name: 'Mauro Dreher', role: 'Vice-Presidente', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&h=800&auto=format&fit=crop' },
]

const outrosCargos = [
  { name: 'Lizete Calloni', role: 'Secretária' },
  { name: 'Melina Calloni Lopes', role: 'Secretária' },
  { name: 'Gilson Hermann Kroeff', role: 'Diretor Jurídico' },
  { name: 'Fernando Serpa', role: 'Comissão de Arbitragem' },
  { name: 'José Luiz Barbosa', role: 'Comissão de Arbitragem' },
]

export default function DiretoriaPage() {
  return (
    <div className="bg-[#050505] min-h-screen text-white/90">
      <PublicHeader />

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-16 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <AnimatedSection delay={1}>
              <div className="text-center max-w-3xl mx-auto mb-20">
                <span className="inline-block bg-[var(--yellow)]/10 text-[var(--yellow)] px-4 py-1.5 fgb-label text-[10px] tracking-[0.3em] mb-8">
                  GESTÃO FGB · 2024–2028
                </span>
                <h1 className="fgb-display text-5xl md:text-8xl leading-none uppercase mb-8">
                  Nossa <span className="text-white/20">Diretoria</span>
                </h1>
                <p className="fgb-label text-white/40 normal-case tracking-normal text-lg leading-relaxed">
                  Liderança dedicada ao fortalecimento do basquete no Rio Grande do Sul, 
                  unindo tradição e inovação para o desenvolvimento de novos talentos e competições de alto nível.
                </p>
              </div>
            </AnimatedSection>
          </div>
          <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-[var(--yellow)]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        </section>

        {/* PRIMARY LEADERSHIP GRID */}
        <section className="pb-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="fgb-section-header-dark mb-12 border-b border-white/5 pb-6">
              <h2 className="fgb-display text-2xl uppercase tracking-widest text-white/30">Diretoria Executiva</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {diretoriaExecutiva.map((member, i) => (
                <AnimatedSection key={i} delay={((i % 3) + 1) as any}>
                  <div className="group relative bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[var(--yellow)]/30 hover:shadow-[0_10px_40px_rgba(245,194,0,0.05)]">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <Image 
                        src={member.image} 
                        alt={member.name} 
                        fill 
                        className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-60" />
                    </div>
                    <div className="p-8">
                      <h3 className="fgb-display text-2xl uppercase tracking-wide mb-2 group-hover:text-[var(--yellow)] transition-colors">{member.name}</h3>
                      <p className="fgb-label text-xs text-white/40 tracking-[0.2em] uppercase">{member.role}</p>
                      
                      <div className="mt-6 pt-6 border-t border-white/5 flex gap-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                         <button className="p-2 bg-white/5 border border-white/10 hover:bg-[var(--yellow)] hover:text-black transition-colors">
                            <Linkedin className="w-4 h-4" />
                         </button>
                         <button className="p-2 bg-white/5 border border-white/10 hover:bg-[var(--yellow)] hover:text-black transition-colors">
                            <Mail className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* SECONDARY BOARD GRID */}
        <section className="py-24 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-6">
             <div className="fgb-section-header-dark mb-12 border-b border-white/5 pb-6">
              <h2 className="fgb-display text-2xl uppercase tracking-widest text-white/30">Membros da Gestão</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {outrosCargos.map((member, i) => (
                 <AnimatedSection key={i} delay={((i % 4) + 1) as any}>
                    <div className="p-6 bg-[#0A0A0A] border border-white/5 hover:border-[var(--yellow)]/20 transition-all group">
                       <h4 className="fgb-display text-lg uppercase mb-2 group-hover:text-white transition-colors">{member.name}</h4>
                       <p className="text-[10px] fgb-label text-white/30 tracking-widest uppercase">{member.role}</p>
                    </div>
                 </AnimatedSection>
               ))}
            </div>
          </div>
        </section>

        {/* CONTACT & OFFICE INFO */}
        <section className="py-32">
          <div className="max-w-7xl mx-auto px-6">
             <div className="grid lg:grid-cols-3 gap-12">
                <AnimatedSection delay={1} className="lg:col-span-2">
                   <div className="bg-[#0A0A0A] border border-white/5 p-12 relative overflow-hidden h-full">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--verde)]/10 blur-3xl rounded-full" />
                      <Building2 className="w-12 h-12 text-[var(--yellow)] mb-8" />
                      <h2 className="fgb-display text-4xl uppercase mb-12 leading-none">Secretaria <br /> e Sede <span className="text-white/20">Oficial</span></h2>
                      
                      <div className="grid md:grid-cols-2 gap-12">
                         <div className="space-y-8">
                            <div className="flex gap-4 items-start">
                               <MapPin className="text-[var(--yellow)] w-5 h-5 flex-shrink-0" />
                               <div>
                                  <div className="fgb-label text-[9px] text-white/30 uppercase mb-2">Endereço</div>
                                  <p className="text-sm leading-relaxed">Rua Marechal Floriano, 388<br />Centro · Caxias do Sul · RS</p>
                               </div>
                            </div>
                            <div className="flex gap-4 items-start">
                               <Clock className="text-[var(--yellow)] w-5 h-5 flex-shrink-0" />
                               <div>
                                  <div className="fgb-label text-[9px] text-white/30 uppercase mb-2">Atendimento</div>
                                  <p className="text-sm">Segunda a Sexta<br />8h às 12h · 13h às 17h</p>
                               </div>
                            </div>
                         </div>
                         <div className="space-y-8">
                            <div className="flex gap-4 items-start">
                               <Phone className="text-[var(--yellow)] w-5 h-5 flex-shrink-0" />
                               <div>
                                  <div className="fgb-label text-[9px] text-white/30 uppercase mb-2">Contato Telefônico</div>
                                  <a href="tel:+555432233858" className="text-lg fgb-display hover:text-[var(--yellow)] transition-colors">(54) 3223-3858</a>
                               </div>
                            </div>
                            <div className="flex gap-4 items-start">
                               <Mail className="text-[var(--yellow)] w-5 h-5 flex-shrink-0" />
                               <div>
                                  <div className="fgb-label text-[9px] text-white/30 uppercase mb-2">E-mail Institucional</div>
                                  <a href="mailto:fgb@basquetegaucho.com.br" className="text-sm hover:underline">fgb@basquetegaucho.com.br</a>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </AnimatedSection>

                <AnimatedSection delay={2}>
                   <div className="bg-[var(--verde)] p-12 flex flex-col justify-between h-full relative overflow-hidden group">
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div>
                         <h3 className="fgb-display text-3xl uppercase mb-6 leading-none">Fale com a <br /> Gestão</h3>
                         <p className="text-white/60 text-sm leading-relaxed mb-12">
                            Para assuntos institucionais, parcerias ou solicitações à diretoria, utilize o canal oficial.
                         </p>
                      </div>
                      <div className="space-y-4 relative z-10">
                         <a href="mailto:fgb@basquetegaucho.com.br" className="flex items-center justify-between bg-white text-black p-5 fgb-display text-xs tracking-widest hover:bg-[var(--yellow)] transition-all">
                            ENVIAR MENSAGEM <ExternalLink className="w-4 h-4" />
                         </a>
                         <a href="https://api.whatsapp.com/send?phone=555432233858" target="_blank" className="flex items-center justify-between border border-white/30 text-white p-5 fgb-display text-xs tracking-widest hover:bg-white hover:text-black transition-all">
                            WHATSAPP <Instagram className="w-4 h-4" />
                         </a>
                      </div>
                   </div>
                </AnimatedSection>
             </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
