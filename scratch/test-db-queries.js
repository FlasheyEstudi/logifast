const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('--- TESTING PRISMA QUERIES FOR INGENIERO ---');
  try {
    const count = await prisma.moto.count();
    console.log(`Moto count: ${count}`);
    
    console.log('Testing motos query...');
    const motos = await prisma.moto.findMany({
      include: {
        mantenimientos: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        alertas: {
          where: { activa: true }
        },
        _count: {
          select: { alertas: { where: { activa: true } } }
        }
      },
      orderBy: { nombre: 'asc' }
    });
    console.log(`Motos query succeeded. Returned ${motos.length} motos.`);

    console.log('Testing stats query...');
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [motosStats, mantenimientosMes, alertasCount, repuestos] = await Promise.all([
      prisma.moto.groupBy({
        by: ['estado'],
        _count: true
      }),
      prisma.mantenimiento.findMany({
        where: { createdAt: { gte: inicioMes } }
      }),
      prisma.alertaMantenimiento.count({ where: { activa: true } }),
      prisma.repuesto.findMany()
    ]);
    console.log('Stats queries succeeded.');
    console.log('motosStats:', motosStats);
    console.log('mantenimientosMes count:', mantenimientosMes.length);
    console.log('alertasCount:', alertasCount);
    console.log('repuestos count:', repuestos.length);

  } catch (err) {
    console.error('QUERY FAILED:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
