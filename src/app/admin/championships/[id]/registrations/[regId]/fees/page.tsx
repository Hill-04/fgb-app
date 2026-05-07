'use client'

import { useParams } from 'next/navigation'

import { RegistrationFeesClient } from '@/components/registration-fees-client'

export default function AdminRegistrationFeesPage() {
  const params = useParams()

  return (
    <RegistrationFeesClient
      mode="admin"
      championshipId={params.id as string}
      registrationId={params.regId as string}
    />
  )
}
