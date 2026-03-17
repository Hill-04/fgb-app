'use client'

import { Button } from '@/components/ui/button'
import { FileDown, FileSpreadsheet, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

type ExportStandingsButtonsProps = {
  standings: any[]
  categoryName: string
  championshipName: string
}

export function ExportStandingsButtons({ standings, categoryName, championshipName }: ExportStandingsButtonsProps) {
  
  const exportPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(18)
    doc.text(`Classificação: ${categoryName}`, 14, 22)
    doc.setFontSize(11)
    doc.text(`Campeonato: ${championshipName}`, 14, 30)
    doc.text(`Data de Exportação: ${new Date().toLocaleDateString()}`, 14, 38)

    const tableRows = standings.map((s, i) => [
      `${i + 1}º`,
      s.team.name,
      s.points,
      s.played,
      s.wins,
      s.losses,
      s.pointsFor,
      s.pointsAg,
      s.pointsFor - s.pointsAg
    ])

    autoTable(doc, {
      startY: 45,
      head: [['Pos', 'Equipe', 'Pts', 'PJ', 'V', 'D', 'PF', 'PC', 'S']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [255, 107, 0] },
    })

    doc.save(`FGB_Standings_${categoryName.replace(/\s+/g, '_')}.pdf`)
  }

  const exportExcel = () => {
    const data = standings.map((s, i) => ({
      Posição: `${i + 1}º`,
      Equipe: s.team.name,
      Pontos: s.points,
      Jogos: s.played,
      Vitórias: s.wins,
      Derrotas: s.losses,
      PF: s.pointsFor,
      PA: s.pointsAg,
      Saldo: s.pointsFor - s.pointsAg
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Classificação')
    XLSX.writeFile(wb, `FGB_Standings_${categoryName.replace(/\s+/g, '_')}.xlsx`)
  }

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        onClick={exportPDF}
        className="bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2 h-10 px-4 text-xs font-black uppercase tracking-widest"
      >
        <FileText className="w-3.5 h-3.5 text-red-500" />
        PDF
      </Button>
      <Button 
        variant="outline" 
        onClick={exportExcel}
        className="bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2 h-10 px-4 text-xs font-black uppercase tracking-widest"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
        Excel
      </Button>
    </div>
  )
}
