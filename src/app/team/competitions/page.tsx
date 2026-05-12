import { redirect } from 'next/navigation'

export default function TeamCompetitionsRedirect() {
  redirect('/team/campeonatos?tab=externos')
}
