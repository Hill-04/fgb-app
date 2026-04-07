import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Campeonatos — FGB',
  description: 'Lista oficial de campeonatos da Federação Gaúcha de Basketball. Estaduais, categorias e tabelas de classificação.',
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'Rascunho',
    REGISTRATION_OPEN: 'Inscrições Abertas',
    ONGOING: 'Em Andamento',
    FINISHED: 'Finalizado',
    CANCELLED: 'Cancelado',
  }
  return map[status] ?? status
}

function getStatusStyle(status: string) {
  if (status === 'ONGOING') return 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/20'
  if (status === 'REGISTRATION_OPEN') return 'text-green-400 bg-green-500/10 border-green-500/20'
  if (status === 'FINISHED') return 'text-slate-400 bg-white/[0.05] border-white/[0.08]'
  return 'text-slate-500 bg-white/[0.03] border-white/[0.05]'
}

function getSexIcon(sex: string) {
  if (sex === 'feminino') return '♀️'
  if (sex === 'masculino') return '♂️'
  return '⚥'
}

export default async function CampeonatosPage() {
  const allChampionships = await prisma.championship.findMany({
    where: {
      status: { not: 'DRAFT' },
      isSimulation: false,
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      categories: { select: { id: true, name: true } },
      _count: {
        select: {
          registrations: true,
          games: true,
        },
      },
    },
  }).catch(() => [])

  const ongoing = allChampionships.filter((c) => c.status === 'ONGOING')
  const open = allChampionships.filter((c) => c.status === 'REGISTRATION_OPEN')
  const finished = allChampionships.filter((c) => c.status === 'FINISHED')

  function ChampionshipCard({ c }: { c: typeof allChampionships[0] }) {
    return (
      <Link
        href={`/campeonatos/${c.id}`}
        className="group bg-[#141414] border border-white/[0.08] hover:border-[#FF6B00]/30 rounded-3xl p-6 transition-all hover:shadow-[0_8px_40px_rgba(255,107,0,0.06)] block"
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getSexIcon(c.sex)}</span>
            <span className="text-2xl">🏀</span>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${getStatusStyle(c.status)}`}>
            {getStatusLabel(c.status)}
          </span>
        </div>
        <h3 className="text-base font-black italic uppercase text-white group-hover:text-[#FF6B00] transition-colors leading-tight mb-2" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
          {c.name}
        </h3>
        <p className="text-[11px] text-slate-500 mb-5">
          {c.categories.length > 0
            ? c.categories.map((cat) => cat.name).join(' · ')
            : 'Categorias a definir'}
        </p>
        {c.description && (
          <p className="text-[11px] text-slate-600 leading-relaxed mb-4 line-clamp-2">
            {c.description}
          </p>
        )}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 text-[10px] text-slate-500 uppercase tracking-wider">
            <span>{c._count.registrations} equipes</span>
            <span>·</span>
            <span>{c._count.games} jogos</span>
          </div>
          <span className="text-[10px] font-black text-[#FF6B00] uppercase tracking-widest">
            Ver →
          </span>
        </div>
      </Link>
    )
  }

  function Section({ title, label, items, emptyMsg }: {
    title: string
    label: string
    items: typeof allChampionships
    emptyMsg: string
  }) {
    return (
      <section className="py-10">
        <div className="flex items-center gap-4 mb-7">
          <div>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${label}`}>
              {title}
            </span>
          </div>
          <div className="flex-1 h-px bg-white/[0.05]" />
        </div>
        {items.length === 0 ? (
          <div className="bg-[#141414] border border-white/[0.06] rounded-3xl p-10 text-center text-slate-600 text-xs uppercase tracking-widest">
            {emptyMsg}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((c) => (
              <ChampionshipCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-14">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF6B00] mb-4">
            FGB · Temporada 2026
          </p>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tight mb-6 leading-[0.95]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            Campeonatos<br />
            <span className="text-[#FF6B00]">FGB</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-2xl">
            Todos os campeonatos oficiais organizados pela Federação Gaúcha de Basketball.
            Acompanhe classificações, jogos e resultados em tempo real.
          </p>
        </div>

        {/* Em andamento */}
        <Section
          title="Em Andamento"
          label="text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/20"
          items={ongoing}
          emptyMsg="Nenhum campeonato em andamento no momento."
        />

        {/* Inscrições abertas */}
        <Section
          title="Inscrições Abertas"
          label="text-green-400 bg-green-500/10 border-green-500/20"
          items={open}
          emptyMsg="Nenhum campeonato com inscrições abertas no momento."
        />

        {/* Finalizados */}
        <Section
          title="Finalizados"
          label="text-slate-400 bg-white/[0.05] border-white/[0.08]"
          items={finished}
          emptyMsg="Nenhum campeonato finalizado."
        />

        {/* Área restrita */}
        <div className="mt-12 bg-[#141414] border border-white/[0.08] rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-black italic uppercase text-white mb-2" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              Inscreva sua equipe
            </h2>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Para inscrever sua equipe em campeonatos, faça login ou cadastre-se
              na plataforma FGB. O processo é 100% digital.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link
              href="/login"
              className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-xl transition-all"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-xl transition-all"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
