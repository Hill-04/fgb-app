import { NextResponse } from 'next/server'

import {
  ATHLETE_REQUEST_INCLUDE,
  AthleteRegistrationError,
  assertAthleteRequestStatus,
  createTeamAthleteRequest,
} from '@/lib/athlete-registration'
import { prisma } from '@/lib/db'
import { requireTeamSession } from '@/lib/athlete-registration-server'

export async function GET(request: Request) {
  const sessionData = await requireTeamSession()
  if (!sessionData) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const { teamId } = sessionData
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')?.trim()

  const requests = await prisma.athleteRegistrationRequest.findMany({
    where: {
      teamId,
      ...(status ? { status } : {}),
    },
    include: ATHLETE_REQUEST_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(requests)
}

export async function POST(request: Request) {
  const sessionData = await requireTeamSession()
  if (!sessionData) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const initialStatus = String(body.status || 'DRAFT').trim().toUpperCase()
    assertAthleteRequestStatus(initialStatus)

    if (!['DRAFT', 'SUBMITTED'].includes(initialStatus)) {
      throw new AthleteRegistrationError('A equipe so pode criar solicitacoes como rascunho ou enviadas.', 400)
    }

    const created = await createTeamAthleteRequest(
      sessionData.teamId,
      {
        fullName: body.fullName,
        birthDate: body.birthDate,
        documentNumber: body.documentNumber,
        motherName: body.motherName,
        phone: body.phone,
        email: body.email,
        requestedCategoryLabel: body.requestedCategoryLabel,
        cbbRegistrationNumber: body.cbbRegistrationNumber,
        // PM-06.N: dados pessoais
        sex: body.sex,
        nationality: body.nationality,
        maritalStatus: body.maritalStatus,
        education: body.education,
        // PM-06.N: documentos
        rg: body.rg,
        rgOrgan: body.rgOrgan,
        rgDate: body.rgDate,
        cpf: body.cpf,
        // PM-06.N: endereço
        cep: body.cep,
        state: body.state,
        city: body.city,
        address: body.address,
        addressNum: body.addressNum,
        addressComp: body.addressComp,
        // PM-06.N: filiação
        fatherName: body.fatherName,
        parentContactPhone: body.parentContactPhone,
        parentContactRole: body.parentContactRole,
        // PM-06.N: esportivo
        height: body.height,
        weight: body.weight,
        position: body.position,
        jerseyNumber: body.jerseyNumber,
        // PM-06.N: uploads
        photoUrl: body.photoUrl,
        docCPFFrontUrl: body.docCPFFrontUrl,
        docCPFBackUrl: body.docCPFBackUrl,
        docRGFrontUrl: body.docRGFrontUrl,
        docRGBackUrl: body.docRGBackUrl,
        docBirthCertUrl: body.docBirthCertUrl,
        docOtherUrl: body.docOtherUrl,
        initialStatus,
      },
      (sessionData.session.user as any)?.id || null
    )

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    const status = error instanceof AthleteRegistrationError ? error.status : 500
    return NextResponse.json({ error: error.message || 'Erro ao criar solicitacao.' }, { status })
  }
}
