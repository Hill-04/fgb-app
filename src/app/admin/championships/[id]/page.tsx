import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/Badge'
import { RegistrationActions } from './RegistrationActions'

export const dynamic = 'force-dynamic'

export default async function ChampionshipDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const championship = await prisma.championship.findUnique({
    where: { id },
    include: {
      categories: true,
      registrations: {
        include: {
          team: true,
          categories: { include: { category: true } },
          blockedDates: true
        },
        orderBy: { registeredAt: 'desc' }
      }
    }
  })

  if (!championship) {
    notFound()
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'Rascunho',
    REGISTRATION_OPEN: 'Inscrições Abertas',
    SCHEDULED: 'Agendado',
    IN_PROGRESS: 'Em Andamento',
    FINISHED: 'Encerrado',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{championship.name}</h1>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Ano: {championship.categories.length > 0 ? '2026' : 'N/A'}</span>
            <Badge variant="blue">{statusLabels[championship.status] || championship.status}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-slate-900/50 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Inscrições ({championship.registrations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {championship.registrations.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  Nenhuma equipe inscrita ainda.
                </div>
              ) : (
                <div className="space-y-4">
                  {championship.registrations.map((reg) => (
                    <div key={reg.id} className="p-4 border border-white/10 rounded-lg bg-slate-950/50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{reg.team.name}</h3>
                          <p className="text-sm text-slate-400">
                            Equipe de {reg.team.city} • Inscrito em {new Date(reg.registeredAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            reg.status === 'CONFIRMED' ? 'success' : 
                            reg.status === 'REJECTED' ? 'error' : 'warning'
                          }
                        >
                          {reg.status === 'CONFIRMED' ? 'Aprovado' : 
                           reg.status === 'REJECTED' ? 'Rejeitado' : 'Pendente'}
                        </Badge>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-slate-300 mb-2">Categorias Solicitadas:</p>
                        <div className="flex flex-wrap gap-2">
                          {reg.categories.map((c) => (
                            <Badge key={c.id} variant="orange" size="sm">
                              {c.category.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {reg.blockedDates.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-slate-300 mb-2">Datas Bloqueadas:</p>
                          <ul className="text-sm text-slate-400 list-disc pl-5">
                            {reg.blockedDates.map((bd) => (
                              <li key={bd.id}>
                                {new Date(bd.startDate).toLocaleDateString()}
                                {bd.endDate ? ` até ${new Date(bd.endDate).toLocaleDateString()}` : ''} 
                                {bd.reason ? ` (${bd.reason})` : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {reg.observations && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-slate-300">Observações:</p>
                          <p className="text-sm text-slate-400 bg-slate-900 p-2 rounded mt-1">
                            {reg.observations}
                          </p>
                        </div>
                      )}

                      <div className="border-t border-white/10 pt-4 mt-2">
                        <RegistrationActions registrationId={reg.id} currentStatus={reg.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Detalhes do Campeonato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Gênero:</span>
                <span className="font-medium capitalize">{championship.sex || 'Não definido'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Formato:</span>
                <span className="font-medium capitalize">{championship.format.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mín. Equipes/Cat:</span>
                <span className="font-medium">{championship.minTeamsPerCat}</span>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <p className="text-slate-400 mb-2 font-medium">Categorias Atendidas:</p>
                <div className="flex flex-wrap gap-2">
                  {championship.categories.map((c) => (
                    <Badge key={c.id} variant="default" size="sm" className="bg-slate-800 text-slate-300">
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
