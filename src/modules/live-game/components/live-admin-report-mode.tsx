'use client'

import { SumulaEletronicoView } from './sumula-eletronico-view'

type LiveAdminReportModeProps = {
  data: any
}

export function LiveAdminReportMode({ data }: LiveAdminReportModeProps) {
  return <SumulaEletronicoView data={data} />
}
