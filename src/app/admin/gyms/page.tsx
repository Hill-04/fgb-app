import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function GymsPage() {
  const gyms = await prisma.gym.findMany({
    orderBy: { name: 'asc' },
    include: { team: { select: { id: true, name: true } } },
  }).catch(() => [])

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)]">Cadastros</p>
          <h1 className="fgb-display mt-1 text-3xl text-[var(--black)]">Ginásios</h1>
          <p className="mt-1 text-sm text-[var(--gray)]">{gyms.length} ginásio{gyms.length !== 1 ? 's' : ''} cadastrado{gyms.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/gyms/new"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--verde)] px-5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[var(--verde)]/90">
          <Plus className="h-4 w-4" /> Novo ginásio
        </Link>
      </div>

      <div className="rounded-[24px] border border-[var(--border)] bg-white shadow-sm overflow-hidden">
        {gyms.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--gray)]">Nenhum ginásio cadastrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--gray-l)]">
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Nome</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Cidade</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Quadras</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Clube</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Ativo</th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {gyms.map(g => (
                <tr key={g.id} className="hover:bg-[var(--gray-l)]/50">
                  <td className="px-4 py-3 font-bold text-[var(--black)]">{g.name}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-[var(--gray)]">{g.city} — {g.state}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-[var(--gray)]">{g.courts}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-[var(--gray)]">{g.team?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                      g.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {g.isActive ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/gyms/${g.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] hover:border-[var(--verde)] hover:text-[var(--verde)] transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
