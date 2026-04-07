import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Notas Oficiais — FGB',
  description: 'Notas e comunicados oficiais da Federação Gaúcha de Basketball.',
}

const notasOficiais = [
  {
    numero: '063/2025',
    titulo: 'Tabela Campeonato Estadual Sub 12 Misto – 2ª Fase',
    data: '2025',
    tipo: 'Tabela de Jogos',
    categoria: 'sub-12',
    resumo: 'Divulga a tabela oficial da 2ª fase do Campeonato Estadual Sub 12 Misto com datas, horários e locais dos jogos.',
  },
  {
    numero: '062/2025',
    titulo: 'Convocação Seleção Gaúcha Sub 13 Masculina',
    data: '2025',
    tipo: 'Convocação',
    categoria: 'selecao',
    resumo: 'Convocação oficial dos atletas para representar o Rio Grande do Sul na competição nacional Sub 13 Masculino.',
  },
  {
    numero: '061/2025',
    titulo: 'Classificação Final – Estadual de Base 2025',
    data: '2025',
    tipo: 'Classificação',
    categoria: 'base',
    resumo: 'Classificação final das categorias Sub 12, Sub 13, Sub 15 e Sub 17 Feminino do Campeonato Estadual de Base 2025.',
  },
  {
    numero: '060/2025',
    titulo: 'Boletim Sul Brasileiro de Clubes 2025 Sub 19 Masculino',
    data: 'Agosto 2025',
    tipo: 'Boletim',
    categoria: 'selecao',
    resumo: 'Boletim oficial do Sul Brasileiro de Clubes Sub 19 Masculino realizado em Caxias do Sul de 22 a 24 de agosto de 2025.',
  },
]

function getTipoCor(tipo: string) {
  const map: Record<string, string> = {
    'Tabela de Jogos': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'Convocação': 'text-green-400 bg-green-500/10 border-green-500/20',
    'Classificação': 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/20',
    'Boletim': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    'Pesar': 'text-slate-400 bg-white/[0.05] border-white/[0.1]',
  }
  return map[tipo] ?? 'text-slate-400 bg-white/[0.05] border-white/[0.1]'
}

export default function NotasPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-8">
          Início · FGB · Notas Oficiais
        </p>

        {/* Header */}
        <div className="mb-14">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00] mb-4">
            Comunicados
          </p>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tight mb-6 leading-[0.95]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Notas<br />
            <span className="text-[#FF6B00]">Oficiais</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-2xl">
            Comunicados, resoluções, tabelas e convocações oficiais emitidos pela
            Federação Gaúcha de Basketball.
          </p>
        </div>

        {/* Notas */}
        <div className="space-y-4 mb-12">
          {notasOficiais.map((nota, i) => (
            <div
              key={i}
              className="bg-[#141414] border border-white/[0.08] hover:border-white/[0.15] rounded-3xl p-6 transition-all group"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
                    Nota nº {nota.numero}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${getTipoCor(nota.tipo)}`}>
                    {nota.tipo}
                  </span>
                </div>
                <span className="text-[10px] text-slate-600 flex-shrink-0">{nota.data}</span>
              </div>
              <h3 className="text-base font-black italic uppercase text-white group-hover:text-[#FF6B00] transition-colors mb-3" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                {nota.titulo}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">{nota.resumo}</p>
            </div>
          ))}
        </div>

        {/* Mais Informações */}
        <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">
            Arquivo Completo
          </p>
          <h2 className="text-xl font-black italic uppercase text-white mb-3" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Mais notas e comunicados
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6 max-w-md mx-auto">
            Para acessar o arquivo completo de notas oficiais, convocações e regulamentos,
            visite o site oficial da FGB ou entre em contato com a secretaria.
          </p>
          <a
            href="https://basquetegaucho.com.br/notas-oficiais/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
          >
            Ver no site oficial →
          </a>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
