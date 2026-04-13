'use client'

import { useRouter } from 'next/navigation'
import { AISchedulingModal } from '@/components/AISchedulingModal'

type OrganizationPlannerClientProps = {
  championshipId: string
  championshipName: string
}

export function OrganizationPlannerClient({
  championshipId,
  championshipName,
}: OrganizationPlannerClientProps) {
  const router = useRouter()

  return (
    <AISchedulingModal
      championshipId={championshipId}
      championshipName={championshipName}
      onClose={() => router.refresh()}
      onApplied={() => router.push(`/admin/championships/${championshipId}/matches`)}
      variant="page"
    />
  )
}
