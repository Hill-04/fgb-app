import {
  cleanupFixtureData,
  createPrismaClient,
  logFixtureFooter,
  logFixtureHeader,
  requireFixtureGuard,
} from './live-fiba-fixture-utils'

async function main() {
  requireFixtureGuard()

  const { prisma, target } = createPrismaClient()

  try {
    logFixtureHeader('cleanup', target)

    const result = await cleanupFixtureData(prisma)

    console.log(`ids removidos: ${result.removedIds.length > 0 ? result.removedIds.join(', ') : 'nenhum'}`)
    console.log(`ids retidos: ${result.retainedIds.length > 0 ? result.retainedIds.join(', ') : 'nenhum'}`)
    console.log(`fixture championship: ${result.state.championship?.id ?? 'nao encontrado'}`)
    console.log(
      `fixture teams: ${result.state.teams.length > 0 ? result.state.teams.map((team) => team.id).join(', ') : 'nao encontradas'}`
    )
    console.log(`fixture admin: ${result.state.admin?.id ?? 'nao encontrado'}`)
    logFixtureFooter('cleanup')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('Erro ao limpar fixture live FIBA:', error)
  process.exit(1)
})
