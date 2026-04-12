import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { ChampionshipTabs } from './ChampionshipTabs'

export default async function ChampionshipLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const championship = await prisma.championship.findUnique({
    where: { id },
    select: { id: true, name: true, status: true }
  }).catch(() => null)

  if (!championship) notFound()

  return (
    <div>
      <div style={{
        background: '#fff',
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px 0'
      }}>
        <Link
          href="/admin/championships"
          className="fgb-label"
          style={{ color: 'var(--gray)', marginBottom: 4, display: 'inline-flex' }}
        >
          Campeonato
        </Link>
        <h1 className="fgb-heading" style={{ fontSize: 20, marginBottom: 12 }}>
          {championship.name}
        </h1>

        <StatusPipeline status={championship.status} />

        <div style={{ display: 'flex', gap: 0, marginTop: 12, overflowX: 'auto' }}>
          <ChampionshipTabs id={championship.id} status={championship.status} />
        </div>
      </div>

      <div>{children}</div>
    </div>
  )
}

function StatusPipeline({ status }: { status: string }) {
  const stages = [
    { key: 'DRAFT',               label: 'Rascunho' },
    { key: 'REGISTRATION_OPEN',   label: 'Inscricoes' },
    { key: 'REGISTRATION_CLOSED', label: 'Encerrado' },
    { key: 'ORGANIZING',          label: 'Organizando' },
    { key: 'ACTIVE',              label: 'Em andamento' },
    { key: 'FINISHED',            label: 'Encerrado' },
  ]
  const currentIdx = stages.findIndex(s => s.key === status)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {stages.map((stage, i) => {
        const isDone = i < currentIdx
        const isCurrent = i === currentIdx
        return (
          <div key={stage.key} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px',
              background: isCurrent ? 'var(--verde)' : isDone ? 'var(--verde-light)' : 'var(--gray-l)',
              borderRadius: 4
            }}>
              {isCurrent && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#fff',
                  animation: 'fgb-dot-pulse 2s ease-in-out infinite'
                }} />
              )}
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 9, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: isCurrent ? '#fff' : isDone ? 'var(--verde)' : 'var(--gray)'
              }}>
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div style={{
                width: 16, height: 1,
                background: isDone ? 'var(--verde)' : 'var(--border)'
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

