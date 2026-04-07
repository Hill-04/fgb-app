import type { Metadata } from 'next'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Categorias e Idades — FGB',
  description: 'Categorias e faixas etárias oficiais do basquete gaúcho conforme regulamentação da Federação Gaúcha de Basketball.',
}

const categorias = [
  { nome: 'Sub 10', idade: 'Até 10 anos', nascimento: '2016 ou posterior', genero: 'Misto', desc: 'Iniciação com regras adaptadas.', cor: 'admin-card-verde' },
  { nome: 'Sub 12', idade: 'Até 12 anos', nascimento: '2014 ou posterior', genero: 'Misto e Feminino', desc: 'Desenvolvimento das habilidades fundamentais.', cor: 'admin-card-verde' },
  { nome: 'Sub 13', idade: 'Até 13 anos', nascimento: '2013 ou posterior', genero: 'Masculino e Feminino', desc: 'Competições estaduais formativas.', cor: 'admin-card-yellow' },
  { nome: 'Sub 14', idade: 'Até 14 anos', nascimento: '2012 ou posterior', genero: 'Masculino e Feminino', desc: 'Transição para competições mais estruturadas.', cor: 'admin-card-yellow' },
  { nome: 'Sub 15', idade: 'Até 15 anos', nascimento: '2011 ou posterior', genero: 'Masculino e Feminino', desc: 'Rota de acesso para Seleções de base.', cor: 'admin-card-orange' },
  { nome: 'Sub 16', idade: 'Até 16 anos', nascimento: '2010 ou posterior', genero: 'Masculino e Feminino', desc: 'Preparatório para o alto nível.', cor: 'admin-card-orange' },
  { nome: 'Sub 17', idade: 'Até 17 anos', nascimento: '2009 ou posterior', genero: 'Masculino e Feminino', desc: 'Seleções gaúchas de nível nacional.', cor: 'admin-card-red' },
  { nome: 'Sub 19', idade: 'Até 19 anos', nascimento: '2007 ou posterior', genero: 'Masculino e Feminino', desc: 'Ponte entre o jovem e adulto.', cor: 'admin-card-red' },
  { nome: 'Adulto', idade: '19 anos ou mais', nascimento: '2007 ou anterior', genero: 'Masculino e Feminino', desc: 'A principal competição do basquete gaúcho.', cor: 'admin-card-red' },
  { nome: 'Master', idade: '35 anos ou mais', nascimento: '1991 ou anterior', genero: 'Misto', desc: 'Para atletas veteranos.', cor: 'admin-card-verde' },
]

export default function CategoriasPage() {
  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Regulamentação Oficial</div>
          <h1 className="fgb-page-header-title">Categorias e Idades</h1>
          <p className="fgb-page-header-sub mx-auto">
            Conheça as categorias oficiais do basquete gaúcho regulamentadas pela FGB.
            Cada categoria tem seus critérios de elegibilidade e regras específicas de competição.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          {categorias.map((cat, i) => (
            <div key={i} className={`fgb-card p-6 ${cat.cor}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="fgb-display text-[20px] text-[var(--black)]">{cat.nome}</h2>
                  <p className="fgb-label text-[var(--gray)]">{cat.genero}</p>
                </div>
                <span className="fgb-badge fgb-badge-outline">{cat.idade}</span>
              </div>
              <p className="fgb-label text-[var(--gray)] mb-4" style={{ textTransform: 'none', letterSpacing: 0 }}>{cat.desc}</p>
              <div className="pt-3" style={{ borderTop: '0.5px solid var(--border)' }}>
                <span className="fgb-label text-[var(--black)]">Nascimento: <span style={{ color: 'var(--verde)' }}>{cat.nascimento}</span></span>
              </div>
            </div>
          ))}
        </div>

        <div className="fgb-section-yellow p-6 rounded border border-[var(--border)] flex gap-4">
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <div>
            <h3 className="fgb-display text-[14px] text-[var(--black)] mb-2">Observações Importantes</h3>
            <ul className="space-y-2 fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
              <li>• A idade é verificada conforme o ano de nascimento do atleta, tomando como base o ano de realização do campeonato.</li>
              <li>• Atletas podem competir em categorias acima da sua faixa etária, mas nunca abaixo.</li>
              <li>• Categorias Sub 12 e Sub 10 seguem regras adaptadas conforme orientação da CBB.</li>
            </ul>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
