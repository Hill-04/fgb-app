'use client'

import { useRouter } from 'next/navigation'

export function StandingsSelector({
  allTeamCategories,
  categoryId,
}: {
  allTeamCategories: { id: string; name: string }[]
  categoryId?: string
}) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 max-w-xs relative">
        <select
          className="w-full bg-white border-[var(--border)] border h-11 rounded-xl px-4 text-xs text-[var(--black)] focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold appearance-none shadow-sm"
          defaultValue={categoryId ?? ''}
          onChange={(e) => {
            const val = e.target.value
            router.push(val ? `/team/standings?categoryId=${val}` : '/team/standings')
          }}
        >
          <option value="" className="bg-white">Todas as Categorias</option>
          {allTeamCategories.map((cat) => (
            <option key={cat.id} value={cat.id} className="bg-white">{cat.name}</option>
          ))}
        </select>
      </div>
      {categoryId && (
        <a href="/team/standings" className="text-[10px] font-black text-[var(--gray)] uppercase tracking-widest hover:text-[var(--black)] transition-colors">
          Limpar Filtro
        </a>
      )}
    </div>
  )
}
