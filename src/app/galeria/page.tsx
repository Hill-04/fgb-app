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
  { src: 'https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Img-011.jpg', alt: 'FGB - Estadual Feminino' },
  { src: 'https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Img-033.jpg', alt: 'FGB - Cestinhas' },
  { src: 'https://basquetegaucho.com.br/wp-content/uploads/2024/01/brasil-x-eua-04.jpg', alt: 'FGB - Brasil' },
  { src: 'https://basquetegaucho.com.br/wp-content/uploads/2023/09/F631C264-4F9C-4B41-B6CE-6F071B546750_1692313232.jpeg', alt: 'FGB - Arbitragem' },
]

export default function GaleriaPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-8">
          Início · Destaques · Galeria
        </p>

        {/* Header */}
        <div className="mb-14">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00] mb-4">
            Destaques
          </p>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tight mb-6 leading-[0.95]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Galeria de<br />
            <span className="text-[#FF6B00]">Fotos</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-2xl">
            Momentos marcantes do basquete gaúcho — campeonatos, seleções,
            atletas e tudo que faz parte da história da FGB.
          </p>
        </div>

        {/* Galeria de fotos do site oficial */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              Fotos recentes
            </h2>
            <div className="flex-1 h-px bg-white/[0.05]" />
            <a
              href="https://basquetegaucho.com.br/galeria-de-fotos/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] hover:underline flex-shrink-0"
            >
              Ver todas →
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo, i) => (
              <a
                key={i}
                href={photo.src}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square bg-[#141414] border border-white/[0.08] rounded-2xl overflow-hidden hover:border-[#FF6B00]/30 transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-black uppercase tracking-widest">
                    Ver foto
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Galeria dos Campeões */}
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-lg font-black italic uppercase text-white" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              Galeria dos Campeões
            </h2>
            <div className="flex-1 h-px bg-white/[0.05]" />
          </div>
          <div className="bg-[#141414] border border-[#FF6B00]/15 rounded-3xl p-8 text-center">
            <div className="text-5xl mb-5">🏆</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] mb-3">
              Tradição e Glória
            </p>
            <h3 className="text-2xl font-black italic uppercase text-white mb-4" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              Campeões do Basquete Gaúcho
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto mb-6">
              A Galeria dos Campeões celebra os títulos e conquistas do basquete gaúcho
              ao longo de décadas. Acesse o site oficial para ver o acervo completo.
            </p>
            <a
              href="https://basquetegaucho.com.br/galeria-dos-campeoes/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
            >
              Acessar Galeria dos Campeões →
            </a>
          </div>
        </section>

        {/* Instagram */}
        <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] mb-2">
              Redes Sociais
            </p>
            <h2 className="text-xl font-black italic uppercase text-white mb-2" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              Siga o basquete gaúcho
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Acompanhe as redes sociais da FGB para fotos, vídeos e as últimas
              novidades do basquete gaúcho em tempo real.
            </p>
          </div>
          <div className="flex flex-col gap-3 flex-shrink-0">
            <a
              href="https://www.instagram.com/fg_basquete/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-xl transition-all"
            >
              📸 @fg_basquete no Instagram
            </a>
            <a
              href="https://www.facebook.com/fgb.basquetegaucho"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-xl transition-all"
            >
              Facebook · FGB Basquete Gaúcho
            </a>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
