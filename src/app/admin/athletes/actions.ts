'use server'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

export async function createAthlete(formData: FormData) {
  const name        = String(formData.get('name')        || '').trim()
  const document    = String(formData.get('document')    || '').trim()
  const teamId      = String(formData.get('teamId')      || '').trim()
  const position    = String(formData.get('position')    || '').trim()
  const jerseyRaw   = formData.get('jerseyNumber')
  const sex         = String(formData.get('sex')         || '').trim()
  const birthDate   = String(formData.get('birthDate')   || '').trim()
  const photoUrl    = String(formData.get('photoUrl')    || '').trim()

  if (!name) return

  await prisma.athlete.create({
    data: {
      name,
      document:        document     || null,
      teamId:          teamId       || null,
      position:        position     || null,
      jerseyNumber:    jerseyRaw ? Number(jerseyRaw) : null,
      sex:             sex          || null,
      birthDate:       birthDate    ? new Date(birthDate) : null,
      photoUrl:        photoUrl     || null,
      federationStatus: 'ACTIVE',
    }
  })
  revalidatePath('/admin/athletes')
}

export async function updateAthlete(formData: FormData) {
  const id          = String(formData.get('id')          || '').trim()
  const name        = String(formData.get('name')        || '').trim()
  const document    = String(formData.get('document')    || '').trim()
  const teamId      = String(formData.get('teamId')      || '').trim()
  const position    = String(formData.get('position')    || '').trim()
  const jerseyRaw   = formData.get('jerseyNumber')
  const sex         = String(formData.get('sex')         || '').trim()
  const birthDate   = String(formData.get('birthDate')   || '').trim()
  const photoUrl    = String(formData.get('photoUrl')    || '').trim()

  if (!id || !name) return

  await prisma.athlete.update({
    where: { id },
    data: {
      name,
      document:     document     || null,
      teamId:       teamId       || null,
      position:     position     || null,
      jerseyNumber: jerseyRaw !== null && jerseyRaw !== '' ? Number(jerseyRaw) : null,
      sex:          sex          || null,
      birthDate:    birthDate    ? new Date(birthDate) : null,
      photoUrl:     photoUrl     || null,
    }
  })
  revalidatePath('/admin/athletes')
  revalidatePath(`/admin/athletes/${id}`)
}

export async function toggleFederationStatus(formData: FormData) {
  const id      = String(formData.get('id')      || '').trim()
  const current = String(formData.get('current') || '').trim()
  if (!id) return

  const next = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  await prisma.athlete.update({
    where: { id },
    data: { federationStatus: next }
  })
  revalidatePath('/admin/athletes')
  revalidatePath(`/admin/athletes/${id}`)
}

export async function issueCard(formData: FormData) {
  const athleteId = String(formData.get('athleteId') || '').trim()
  if (!athleteId) return

  const token      = randomUUID()
  const cardNumber = `FGB-${Date.now().toString(36).toUpperCase()}`

  await prisma.athleteIdCard.create({
    data: { athleteId, qrToken: token, cardNumber }
  })
  revalidatePath('/admin/athletes')
  revalidatePath(`/admin/athletes/${athleteId}`)
}
