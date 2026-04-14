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
      
      // Build stat map: userId → stats
      const statsMap: Record<string, any> = {}
      if (game.playerStats) {
        for (const s of game.playerStats) statsMap[s.userId] = s
      }

      // Árbitros
      const mainRef = game.refereeAssignments?.find((a: any) => a.role === 'MAIN')?.referee?.name || ''
      const auxRef  = game.refereeAssignments?.find((a: any) => a.role !== 'MAIN')?.referee?.name || ''

      const isFinished = game.status === 'FINISHED'

      // Roster builder — se o jogo está finalizado mostra stats, senão mostra células de falta
      const buildRoster = (members: any[]) => members.map((m: any) => {
        const s = statsMap[m.user?.id || m.userId]
        if (isFinished && s) {
          return [
            m.number || '-',
            m.user.name.toUpperCase(),
            s.points ?? '',
            s.threePoints ?? '',
            s.assists ?? '',
            s.rebounds ?? '',
            s.blocks ?? '',
            s.steals ?? '',
            s.fouls ?? '',
          ]
        }
        return [m.number || '-', m.user.name.toUpperCase(), '', '', '', '', '', '', '']
      })

      const rosterHead = [['Nº', 'NOME DO ATLETA', 'PTS', '3PT', 'AST', 'REB', 'BLK', 'STL', 'FLT']]
      const rosterColStyles: Record<number, object> = {
        0: { cellWidth: 8 },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 7 }, 3: { cellWidth: 7 }, 4: { cellWidth: 7 },
        5: { cellWidth: 7 }, 6: { cellWidth: 7 }, 7: { cellWidth: 7 },
        8: { cellWidth: 7 },
      }

      // ════════════════════════════════════════════
      // EQUIPE A (HOME)
      // ════════════════════════════════════════════
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(240, 240, 240)
      doc.rect(15, 52, (pageWidth - 35) / 2, 8, 'F')
      doc.text(`EQUIPE A: ${game.homeTeam.name.toUpperCase()}`, 17, 57.5)

      autoTable(doc, {
        startY: 61,
        margin: { left: 15 },
        tableWidth: (pageWidth - 35) / 2,
        head: rosterHead,
        body: buildRoster(game.homeTeam.members),
        styles: { fontSize: 7, cellPadding: 1, halign: 'center' },
        headStyles: { fillColor: [27, 115, 64], textColor: [255, 255, 255] },
        columnStyles: rosterColStyles,
      })

      // ════════════════════════════════════════════
      // EQUIPE B (AWAY)
      // ════════════════════════════════════════════
      const homeTableFinalY = (doc as any).lastAutoTable.finalY || 61

      doc.setFont('helvetica', 'bold')
      doc.setFillColor(240, 240, 240)
      doc.rect(pageWidth / 2 + 2.5, 52, (pageWidth - 35) / 2, 8, 'F')
      doc.text(`EQUIPE B: ${game.awayTeam.name.toUpperCase()}`, pageWidth / 2 + 4.5, 57.5)

      autoTable(doc, {
        startY: 61,
        margin: { left: pageWidth / 2 + 2.5 },
        tableWidth: (pageWidth - 35) / 2,
        head: rosterHead,
        body: buildRoster(game.awayTeam.members),
        styles: { fontSize: 7, cellPadding: 1, halign: 'center' },
        headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255] },
        columnStyles: rosterColStyles,
      })

      const awayTableFinalY = (doc as any).lastAutoTable.finalY || 61
      const maxY = Math.max(homeTableFinalY, awayTableFinalY)

      // ════════════════════════════════════════════
      // PLACAR FINAL (se finalizado) ou tabela de controle
      // ════════════════════════════════════════════
      if (isFinished) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('RESULTADO FINAL:', 15, maxY + 14)
        doc.setFontSize(18)
        doc.text(
          `${game.homeTeam.name.toUpperCase()}  ${game.homeScore ?? '-'}  ×  ${game.awayScore ?? '-'}  ${game.awayTeam.name.toUpperCase()}`,
          pageWidth / 2,
          maxY + 26,
          { align: 'center' }
        )
      } else {
        doc.setFontSize(10)
        doc.text('CONTROLE DE PONTUAÇÃO:', 15, maxY + 14)
        const scoresBody = Array.from({ length: 12 }, (_, i) => [i + 1, '', '', i + 1, '', '', i + 1, '', ''])
        autoTable(doc, {
          startY: maxY + 19,
          head: [['A', 'M', 'B', 'A', 'M', 'B', 'A', 'M', 'B']],
          body: scoresBody,
          styles: { fontSize: 7, halign: 'center' },
          theme: 'grid',
        })
      }

      // ════════════════════════════════════════════
      // RODAPÉ / ASSINATURAS
      // ════════════════════════════════════════════
      const lastY = (doc as any).lastAutoTable?.finalY || maxY + 40
      const footerY = lastY + 18
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')

      doc.line(15, footerY, 85, footerY)
      doc.text(`Árbitro Principal${mainRef ? ': ' + mainRef : ''}`, 17, footerY + 5)

      doc.line(pageWidth - 85, footerY, pageWidth - 15, footerY)
      doc.text(`Árbitro Auxiliar${auxRef ? ': ' + auxRef : ''}`, pageWidth - 83, footerY + 5)
      
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
