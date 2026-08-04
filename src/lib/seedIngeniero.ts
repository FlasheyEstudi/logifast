import { db as prisma } from './db';

export async function seedIngeniero() {
  const count = await prisma.moto.count();
  if (count > 0) return;

  // Seed Motos
  const motos = [
    { id: 'moto01', nombre: 'Moto-01', modelo: 'Honda Wave 110', placa: 'M 4521', anio: 2024, color: 'var(--text)', kmAcumulados: 15230, estado: 'EN_SERVICIO', asignadaA: 'rep001' },
    { id: 'moto02', nombre: 'Moto-02', modelo: 'Honda Wave 110', placa: 'M 4522', anio: 2024, color: '#FF5722', kmAcumulados: 18750, estado: 'EN_SERVICIO', asignadaA: 'rep002' },
    { id: 'moto03', nombre: 'Moto-03', modelo: 'Honda Wave 110', placa: 'M 4523', anio: 2023, color: '#2979FF', kmAcumulados: 12450, estado: 'DISPONIBLE', asignadaA: null },
    { id: 'moto04', nombre: 'Moto-04', modelo: 'Yamaha YBR 125', placa: 'M 5100', anio: 2025, color: '#00C853', kmAcumulados: 8900, estado: 'DISPONIBLE', asignadaA: null },
    { id: 'moto05', nombre: 'Moto-05', modelo: 'Honda Wave 110', placa: 'M 4525', anio: 2023, color: '#8B5CF6', kmAcumulados: 22100, estado: 'EN_MANTENIMIENTO', asignadaA: null },
    { id: 'moto06', nombre: 'Moto-06', modelo: 'Yamaha YBR 125', placa: 'M 5101', anio: 2025, color: '#FFB300', kmAcumulados: 5600, estado: 'EN_SERVICIO', asignadaA: 'rep003' },
    { id: 'moto07', nombre: 'Moto-07', modelo: 'Honda Wave 110', placa: 'M 4527', anio: 2022, color: '#FF1744', kmAcumulados: 31500, estado: 'FUERA_SERVICIO', asignadaA: null },
    { id: 'moto08', nombre: 'Moto-08', modelo: 'Honda Wave 110', placa: 'M 4528', anio: 2024, color: '#3949AB', kmAcumulados: 11200, estado: 'DISPONIBLE', asignadaA: null },
    { id: 'moto09', nombre: 'Moto-09', modelo: 'Yamaha YBR 125', placa: 'M 5102', anio: 2025, color: '#00897B', kmAcumulados: 3200, estado: 'DISPONIBLE', asignadaA: null },
    { id: 'moto10', nombre: 'Moto-10', modelo: 'Honda Wave 110', placa: 'M 4530', anio: 2023, color: '#5C6BC0', kmAcumulados: 19800, estado: 'DISPONIBLE', asignadaA: null },
    { id: 'moto11', nombre: 'Moto-11', modelo: 'Honda Wave 110', placa: 'M 4531', anio: 2024, color: '#E64A19', kmAcumulados: 9500, estado: 'DISPONIBLE', asignadaA: null },
    { id: 'moto12', nombre: 'Moto-12', modelo: 'Yamaha YBR 125', placa: 'M 5103', anio: 2025, color: '#7CB342', kmAcumulados: 1800, estado: 'DISPONIBLE', asignadaA: null }
  ];

  for (const m of motos) {
    await prisma.moto.create({ data: m });
  }

  // Seed Repuestos
  const repuestos = [
    { id: 'rep001', nombre: 'Aceite 10W-40 1L', categoria: 'ACEITE', sku: 'ACE-1040-1L', precioUnitario: 250, stock: 15, stockMinimo: 8, unidad: 'litro', compatibleCon: JSON.stringify(['Honda Wave 110', 'Yamaha YBR 125']), proveedor: 'Lubricantes SA', ubicacion: 'Estante A-1' },
    { id: 'rep002', nombre: 'Filtro de aceite Honda', categoria: 'ACEITE', sku: 'FIL-ACE-HW', precioUnitario: 200, stock: 6, stockMinimo: 5, unidad: 'pza', compatibleCon: JSON.stringify(['Honda Wave 110']), proveedor: 'Honda Parts', ubicacion: 'Estante A-1' },
    { id: 'rep003', nombre: 'Pastillas de freno delanteras', categoria: 'FRENO', sku: 'FRE-PAS-D', precioUnitario: 350, stock: 3, stockMinimo: 5, unidad: 'juego', compatibleCon: JSON.stringify(['Honda Wave 110']), proveedor: 'Frenos Express', ubicacion: 'Estante B-2' },
    { id: 'rep004', nombre: 'Kit cadena 428H', categoria: 'CADENA', sku: 'CAD-428H', precioUnitario: 550, stock: 4, stockMinimo: 3, unidad: 'juego', compatibleCon: JSON.stringify(['Honda Wave 110', 'Yamaha YBR 125']), proveedor: 'Cadenas MX', ubicacion: 'Estante C-1' },
    { id: 'rep005', nombre: 'Neumatico trasero 90/90-18', categoria: 'LLANTA', sku: 'LLA-9090-18', precioUnitario: 1200, stock: 2, stockMinimo: 3, unidad: 'pza', compatibleCon: JSON.stringify(['Honda Wave 110']), proveedor: 'Llantas SA', ubicacion: 'Bodega 1' },
    { id: 'rep006', nombre: 'Bujia CR7HSA', categoria: 'ELECTRICO', sku: 'BUJ-CR7H', precioUnitario: 80, stock: 20, stockMinimo: 10, unidad: 'pza', compatibleCon: JSON.stringify(['Honda Wave 110', 'Yamaha YBR 125']), proveedor: 'NGK', ubicacion: 'Estante D-1' },
    { id: 'rep007', nombre: 'Filtro de aire Honda', categoria: 'ACEITE', sku: 'FIL-AIR-HW', precioUnitario: 180, stock: 4, stockMinimo: 5, unidad: 'pza', compatibleCon: JSON.stringify(['Honda Wave 110']), proveedor: 'Honda Parts', ubicacion: 'Estante A-2' },
    { id: 'rep008', nombre: 'Piñon 15T', categoria: 'CADENA', sku: 'CAD-PIN-15', precioUnitario: 300, stock: 5, stockMinimo: 3, unidad: 'pza', compatibleCon: JSON.stringify(['Honda Wave 110']), proveedor: 'Cadenas MX', ubicacion: 'Estante C-1' },
    { id: 'rep009', nombre: 'Aceite 20W-50 1L', categoria: 'ACEITE', sku: 'ACE-2050-1L', precioUnitario: 280, stock: 2, stockMinimo: 6, unidad: 'litro', compatibleCon: JSON.stringify(['Yamaha YBR 125']), proveedor: 'Lubricantes SA', ubicacion: 'Estante A-1' },
    { id: 'rep010', nombre: 'Cable de clutch Honda', categoria: 'GENERAL', sku: 'GEN-CLT-HW', precioUnitario: 150, stock: 7, stockMinimo: 4, unidad: 'pza', compatibleCon: JSON.stringify(['Honda Wave 110']), proveedor: 'Honda Parts', ubicacion: 'Estante E-1' }
  ];

  for (const r of repuestos) {
    await prisma.repuesto.create({ data: r });
  }

  // Seed Alertas
  const alertas = [
    { id: 'alert001', motoId: 'moto02', tipo: 'KM', descripcion: 'Cambio de aceite proximo: faltan 250 km', kmTrigger: 19000, fechaTrigger: null, activa: true },
    { id: 'alert002', motoId: 'moto05', tipo: 'AMBOS', descripcion: 'Mantenimiento correctivo en proceso', kmTrigger: null, fechaTrigger: null, activa: true },
    { id: 'alert003', motoId: 'moto07', tipo: 'FECHA', descripcion: 'Falla de motor: requiere atencion URGENTE', kmTrigger: null, fechaTrigger: new Date('2026-06-17'), activa: true },
    { id: 'alert004', motoId: 'moto10', tipo: 'KM', descripcion: 'Cambio de aceite: faltan 200 km para 22000', kmTrigger: 22000, fechaTrigger: null, activa: true },
    { id: 'alert005', motoId: 'moto01', tipo: 'FECHA', descripcion: 'Revision general programada para 10 Jul', kmTrigger: null, fechaTrigger: new Date('2026-07-10'), activa: true }
  ];

  for (const a of alertas) {
    await prisma.alertaMantenimiento.create({ data: a });
  }

  // Seed Mantenimientos
  const mantenimientos = [
    {
      id: 'mant001', motoId: 'moto05', tipo: 'CORRECTIVO', categoria: 'LLANTA', descripcion: 'Cambio de neumatico trasero desgastado',
      observaciones: 'Neumatico con desgaste irregular, posible problema de alineacion',
      kmAlMomento: 22100, costoManoObra: 300, costoRepuestos: 1200, costoTotal: 1500,
      estado: 'EN_PROCESO', prioridad: 'ALTA',
      programadoPara: new Date('2026-06-15'), iniciadoEn: new Date('2026-06-15T09:00:00'), completadoEn: null,
      createdAt: new Date('2026-06-14')
    },
    {
      id: 'mant002', motoId: 'moto02', tipo: 'PREVENTIVO', categoria: 'CAMBIO_ACEITE', descripcion: 'Cambio de aceite y filtro programado',
      observaciones: null, kmAlMomento: 18500, costoManoObra: 200, costoRepuestos: 450, costoTotal: 650,
      estado: 'PROGRAMADO', prioridad: 'NORMAL',
      programadoPara: new Date('2026-06-20'), iniciadoEn: null, completadoEn: null,
      createdAt: new Date('2026-06-10')
    },
    {
      id: 'mant003', motoId: 'moto07', tipo: 'EMERGENCIA', categoria: 'MOTOR', descripcion: 'Falla de motor - ruido anormal en valvulas',
      observaciones: 'Requiere diagnostico completo. Posible cambio de piston y anillos.',
      kmAlMomento: 31500, costoManoObra: 2500, costoRepuestos: 4500, costoTotal: 7000,
      estado: 'PROGRAMADO', prioridad: 'URGENTE',
      programadoPara: new Date('2026-06-17'), iniciadoEn: null, completadoEn: null,
      createdAt: new Date('2026-06-15')
    },
    {
      id: 'mant004', motoId: 'moto01', tipo: 'PREVENTIVO', categoria: 'FRENO', descripcion: 'Revision y ajuste de frenos delanteros',
      observaciones: null, kmAlMomento: 15000, costoManoObra: 150, costoRepuestos: 0, costoTotal: 150,
      estado: 'COMPLETADO', prioridad: 'NORMAL',
      programadoPara: new Date('2026-06-01'), iniciadoEn: new Date('2026-06-01T10:00:00'), completadoEn: new Date('2026-06-01T11:30:00'),
      createdAt: new Date('2026-05-28')
    },
    {
      id: 'mant005', motoId: 'moto03', tipo: 'PREVENTIVO', categoria: 'CADENA', descripcion: 'Cambio de cadena y piñon',
      observaciones: 'Cadena estirada, piñon con dientes desgastados',
      kmAlMomento: 12000, costoManoObra: 400, costoRepuestos: 850, costoTotal: 1250,
      estado: 'COMPLETADO', prioridad: 'NORMAL',
      programadoPara: new Date('2026-05-25'), iniciadoEn: new Date('2026-05-25T08:00:00'), completadoEn: new Date('2026-05-25T10:00:00'),
      createdAt: new Date('2026-05-20')
    }
  ];

  for (const m of mantenimientos) {
    await prisma.mantenimiento.create({ data: m });
  }

  // Seed RepuestosUsados
  const repuestosUsados = [
    { id: 'ru001', mantenimientoId: 'mant001', repuestoId: 'rep005', cantidad: 1, precioUnitario: 1200, subtotal: 1200 },
    { id: 'ru002', mantenimientoId: 'mant002', repuestoId: 'rep001', cantidad: 1, precioUnitario: 250, subtotal: 250 },
    { id: 'ru003', mantenimientoId: 'mant002', repuestoId: 'rep002', cantidad: 1, precioUnitario: 200, subtotal: 200 },
    { id: 'ru004', mantenimientoId: 'mant005', repuestoId: 'rep004', cantidad: 1, precioUnitario: 550, subtotal: 550 },
    { id: 'ru005', mantenimientoId: 'mant005', repuestoId: 'rep008', cantidad: 1, precioUnitario: 300, subtotal: 300 }
  ];

  for (const ru of repuestosUsados) {
    await prisma.repuestoUsado.create({ data: ru });
  }
}
