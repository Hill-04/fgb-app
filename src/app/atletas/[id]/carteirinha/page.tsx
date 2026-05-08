import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import CarteirinhaCard from '@/components/CarteirinhaCard'
import Link from 'next/link'
import { ArrowLeft, Printer, CheckCircle, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PublicCarteirinhaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const athlete = await prisma.athlete.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      birthDate: true,
      cpf: true,
      registrationNumber: true,
      situation: true,
      photoUrl: true,
      position: true,
      document: true,
      team: { select: { name: true } },
      registrationRequests: {
        where: { status: 'APPROVED' },
        select: { requestedCategoryLabel: true },
        orderBy: { approvedAt: 'desc' },
        take: 1,
      },
      cards: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!athlete) notFound()

  const isActive = athlete.situation === 'ACTIVE'
  const birthFormatted = athlete.birthDate
    ? new Date(athlete.birthDate).toLocaleDateString('pt-BR')
    : '—'
  const cpfMasked = (athlete.cpf || athlete.document || '')
    .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4')
    .slice(0, 14) || '—'

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="no-print border-b border-[#e0e0e0] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#145530]">
              <span className="text-xs font-black text-white">FGB</span>
            </div>
            <span className="text-sm font-bold text-[#145530]">Carteirinha Digital</span>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#145530] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimir
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-xl space-y-6 px-6 py-8">
        {/* Status banner */}
        <div className={`flex items-center gap-3 rounded-2xl p-4 ${isActive ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          {isActive ? (
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
          )}
          <div>
            <p className={`text-sm font-black uppercase ${isActive ? 'text-green-700' : 'text-yellow-700'}`}>
              {isActive ? 'Atleta Ativo — Temporada 2026' : `Situação: ${athlete.situation}`}
            </p>
            <p className="text-xs text-gray-500">Verificado em {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Carteirinha visual */}
        <div className="mx-auto w-full max-w-sm">
          <CarteirinhaCard
            type="athlete"
            name={athlete.name}
            registrationNumber={athlete.registrationNumber}
            photoUrl={athlete.photoUrl}
            teamName={athlete.team?.name}
            categoryName={athlete.registrationRequests[0]?.requestedCategoryLabel || ''}
            situation={athlete.situation}
            season={2026}
            athleteId={athlete.id}
            showQR={true}
          />
        </div>

        {/* Dados do atleta */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Dados Cadastrais</h2>
          <dl className="space-y-2 text-sm">
            {[
              { label: 'Nome completo', value: athlete.name },
              { label: 'CPF', value: cpfMasked },
              { label: 'Data de nascimento', value: birthFormatted },
              { label: 'Clube', value: athlete.team?.name || '—' },
              { label: 'Categoria', value: athlete.registrationRequests[0]?.requestedCategoryLabel || '—' },
              { label: 'Nº de registro', value: athlete.registrationNumber ? `#${athlete.registrationNumber}` : '—' },
              { label: 'Válida até', value: '31/12/2026' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4 border-b border-gray-50 pb-2">
                <dt className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</dt>
                <dd className="font-semibold text-gray-800 text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="no-print text-center text-[10px] text-gray-400">
          Federação Gaúcha de Basquete · fgb-app.vercel.app
        </p>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          header, nav, footer { display: none !important; }
        }
      `}</style>
    </div>
  )
}
