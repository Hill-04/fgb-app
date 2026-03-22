'use client'

import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { formatChampionshipStatus } from '@/lib/utils'

type Category = { id: string; name: string }

type ChampionshipCardProps = {
  id: string
  name: string
  year: number
  status: string
  categories: Category[]
  teamCount: number
  gameCount?: number
  href: string
  buttonLabel?: string
}

const statusBadge: Record<string, string> = {
  'DRAFT':                'bg-slate-700 text-slate-300',
  'REGISTRATION_OPEN':    'bg-blue-500 text-white',
  'REGISTRATION_CLOSED':  'bg-yellow-500 text-black',
  'ONGOING':              'bg-[#FF6B00] text-white',
  'FINISHED':             'bg-green-500 text-white',
  'ARCHIVED':             'bg-slate-800 text-slate-500',
}

export function ChampionshipCard({
  id, name, year, status, categories,
  teamCount, gameCount, href, buttonLabel = 'Ver Painel →'
}: ChampionshipCardProps) {
  return (
    <Link
      href={href}
      className="group block bg-[#141414] border border-white/[0.08] hover:border-[#FF6B00]/40 rounded-3xl p-6 transition-all duration-200 hover:bg-[#FF6B00]/[0.03] cursor-pointer shadow-xl shadow-black/20"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/15 flex items-center justify-center flex-shrink-0">
          <Trophy className="w-5 h-5 text-[#FF6B00]" />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${statusBadge[status] || statusBadge['DRAFT']}`}>
          {formatChampionshipStatus(status)}
        </span>
      </div>

      {/* Title */}
      <div className="mb-4">
        <h3 className="text-xl font-black italic uppercase text-white group-hover:text-[#FF6B00] transition-colors leading-tight tracking-tight">
          {name}
        </h3>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-1">
          Temporada {year}
        </p>
      </div>

      {/* Category Chips - Grid de 3 colunas */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {categories.slice(0, 5).map((cat) => (
          <div
            key={cat.id}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-2 py-2"
          >
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
              Categoria
            </p>
            <p className="text-[10px] font-black uppercase text-white leading-tight truncate">
              {cat.name}
            </p>
          </div>
        ))}
        {categories.length > 5 && (
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-2 py-2 flex items-center justify-center">
            <p className="text-[10px] font-black text-slate-600">
              +{categories.length - 5}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          {/* Avatar stack simulado */}
          <div className="flex -space-x-2">
            {[...Array(Math.min(3, teamCount))].map((_, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-[#FF6B00]/20 border-2 border-[#141414] flex items-center justify-center"
              >
                <span className="text-[7px] font-black text-[#FF6B00]">T</span>
              </div>
            ))}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {teamCount} {teamCount === 1 ? 'Equipe' : 'Equipes'}
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/[0.04] px-3 py-1.5 rounded-full border border-white/[0.06] group-hover:bg-[#FF6B00]/10 group-hover:text-[#FF6B00] group-hover:border-[#FF6B00]/20 transition-all">
          {buttonLabel}
        </span>
      </div>
    </Link>
  )
}
