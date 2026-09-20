/**
 * HORARIOS DE TIENDA — fuente única de verdad (servidor y cliente).
 *
 * La columna `Tienda.horario` es un string libre y en producción convivió con dos
 * formatos: el legacy de texto ("8:00 AM - 6:00 PM") y el JSON estructurado que
 * guarda Configuración (`{"lun":{"abre":"08:00","cierra":"20:00"}}`). Ese texto
 * legacy hacía que el cliente inventara un horario por defecto y mostrara una
 * apertura que no era la real. Aquí se normaliza TODO a un solo formato y, cuando
 * el dato no alcanza, se dice explícitamente en vez de fabricarlo.
 */

export type DiaClave = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom';

export interface TramoDia {
  abre: string;           // "HH:MM" en 24 h
  cierra: string;         // "HH:MM" en 24 h
  cerrado?: boolean;      // el día no se atiende
}

export type HorarioSemanal = Record<DiaClave, TramoDia>;

export const DIAS_ORDEN: DiaClave[] = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];

/** Day.getDay() → clave. getDay(): 0=domingo. */
export const CLAVE_POR_GETDAY: DiaClave[] = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];

const RE_HORA = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** Objeto por defecto SOLO para tiendas que nunca configuraron horario (compatibilidad). */
export const HORARIO_POR_DEFECTO: HorarioSemanal = {
  lun: { abre: '08:00', cierra: '20:00' },
  mar: { abre: '08:00', cierra: '20:00' },
  mie: { abre: '08:00', cierra: '20:00' },
  jue: { abre: '08:00', cierra: '20:00' },
  vie: { abre: '08:00', cierra: '21:00' },
  sab: { abre: '08:00', cierra: '21:00' },
  dom: { abre: '09:00', cierra: '19:00' },
};

