/**
 * Game PDF Generator — Fase 5.C
 *
 * Gera a sumula oficial em PDF:
 * - Cabecalho com brasao FGB + tricolor stripe
 * - Info do jogo (campeonato, categoria, data, local, versao)
 * - Placar e quartos
 * - Box score por equipe
 * - Comissao tecnica + arbitragem
 * - QR code para verificacao publica
 *
 * Storage: Vercel Blob (acesso publico, URL fica em GameOfficialReportVersion.officialPdfUrl).
 */

import { put } from '@vercel/blob'
import { prisma } from '@/lib/db'

const FGB_GREEN = { r: 12, g: 92, b: 45 }  // var(--fgb-green-800) #0C5C2D
const FGB_GREEN_DARK = { r: 8, g: 60, b: 30 }  // #083C1E
const FGB_YELLOW = { r: 229, g: 171, b: 0 }  // #E5AB00
const FGB_RED = { r: 215, g: 32, b: 32 }  // #D72020
const INK_900 = { r: 21, g: 25, b: 26 }
const INK_500 = { r: 92, g: 102, b: 97 }
const INK_200 = { r: 200, g: 207, b: 204 }

// ─────────────── Data loading ───────────────

export async function loadSumulaData(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      homeTeam: { select: { id: true, name: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, logoUrl: true } },
      championship: { select: { name: true, year: true } },
      category: { select: { name: true } },
      periodScores: { orderBy: { period: 'asc' } },
      officials: { orderBy: { createdAt: 'asc' } },
      rosters: {
        include: {
          players: {
            include: {
              athlete: {
                select: {
                  id: true,
                  name: true,
                  jerseyNumber: true,
                  position: true,
                  verifiedFgb: true,
                },
              },
            },
            orderBy: { jerseyNumber: 'asc' },
          },
        },
      },
      playerStatLines: true,
    },
  })

  if (!game) return null
  return game
}

// ─────────────── PDF builder ───────────────

type BuildInput = {
  game: NonNullable<Awaited<ReturnType<typeof loadSumulaData>>>
  version: number
  verifyUrl: string
}

