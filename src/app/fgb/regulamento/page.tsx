import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Regulamento Desportivo — FGB',
  description: 'Regulamento desportivo oficial, normas do estadual, regimento de taxas e documentos da Federação Gaúcha de Basketball.',
}

const documentos = [
  {
    icon: '📋',
    titulo: 'Regulamento Desportivo',
    desc: 'Regras gerais que norteiam todos os campeonatos e competições organizados pela FGB.',
    categoria: 'Oficial',
    cor: 'border-[#FF6B00]/20',
    badgeColor: 'text-[#FF6B00] bg-[#FF6B00]/10',
  },
  {
    icon: '📐',
    titulo: 'Normas do Estadual',
    desc: 'Normas específicas para o campeonato estadual, incluindo formato, desempate e playoff.',
    categoria: 'Estadual',
    cor: 'border-blue-500/20',
    badgeColor: 'text-blue-400 bg-blue-500/10',
  },
  {
    icon: '💰',
    titulo: 'Regimento de Taxas',
    desc: 'Valores de inscrição, taxas de filiação, arbitragem e demais custos operacionais.',
    categoria: 'Secretaria',
    cor: 'border-green-500/20',
    badgeColor: 'text-green-400 bg-green-500/10',
  },
  {
    icon: '📝',
    titulo: 'Atas de Reunião',
    desc: 'Atas das assembleias e reuniões da diretoria da Federação Gaúcha de Basketball.',
    categoria: 'Secretaria',
    cor: 'border-purple-500/20',
    badgeColor: 'text-purple-400 bg-purple-500/10',
  },
  {
    icon: '⚖️',
    titulo: 'Código de Ética',
    desc: 'Regras de conduta e ética desportiva aplicáveis a atletas, técnicos e dirigentes.',
    categoria: 'Oficial',
    cor: 'border-amber-500/20',
    badgeColor: 'text-amber-400 bg-amber-500/10',
  },
  {
    icon: '🏀',
    titulo: 'Regras Oficiais do Basquete',
    desc: 'Regras oficiais FIBA/CBB traduzidas e adaptadas para o contexto do basquete gaúcho.',
    categoria: 'FIBA/CBB',
    cor: 'border-cyan-500/20',
    badgeColor: 'text-cyan-400 bg-cyan-500/10',
  },
]

export default function RegulamentoPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-8">
          Início · FGB · Regulamento
        </p>

        {/* Header */}
        <div className="mb-14">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00] mb-4">
            Documentos oficiais
          </p>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tight mb-6 leading-[0.95]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Regulamento<br />
            <span className="text-[#FF6B00]">Desportivo</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-3xl">
            Acesse os documentos oficiais da Federação Gaúcha de Basketball.
            Para obter as versões atualizadas dos regulamentos, entre em contato
            com a secretaria da FGB.
          </p>
        </div>

        {/* Documentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          {documentos.map((doc, i) => (
            <div
              key={i}
              className={`bg-[#141414] border ${doc.cor} rounded-3xl p-6 hover:border-white/[0.15] transition-all group`}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{doc.icon}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${doc.badgeColor}`}>
                  {doc.categoria}
                </span>
              </div>
              <h3 className="text-base font-black italic uppercase text-white mb-3 group-hover:text-[#FF6B00] transition-colors" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                {doc.titulo}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{doc.desc}</p>
              <div className="pt-4 border-t border-white/[0.06]">
                <a
                  href={`mailto:fgb@basquetegaucho.com.br?subject=Solicito ${doc.titulo}`}
                  className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] hover:underline"
                >
                  Solicitar documento →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Contato */}
        <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-black italic uppercase text-white mb-2" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                Precisa de um documento?
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                Solicite os documentos diretamente com a secretaria da FGB pelo e-mail
                ou telefone. Nosso horário de atendimento é de segunda a sexta,
                das 8h às 12h e das 13h às 17h.
              </p>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0">
              <a
                href="mailto:fgb@basquetegaucho.com.br"
                className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-xl transition-all"
              >
                ✉️ fgb@basquetegaucho.com.br
              </a>
              <a
                href="tel:+555432233858"
                className="inline-flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-xl transition-all"
              >
                📞 (54) 3223-3858
              </a>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
