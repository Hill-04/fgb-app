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
          className="w-full bg-white/[0.03] border-white/10 border h-11 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-[#FF6B00]/50 transition-all font-bold appearance-none"
          defaultValue={categoryId ?? ''}
          onChange={(e) => {
            const val = e.target.value
            router.push(val ? `/team/standings?categoryId=${val}` : '/team/standings')
          }}
        >
          <option value="" className="bg-[#0A0A0A]">Todas as Categorias</option>
          {allTeamCategories.map((cat) => (
            <option key={cat.id} value={cat.id} className="bg-[#0A0A0A]">{cat.name}</option>
          ))}
        </select>
      </div>
      {categoryId && (
        <a href="/team/standings" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
          Limpar Filtro
        </a>
      )}
    </div>
  )
}
