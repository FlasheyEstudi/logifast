import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const repuestos = await prisma.repuesto.findMany({
      orderBy: { nombre: 'asc' }
    });

    const formatted = repuestos.map(r => {
      let compatibleCon = [];
      try {
        compatibleCon = JSON.parse(r.compatibleCon);
      } catch (e) {
        compatibleCon = [];
      }
      return {
        ...r,
        compatibleCon,
        bajoStock: r.stock <= r.stockMinimo
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[INGENIERO_REPUESTOS_GET]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const repuesto = await prisma.repuesto.create({
      data: {
        nombre: data.nombre,
        categoria: data.categoria,
        sku: data.sku,
        precioUnitario: parseFloat(data.precioUnitario) || 0,
        stock: parseInt(data.stock) || 0,
        stockMinimo: parseInt(data.stockMinimo) || 5,
        unidad: data.unidad || 'pza',
        compatibleCon: JSON.stringify(data.compatibleCon || []),
        proveedor: data.proveedor,
        ubicacion: data.ubicacion
      }
    });

    let compatibleCon = [];
    try {
      compatibleCon = JSON.parse(repuesto.compatibleCon);
    } catch (e) {
      compatibleCon = [];
    }

    return NextResponse.json({
      ...repuesto,
      compatibleCon,
      bajoStock: repuesto.stock <= repuesto.stockMinimo
    }, { status: 201 });
  } catch (error) {
    console.error('[INGENIERO_REPUESTOS_POST]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, stock } = body;

    const repuesto = await prisma.repuesto.update({
      where: { id },
      data: { stock: parseInt(stock) || 0 }
    });

    let compatibleCon = [];
    try {
      compatibleCon = JSON.parse(repuesto.compatibleCon);
    } catch (e) {
      compatibleCon = [];
    }

    return NextResponse.json({
      ...repuesto,
      compatibleCon,
      bajoStock: repuesto.stock <= repuesto.stockMinimo
    });
  } catch (error) {
    console.error('[INGENIERO_REPUESTOS_PATCH]', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