export async function buildSumulaPdfBuffer({ game, version, verifyUrl }: BuildInput): Promise<Buffer> {
  const { jsPDF } = await import('jspdf')
  const autoTableModule = await import('jspdf-autotable')
  const autoTable: any = (autoTableModule as any).default ?? (autoTableModule as any)
  const QRCode = await import('qrcode')

  const doc = new jsPDF({ format: 'a4', unit: 'mm' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14

  // ─── Cabecalho ───
  doc.setFillColor(FGB_GREEN_DARK.r, FGB_GREEN_DARK.g, FGB_GREEN_DARK.b)
  doc.rect(0, 0, pageWidth, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('FEDERACAO GAUCHA DE BASKETBALL', margin, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Sumula Oficial', margin, 18)

  doc.setFontSize(8)
  doc.text(`v${version}`, pageWidth - margin, 12, { align: 'right' })
  doc.text(new Date().toLocaleString('pt-BR'), pageWidth - margin, 18, { align: 'right' })

  // Tricolor stripe — verde / amarelo / vermelho
  const stripeH = 1.6
  const stripeY = 28
  const stripeW = pageWidth / 3
  doc.setFillColor(FGB_GREEN.r, FGB_GREEN.g, FGB_GREEN.b)
  doc.rect(0, stripeY, stripeW, stripeH, 'F')
  doc.setFillColor(FGB_YELLOW.r, FGB_YELLOW.g, FGB_YELLOW.b)
  doc.rect(stripeW, stripeY, stripeW, stripeH, 'F')
  doc.setFillColor(FGB_RED.r, FGB_RED.g, FGB_RED.b)
  doc.rect(stripeW * 2, stripeY, stripeW, stripeH, 'F')

  // ─── Info do jogo ───
  let y = 38
  doc.setTextColor(INK_500.r, INK_500.g, INK_500.b)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const champLine = `${game.championship?.name ?? 'Campeonato'}${
    game.championship?.year ? ` ${game.championship.year}` : ''
  }${game.category?.name ? ` · ${game.category.name}` : ''}`
  doc.text(champLine.toUpperCase(), margin, y)

  y += 5
  doc.setTextColor(INK_900.r, INK_900.g, INK_900.b)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  const gameDate = new Date(game.dateTime)
  doc.text(
    gameDate.toLocaleString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    margin,
    y,
  )

  if (game.venue) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(game.venue, pageWidth - margin, y, { align: 'right' })
  }

  // ─── Placar ───
  y += 12
  doc.setFillColor(FGB_GREEN.r, FGB_GREEN.g, FGB_GREEN.b)
  doc.rect(margin, y, pageWidth - margin * 2, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(game.homeTeam.name.toUpperCase(), margin + 4, y + 8)
  doc.text(game.awayTeam.name.toUpperCase(), pageWidth - margin - 4, y + 8, { align: 'right' })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text('CASA', margin + 4, y + 14)
  doc.text('VISITANTE', pageWidth - margin - 4, y + 14, { align: 'right' })

  // Placar centralizado, big
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  const scoreText = `${game.homeScore ?? 0}  -  ${game.awayScore ?? 0}`
  doc.text(scoreText, pageWidth / 2, y + 22, { align: 'center' })

  // ─── Quartos ───
  y += 34
  if (game.periodScores.length > 0) {
    const periods = game.periodScores
    const headers = ['Time', ...periods.map(p => `Q${p.period}`), 'TOTAL']
    const home = [
      game.homeTeam.name,
      ...periods.map(p => String(p.homePoints)),
      String(game.homeScore ?? 0),
    ]
    const away = [
      game.awayTeam.name,
      ...periods.map(p => String(p.awayPoints)),
      String(game.awayScore ?? 0),
    ]

    autoTable(doc, {
      startY: y,
      head: [headers],
      body: [home, away],
      theme: 'grid',
      styles: { fontSize: 9, halign: 'center' },
      headStyles: {
        fillColor: [FGB_GREEN.r, FGB_GREEN.g, FGB_GREEN.b],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        [headers.length - 1]: { fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    })
    y = (doc as any).lastAutoTable.finalY + 6
  }

  // ─── Box score por equipe ───
  for (const team of [game.homeTeam, game.awayTeam]) {
    const teamRoster = game.rosters.find(r => r.teamId === team.id)
    const teamStats = game.playerStatLines.filter(s => s.teamId === team.id)
    const players = teamRoster?.players ?? []

    if (y > 240) {
      doc.addPage()
      y = 20
    }

    // Cabecalho da equipe
    doc.setFillColor(FGB_GREEN_DARK.r, FGB_GREEN_DARK.g, FGB_GREEN_DARK.b)
    doc.rect(margin, y, pageWidth - margin * 2, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(team.name.toUpperCase(), margin + 3, y + 5.5)

    const teamTotal =
      team.id === game.homeTeamId ? game.homeScore ?? 0 : game.awayScore ?? 0
    doc.text(`${teamTotal} pts`, pageWidth - margin - 3, y + 5.5, { align: 'right' })

    y += 10

    // Tabela de stats — junta roster com playerStatLines
    const rows = players.map(rp => {
      const s = teamStats.find(st => st.athleteId === rp.athlete.id)
      const verified = rp.athlete.verifiedFgb ? ' ✓' : ''
      return [
        String(rp.jerseyNumber ?? '-'),
        `${rp.athlete.name}${verified}`,
        rp.athlete.position ?? '-',
        String(s?.points ?? 0),
        String((s?.reboundsOffensive ?? 0) + (s?.reboundsDefensive ?? 0)),
        String(s?.assists ?? 0),
        String(s?.steals ?? 0),
        String(s?.blocks ?? 0),
        String(s?.turnovers ?? 0),
        String(s?.fouls ?? 0),
        `${s?.twoPtMade ?? 0}/${s?.twoPtAttempted ?? 0}`,
        `${s?.threePtMade ?? 0}/${s?.threePtAttempted ?? 0}`,
        `${s?.freeThrowsMade ?? 0}/${s?.freeThrowsAttempted ?? 0}`,
        String(s?.minutesPlayed ?? 0),
      ]
    })

    autoTable(doc, {
      startY: y,
      head: [
        [
          '#',
          'Atleta',
          'Pos',
          'PTS',
          'REB',
          'AST',
          'STL',
          'BLK',
          'TO',
          'F',
          '2PT',
          '3PT',
          'FT',
          'MIN',
        ],
      ],
      body: rows,
      theme: 'striped',
      styles: { fontSize: 7.5, cellPadding: 1.2 },
      headStyles: {
        fillColor: [FGB_GREEN.r, FGB_GREEN.g, FGB_GREEN.b],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 7 },
        1: { halign: 'left', cellWidth: 38 },
        2: { halign: 'center', cellWidth: 10 },
        3: { halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    })
    y = (doc as any).lastAutoTable.finalY + 4

    // Tecnico
    if (teamRoster?.coachName) {
      doc.setTextColor(INK_500.r, INK_500.g, INK_500.b)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const coachLine = `Tecnico: ${teamRoster.coachName}${
        teamRoster.assistantCoachName ? ` · Auxiliar: ${teamRoster.assistantCoachName}` : ''
      }`
      doc.text(coachLine, margin + 1, y + 3)
      y += 6
    } else {
      y += 2
    }
  }

  // ─── Arbitragem + Oficiais ───
  if (y > 240) {
    doc.addPage()
    y = 20
  }

  doc.setFillColor(INK_200.r, INK_200.g, INK_200.b)
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F')
  doc.setTextColor(INK_900.r, INK_900.g, INK_900.b)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('ARBITRAGEM E MESA', margin + 2, y + 4)
  y += 9

  if (game.officials.length > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(INK_900.r, INK_900.g, INK_900.b)
    for (const o of game.officials) {
      doc.text(`${o.role}: ${o.name}`, margin + 2, y)
      y += 4.5
    }
  } else {
    doc.setTextColor(INK_500.r, INK_500.g, INK_500.b)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.text('Nao informado', margin + 2, y)
    y += 4.5
  }

  // ─── QR Code de verificacao + footer ───
  // QR code no rodape, lado esquerdo
  const qrSize = 28
  const footerY = doc.internal.pageSize.getHeight() - qrSize - 20

  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 280,
      margin: 1,
      color: { dark: '#0C5C2D', light: '#FFFFFF' },
    })
    doc.addImage(qrDataUrl, 'PNG', margin, footerY, qrSize, qrSize)
  } catch (err) {
    console.error('[game-pdf] Falha ao gerar QR code:', err)
  }

  doc.setTextColor(INK_500.r, INK_500.g, INK_500.b)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('Verifique a autenticidade:', margin + qrSize + 4, footerY + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(verifyUrl, margin + qrSize + 4, footerY + 11)

  // Footer line
  doc.setDrawColor(INK_200.r, INK_200.g, INK_200.b)
  doc.setLineWidth(0.3)
  const footerLineY = doc.internal.pageSize.getHeight() - 12
  doc.line(margin, footerLineY, pageWidth - margin, footerLineY)

  doc.setTextColor(INK_500.r, INK_500.g, INK_500.b)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(
    `Sumula oficial v${version} · Federacao Gaucha de Basketball · Documento imutavel`,
    pageWidth / 2,
    footerLineY + 4,
    { align: 'center' },
  )
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, footerLineY + 8, {
    align: 'center',
  })

  const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer
  return Buffer.from(arrayBuffer)
}

// ─────────────── Upload + version update ───────────────

export async function generateAndUploadSumulaPdf(input: {
  gameId: string
  version: number
  reportVersionId: string
  publicBaseUrl?: string
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const { gameId, version, reportVersionId } = input

  try {
    const game = await loadSumulaData(gameId)
    if (!game) return { ok: false, error: 'Jogo nao encontrado' }

    const baseUrl =
      input.publicBaseUrl ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'https://fgb-app.vercel.app'
    const verifyUrl = `${baseUrl}/jogos/${gameId}?v=${version}`

    const buffer = await buildSumulaPdfBuffer({ game, version, verifyUrl })

    const filename = `fgb/sumulas/${gameId}/v${version}-${Date.now()}.pdf`
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: 'application/pdf',
    })

    await prisma.gameOfficialReportVersion.update({
      where: { id: reportVersionId },
      data: { officialPdfUrl: blob.url },
    })

    // tambem atualiza GameOfficialReport.officialPdfUrl pra refletir versao atual
    await prisma.gameOfficialReport.updateMany({
      where: { gameId },
      data: { officialPdfUrl: blob.url },
    })

    return { ok: true, url: blob.url }
  } catch (err: any) {
    console.error('[generateAndUploadSumulaPdf] erro:', err)
    return { ok: false, error: err?.message ?? 'Erro ao gerar PDF' }
  }
}
