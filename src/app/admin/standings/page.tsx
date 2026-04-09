import { redirect } from 'next/navigation'

export default function AdminStandingsRedirect() {
  redirect('/admin/championships?info=standings')
}
