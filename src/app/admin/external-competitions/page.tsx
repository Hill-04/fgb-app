import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import Link from 'next/link'
import { AlertTriangle, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminExternalCompetitionsPage() {
  await ensureDatabaseSchema()

  const competitions = await prisma.externalCompetition.findMany({
    orderBy: { startDate: 'asc' },
    include: {
      blocks: { include: { championship: { select: { id: true, name: true } } } },
      _count: { select: { registrations: true } },
    },
  }).catch(() => [])

  const fmtDate = (d: Date) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="fgb-display text-[28px] text-[var(--black)] flex items-center gap-2">
            <AlertTriangle className="text-[var(--red)]" size={26} />
            Conflitos Externos
          </h1>
          <p className="fgb-label text-[var(--gray)] mt-2 max-w-2xl" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Registro de competições de outras federações/entidades que geram bloqueios de elegibilidade
            nos campeonatos da FGB. Para campeonatos que vão usar a plataforma FGB, crie diretamente
            em <Link href="/admin/championships" className="underline" style={{ color: 'var(--fgb-green-700)' }}>Campeonatos</Link>.
          </p>
        </div>
        <Link
          href="/admin/external-competitions/new"
          className="fgb-btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Conflito
        </Link>
      </div>

      {competitions.length === 0 ? (
        <div className="fgb-card p-10 text-center">
          <AlertTriangle size={32} className="mx-auto mb-3 text-[var(--gray)]" />
          <p className="fgb-label" style={{ color: 'var(--gray)', textTransform: 'none', letterSpacing: 0 }}>
            Nenhuma competição externa cadastrada.
          </p>
        </div>
      ) : (
        <div className="fgb-card overflow-hidden">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-soft)' }}>
              <tr>
                <th className="text-left p-3 fgb-label">Nome</th>
                <th className="text-left p-3 fgb-label">Organizador</th>
                <th className="text-left p-3 fgb-label">Período</th>
                <th className="text-left p-3 fgb-label">Categorias</th>
                <th className="text-center p-3 fgb-label">Inscritas</th>
                <th className="text-left p-3 fgb-label">Bloqueia FGB</th>
                <th className="text-center p-3 fgb-label">Status</th>
                <th className="text-right p-3 fgb-label">Ações</th>
              </tr>
            </thead>
            <tbody>
              {competitions.map((c) => {
                const cats: string[] = (() => {
                  try { return JSON.parse(c.categoriesJson) } catch { return [] }
                })()
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="p-3 font-semibold">{c.name}</td>
                    <td className="p-3 text-[var(--gray)]">{c.organizer}</td>
                    <td className="p-3 text-[var(--gray)] text-xs">
                      {fmtDate(c.startDate)} → {fmtDate(c.endDate)}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {cats.slice(0, 3).map((cat: string) => (
                          <span key={cat} className="fgb-badge fgb-badge-outline text-[10px]">{cat}</span>
                        ))}
                        {cats.length > 3 && (
                          <span className="text-[10px] text-[var(--gray)]">+{cats.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">{c._count.registrations}</td>
                    <td className="p-3 text-xs">
                      {c.blocks.length === 0 ? (
                        <span className="text-[var(--gray)]">—</span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          {c.blocks.slice(0, 2).map((b) => (
                            <span key={b.id} style={{ color: 'var(--red)' }}>{b.championship.name}</span>
                          ))}
                          {c.blocks.length > 2 && (
                            <span className="text-[var(--gray)]">+{c.blocks.length - 2}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {c.isPublished ? (
                        <span className="fgb-badge fgb-badge-verde">Publicada</span>
                      ) : (
                        <span className="fgb-badge fgb-badge-outline">Rascunho</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/external-competitions/${c.id}`}
                        className="text-[var(--verde)] font-semibold text-xs uppercase tracking-wide"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
