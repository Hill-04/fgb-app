import { prisma } from '@/lib/db'

/**
 * "Season" no schema atual = ano da Championship mais recente que esteja em andamento
 * (ou já finalizada como fallback). Retornamos um objeto sintético compatível com o
 * shape antigo do Supabase para manter as páginas públicas funcionando sem alteração.
 */
export async function getActiveSeason() {
  const champ = await prisma.championship.findFirst({
    where: {
      isSimulation: false,
      status: { in: ['ONGOING', 'PLAYOFFS', 'REGISTRATION_OPEN', 'FINISHED'] },
    },
    orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    select: { year: true },
  }).catch(() => null)

  if (!champ) {
    const fallback = new Date().getFullYear()
    return { id: String(fallback), name: String(fallback), is_active: true }
  }

  return { id: String(champ.year), name: String(champ.year), is_active: true }
}