const aMinutos = (hhmm: string): number | null => {
  const m = RE_HORA.exec(String(hhmm || '').trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
};

/** Convierte "8:00 AM" / "18:30" a "08:00" / "18:30". Devuelve null si no se entiende. */
export function normalizarHora(crudo: string): string | null {
  const txt = String(crudo || '').trim().toUpperCase();
  if (!txt) return null;

  const ampm = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM|A\.M\.|P\.M\.)$/.exec(txt);
  if (ampm) {
    let h = Number(ampm[1]) % 12;
    const min = ampm[2] ? Number(ampm[2]) : 0;
    if (ampm[3].startsWith('P')) h += 12;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  const directo = /^(\d{1,2}):(\d{2})$/.exec(txt);
  if (directo) {
    const h = Number(directo[1]);
    const min = Number(directo[2]);
    if (h > 23 || min > 59) return null;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  return null;
}

/**
 * Interpreta el texto legacy "8:00 AM - 6:00 PM" como el MISMO tramo para toda la
 * semana. Solo se usa para migrar; no se inventa nada más: si no se entiende, null.
 */
export function parsearHorarioLegacy(crudo: string): HorarioSemanal | null {
  const txt = String(crudo || '').trim();
  if (!txt || txt.includes('{') || !/[-–a]/i.test(txt)) return null;
  const partes = txt.split(/\s*(?:-|–|a las|to)\s*/i).filter(Boolean);
  if (partes.length < 2) return null;
  const abre = normalizarHora(partes[0]);
  const cierra = normalizarHora(partes[1]);
  if (!abre || !cierra) return null;
  return DIAS_ORDEN.reduce((acc, d) => {
    acc[d] = { abre, cierra };
    return acc;
  }, {} as HorarioSemanal);
}

/**
 * Normaliza cualquier forma de `Tienda.horario` a `HorarioSemanal`.
 * No lanza. Si el valor es basura devuelve el default comercial, pero MARCA el
 * resultado como no configurado para que la UI lo diga en vez de inventar horas.
 */
export function parsearHorario(crudo: unknown): HorarioSemanal {
  let valor: unknown = crudo;
  if (typeof valor === 'string') {
    const txt = valor.trim();
    if (!txt) return HORARIO_POR_DEFECTO;
    try {
      valor = JSON.parse(txt);
    } catch {
      const legacy = parsearHorarioLegacy(txt);
      return legacy ?? HORARIO_POR_DEFECTO;
    }
  }
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return HORARIO_POR_DEFECTO;

  const obj = valor as Record<string, unknown>;
  const salida = {} as HorarioSemanal;
  for (const dia of DIAS_ORDEN) {
    const tramo = obj[dia] as Record<string, unknown> | undefined;
    if (!tramo || typeof tramo !== 'object') {
      salida[dia] = { abre: '', cierra: '', cerrado: true };
      continue;
    }
    if (tramo.cerrado === true) {
      salida[dia] = { abre: '', cierra: '', cerrado: true };
      continue;
    }
    const abre = normalizarHora(String(tramo.abre ?? ''));
    const cierra = normalizarHora(String(tramo.cierra ?? ''));
    salida[dia] = abre && cierra ? { abre, cierra } : { abre: '', cierra: '', cerrado: true };
  }
  return salida;
}

/** ¿El valor guardado en `Tienda.horario` es interpretable de verdad? */
export function horarioConfigurado(crudo: unknown): boolean {
  if (typeof crudo === 'string') {
    const txt = crudo.trim();
    if (!txt) return false;
    try {
      const parsed = JSON.parse(txt);
      return !!parsed && typeof parsed === 'object' && !Array.isArray(parsed);
    } catch {
      return parsearHorarioLegacy(txt) !== null;
    }
  }
  return !!crudo && typeof crudo === 'object' && !Array.isArray(crudo);
}

/** Minutos desde medianoche de "HH:MM"; null si no es válido. */
export const minutosDeHora = aMinutos;

export interface EstadoApertura {
  abierto: boolean;
  /** Texto listo para pintar: "Abierto hasta las 20:00" / "Cerrado hoy" / "Abre mañana a las 08:00". */
  texto: string;
  /** Próxima apertura real, o null si el horario no tiene ningún día válido. */
  proximaApertura: Date | null;
  /** true cuando el horario guardado no es utilizable (se está usando el default). */
  horarioNoConfigurado: boolean;
}

/**
 * Calcula si la tienda está abierta AHORA y cuándo vuelve a abrir.
 * `ahora` se inyecta para poder probar sin tocar el reloj del sistema.
 */
export function calcularApertura(horarioCrudo: unknown, ahora: Date = new Date()): EstadoApertura {
  const horario = parsearHorario(horarioCrudo);
  const diaHoy = CLAVE_POR_GETDAY[ahora.getDay()];
  const tramoHoy = horario[diaHoy];
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  const noConfigurado = !horarioConfigurado(horarioCrudo);

  if (tramoHoy && !tramoHoy.cerrado && tramoHoy.abre && tramoHoy.cierra) {
    const abre = aMinutos(tramoHoy.abre)!;
    let cierra = aMinutos(tramoHoy.cierra)!;
    // Horario que cruza medianoche (p. ej. 20:00 → 02:00): se compara contra el
    // tramo extendido del día anterior también.
    if (cierra <= abre) {
      if (minutosAhora >= abre) {
        return { abierto: true, texto: `Abierto hasta las ${tramoHoy.cierra}`, proximaApertura: null, horarioNoConfigurado: noConfigurado };
      }
      const diaAyer = CLAVE_POR_GETDAY[(ahora.getDay() + 6) % 7];
      const tAyer = horario[diaAyer];
      const cierraAyer = tAyer && !tAyer.cerrado ? aMinutos(tAyer.cierra) : null;
      if (cierraAyer !== null && cierraAyer <= aMinutos(tAyer.abre)! && minutosAhora < cierraAyer) {
        return { abierto: true, texto: `Abierto hasta las ${tAyer.cierra}`, proximaApertura: null, horarioNoConfigurado: noConfigurado };
      }
    } else if (minutosAhora >= abre && minutosAhora <= cierra) {
      return { abierto: true, texto: `Abierto hasta las ${tramoHoy.cierra}`, proximaApertura: null, horarioNoConfigurado: noConfigurado };
    }
  }

  // Cerrado: buscar la próxima apertura real (hasta 8 días vista).
  for (let i = 0; i < 8; i++) {
    const fecha = new Date(ahora);
    fecha.setDate(fecha.getDate() + i);
    const dia = CLAVE_POR_GETDAY[fecha.getDay()];
    const t = horario[dia];
    if (!t || t.cerrado || !t.abre || !t.cierra) continue;
    const abre = aMinutos(t.abre)!;
    if (i === 0 && minutosAhora >= abre) continue; // ya pasó la apertura de hoy
    const objetivo = new Date(fecha);
    objetivo.setHours(Math.floor(abre / 60), abre % 60, 0, 0);
    const cuando = i === 0 ? `hoy a las ${t.abre}` : i === 1 ? `mañana a las ${t.abre}` : `${DIAS_ORDEN[(fecha.getDay() + 6) % 7]} a las ${t.abre}`;
    const texto = i === 0 && tramoHoy && !tramoHoy.cerrado ? `Abre ${cuando}` : (tramoHoy && tramoHoy.cierra && !tramoHoy.cerrado ? `Cerrado por hoy · abre ${cuando}` : `Cerrado · abre ${cuando}`);
    return { abierto: false, texto, proximaApertura: objetivo, horarioNoConfigurado: noConfigurado };
  }

  return { abierto: false, texto: 'Horario no configurado', proximaApertura: null, horarioNoConfigurado: true };
}

/** Atajo booleano para el backend: ¿puede esta tienda recibir un pedido ahora? */
export function tiendaAbierta(horarioCrudo: unknown, ahora: Date = new Date()): boolean {
  return calcularApertura(horarioCrudo, ahora).abierto;
}

/** Serializa al formato único que se guarda en BD y consumen todos los clientes. */
export function serializarHorario(horario: HorarioSemanal): string {
  return JSON.stringify(horario);
}

/**
 * Construye un horario semanal a partir del texto legacy, para migrar filas viejas
 * sin perder información. Devuelve null si no se pudo interpretar.
 */
export function migrarHorarioLegacy(crudo: string): string | null {
  const legacy = parsearHorarioLegacy(crudo);
  return legacy ? serializarHorario(legacy) : null;
}
