import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { rateLimit, getClientIP } from '@/lib/auth/rateLimit';
import { fail, isValidEmail, ok, tooManyRequests, validateLength } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  role?: 'cliente' | 'repartidor';
  telefono: string;
  cedula: string;
  municipio: string;
  departamento?: string;
  direccion?: string;
  lat?: number;
  lng?: number;
  fotoUrl: string; // Exigida obligatoriamente
  // Campos del Vehículo de Repartidor
  vehiculoTipo?: string;
  vehiculoMarca?: string;
  vehiculoModelo?: string;
  vehiculoAnio?: number;
  vehiculoColor?: string;
  vehiculoPlaca?: string;
  zonaPreferida?: string;
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function computeColor(seed: string): string {
  const palette = ['#FF5722', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#FF9800', '#00BCD4', '#3F51B5'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req);
    const rl = rateLimit(`register:${ip}`, 50, 60 * 60 * 1000);
    if (!rl.success) return tooManyRequests(rl.resetAt);

    const body = (await req.json()) as RegisterBody;
    const name = (body.name ?? '').trim();
    const email = (body.email ?? '').trim().toLowerCase();
    const password = (body.password ?? '').trim();
    const role = body.role === 'repartidor' ? 'repartidor' : 'cliente';
    const telefono = (body.telefono ?? '').trim();
    const cedula = (body.cedula ?? '').trim().toUpperCase();
    const municipio = (body.municipio ?? '').trim();
    const departamento = (body.departamento ?? 'Managua').trim();
    const direccion = (body.direccion ?? '').trim();
    const lat = Number(body.lat) || 12.1365;
    const lng = Number(body.lng) || -86.2514;
    const fotoUrl = (body.fotoUrl ?? '').trim();

    // Exigencia 1: Foto de Perfil Obligatoria
    if (!fotoUrl) {
      return fail('La foto de perfil es obligatoria para completar tu registro');
    }

    // Exigencia 2: Nombre Completo
    const nameErr = validateLength(name, 3, 100, 'Nombre Completo');
    if (nameErr) return fail(nameErr);

    // Exigencia 3: Email Válido
    if (!email) return fail('El correo electrónico es obligatorio');
    if (!isValidEmail(email)) return fail('Correo electrónico con formato inválido');

    // Exigencia 4: Contraseña Segura
    const pwErr = validateLength(password, 6, 200, 'Contraseña');
    if (pwErr) return fail('La contraseña debe tener al menos 6 caracteres');

    // Exigencia 5: Teléfono Nicaragüense Obligatorio
    if (!telefono) return fail('El número de teléfono móvil es obligatorio');
    const cleanPhone = telefono.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      return fail('El número de teléfono debe incluir al menos 8 dígitos (ej: 8888-8888)');
    }

    // Exigencia 6: Cédula de Identidad Nicaragüense Obligatoria
    if (!cedula) return fail('La Cédula de Identidad es obligatoria');
    const cedulaRegex = /^\d{3}-?\d{6}-?\d{4}[A-Za-z]$/;
    if (!cedulaRegex.test(cedula)) {
      return fail('Formato de cédula nicaragüense inválido (ej: 001-120495-0002E)');
    }

    // Exigencia 7: Municipio y Departamento Obligatorios
    if (!municipio) return fail('Debes seleccionar tu Municipio');

    // Exigencias adicionales si se registra como REPARTIDOR
    const vehiculoTipo = (body.vehiculoTipo ?? '').trim();
    const vehiculoMarca = (body.vehiculoMarca ?? '').trim();
    const vehiculoModelo = (body.vehiculoModelo ?? '').trim();
    const vehiculoAnio = body.vehiculoAnio ? Number(body.vehiculoAnio) : null;
    const vehiculoColor = (body.vehiculoColor ?? '').trim();
    const vehiculoPlaca = (body.vehiculoPlaca ?? '').trim().toUpperCase();
    const zonaPreferida = (body.zonaPreferida ?? municipio).trim();

    if (role === 'repartidor') {
      if (!vehiculoTipo) return fail('Debes seleccionar el tipo de vehículo (Moto, Bicicleta, Auto)');
      if (['moto', 'auto'].includes(vehiculoTipo.toLowerCase())) {
        if (!vehiculoMarca) return fail('La marca del vehículo es obligatoria');
        if (!vehiculoModelo) return fail('El modelo del vehículo es obligatorio');
        if (!vehiculoAnio) return fail('El año del vehículo es obligatorio');
        if (!vehiculoPlaca) return fail('La placa oficial del vehículo es obligatoria (ej: M-123456)');
      }
    }

    const existing = await db.user.findFirst({
      where: { email: { equals: email } },
    });
    if (existing) {
      return fail('Ya existe una cuenta registrada con este correo electrónico', 409);
    }

    const hashed = await hashPassword(password);
    const created = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        role,
        telefono,
        cedula,
        municipio,
        departamento,
        direccion,
        lat,
        lng,
        fotoUrl,
        initials: computeInitials(name),
        color: computeColor(email),
      },
    });

    // Guardar dirección de residencia predeterminada para el cliente
    if (direccion) {
      try {
        await db.direccionCliente.create({
          data: {
            clienteId: created.id,
            etiqueta: 'Casa',
            direccion,
            lat,
            lng,
            referencia: `Registrada en ${municipio}, ${departamento}`,
            predeterminada: true,
          },
        });
      } catch (dirErr) {
        console.warn('[AUTH_REGISTER] DireccionCliente creation skipped:', dirErr);
      }
    }

    if (role === 'repartidor') {
      try {
        await db.repartidorProfile.create({
          data: {
            userId: created.id,
            nombre: created.name,
            email: created.email,
            telefono: created.telefono,
            saldo: 100,
            conectado: true,
            contratoAceptado: true,
            cedulaRepartidor: cedula,
            vehiculoTipo,
            vehiculoMarca,
            vehiculoModelo,
            vehiculoAnio,
            vehiculoColor,
            vehiculoPlaca,
            zonaPreferida,
          },
        });
      } catch (e) {
        console.warn('[AUTH_REGISTER] RepartidorProfile creation skipped:', e);
      }
    }

    await createSession({
      id: created.id,
      email: created.email,
      name: created.name,
      role: created.role as 'cliente' | 'repartidor' | 'admin' | 'ingeniero',
      telefono: created.telefono ?? undefined,
      initials: created.initials || computeInitials(name),
      color: created.color || computeColor(email),
      fotoUrl: created.fotoUrl ?? undefined,
    }).catch(() => null);

    return ok(
      {
        user: {
          id: created.id,
          email: created.email,
          name: created.name,
          role: created.role,
          telefono: created.telefono,
          cedula: created.cedula,
          municipio: created.municipio,
          departamento: created.departamento,
          direccion: created.direccion,
          lat: created.lat,
          lng: created.lng,
          fotoUrl: created.fotoUrl,
          initials: created.initials,
          color: created.color,
        },
      },
      201
    );
  } catch (error) {
    console.error('[AUTH_REGISTER]', error);
    return fail('Error interno al procesar el registro de cuenta', 500);
  }
}
