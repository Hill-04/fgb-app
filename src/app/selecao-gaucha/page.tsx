import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { FgbImage } from '@/components/FgbImage'
import { StaggerGrid } from '@/components/motion/StaggerGrid'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import { Trophy, Medal, Star, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Selecao Gaucha — FGB',
  description: 'Selecoes gauchas de basketball - convocacoes, resultados e informacoes das categorias de base e adulto.',
}

type Selecao = {
  cat: string
  gen: 'Masculino' | 'Feminino'
  badge: string
  desc: string
  tint: 'green' | 'yellow' | 'red'
  photoUrl?: string
}

const selecoes: Selecao[] = [
  { cat: 'Sub 13', gen: 'Masculino', badge: 'fgb-badge-verde', tint: 'green',  desc: 'Representa o RS nas competicoes nacionais de base.' },
  { cat: 'Sub 13', gen: 'Feminino',  badge: 'fgb-badge-yellow', tint: 'yellow', desc: 'Compete no Campeonato Brasileiro de Selecoes.' },
  { cat: 'Sub 15', gen: 'Masculino', badge: 'fgb-badge-verde', tint: 'green',  desc: 'Uma das principais equipes jovens do basquete gaucho.' },
  { cat: 'Sub 15', gen: 'Feminino',  badge: 'fgb-badge-yellow', tint: 'yellow', desc: 'Formando as futuras representantes do basquete feminino.' },
  { cat: 'Sub 17', gen: 'Masculino', badge: 'fgb-badge-verde', tint: 'green',  desc: 'Categoria de projecao para atletas de elite.' },
  { cat: 'Sub 17', gen: 'Feminino',  badge: 'fgb-badge-yellow', tint: 'yellow', desc: 'Atletas gauchas destaques do cenario nacional.' },
  { cat: 'Adulto', gen: 'Masculino', badge: 'fgb-badge-red',    tint: 'red',    desc: 'Principal selecao masculina do Rio Grande do Sul.' },
  { cat: 'Adulto', gen: 'Feminino',  badge: 'fgb-badge-red',    tint: 'red',    desc: 'Principal selecao feminina nas competicoes adultas.' },
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
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14" stagger={0.1}>
          {[
            { value: '1934', label: '1º Titulo Nacional', Icon: Trophy, color: 'text-[var(--verde)]' },
            { value: '1935', label: '2º Titulo Nacional', Icon: Medal,  color: 'text-[var(--red)]' },
            { value: 'RS',   label: 'Potencia Nacional',   Icon: Star,   color: 'text-[var(--yellow)]' },
          ].map(({ value, label, Icon, color }, i) => (
            <div key={i} className="fgb-card text-center p-6 bg-[var(--gray-l)]">
              <Icon className="mx-auto mb-3" size={28} style={{ color: 'var(--fgb-green-700)', strokeWidth: 1.5 }} aria-hidden />
              <p className={`fgb-display text-[28px] mb-1 ${color}`}>{value}</p>
              <p className="fgb-label text-[var(--gray)]">{label}</p>
            </div>
          ))}
        </StaggerGrid>

        {/* HERO: Seleções Adulto (M/F) — destaque */}
        <section className="mb-10">
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-red" />
              <h2 className="fgb-section-title">Seleção <span className="red">Adulto</span></h2>
            </div>
            <span className="fgb-label" style={{ color: 'var(--gray)' }}>Principal representação</span>
          </div>
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-5" stagger={0.1}>
            {selecoes.filter((s) => s.cat === 'Adulto').map((sel, i) => (
              <div key={i} className="fgb-card overflow-hidden admin-card-red">
                <div className="aspect-[16/10] relative">
                  <FgbImage
                    variant="cover"
                    src={sel.photoUrl}
                    icon={Users}
                    tint={sel.tint}
                    alt={`Seleção Gaúcha Adulto ${sel.gen}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className={`fgb-badge ${sel.badge}`}>{sel.gen}</span>
                  </div>
                  <div className="absolute inset-x-6 bottom-5">
                    <div className="fgb-label" style={{ color: 'var(--fgb-yellow-500)', fontSize: 10, letterSpacing: '0.22em' }}>
                      Principal
                    </div>
                    <h3 className="fgb-display mt-1 text-white" style={{ fontSize: 32, lineHeight: 1, fontFamily: 'var(--font-anton)' }}>
                      Adulto {sel.gen}
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>{sel.desc}</p>
                </div>
              </div>
            ))}
          </StaggerGrid>
        </section>

        {/* GRID: Categorias de Base */}
        <section className="mb-14">
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-verde" />
              <h2 className="fgb-section-title">Categorias de <span className="verde">Base</span></h2>
            </div>
          </div>
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" stagger={0.06}>
            {selecoes.filter((s) => s.cat !== 'Adulto').map((sel, i) => (
              <div key={i} className={`fgb-card overflow-hidden ${sel.badge.includes('yellow') ? 'admin-card-yellow' : 'admin-card-verde'}`}>
                <div className="aspect-[21/9] relative">
                  <FgbImage
                    variant="cover"
                    src={sel.photoUrl}
                    icon={Users}
                    tint={sel.tint}
                    alt={`Seleção Gaúcha ${sel.cat} ${sel.gen}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="absolute inset-x-5 bottom-3 flex items-center justify-between">
                    <h3 className="fgb-display text-[20px] text-white drop-shadow-sm">{sel.cat}</h3>
                    <span className={`fgb-badge ${sel.badge}`}>{sel.gen}</span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>{sel.desc}</p>
                </div>
              </div>
            ))}
          </StaggerGrid>
        </section>

        <ScrollReveal>
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
        </ScrollReveal>
      </main>

      <PublicFooter />
    </div>
  )
}
