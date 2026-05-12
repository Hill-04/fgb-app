import { redirect } from 'next/navigation'

export default function TeamChampionshipsRedirect() {
  redirect('/team/campeonatos?tab=fgb')
}
