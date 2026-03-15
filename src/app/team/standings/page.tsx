import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/Badge"
import { Trophy, TrendingUp, Info } from "lucide-react"

export default function StandingsPage() {
  // Mock data for the standings
  const standings = [
    { rank: 1, team: "Flyboys", pts: 21, p: 8, w: 7, l: 1, dp: 120, form: ['W', 'W', 'W', 'L', 'W'], isUserTeam: true },
    { rank: 2, team: "Sogipa", pts: 19, p: 8, w: 6, l: 2, dp: 85, form: ['W', 'L', 'W', 'W', 'W'], isUserTeam: false },
    { rank: 3, team: "Corinthians", pts: 18, p: 8, w: 5, l: 3, dp: 42, form: ['L', 'W', 'W', 'L', 'W'], isUserTeam: false },
    { rank: 4, team: "Recreio da Juventude", pts: 15, p: 7, w: 4, l: 3, dp: 10, form: ['W', 'L', 'L', 'W', 'L'], isUserTeam: false },
    { rank: 5, team: "CEAT Bira", pts: 14, p: 8, w: 3, l: 5, dp: -15, form: ['L', 'L', 'W', 'L', 'W'], isUserTeam: false },
    { rank: 6, team: "CR Esportes", pts: 10, p: 7, w: 1, l: 6, dp: -80, form: ['L', 'L', 'L', 'L', 'W'], isUserTeam: false },
    { rank: 7, team: "Sinodal", pts: 9, p: 8, w: 0, l: 8, dp: -162, form: ['L', 'L', 'L', 'L', 'L'], isUserTeam: false },
  ]

  const getFormDot = (result: string, index: number) => {
    if (result === 'W') {
      return (
        <span key={index} title="Vitória" className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
      )
    }
    return (
      <span key={index} title="Derrota" className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-[--text-main] mb-2 flex items-center gap-3">
            Classificação
            <Badge variant="orange" size="sm" className="shadow-[0_4px_10px_rgba(255,107,0,0.2)]">
              Estadual 2026
            </Badge>
          </h1>
          <p className="text-[--text-secondary] font-medium text-lg">
            Acompanhe o desempenho da sua equipe no campeonato.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="glass-panel px-4 py-2 flex items-center gap-3 backdrop-blur-xl border border-[rgba(255,255,255,0.05)] rounded-2xl">
            <Trophy className="w-5 h-5 text-[#FF6B00]" />
            <div>
              <p className="text-[10px] text-[--text-dim] uppercase tracking-widest font-black">Categoria</p>
              <p className="text-sm font-bold text-[--text-main]">Sub 17 - Masculino</p>
            </div>
          </div>
        </div>
      </div>

      {/* Standings Table Module */}
      <Card className="glass-panel text-white overflow-hidden border border-[rgba(255,255,255,0.05)] shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        <CardHeader className="border-b border-[rgba(255,255,255,0.05)] bg-white/5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-display font-black text-[--text-main]">
              Tabela Geral
            </CardTitle>
            <div className="flex items-center gap-2 text-[--text-dim] text-xs font-medium">
              <Info className="w-4 h-4" />
              <span>Atualizado há 2 horas</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-black/20">
                <TableRow className="border-[rgba(255,255,255,0.05)] hover:bg-transparent">
                  <TableHead className="w-[80px] text-center text-[10px] font-bold text-[--text-secondary] uppercase tracking-widest py-4">Pos</TableHead>
                  <TableHead className="text-left text-[10px] font-bold text-[--text-secondary] uppercase tracking-widest py-4">Equipe</TableHead>
                  <TableHead className="text-center text-[10px] font-bold text-[--text-main] uppercase tracking-widest py-4">PTS</TableHead>
                  <TableHead className="text-center text-[10px] font-bold text-[--text-secondary] uppercase tracking-widest py-4">J</TableHead>
                  <TableHead className="text-center text-[10px] font-bold text-[--text-secondary] uppercase tracking-widest py-4">V</TableHead>
                  <TableHead className="text-center text-[10px] font-bold text-[--text-secondary] uppercase tracking-widest py-4">D</TableHead>
                  <TableHead className="text-center text-[10px] font-bold text-[--text-secondary] uppercase tracking-widest py-4 hidden md:table-cell">Saldo</TableHead>
                  <TableHead className="text-left text-[10px] font-bold text-[--text-secondary] uppercase tracking-widest py-4">Forma (Últimos 5)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((row) => (
                  <TableRow 
                    key={row.rank} 
                    className={`border-[rgba(255,255,255,0.05)] transition-colors ${
                      row.isUserTeam 
                        ? 'bg-[#FF6B00]/5 hover:bg-[#FF6B00]/10 border-l-2 border-l-[#FF6B00]' 
                        : 'hover:bg-white/5 border-l-2 border-l-transparent'
                    }`}
                  >
                    <TableCell className="text-center font-bold text-[--text-secondary] relative">
                      {row.rank <= 4 && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-[#10B981] rounded-full opacity-50" title="Zona de Classificação" />
                      )}
                      {row.rank}º
                    </TableCell>
                    <TableCell className="text-left font-display font-black text-[--text-main] tracking-tight">
                      {row.team}
                      {row.isUserTeam && (
                        <span className="ml-2 inline-flex items-center text-[9px] font-bold uppercase tracking-widest text-[#FF6B00] bg-[#FF6B00]/10 px-1.5 py-0.5 rounded-full border border-[#FF6B00]/20">
                          Sua Equipe
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-black text-lg text-[--text-main]">{row.pts}</TableCell>
                    <TableCell className="text-center font-medium text-[--text-dim]">{row.p}</TableCell>
                    <TableCell className="text-center font-semibold text-[#10B981]">{row.w}</TableCell>
                    <TableCell className="text-center font-semibold text-[#EF4444]">{row.l}</TableCell>
                    <TableCell className={`text-center font-medium hidden md:table-cell ${row.dp > 0 ? 'text-[#10B981]' : row.dp < 0 ? 'text-[#EF4444]' : 'text-[--text-dim]'}`}>
                      {row.dp > 0 ? `+${row.dp}` : row.dp}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {row.form.map((result, idx) => getFormDot(result, idx))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="bg-black/40 border-t border-[rgba(255,255,255,0.05)] p-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-medium text-[--text-dim] uppercase tracking-widest gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-[#10B981]/50" /> Zona de Classificação (G4)</span>
          </div>
          <div className="flex items-center gap-6">
            <span>PTS = Pontos</span>
            <span>J = Jogos</span>
            <span>V = Vitórias</span>
            <span>D = Derrotas</span>
          </div>
        </div>
      </Card>
      
      {/* Additional Analytics / Form details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="glass-panel p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-[12px] bg-[#10B981]/10 flex items-center justify-center shrink-0 border border-[#10B981]/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <TrendingUp className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[--text-main] mb-1">Melhor Sequência</h3>
            <p className="text-xs text-[--text-secondary] leading-relaxed">
              O <strong className="text-white">Flyboys</strong> detém a maior sequência invicta atual com <span className="text-[#10B981] font-bold">5 vitórias</span> consecutivas. A equipe está com o melhor aproveitamento do campeonato (87.5%).
            </p>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-start gap-4 hover:border-[rgba(255,255,255,0.1)] transition-colors cursor-pointer group">
          <div className="w-10 h-10 rounded-[12px] bg-[#FF6B00]/10 flex items-center justify-center shrink-0 border border-[#FF6B00]/20 shadow-[0_0_15px_rgba(255,107,0,0.15)] transition-transform duration-300 group-hover:scale-110">
            <Trophy className="w-5 h-5 text-[#FF6B00]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[--text-main] mb-1">Regulamento</h3>
            <p className="text-xs text-[--text-secondary] leading-relaxed">
              Os <strong className="text-white">4 primeiros</strong> classificados avançam para o Final Four, que será disputado em sede única no mês de Novembro.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
