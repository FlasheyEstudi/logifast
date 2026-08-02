import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const deleted = await db.posicionRepartidor.deleteMany({
    where: {
      timestamp: { lt: yesterday },
    },
  });
  console.log(`[CLEANUP] Posiciones eliminadas anteriores a ${yesterday.toISOString()}: ${deleted.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
