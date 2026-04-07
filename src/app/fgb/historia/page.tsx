import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'História da Federação — FGB',
  description: 'Conheça a história da Federação Gaúcha de Basketball, fundada em 18 de abril de 1952 em Porto Alegre, Rio Grande do Sul.',
}

const clubesFundadores = [
  'Grêmio Foot-Ball Porto Alegrense',
  'Sport Club Internacional',
  'SOGIPA',
  'Juventude',
  'Americano F.C.',
  'Caxias do Sul',
  'Pelotas',
  'Santa Maria',
  'Rio Grande',
  'Passo Fundo',
  'Novo Hamburgo',
  'São Leopoldo',
  'Canoas',
  'Cachoeira do Sul',
  'Bagé',
  'Uruguaiana',
  'Santa Cruz do Sul',
  'Lajeado',
  'Cruz Alta',
  'Erechim',
  'Bento Gonçalves',
  'Caxias',
]

export default function HistoriaPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-8">
          Início · FGB · História
        </p>

        {/* Header */}
        <div className="mb-14">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00] mb-4">
            FGB · Desde 1952
          </p>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tight mb-6 leading-[0.95]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            História da<br />
            <span className="text-[#FF6B00]">Federação</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-3xl">
            A Federação Gaúcha de Basketball foi fundada em{' '}
            <strong className="text-white">18 de abril de 1952</strong>, em Porto Alegre,
            pelo 1º Presidente Sr. <strong className="text-white">José Carlos Daut</strong>,
            com apoio de 22 clubes fundadores que acreditaram na força do basquete gaúcho.
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-5 mb-16">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6">
            Marco Histórico
          </h2>

          {[
            {
              year: '1934–1935',
              icon: '🏆',
              title: 'Bi-campeões Nacionais',
              desc: 'O Rio Grande do Sul conquistou o título brasileiro de basquete por dois anos consecutivos, em 1934 e 1935, estabelecendo o estado como uma potência nacional da modalidade.',
              highlight: true,
            },
            {
              year: '1952',
              icon: '🏛️',
              title: 'Fundação da FGB',
              desc: 'Em 18 de abril de 1952, em Porto Alegre, é fundada a Federação Gaúcha de Basketball. O primeiro presidente José Carlos Daut liderou a reunião com representantes de 22 clubes do estado.',
              highlight: false,
            },
            {
              year: '1960–1980',
              icon: '📈',
              title: 'Expansão do Basquete Gaúcho',
              desc: 'Décadas de crescimento, com o surgimento de novos clubes em todo o Rio Grande do Sul e consolidação dos campeonatos estaduais nas diversas categorias.',
              highlight: false,
            },
            {
              year: '2000+',
              icon: '🚀',
              title: 'Era Moderna',
              desc: 'Com a modernização da gestão e a adoção de novas tecnologias, a FGB amplia seu alcance, profissionaliza os campeonatos e aproxima o basquete gaúcho das comunidades.',
              highlight: false,
            },
            {
              year: '2026',
              icon: '💻',
              title: 'Plataforma Digital FGB',
              desc: 'Lançamento do sistema digital oficial de gestão de campeonatos, trazendo inscrições online, agendamento inteligente e transparência total para o basquete gaúcho.',
              highlight: false,
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`relative bg-[#141414] border rounded-3xl p-6 transition-all ${
                item.highlight
                  ? 'border-[#FF6B00]/30 shadow-[0_0_30px_rgba(255,107,0,0.05)]'
                  : 'border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              {item.highlight && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent rounded-t-3xl" />
              )}
              <div className="flex items-start gap-5">
                <span className="text-3xl flex-shrink-0">{item.icon}</span>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] bg-[#FF6B00]/10 px-2.5 py-1 rounded-full">
                      {item.year}
                    </span>
                    {item.highlight && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                        Destaque
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black italic uppercase text-white mb-2" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Clubes Fundadores */}
        <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-8 mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6B00] mb-2">
            18 de abril de 1952
          </p>
          <h2 className="text-2xl font-black italic uppercase text-white mb-6" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            22 Clubes Fundadores
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {clubesFundadores.map((clube, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-slate-400 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
                <span className="w-5 h-5 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] text-[9px] font-black flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                {clube}
              </div>
            ))}
          </div>
        </div>

        {/* Info FGB */}
        <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-8">
          <h2 className="text-xl font-black italic uppercase text-white mb-6" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Sobre a Federação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400 leading-relaxed">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="text-[#FF6B00] flex-shrink-0">📍</span>
                <span>Rua Marechal Floriano, 388 - Centro, Caxias do Sul - RS</span>
              </div>
              <div className="flex gap-3">
                <span className="text-[#FF6B00] flex-shrink-0">📞</span>
                <span>(54) 3223-3858</span>
              </div>
              <div className="flex gap-3">
                <span className="text-[#FF6B00] flex-shrink-0">⏰</span>
                <span>8h às 12h - 13h às 17h</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="text-[#FF6B00] flex-shrink-0">✉️</span>
                <span>fgb@basquetegaucho.com.br</span>
              </div>
              <div className="flex gap-3">
                <span className="text-[#FF6B00] flex-shrink-0">🌐</span>
                <a href="https://basquetegaucho.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  basquetegaucho.com.br
                </a>
              </div>
              <div className="flex gap-3">
                <span className="text-[#FF6B00] flex-shrink-0">📅</span>
                <span>Fundada em 18 de abril de 1952</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
