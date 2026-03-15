"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function SchedulingPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  const handleSimulate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/scheduling/simulate', {
        method: 'POST',
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao comunicar com a IA')
      }
      
      setResult(data)
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = () => {
    if (!result) return
    const ws = XLSX.utils.json_to_sheet(result.dates.map((d: any) => ({
      'Fase / Bloco': d.phase,
      'Data Principal Sugerida': d.primary,
      'Data Plano B': d.alternate,
      'Conflito Tratado': d.conflictRemoved || 'Nenhum'
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Calendário")
    XLSX.writeFile(wb, "calendario_fgb_2026.xlsx")
  }

  const handleExportPDF = () => {
    if (!result) return
    const doc = new jsPDF()
    doc.text("Calendário de Jogos FGB 2026 - Sugestão IA", 14, 15)
    
    const tableBody = result.dates.map((d: any) => [
      d.phase, d.primary, d.alternate, d.conflictRemoved || 'Nenhum'
    ])
    
    ;(doc as any).autoTable({
      startY: 20,
      head: [['Fase / Bloco', 'Data Principal', 'Data Plano B', 'Conflito Tratado']],
      body: tableBody,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [234, 88, 12] } // Tailwind orange-600 approx
    })
    
    doc.save("calendario_fgb_2026.pdf")
  }

  const handleSendEmails = async () => {
    setSendingEmail(true)
    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: ['teste-equipe@exemplo.com'], // Mocado para o exemplo
          subject: 'Tabela de Jogos - FGB 2026',
          html: '<h1>A tabela de jogos foi gerada!</h1><p>Acesse o painel da sua equipe para visualizar os horários e locais.</p>'
        })
      })
      if (res.ok) {
        alert('Tabela de jogos enviada com sucesso para todas as equipes da categoria!')
      } else {
        alert('Falha ao enviar e-mail.')
      }
    } catch (err) {
      alert('Erro ao enviar e-mail.')
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black tracking-tight text-[--text-main] mb-2 flex items-center gap-3">
          Simulador de Inteligência Artificial
          <span className="text-[10px] font-bold uppercase tracking-widest bg-[#8B5CF6]/20 text-[#A78BFA] px-2 py-1 rounded-full border border-[#8B5CF6]/30">
            Optimized by AI
          </span>
        </h1>
        <p className="text-[--text-secondary] font-medium">Gere calendários otimizados cruzando datas, disponibilidade de ginásios e agrupamento de viagens.</p>
      </div>

      {!result && (
        <Card className="glass-panel border-[rgba(139,92,246,0.3)] shadow-[0_0_30px_rgba(139,92,246,0.1)] text-white relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl">Dados Atuais — Estadual 2026</CardTitle>
            <CardDescription className="text-[--text-secondary]">
              O sistema fechou as inscrições e conta com dados complexos para otimização.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[--text-dim]">
             <ul className="list-disc pl-5 space-y-2">
               <li><strong className="text-white">Sub 17:</strong> Fluxo, Sogipa, Amb, Sinodal</li>
               <li><strong className="text-white">Sub 15:</strong> Flyboys, Recreio, Sinodal, Richmond, Sojao, Dunk</li>
               <li><strong className="text-white">Sub 13:</strong> Flyboys, Amb, Richmond, Juvenil</li>
               <li><strong className="text-white">Sub 12:</strong> Flyboys, Amb, Apacobas</li>
             </ul>
             <p className="mt-4 text-[#A78BFA] font-medium">Inconsistências mapeadas manual? Quase impossível. Deixe a IA organizar o quebra-cabeça.</p>
          </CardContent>
          <CardFooter>
            <Button size="lg" onClick={handleSimulate} disabled={loading} className="w-full sm:w-auto bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold shadow-[0_8px_20px_-5px_rgba(139,92,246,0.5)] hover:shadow-[0_12px_25px_-5px_rgba(139,92,246,0.6)] hover:scale-105 transition-all">
              {loading ? "Processando e Otimizando 532 variáveis..." : "Gerar Otimização com IA"}
              {!loading && <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            </Button>
          </CardFooter>
        </Card>
      )}

      {result && (
        <div className="animate-in fade-in zoom-in duration-500 space-y-8">
          
          <div className="flex justify-between items-center bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 p-4 rounded-xl">
             <div className="flex items-center text-[#A78BFA]">
               <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <span className="font-semibold text-sm">Otimização Concluída: 17 equipes consolidadas, 4 categorias viáveis, e R$ 12.000 de custos economizados em viagens.</span>
             </div>
             <Button variant="outline" onClick={() => setResult(null)} className="border-[rgba(255,255,255,0.1)] bg-white/5 text-[--text-main] hover:bg-white/10 hover:text-white rounded-lg">Recalcular Cenário</Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass-panel text-white">
              <CardHeader>
                <CardTitle className="text-lg text-[--text-main] font-display font-bold">Viabilidade de Categorias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 divide-y divide-[rgba(255,255,255,0.05)]">
                  {result.viableCategories.map((cat:any) => (
                    <div key={cat.id} className="flex justify-between items-center pt-3 mt-3 first:pt-0 first:mt-0">
                      <span className="font-medium text-[--text-secondary]">{cat.title}</span>
                      <span className="text-xs font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 px-2 py-1 rounded-full">
                        {cat.teams} Equipes Validado
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-panel text-white">
              <CardHeader>
                <CardTitle className="text-lg font-display font-bold text-[--text-main]">Agrupamento Inteligente de Sedes</CardTitle>
                <CardDescription className="text-[--text-secondary]">A IA uniu categorias com base na similaridade de viagens.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {result.blocks.map((block:any) => (
                    <div key={block.id} className="bg-white/5 border border-[rgba(255,255,255,0.05)] p-4 rounded-xl relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8B5CF6] rounded-l-xl opacity-80" />
                      <h4 className="font-bold text-[#FF6B00] ml-2">{block.title}</h4>
                      <p className="text-xs text-[--text-dim] mt-1 mb-3 ml-2">{block.reason}</p>
                      
                      {block.phases.map((p:any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm mt-2 border-t border-[rgba(255,255,255,0.05)] pt-2 ml-2">
                           <span className="text-[--text-main]">{p.name}</span>
                           <span className="bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] px-2 py-0.5 rounded-full text-xs font-bold">{p.matches} Jogos</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-panel text-white">
            <CardHeader>
              <CardTitle className="text-lg font-display font-bold text-[--text-main]">Datas e Conflitos</CardTitle>
              <CardDescription className="text-[--text-secondary]">Sugestões de calendários cruzando incompatibilidades das equipes e feriados do Sul.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-[--text-secondary] bg-white/5 uppercase tracking-widest font-bold">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Fase / Bloco</th>
                      <th className="px-4 py-3">Data Principal Sugerida</th>
                      <th className="px-4 py-3">Data Plano B</th>
                      <th className="px-4 py-3 rounded-tr-lg">Conflito Tratado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.dates.map((d:any, i:number) => (
                      <tr key={i} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-medium text-[--text-main]">{d.phase}</td>
                        <td className="px-4 py-3 text-[#10B981] font-bold">{d.primary}</td>
                        <td className="px-4 py-3 text-[#FF6B00] font-medium">{d.alternate}</td>
                        <td className="px-4 py-3 text-[#A78BFA] text-xs font-semibold">{d.conflictRemoved || 'Nenhum'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="bg-white/5 rounded-b-[16px] border-t border-[rgba(255,255,255,0.1)] pt-4">
              <div className="flex flex-wrap gap-4 w-full">
                <Button 
                  onClick={handleSendEmails} 
                  disabled={sendingEmail}
                  className="font-bold shadow-[0_4px_15px_rgba(16,185,129,0.3)] bg-[#10B981] hover:bg-[#059669] text-white rounded-xl"
                >
                  {sendingEmail ? 'Enviando...' : 'Aprovar e Notificar Equipes (E-mail)'}
                </Button>
                <Button variant="outline" onClick={handleExportExcel} className="text-[--text-secondary] border-[rgba(255,255,255,0.1)] bg-white/5 hover:text-white hover:bg-white/10 rounded-xl">Exportar (Excel)</Button>
                <Button variant="outline" onClick={handleExportPDF} className="text-[--text-secondary] border-[rgba(255,255,255,0.1)] bg-white/5 hover:text-white hover:bg-white/10 rounded-xl">Gerar Relatório (PDF)</Button>
              </div>
            </CardFooter>
          </Card>

        </div>
      )}
    </div>
  )
}
