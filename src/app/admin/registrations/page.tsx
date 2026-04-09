import { redirect } from 'next/navigation'

export default function AdminRegistrationsRedirect() {
  redirect('/admin/championships?info=registrations')
}
