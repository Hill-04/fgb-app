import { prisma } from '@/lib/db'
import { Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChampionshipCard } from '@/components/ChampionshipCard'
import { SimulationModalWrapper } from './SimulationModalWrapper'

export default async function AdminChampionshipsPage() {
  const activeChampionships = await prisma.championship.findMany({
    where: { status: { not: 'ARCHIVED' } },
    orderBy: { createdAt: 'desc' },
    include: {
      categories: { select: { id: true, name: true } },
      _count: {
        select: {
          registrations: { where: { status: 'CONFIRMED' } },
          games: true,
        }
      }
    }
  })

  const archivedChampionships = await prisma.championship.findMany({
    where: { status: 'ARCHIVED' },
    orderBy: { createdAt: 'desc' },
    include: {
      categories: { select: { id: true, name: true } },
      _count: {
        select: {
          registrations: { where: { status: 'CONFIRMED' } },
          games: true,
        }
      }
    }
  })

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto pb-20 px-4 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-tighter leading-none mb-3">
            Campeonatos
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
            Gestão de Competições da Federação
          </p>
        </div>
        <div className="flex gap-3">
          <SimulationModalWrapper />
          <Link href="/admin/championships/new">
            <Button className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-orange-600/20 transition-all hover:scale-105 active:scale-95 text-[10px] uppercase tracking-widest">
              <Plus className="w-5 h-5 mr-2" /> Novo Campeonato
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid Ativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeChampionships.map((c) => (
          <ChampionshipCard
            key={c.id}
            id={c.id}
            name={c.name}
            year={c.year}
            status={c.status}
            categories={c.categories}
            teamCount={c._count.registrations}
            gameCount={c._count.games}
            href={`/admin/championships/${c.id}`}
            buttonLabel="Ver Painel →"
          />
        ))}

        {/* Card Novo Campeonato */}
        <Link
          href="/admin/championships/new"
          className="group block bg-[#141414] border border-dashed border-white/10 hover:border-[#FF6B00]/30 rounded-3xl p-6 transition-all flex flex-col items-center justify-center gap-4 min-h-[220px] hover:bg-[#FF6B00]/[0.02]"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#FF6B00]/10 transition-all">
            <Plus className="w-6 h-6 text-slate-600 group-hover:text-[#FF6B00] transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black italic uppercase text-slate-500 group-hover:text-white transition-colors tracking-tight">
              Novo Campeonato
            </p>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-1">
              Criar e configurar
            </p>
          </div>
        </Link>
      </div>

      {/* Seção de arquivados */}
      {archivedChampionships.length > 0 && (
        <div className="mt-16 pt-16 border-t border-white/5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-6 flex items-center gap-3">
            Arquivados ({archivedChampionships.length})
            <span className="h-px bg-white/5 flex-1" />
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-40 hover:opacity-100 transition-opacity duration-700">
            {archivedChampionships.map((c) => (
              <ChampionshipCard
                key={c.id}
                id={c.id}
                name={c.name}
                year={c.year}
                status={c.status}
                categories={c.categories}
                teamCount={c._count.registrations}
                href={`/admin/championships/${c.id}`}
                buttonLabel="Ver Arquivo →"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
