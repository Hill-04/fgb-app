const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching teams...');
  const teams = await prisma.team.findMany({
    select: { id: true, name: true }
  });
  console.log('Teams found:', JSON.stringify(teams, null, 2));
}

main()
  .catch(e => {
    console.error('Error fetching teams:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
