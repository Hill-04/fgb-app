import type { Metadata } from 'next'
import { Trophy } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Galeria · Destaques — FGB',
  description: 'Galeria dos Campeoes e Galeria de Fotos da Federacao Gaucha de Basketball.',
}

const photos = [
  { src: '/images/gallery/01.jpg', alt: 'FGB - Basquete Gaucho' },
  { src: '/images/gallery/02.jpg', alt: 'FGB - Basquete Gaucho' },
  { src: '/images/gallery/03.jpg', alt: 'FGB - Basquete Gaucho' },
  { src: '/images/gallery/04.jpg', alt: 'FGB - Basquete Gaucho' },
  { src: '/images/gallery/05.jpg', alt: 'FGB - Basquete Gaucho' },
  { src: '/images/gallery/06.jpg', alt: 'FGB - Basquete Gaucho' },
  { src: '/images/gallery/07.jpg', alt: 'FGB - Basquete Gaucho' },
  { src: '/images/gallery/estadual-masculino.jpg', alt: 'FGB - Estadual Masculino' },
]

export default function GaleriaPage() {
  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Destaques</div>
          <h1 className="fgb-page-header-title">Galeria de Fotos</h1>
          <p className="fgb-page-header-sub mx-auto">
            Momentos marcantes do basquete gaucho — campeonatos, selecoes,
            atletas e tudo que faz parte da historia da FGB.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <section className="mb-14">
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-verde" />
              <h2 className="fgb-section-title">Fotos <span className="verde">Recentes</span></h2>
            </div>
            <a href="https://basquetegaucho.com.br/galeria-de-fotos/" target="_blank" rel="noopener noreferrer" className="fgb-section-link">
              Ver todas →
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {photos.map((photo, i) => (
              <a key={i} href={photo.src} target="_blank" rel="noopener noreferrer" className="group relative aspect-square bg-[var(--gray-l)] rounded overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-[var(--verde-dark)]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="fgb-label text-white">Ver foto</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <div className="fgb-cta">
            <div className="fgb-cta-pattern" />
            <div className="fgb-cta-inner text-center">
              <div className="mb-4 flex justify-center"><Trophy className="w-12 h-12 text-[var(--fgb-yellow-500)]" /></div>
              <div className="fgb-accent fgb-accent-yellow mx-auto mb-4" />
              <h2 className="fgb-cta-h text-[32px]">Galeria dos Campeoes</h2>
              <p className="fgb-cta-sub max-w-md mx-auto mb-6">
                Celebra os titulos e conquistas do basquete gaucho ao longo de decadas. Acesse o site oficial para ver o acervo completo.
              </p>
              <a href="https://basquetegaucho.com.br/galeria-dos-campeoes/" target="_blank" rel="noopener noreferrer" className="fgb-btn-primary">
                Acessar Galeria →
              </a>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
