import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Galeria · Destaques — FGB',
  description: 'Galeria dos Campeões e Galeria de Fotos da Federação Gaúcha de Basketball.',
}

const photos = [
  { src: 'https://basquetegaucho.com.br/wp-content/uploads/2024/04/436798402_17959816394740627_7133097296869973522_n.jpg', alt: 'FGB - Basquete Gaúcho' },
  { src: 'https://basquetegaucho.com.br/wp-content/uploads/2024/04/436953622_17959816355740627_4207539994510205825_n.jpg', alt: 'FGB - Basquete Gaúcho' },
  { src: 'https://basquetegaucho.com.br/wp-content/uploads/2024/04/436783444_17959816358740627_458700201676952614_n.jpg', alt: 'FGB - Basquete Gaúcho' },
  { src: 'https://basquetegaucho.com.br/wp-content/uploads/2024/04/436770135_17959816367740627_7240870606236286883_n.jpg', alt: 'FGB - Basquete Gaúcho' },
  { src: 'https://basquetegaucho.com.br/wp-content/uploads/2024/04/436799064_17959816340740627_3850140963121385520_n.jpg', alt: 'FGB - Basquete Gaúcho' },
  { src: 'https://basquetegaucho.com.br/wp-content/uploads/2024/04/436783538_17959816376740627_400857416916956698_n.jpg', alt: 'FGB - Basquete Gaúcho' },
  { src: 'https://basquetegaucho.com.br/wp-content/uploads/2024/04/436916325_17959816385740627_2253289532628306366_n.jpg', alt: 'FGB - Basquete Gaúcho' },
  { src: 'https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Img-022.jpg', alt: 'FGB - Estadual Masculino' },
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
            Momentos marcantes do basquete gaúcho — campeonatos, seleções,
            atletas e tudo que faz parte da história da FGB.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        {/* Fotos recentes */}
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

        {/* Galeria dos Campeões */}
        <section className="mb-14">
          <div className="fgb-cta">
            <div className="fgb-cta-pattern" />
            <div className="fgb-cta-inner text-center">
              <div className="text-5xl mb-4">🏆</div>
              <div className="fgb-accent fgb-accent-yellow mx-auto mb-4" />
              <h2 className="fgb-cta-h text-[32px]">Galeria dos Campeões</h2>
              <p className="fgb-cta-sub max-w-md mx-auto mb-6">
                Celebra os títulos e conquistas do basquete gaúcho ao longo de décadas. Acesse o site oficial para ver o acervo completo.
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
