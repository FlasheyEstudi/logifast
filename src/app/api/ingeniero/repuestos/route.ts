import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db as prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';
import { seedIngeniero } from '@/lib/seedIngeniero';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  nombre: z.string().min(1, 'nombre requerido').max(200),
  categoria: z.string().min(1).default('GENERAL'),
  sku: z.string().max(50).optional().nullable(),
  precioUnitario: z.union([z.number(), z.string()]).optional(),
  stock: z.union([z.number().int().min(0), z.string()]).optional(),
  stockMinimo: z.union([z.number().int().min(0), z.string()]).optional(),
  unidad: z.string().max(20).optional(),
  compatibleCon: z.union([z.array(z.string()), z.string()]).optional(),
  proveedor: z.string().max(200).optional().nullable(),
  ubicacion: z.string().max(200).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole('ingeniero', 'admin');
    await seedIngeniero();
    const repuestos = await prisma.repuesto.findMany({
      orderBy: { nombre: 'asc' }
    });

    const formatted = repuestos.map(r => {
      let compatibleCon = [];
      try {
        compatibleCon = Array.isArray(r.compatibleCon) ? r.compatibleCon : JSON.parse(r.compatibleCon || '[]');
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
    return handleError(error, 'INGENIERO_REPUESTOS_GET');
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole('ingeniero', 'admin');
    const data = await req.json();
    const parsed = postSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    const compatibleConStr = Array.isArray(data.compatibleCon)
      ? JSON.stringify(data.compatibleCon)
      : typeof data.compatibleCon === 'string'
      ? data.compatibleCon
      : '[]';

    const repuesto = await prisma.repuesto.create({
      data: {
        nombre: data.nombre,
        categoria: (data.categoria || 'GENERAL').toUpperCase(),
        sku: data.sku || `SKU-${Date.now().toString().slice(-6)}`,
        precioUnitario: parseFloat(data.precioUnitario) || 0,
        stock: parseInt(data.stock) || 0,
        stockMinimo: parseInt(data.stockMinimo) || 5,
        unidad: data.unidad || 'pza',
        compatibleCon: compatibleConStr,
        proveedor: data.proveedor || null,
        ubicacion: data.ubicacion || null,
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
    return handleError(error, 'INGENIERO_REPUESTOS_POST');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole('ingeniero', 'admin');
    const body = await req.json();
    const { id, stock, nombre, categoria, sku, precioUnitario, stockMinimo, unidad, proveedor, ubicacion, compatibleCon } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const updateData: any = {};
    if (stock !== undefined) updateData.stock = parseInt(stock) || 0;
    if (nombre !== undefined) updateData.nombre = nombre;
    if (categoria !== undefined) updateData.categoria = String(categoria).toUpperCase();
    if (sku !== undefined) updateData.sku = sku;
    if (precioUnitario !== undefined) updateData.precioUnitario = parseFloat(precioUnitario) || 0;
    if (stockMinimo !== undefined) updateData.stockMinimo = parseInt(stockMinimo) || 5;
    if (unidad !== undefined) updateData.unidad = unidad;
    if (proveedor !== undefined) updateData.proveedor = proveedor;
    if (ubicacion !== undefined) updateData.ubicacion = ubicacion;
    if (compatibleCon !== undefined) {
      updateData.compatibleCon = Array.isArray(compatibleCon) ? JSON.stringify(compatibleCon) : String(compatibleCon);
    }

    const repuesto = await prisma.repuesto.update({
      where: { id },
      data: updateData,
    });

    let compat = [];
    try {
      compat = JSON.parse(repuesto.compatibleCon);
    } catch (e) {
      compat = [];
    }

    return NextResponse.json({
      ...repuesto,
      compatibleCon: compat,
      bajoStock: repuesto.stock <= repuesto.stockMinimo
    });
  } catch (error) {
    return handleError(error, 'INGENIERO_REPUESTOS_PATCH');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole('ingeniero', 'admin');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    await prisma.repuesto.delete({
      where: { id }
    });

    return NextResponse.json({ ok: true, message: 'Repuesto eliminado exitosamente' });
  } catch (error) {
    return handleError(error, 'INGENIERO_REPUESTOS_DELETE');
  }
}

