import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Categorias e Idades — FGB',
  description: 'Categorias e faixas etárias oficiais do basquete gaúcho conforme regulamentação da Federação Gaúcha de Basketball.',
}

const categorias = [
  {
    nome: 'Sub 10',
    idade: 'Até 10 anos',
    nascimento: '2016 ou posterior',
    genero: 'Misto',
    desc: 'Iniciação ao basquete com regras adaptadas, foco no desenvolvimento motor e na diversão.',
    cor: 'from-violet-500/10 to-violet-500/5',
    border: 'border-violet-500/20',
    badge: 'text-violet-400 bg-violet-500/10',
  },
  {
    nome: 'Sub 12',
    idade: 'Até 12 anos',
    nascimento: '2014 ou posterior',
    genero: 'Misto e Feminino',
    desc: 'Desenvolvimento das habilidades fundamentais do basquete em ambiente competitivo adaptado.',
    cor: 'from-blue-500/10 to-blue-500/5',
    border: 'border-blue-500/20',
    badge: 'text-blue-400 bg-blue-500/10',
  },
  {
    nome: 'Sub 13',
    idade: 'Até 13 anos',
    nascimento: '2013 ou posterior',
    genero: 'Masculino e Feminino',
    desc: 'Competições estaduais com formação individual e coletiva do jovem atleta.',
    cor: 'from-cyan-500/10 to-cyan-500/5',
    border: 'border-cyan-500/20',
    badge: 'text-cyan-400 bg-cyan-500/10',
  },
  {
    nome: 'Sub 14',
    idade: 'Até 14 anos',
    nascimento: '2012 ou posterior',
    genero: 'Masculino e Feminino',
    desc: 'Transição para competições mais estruturadas, com ênfase no desenvolvimento tático.',
    cor: 'from-teal-500/10 to-teal-500/5',
    border: 'border-teal-500/20',
    badge: 'text-teal-400 bg-teal-500/10',
  },
  {
    nome: 'Sub 15',
    idade: 'Até 15 anos',
    nascimento: '2011 ou posterior',
    genero: 'Masculino e Feminino',
    desc: 'Rota de acesso para a Seleção Gaúcha nas principais competições inter-estaduais.',
    cor: 'from-green-500/10 to-green-500/5',
    border: 'border-green-500/20',
    badge: 'text-green-400 bg-green-500/10',
  },
  {
    nome: 'Sub 16',
    idade: 'Até 16 anos',
    nascimento: '2010 ou posterior',
    genero: 'Masculino e Feminino',
    desc: 'Campeonatos estaduais preparatórios para a formação dos atletas de alto nível.',
    cor: 'from-lime-500/10 to-lime-500/5',
    border: 'border-lime-500/20',
    badge: 'text-lime-400 bg-lime-500/10',
  },
  {
    nome: 'Sub 17',
    idade: 'Até 17 anos',
    nascimento: '2009 ou posterior',
    genero: 'Masculino e Feminino',
    desc: 'Uma das principais seleções gaúchas, com participação em torneios nacionais de base.',
    cor: 'from-yellow-500/10 to-yellow-500/5',
    border: 'border-yellow-500/20',
    badge: 'text-yellow-400 bg-yellow-500/10',
  },
  {
    nome: 'Sub 19',
    idade: 'Até 19 anos',
    nascimento: '2007 ou posterior',
    genero: 'Masculino e Feminino',
    desc: 'Última categoria de formação, ponte entre o basquete jovem e o adulto.',
    cor: 'from-orange-500/10 to-orange-500/5',
    border: 'border-orange-500/20',
    badge: 'text-orange-400 bg-orange-500/10',
  },
  {
    nome: 'Adulto',
    idade: '19 anos ou mais',
    nascimento: '2007 ou anterior',
    genero: 'Masculino e Feminino',
    desc: 'Campeonato Estadual adulto — a principal competição do basquete gaúcho.',
    cor: 'from-[#FF6B00]/10 to-[#FF6B00]/5',
    border: 'border-[#FF6B00]/30',
    badge: 'text-[#FF6B00] bg-[#FF6B00]/10',
  },
  {
    nome: 'Master',
    idade: '35 anos ou mais',
    nascimento: '1991 ou anterior',
    genero: 'Misto',
    desc: 'Categoria para atletas veteranos que mantêm a paixão pelo basquete em alta.',
    cor: 'from-pink-500/10 to-pink-500/5',
    border: 'border-pink-500/20',
    badge: 'text-pink-400 bg-pink-500/10',
  },
]

export default function CategoriasPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-8">
          Início · FGB · Categorias e Idades
        </p>

        {/* Header */}
        <div className="mb-14">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00] mb-4">
            Regulamentação oficial
          </p>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tight mb-6 leading-[0.95]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Categorias<br />
            <span className="text-[#FF6B00]">e Idades</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-3xl">
            Conheça as categorias oficiais do basquete gaúcho regulamentadas pela FGB.
            Cada categoria tem seus critérios de elegibilidade e regras específicas de competição.
          </p>
        </div>

        {/* Grid de Categorias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          {categorias.map((cat, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${cat.cor} border ${cat.border} rounded-3xl p-6 hover:scale-[1.01] transition-all`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-black italic uppercase text-white tracking-tight" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                    {cat.nome}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">{cat.genero}</p>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${cat.badge}`}>
                  {cat.idade}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{cat.desc}</p>
              <div className="pt-3 border-t border-white/[0.06]">
                <span className="text-[10px] text-slate-600 uppercase tracking-widest">
                  Nascimento: {cat.nascimento}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Nota */}
        <div className="bg-[#141414] border border-[#FF6B00]/20 rounded-3xl p-6">
          <div className="flex gap-4">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              <h3 className="text-sm font-black uppercase text-white mb-2" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                Observações Importantes
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-400 leading-relaxed">
                <li>• A idade é verificada conforme o ano de nascimento do atleta, tomando como base o ano de realização do campeonato.</li>
                <li>• Atletas podem competir em categorias acima da sua faixa etária, mas nunca abaixo.</li>
                <li>• Categorias Sub 12 e Sub 10 seguem regras adaptadas conforme orientação da CBB (Confederação Brasileira de Basketball).</li>
                <li>• Para informações sobre regulamentação específica, entre em contato com a secretaria da FGB.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
