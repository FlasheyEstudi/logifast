import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const ANCHO = 226; // 80mm térmico

const dinero = (n: number) => `C$ ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function linea(doc: PDFKit.PDFDocument, texto: string, opts: { bold?: boolean; centro?: boolean; tamano?: number; gris?: boolean } = {}) {
  const { bold = false, centro = false, tamano = 10, gris = false } = opts;
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(tamano).fillColor(gris ? '#555555' : '#000000');
  if (centro) doc.text(texto, { align: 'center', width: ANCHO - 24, lineGap: 2 });
  else doc.text(texto, { width: ANCHO - 24, lineGap: 2 });
}

function separador(doc: PDFKit.PDFDocument) {
  doc.moveDown(0.4);
  doc.moveTo(12, doc.y).lineTo(ANCHO - 12, doc.y).dash(2, { space: 2 }).stroke();
  doc.undash();
  doc.moveDown(0.4);
}

/**
 * GET /api/cliente/facturas/[id]/pdf — factura térmica de una compra (solicitud de envío) del cliente.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return new NextResponse('No autorizado', { status: 401 });

  const { id } = await params;
  const s = await db.solicitudEnvio.findUnique({ where: { id } });
  if (!s || s.clienteId !== user.id) {
    return new NextResponse('Factura no encontrada', { status: 404 });
  }

  const doc = new PDFDocument({ size: [ANCHO, 500], margin: 12 });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const fin = new Promise<Buffer>((res) => doc.on('end', () => res(Buffer.concat(chunks))));

  linea(doc, 'LOGIFAST', { bold: true, centro: true, tamano: 13 });
  linea(doc, 'Tu logística y delivery de confianza', { centro: true, gris: true, tamano: 8 });
  separador(doc);
  linea(doc, 'FACTURA DE SERVICIO', { bold: true, centro: true, tamano: 12 });
  linea(doc, `Fecha: ${s.createdAt.toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' })}`, { centro: true, gris: true });
  separador(doc);
  linea(doc, 'Recogida:', { bold: true, tamano: 9 });
  linea(doc, s.origen, { gris: true, tamano: 9 });
  linea(doc, 'Entrega:', { bold: true, tamano: 9 });
  linea(doc, s.destino, { gris: true, tamano: 9 });
  separador(doc);
  linea(doc, `TOTAL   ${dinero(s.monto)}`, { bold: true, tamano: 13 });
  linea(doc, `Pago: ${s.metodoPago === 'efectivo' ? 'Efectivo' : s.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Transferencia'}`, { gris: true });
  separador(doc);
  linea(doc, '¡Gracias por usar LogiFast!', { centro: true, bold: true });
  linea(doc, 'Conservar esta factura para reclamos.', { centro: true, gris: true, tamano: 8 });

  doc.end();
  const buf = await fin;

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="factura-${s.id.slice(-8)}.pdf"`,
    },
  });
}
