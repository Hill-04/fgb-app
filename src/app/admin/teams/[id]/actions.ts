'use server'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

function str(v: FormDataEntryValue | null) {
  return String(v ?? '').trim() || null
}

export async function updateTeam(formData: FormData) {
  const id = str(formData.get('id'))
  const name = str(formData.get('name'))
  if (!id || !name) return

  await prisma.team.update({
    where: { id },
    data: {
      name,
      city:    str(formData.get('city')),
      state:   str(formData.get('state')),
      phone:   str(formData.get('phone')),
      sex:     str(formData.get('sex')),
      ...(formData.has('logoUrl') && { logoUrl: str(formData.get('logoUrl')) }),
    },
  })

  revalidatePath('/admin/teams')
  revalidatePath(`/admin/teams/${id}`)
}
