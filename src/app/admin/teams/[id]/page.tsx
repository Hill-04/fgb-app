import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { TeamDetailClient } from './TeamDetailClient'
import type { DrawerAthlete } from '@/components/AthleteDrawer'

export const dynamic = 'force-dynamic'

export default async function AdminTeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  })

  if (!team) notFound()

  const athletesRaw = await prisma.athlete.findMany({
    where: { teamId: id },
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
    include: {
      registrationRequests: {
        where: { status: 'APPROVED' },
        orderBy: { approvedAt: 'desc' },
        take: 1,
        select: { requestedCategoryLabel: true },
      },
    },
  })

  const athletes: DrawerAthlete[] = athletesRaw.map((a) => ({
    id: a.id,
    name: a.name,
    photoUrl: a.photoUrl,
    status: a.status,
    federationStatus: a.federationStatus,
    situation: a.situation,
    registrationNumber: a.registrationNumber,
    registrationCBB: a.registrationCBB,
    registrationPrev: a.registrationPrev,
    filiationDate: a.filiationDate,
    birthDate: a.birthDate,
    birthCity: a.birthCity,
    sex: a.sex,
    nationality: a.nationality,
    maritalStatus: a.maritalStatus,
    education: a.education,
    position: a.position,
    jerseyNumber: a.jerseyNumber,
    height: a.height,
    weight: a.weight,
    document: a.document,
    cpf: a.cpf,
    rg: a.rg,
    rgOrgan: a.rgOrgan,
    rgDate: a.rgDate,
    email: (a as any).email ?? null,
    mobile: a.mobile,
    phone: a.phone,
    cep: a.cep,
    state: a.state,
    city: a.city,
    address: a.address,
    addressNum: a.addressNum,
    addressComp: a.addressComp,
    motherName: a.motherName,
    fatherName: a.fatherName,
    notes: a.notes,
    docCPFUrl: a.docCPFUrl,
    docRGFrontUrl: a.docRGFrontUrl,
    docRGBackUrl: a.docRGBackUrl,
    docBirthCertUrl: a.docBirthCertUrl,
    docOtherUrl: a.docOtherUrl,
    category: a.registrationRequests[0]?.requestedCategoryLabel ?? null,
  }))

  return <TeamDetailClient team={team} athletes={athletes} />
}
