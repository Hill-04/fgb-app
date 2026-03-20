'use client'

import dynamic from 'next/dynamic'

const ExportStandingsButtons = dynamic(
  () => import('./ExportStandingsButtons').then(mod => mod.ExportStandingsButtons),
  { ssr: false, loading: () => null }
)

export { ExportStandingsButtons }
