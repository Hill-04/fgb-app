'use server'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

function str(v: FormDataEntryValue | null) {
  return String(v ?? '').trim() || null
}
function num(v: FormDataEntryValue | null) {
  const s = String(v ?? '').trim()
  return s ? Number(s) : null
}
function flt(v: FormDataEntryValue | null) {
  const s = String(v ?? '').trim()
  return s ? parseFloat(s) : null
}
function dt(v: FormDataEntryValue | null) {
  const s = String(v ?? '').trim()
  return s ? new Date(s) : null
}

export async function createAthlete(formData: FormData) {
  const name = str(formData.get('name'))
  if (!name) return

  await prisma.athlete.create({
    data: {
      name,
      document:     str(formData.get('document')),
      teamId:       str(formData.get('teamId')),
      position:     str(formData.get('position')),
      jerseyNumber: num(formData.get('jerseyNumber')),
      sex:          str(formData.get('sex')),
      birthDate:    dt(formData.get('birthDate')),
      photoUrl:     str(formData.get('photoUrl')),
      federationStatus: 'ACTIVE',
    },
  })
  revalidatePath('/admin/athletes')
}

export async function updateAthlete(formData: FormData) {
  const id   = str(formData.get('id'))
  const name = str(formData.get('name'))
  if (!id || !name) return

  await prisma.athlete.update({
    where: { id },
    data: {
      // Identificação
      name,
      registrationNumber: num(formData.get('registrationNumber')),
      registrationPrev:   str(formData.get('registrationPrev')),
      registrationCBB:    str(formData.get('registrationCBB')),
      teamId:             str(formData.get('teamId')),
      situation:          str(formData.get('situation')) ?? 'ACTIVE',
      // Pessoal
      birthDate:          dt(formData.get('birthDate')),
      birthCity:          str(formData.get('birthCity')),
      sex:                str(formData.get('sex')),
      nationality:        str(formData.get('nationality')),
      maritalStatus:      str(formData.get('maritalStatus')),
      education:          str(formData.get('education')),
      // Posição
      position:           str(formData.get('position')),
      jerseyNumber:       num(formData.get('jerseyNumber')),
      height:             flt(formData.get('height')),
      weight:             flt(formData.get('weight')),
      // Documentos
      cpf:                str(formData.get('cpf')),
      rg:                 str(formData.get('rg')),
      rgOrgan:            str(formData.get('rgOrgan')),
      rgDate:             dt(formData.get('rgDate')),
      // Contato
      email:              str(formData.get('email')),
      mobile:             str(formData.get('mobile')),
      phone:              str(formData.get('phone')),
      // Endereço
      cep:                str(formData.get('cep')),
      state:              str(formData.get('state')),
      city:               str(formData.get('city')),
      address:            str(formData.get('address')),
      addressNum:         str(formData.get('addressNum')),
      addressComp:        str(formData.get('addressComp')),
      // Família
      motherName:         str(formData.get('motherName')),
      fatherName:         str(formData.get('fatherName')),
      // Notas
      notes:              str(formData.get('notes')),
      // Fotos e documentos digitais
      ...(formData.has('photoUrl')       && { photoUrl:       str(formData.get('photoUrl'))       }),
      ...(formData.has('docCPFUrl')      && { docCPFUrl:      str(formData.get('docCPFUrl'))      }),
      ...(formData.has('docRGFrontUrl')  && { docRGFrontUrl:  str(formData.get('docRGFrontUrl'))  }),
      ...(formData.has('docRGBackUrl')   && { docRGBackUrl:   str(formData.get('docRGBackUrl'))   }),
      ...(formData.has('docBirthCertUrl')&& { docBirthCertUrl:str(formData.get('docBirthCertUrl'))}),
      ...(formData.has('docOtherUrl')    && { docOtherUrl:    str(formData.get('docOtherUrl'))    }),
    },
  })
  revalidatePath('/admin/athletes')
  revalidatePath(`/admin/athletes/${id}`)
}

export async function toggleFederationStatus(formData: FormData) {
  const id      = str(formData.get('id'))
  const current = str(formData.get('current'))
  if (!id) return

  await prisma.athlete.update({
    where: { id },
    data: { federationStatus: current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
  })
  revalidatePath('/admin/athletes')
  revalidatePath(`/admin/athletes/${id}`)
}

export async function issueCard(formData: FormData) {
  const athleteId = str(formData.get('athleteId'))
  if (!athleteId) return

  await prisma.athleteIdCard.create({
    data: {
      athleteId,
      qrToken:    randomUUID(),
      cardNumber: `FGB-${Date.now().toString(36).toUpperCase()}`,
    },
  })
  revalidatePath('/admin/athletes')
  revalidatePath(`/admin/athletes/${athleteId}`)
}
