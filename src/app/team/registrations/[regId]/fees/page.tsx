'use client'

import { useParams } from 'next/navigation'

import { RegistrationFeesClient } from '@/components/registration-fees-client'

export default function TeamRegistrationFeesPage() {
  const params = useParams()

  return (
    <RegistrationFeesClient
      mode="team"
      championshipId=""
      registrationId={params.regId as string}
    />
  )
}
