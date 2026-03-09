"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SchedulingPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSimulate = () => {
    setLoading(true)
    // Simulated AI API latency
    setTimeout(() => {
      setLoading(false)
      setResult({
        viableCategories: [
          { id: 'sub17', title: 'Sub 17', teams: 4 },
          { id: 'sub15', title: 'Sub 15', teams: 6 },
          { id: 'sub13', title: 'Sub 13', teams: 4 },
          { id: 'sub12', title: 'Sub 12', teams: 3 },
        ],
        blocks: [
          {
            id: 'B1',
            title: 'Bloco 1 (Sub 15 + Sub 17)',
            reason: '3 equipes disputam ambas as categorias (Flyboys, Amb, Sinodal). Agrupamento economiza R$ 12.000 em custos projetados de viagem.',
            phases: [
              {
                name: 'Sede 1: Porto Alegre',
                date: 'A Definir (1ª Fase)',
                matches: 10
              },
              {
                name: 'Sede 2: Santa Cruz do Sul',
                date: 'A Definir (2ª Fase)',
                matches: 10
              }
            ]
          },
          {
            id: 'B2',
            title: 'Bloco 2 (Sub 12 + Sub 13)',
            reason: '2 equipes disputam ambas (Flyboys, Amb). Agrupamento reduz 32% do deslocamento total das equipes menores.',
            phases: [
              {
                name: 'Sede 1: Lajeado',
                date: 'A Definir (1ª Fase)',
                matches: 6
              }
            ]
          }
        ],
        dates: [
          { phase: 'Bloco 1 - 1ª Fase', primary: '08 a 09 de Maio de 2026', alternate: '15 a 16 de Maio de 2026', conflictRemoved: 'Dia das Mães excluído' },
          { phase: 'Bloco 1 - 2ª Fase', primary: '05 a 06 de Junho de 2026', alternate: '19 a 20 de Junho de 2026', conflictRemoved: 'Festa Junina e Corpus Christi evitados' },
          { phase: 'Bloco 2 - Única', primary: '22 a 23 de Maio de 2026', alternate: '29 a 30 de Maio de 2026', conflictRemoved: '' },
        ]
      })
    }, 2500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Simulador de Inteligência Artificial</h1>
        <p className="text-slate-400">Gere calendários otimizados cruzando datas, disponibilidade de ginásios e agrupamento de viagens.</p>
      </div>

      {!result && (
        <Card className="bg-gradient-to-br from-blue-900/30 to-slate-900/50 border-blue-500/30 text-white relative overflow-hidden">
          <CardHeader>
            <CardTitle>Dados Atuais — Estadual 2026</CardTitle>
            <CardDescription className="text-slate-300">
              O sistema fechou as inscrições e conta com dados complexos para otimização.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
             <ul className="list-disc pl-5 space-y-2">
               <li><strong>Sub 17:</strong> Fluxo, Sogipa, Amb, Sinodal</li>
               <li><strong>Sub 15:</strong> Flyboys, Recreio, Sinodal, Richmond, Sojao, Dunk</li>
               <li><strong>Sub 13:</strong> Flyboys, Amb, Richmond, Juvenil</li>
               <li><strong>Sub 12:</strong> Flyboys, Amb, Apacobas</li>
             </ul>
             <p className="mt-4 text-blue-300">Inconsistências mapeadas manual? Quase impossível. Deixe a IA organizar o quebra-cabeça.</p>
          </CardContent>
          <CardFooter>
            <Button size="lg" onClick={handleSimulate} disabled={loading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 font-semibold shadow-lg shadow-blue-600/20">
              {loading ? "Processando e Otimizando 532 variáveis..." : "Gerar Otimização com IA"}
              {!loading && <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            </Button>
          </CardFooter>
        </Card>
      )}

      {result && (
        <div className="animate-in fade-in zoom-in duration-500 space-y-8">
          
          <div className="flex justify-between items-center bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
             <div className="flex items-center text-blue-400">
               <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <span className="font-semibold">Otimização Concluída: 17 equipes consolidadas, 4 categorias viáveis, e R$ 12.000 de custos economizados em viagens.</span>
             </div>
             <Button variant="outline" onClick={() => setResult(null)} className="border-white/10 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white">Recalcular Cenário</Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Viabilidade de Categorias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 divide-y divide-white/5">
                  {result.viableCategories.map((cat:any) => (
                    <div key={cat.id} className="flex justify-between items-center pt-3 mt-3 first:pt-0 first:mt-0">
                      <span className="font-medium text-slate-200">{cat.title}</span>
                      <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                        {cat.teams} Equipes Validado
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/50 border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Agrupamento Inteligente de Sedes</CardTitle>
                <CardDescription className="text-slate-400">A IA uniu categorias com base na similaridade de viagens.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {result.blocks.map((block:any) => (
                    <div key={block.id} className="bg-slate-950/50 border border-white/5 p-4 rounded-md">
                      <h4 className="font-bold text-orange-400">{block.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 mb-3">{block.reason}</p>
                      
                      {block.phases.map((p:any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm mt-2 border-t border-white/5 pt-2">
                           <span className="text-slate-300">{p.name}</span>
                           <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs">{p.matches} Jogos</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-900/50 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Datas e Conflitos</CardTitle>
              <CardDescription className="text-slate-400">Sugestões de calendários cruzando incompatibilidades das equipes e feriados do Sul.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 bg-slate-950 uppercase">
                    <tr>
                      <th className="px-4 py-3">Fase / Bloco</th>
                      <th className="px-4 py-3">Data Principal Sugerida</th>
                      <th className="px-4 py-3">Data Plano B</th>
                      <th className="px-4 py-3">Conflito Tratado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.dates.map((d:any, i:number) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="px-4 py-3 font-medium text-slate-200">{d.phase}</td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold">{d.primary}</td>
                        <td className="px-4 py-3 text-orange-400">{d.alternate}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{d.conflictRemoved || 'Nenhum'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-950/50 rounded-b-lg border-t border-white/5 pt-4">
              <div className="flex gap-4 w-full">
                <Button className="font-semibold shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                  Aprovar Calendário e Gerar Súmulas
                </Button>
                <Button variant="outline" className="text-slate-300 border-white/20 hover:bg-white/10">Exportar Tabela de Jogos (Excel)</Button>
              </div>
            </CardFooter>
          </Card>

        </div>
      )}
    </div>
  )
}
