import { formatCurrencyCentsBRL, getInvoiceStatusLabel } from './finance'

export async function buildInvoicePdfBuffer(invoice: any) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  let y = 16

  doc.setFillColor(20, 85, 48)
  doc.rect(0, 0, pageWidth, 34, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text('FEDERACAO GAUCHA DE BASKETBALL', margin, y)
  y += 7
  doc.setFontSize(10)
  doc.text('Fatura oficial - Regimento financeiro FGB', margin, y)

  y = 48
  doc.setTextColor(20, 20, 20)
  doc.setFontSize(18)
  doc.text(`Fatura ${invoice.number}`, margin, y)
  doc.setFontSize(10)
  doc.text(`Status: ${getInvoiceStatusLabel(invoice.effectiveStatus || invoice.status)}`, pageWidth - margin, y, { align: 'right' })

  y += 12
  doc.setFontSize(10)
  doc.text(`Equipe: ${invoice.team?.name || '-'}`, margin, y)
  y += 6
  doc.text(`Campeonato: ${invoice.championship?.name || 'Nao vinculado'}`, margin, y)
  y += 6
  doc.text(`Emissao: ${new Date(invoice.issueDate).toLocaleDateString('pt-BR')}`, margin, y)
  doc.text(`Vencimento: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('pt-BR') : 'Sem vencimento'}`, pageWidth - margin, y, { align: 'right' })

  y += 14
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F')
  doc.setFontSize(9)
  doc.text('Item', margin + 2, y)
  doc.text('Qtd', 116, y)
  doc.text('Unit.', 132, y)
  doc.text('Total', pageWidth - margin - 2, y, { align: 'right' })
  y += 8

  for (const item of invoice.items || []) {
    if (y > 260) {
      doc.addPage()
      y = 18
    }

    const description = String(item.description || '-')
    const lines = doc.splitTextToSize(description, 92)
    doc.text(lines, margin + 2, y)
    doc.text(String(item.quantity || 1), 118, y)
    doc.text(formatCurrencyCentsBRL(item.unitValueCents || 0), 132, y)
    doc.text(formatCurrencyCentsBRL(item.totalCents || 0), pageWidth - margin - 2, y, { align: 'right' })
    y += Math.max(7, lines.length * 5)
  }

  y += 6
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8
  doc.setFontSize(11)
  doc.text('Subtotal', 122, y)
  doc.text(formatCurrencyCentsBRL(invoice.subtotalCents || 0), pageWidth - margin - 2, y, { align: 'right' })
  y += 7
  doc.text('Desconto', 122, y)
  doc.text(formatCurrencyCentsBRL(invoice.discountCents || 0), pageWidth - margin - 2, y, { align: 'right' })
  y += 8
  doc.setFontSize(14)
  doc.text('Total', 122, y)
  doc.text(formatCurrencyCentsBRL(invoice.totalCents || 0), pageWidth - margin - 2, y, { align: 'right' })
  y += 8
  doc.setFontSize(11)
  doc.text('Saldo pendente', 122, y)
  doc.text(formatCurrencyCentsBRL(invoice.balanceCents || 0), pageWidth - margin - 2, y, { align: 'right' })

  if (invoice.notes) {
    y += 14
    doc.setFontSize(10)
    doc.text('Observacoes', margin, y)
    y += 6
    doc.text(doc.splitTextToSize(String(invoice.notes), pageWidth - margin * 2), margin, y)
  }

  doc.setFontSize(8)
  doc.setTextColor(110, 110, 110)
  doc.text('Documento gerado pelo FGB App. Valores em reais (BRL).', margin, 288)

  return Buffer.from(doc.output('arraybuffer'))
}
