'use client'

import React, { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface GenerateSumulaButtonProps {
  gameId: string
  gameLabel?: string
}

export function GenerateSumulaButton({ gameId, gameLabel }: GenerateSumulaButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/games/${gameId}/sumula`)
      if (!res.ok) throw new Error('Erro ao buscar dados da partida')
      
      const game = await res.json()
      
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      
      // ════════════════════════════════════════════
      // CABEÇALHO
      // ════════════════════════════════════════════
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text('FEDERAÇÃO GAÚCHA DE BASKETBALL', pageWidth / 2, 15, { align: 'center' })
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`CAMPEONATO: ${game.championship.name.toUpperCase()} ${game.championship.year}`, pageWidth / 2, 22, { align: 'center' })
      
      doc.setLineWidth(0.5)
      doc.line(15, 25, pageWidth - 15, 25)
      
      // Info Geral
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('SÚMULA DE JOGO:', 15, 32)
      doc.text(`JOGO Nº: ${gameId.slice(0, 4).toUpperCase()}`, 155, 32)
      
      doc.setFont('helvetica', 'normal')
      doc.text(`CATEGORIA: ${game.category.name}`, 15, 38)
      doc.text(`DATA: ${format(new Date(game.dateTime), 'dd/MM/yyyy', { locale: ptBR })}`, 85, 38)
      doc.text(`HORA: ${format(new Date(game.dateTime), 'HH:mm', { locale: ptBR })}`, 155, 38)
      
      doc.text(`LOCAL: ${game.location || 'A DEFINIR'}`, 15, 44)
      doc.text(`CIDADE: ${game.city || 'A DEFINIR'}`, 155, 44)
      
      doc.line(15, 48, pageWidth - 15, 48)
      
      // ════════════════════════════════════════════
      // EQUIPE A (HOME)
      // ════════════════════════════════════════════
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(240, 240, 240)
      doc.rect(15, 52, (pageWidth - 35) / 2, 8, 'F')
      doc.text(`EQUIPE A: ${game.homeTeam.name.toUpperCase()}`, 17, 57.5)
      
      const homeRoster = game.homeTeam.members.map((m: any) => [
        m.number || '-',
        m.user.name.toUpperCase(),
        '', '', '', '', '' // Faltas
      ])
      
      autoTable(doc, {
        startY: 61,
        margin: { left: 15 },
        tableWidth: (pageWidth - 35) / 2,
        head: [['Nº', 'NOME DO ATLETA', '1', '2', '3', '4', '5']],
        body: homeRoster,
        styles: { fontSize: 7, cellPadding: 1, halign: 'center' },
        headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 'auto', halign: 'left' },
          2: { cellWidth: 6 },
          3: { cellWidth: 6 },
          4: { cellWidth: 6 },
          5: { cellWidth: 6 },
          6: { cellWidth: 6 },
        }
      })
      
      // ════════════════════════════════════════════
      // EQUIPE B (AWAY)
      // ════════════════════════════════════════════
      const homeTableFinalY = (doc as any).lastAutoTable.finalY || 61
      
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(240, 240, 240)
      doc.rect(pageWidth / 2 + 2.5, 52, (pageWidth - 35) / 2, 8, 'F')
      doc.text(`EQUIPE B: ${game.awayTeam.name.toUpperCase()}`, pageWidth / 2 + 4.5, 57.5)
      
      const awayRoster = game.awayTeam.members.map((m: any) => [
        m.number || '-',
        m.user.name.toUpperCase(),
        '', '', '', '', '' // Faltas
      ])
      
      autoTable(doc, {
        startY: 61,
        margin: { left: pageWidth / 2 + 2.5 },
        tableWidth: (pageWidth - 35) / 2,
        head: [['Nº', 'NOME DO ATLETA', '1', '2', '3', '4', '5']],
        body: awayRoster,
        styles: { fontSize: 7, cellPadding: 1, halign: 'center' },
        headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 'auto', halign: 'left' },
          2: { cellWidth: 6 },
          3: { cellWidth: 6 },
          4: { cellWidth: 6 },
          5: { cellWidth: 6 },
          6: { cellWidth: 6 },
        }
      })
      
      const awayTableFinalY = (doc as any).lastAutoTable.finalY || 61
      const maxY = Math.max(homeTableFinalY, awayTableFinalY)
      
      // ════════════════════════════════════════════
      // CONTROLE DE PONTUAÇÃO (PLACEHOLDER TABLE)
      // ════════════════════════════════════════════
      doc.setFontSize(10)
      doc.text('CONTAGEM DE PONTOS:', 15, maxY + 15)
      
      const scoresBody = Array.from({ length: 15 }, (_, i) => [
        i + 1, '', '', i + 1, '', '', i + 1, '', ''
      ])
      
      autoTable(doc, {
        startY: maxY + 20,
        head: [['A', 'M', 'B', 'A', 'M', 'B', 'A', 'M', 'B']],
        body: scoresBody,
        styles: { fontSize: 7, halign: 'center' },
        theme: 'grid'
      })
      
      // Rodapé / Assinaturas
      const footerY = (doc as any).lastAutoTable.finalY + 20
      doc.line(15, footerY, 75, footerY)
      doc.text('Árbitro Principial', 25, footerY + 5)
      
      doc.line(pageWidth - 75, footerY, pageWidth - 15, footerY)
      doc.text('Árbitro Auxiliar', pageWidth - 65, footerY + 5)
      
      doc.save(`sumula-${game.homeTeam.name}-vs-${game.awayTeam.name}.pdf`)
      toast.success('Súmula gerada com sucesso!')
    } catch (error) {
      console.error(error)
      toast.error('Falha ao gerar súmula.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-300 bg-white/[0.04] border border-white/[0.08] hover:border-white/20 h-8 px-3 rounded-lg transition-all disabled:opacity-50"
      title="Gerar Súmula PDF"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <FileText className="w-3 h-3" />
      )}
      {gameLabel || 'Súmula'}
    </button>
  )
}
