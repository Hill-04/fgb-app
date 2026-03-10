import prisma from '@/lib/db'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TeamChampionshipsPage() {
  const championships = await prisma.championship.findMany({
    where: { status: 'REGISTRATION_OPEN' },
    orderBy: { createdAt: 'desc' },
    include: {
      categories: {
        include: {
          _count: { select: { registrations: true } }
        }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Campeonatos Abertos</h1>
        <p className="text-slate-400">Campeonatos com inscrições disponíveis para sua equipe.</p>
      </div>

      {championships.length === 0 ? (
        <Card className="bg-slate-900/50 border-white/10 text-white">
          <CardContent className="py-16 text-center">
            <div className="flex justify-center mb-4 opacity-30">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Nenhum campeonato com inscrições abertas</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              No momento não há campeonatos com inscrições disponíveis. A Federação avisará quando houver novos campeonatos abertos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {championships.map((championship) => (
            <Card key={championship.id} className="bg-gradient-to-br from-orange-600/20 to-slate-900/50 border-orange-500/30 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </div>

              <CardHeader>
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-xl">{championship.name}</CardTitle>
                    <CardDescription className="text-slate-300 mt-1">
                      {championship.description || 'Campeonato FGB'}
                    </CardDescription>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-semibold text-orange-400 border border-orange-500/30">
                    Inscrições Abertas
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex gap-2 text-xs text-slate-400 font-medium flex-wrap">
                  <span className="bg-white/5 px-2 py-1 rounded">
                    Mínimo {championship.minTeamsPerCat} equipes/categoria
                  </span>
                  <span className="bg-white/5 px-2 py-1 rounded">
                    {championship.categories.length} categoria(s)
                  </span>
                </div>

                {championship.categories.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-300 mb-2">Categorias disponíveis:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {championship.categories.map((cat) => (
                        <div key={cat.id} className="bg-slate-900/60 rounded-md p-2 border border-white/5">
                          <p className="text-xs font-semibold text-white">{cat.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {cat._count.registrations} equipe(s) inscrita(s)
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Link href={`/team/championships/${championship.id}/register`} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white">
                    Realizar Inscrição
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
