import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db as prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  nombre: z.string().min(1, 'nombre requerido').max(200),
  categoria: z.enum(['ACEITE', 'FRENO', 'LLANTA', 'CADENA', 'ELECTRICO', 'MOTOR', 'OTRO']),
  sku: z.string().max(50).optional().nullable(),
  precioUnitario: z.union([z.number(), z.string()]).optional(),
  stock: z.union([z.number().int().min(0), z.string()]).optional(),
  stockMinimo: z.union([z.number().int().min(0), z.string()]).optional(),
  unidad: z.string().max(20).optional(),
  compatibleCon: z.array(z.string()).optional(),
  proveedor: z.string().max(200).optional().nullable(),
  ubicacion: z.string().max(200).optional().nullable(),
});

const patchSchema = z.object({
  id: z.string().min(1, 'id requerido'),
  stock: z.union([z.number().int().min(0), z.string()]).optional(),
});

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
    return handleError(error, 'INGENIERO_REPUESTOS_GET');
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('ingeniero', 'admin');
    const data = await req.json();
    const parsed = postSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

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
    return handleError(error, 'INGENIERO_REPUESTOS_POST');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireRole('ingeniero', 'admin');
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
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
    return handleError(error, 'INGENIERO_REPUESTOS_PATCH');
  }
}

