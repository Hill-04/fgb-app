import { prisma } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { Section } from '@/components/Section'
import { Badge } from '@/components/Badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, AlertTriangle, CheckCircle2, Ghost, ArrowRight, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { ManualRegistrationModal } from '../ManualRegistrationModal'
import { RegistrationActions } from '../RegistrationActions'
import { formatChampionshipStatus } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type ManagePageProps = {
  params: Promise<{ id: string }>
}

export default async function ChampionshipManagePage({ params }: ManagePageProps) {
  const { id } = await params

  const championship = await prisma.championship.findUnique({
    where: { id },
    include: {
      categories: {
        include: {
          _count: { select: { registrations: true } }
        }
      },
      registrations: {
        include: {
          team: true,
          categories: {
            include: { category: true }
          }
        },
        orderBy: { registeredAt: 'desc' }
      }
    }
  })

  if (!championship) notFound()

  const minTeams = championship.minTeamsPerCat

  return (
    <div className="space-y-10">
      <div className="animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
            <Link href="/admin/championships" className="hover:text-white transition-colors">Campeonatos</Link>
            <ArrowRight className="w-3 h-3" />
            <span className="text-[#FF6B00]">Gerenciamento Geral</span>
          </div>
          <h1 className="text-4xl font-display font-black text-white tracking-tight">
            {championship.name}
          </h1>
          <p className="text-slate-400 font-medium mt-1">Configure categorias, valide inscricoes e organize o calendario.</p>
        </div>

        <div className="flex gap-3">
          <Link href="/admin/championships">
            <Button variant="ghost" className="h-12 px-6 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 uppercase tracking-widest text-[10px]">
              <Settings2 className="w-4 h-4 mr-2" />
              Editar Regras
            </Button>
          </Link>
          <ManualRegistrationModal championshipId={championship.id} categories={championship.categories} />
          <Badge variant="blue" className="px-6 h-12 flex items-center border-blue-500/20 text-[10px] uppercase font-black tracking-widest bg-blue-500/5">
            Status: {formatChampionshipStatus(championship.status)}
          </Badge>
        </div>
      </div>

      <Section title="Viabilidade de Categorias" subtitle={`Minimo exigido: ${minTeams} equipes por categoria`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {championship.categories.map((cat: any) => {
            const teamCount = cat._count.registrations
            const isViable = teamCount >= minTeams

            return (
              <Card key={cat.id} className={`bg-[#111] border-white/5 rounded-3xl group overflow-hidden transition-all ${isViable ? 'hover:border-green-500/30' : 'hover:border-red-500/30'}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="default" className="bg-white/5 border-white/10 text-[9px] font-black uppercase">{cat.name}</Badge>
                    {isViable ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-2">
                    <div className="text-3xl font-display font-black text-white">{teamCount}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Equipes Inscritas</div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isViable ? 'text-green-500' : 'text-red-500'}`}>
                      {isViable ? 'VIAVEL' : 'INVIAVEL'}
                    </span>
                    {!isViable && (
                      <span className="text-[9px] font-medium text-slate-600">Falta {minTeams - teamCount}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
          <Section title="Inscricoes e Categorias Selecionadas" subtitle="Visao detalhada de cada equipe na competicao">
            <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden mt-6">
              <div className="fgb-table-wrap">
                <table className="fgb-table w-full text-left">
                  <thead className="bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Equipe</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cidade</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Categorias</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Inscricao</th>
                      <th className="px-6 py-4 text-right pr-12 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {championship.registrations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <Ghost className="w-12 h-12 text-white/5 mx-auto mb-4" />
                          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Nenhuma inscricao realizada ate o momento.</p>
                        </td>
                      </tr>
                    ) : (
                      championship.registrations.map((reg: any) => (
                        <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-display font-black text-[#FF6B00]">
                                {reg.team.name.charAt(0)}
                              </div>
                              <span className="font-bold text-white text-sm">{reg.team.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm font-medium text-slate-400">{reg.team.city || 'N/A'}</td>
                          <td className="px-6 py-5">
                            <div className="flex flex-wrap gap-1.5">
                              {reg.categories.map((rc: any) => (
                                <Badge key={rc.id} variant="default" className="bg-white/5 border-white/10 text-[8px] font-bold uppercase">{rc.category.name}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <Badge variant={reg.status === 'CONFIRMED' ? 'success' : reg.status === 'REJECTED' ? 'error' : 'orange'} className="text-[9px] uppercase font-black px-3 py-1">
                              {reg.status === 'CONFIRMED' ? 'CONFIRMADA' : reg.status === 'REJECTED' ? 'REJEITADA' : 'PENDENTE'}
                            </Badge>
                          </td>
                          <td className="px-6 py-5 text-right flex justify-end">
                            <RegistrationActions
                              championshipId={championship.id}
                              registration={reg}
                              categories={championship.categories}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>
        </div>

        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border-white/5 rounded-[40px] p-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B5CF6]/5 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/10 flex items-center justify-center mb-6">
                <Settings2 className="w-6 h-6 text-[#8B5CF6]" />
              </div>
              <h2 className="text-3xl font-display font-black text-white tracking-tight mb-4 leading-tight">Agrupamento e Viagens</h2>
              <p className="text-slate-500 font-medium mb-8 max-w-md">A IA ira analisar as equipes inscritas e sugerir quais categorias devem jogar juntas nas mesmas sedes para reduzir os custos em 50%.</p>
              <Link href={`/admin/championships/${championship.id}/scheduling`}>
                <Button className="bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-black uppercase tracking-widest h-14 px-8 rounded-2xl shadow-xl shadow-[#8B5CF6]/20 transition-all hover:scale-105 active:scale-95">
                  Iniciar Otimizacao IA
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="bg-[#111] border-white/5 rounded-[40px] p-10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6 text-[#FF6B00]" />
              </div>
              <h2 className="text-3xl font-display font-black text-white tracking-tight mb-4">Confirmar Temporada</h2>
              <p className="text-slate-500 font-medium mb-8">Assim que a tabela estiver pronta, voce podera disparar as notificacoes e confirmar as sedes oficiais.</p>
            </div>
            <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-[#FF6B00]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">Aguardando definicao completa das sedes pela IA para permitir a confirmacao.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

