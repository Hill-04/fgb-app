import { redirect } from 'next/navigation'

export default function AdminFeesLegacyRedirectPage() {
  redirect('/admin/financeiro/taxas')
}
