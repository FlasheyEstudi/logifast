'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Tag, Users, Megaphone, Star } from '@/components/icons';
import { notify } from '@/lib/notify';

/**
 * Secciones comerciales del portal de tienda:
 *  - #7/#10 Equipo: invitar usuarios con rol y permisos; solo ven esta tienda.
 *  - #9 Alianzas: beneficios que la tienda ofrece a los repartidores.
 *  - #8 Pauta: contratar un anuncio en el inicio de la app.
 */

const campo: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  height: 44,
  borderRadius: 'var(--lf-input-radius, 14px)',
  border: '1px solid var(--border)',
  background: 'var(--bg-alt)',
  color: 'var(--text)',
  padding: '0 14px',
  fontSize: 13,
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
};

const etiqueta: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  color: 'var(--text-muted)',
  marginBottom: 4,
  display: 'block',
};

const panel: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--lf-card-radius, 20px)',
  boxShadow: 'var(--lf-shadow-card)',
  padding: 24,
};

const botonPrimario: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  height: 44,
  padding: '0 18px',
  borderRadius: 'var(--lf-button-radius, 14px)',
  border: 'none',
  background: 'var(--primario)',
  color: '#FFFFFF',
  fontWeight: 700,
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(0, 122, 255, 0.25)',
  transition: 'all 0.2s ease',
};

const money = (n: number) => `C$ ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fecha = (v: string | null) => (v ? new Date(v).toLocaleDateString('es-NI') : '—');

export function TiendaComercial() {
  const [abierta, setAbierta] = useState<'equipo' | 'alianzas' | 'pauta' | null>('equipo');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'equipo' as const, label: 'Equipo de la tienda', icon: <Users size={15} /> },
          { id: 'alianzas' as const, label: 'Alianzas con repartidores', icon: <Star size={15} /> },
          { id: 'pauta' as const, label: 'Publicidad en el inicio', icon: <Megaphone size={15} /> },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setAbierta(abierta === t.id ? null : t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 40,
              padding: '0 16px',
              borderRadius: 'var(--lf-pill-radius, 100px)',
              border: `1px solid ${abierta === t.id ? 'var(--primario)' : 'var(--border)'}`,
              background: abierta === t.id ? 'var(--primario)' : 'var(--bg-alt)',
              color: abierta === t.id ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
              boxShadow: abierta === t.id ? '0 2px 8px rgba(0, 122, 255, 0.25)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {abierta === 'equipo' && <SeccionEquipo />}
      {abierta === 'alianzas' && <SeccionAlianzas />}
      {abierta === 'pauta' && <SeccionPauta />}
    </div>
  );
}

/* ─────────────── #7 / #10 Equipo ─────────────── */

interface Miembro {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  permisosEfectivos: string[];
  activo: boolean;
}

function SeccionEquipo() {
  const [equipo, setEquipo] = useState<Miembro[]>([]);
  const [roles, setRoles] = useState<string[]>(['dueno', 'encargado', 'cajero', 'inventario']);
  const [esPropietario, setEsPropietario] = useState(false);
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('cajero');
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/tienda/usuarios');
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setEquipo(data.equipo || []);
        if (Array.isArray(data.roles) && data.roles.length) setRoles(data.roles);
        setEsPropietario(!!data.esPropietario);
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const invitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await fetch('/api/tienda/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, rol }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        notify.error(data.error || 'No se pudo invitar');
        return;
      }
      notify.success(data.mensaje || 'Usuario invitado');
      setEmail('');
      await cargar();
    } finally {
      setEnviando(false);
    }
  };

  const quitar = async (id: string) => {
    const res = await fetch(`/api/tienda/usuarios?id=${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      notify.error(data.error || 'No se pudo quitar');
      return;
    }
    notify.success('Miembro quitado del equipo');
    await cargar();
  };

  return (
    <div style={panel}>
      <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Users size={17} /> Equipo de la tienda
      </h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 0' }}>
        Cada persona entra con su propia cuenta y ve <b>solo esta tienda</b>. El rol decide qué puede tocar: el cajero
        vende pero no cambia precios.
      </p>

      {esPropietario && (
        <form onSubmit={invitar} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-3" style={{ marginTop: 14 }}>
          <div>
            <label style={etiqueta}>Correo del usuario registrado</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cajero@correo.com" style={campo} required />
          </div>
          <div>
            <label style={etiqueta}>Rol</label>
            <select value={rol} onChange={(e) => setRol(e.target.value)} style={campo}>
              {roles.filter((r) => r !== 'dueno').map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={enviando} style={{ ...botonPrimario, background: enviando ? 'var(--bg-alt)' : 'var(--exito)', color: enviando ? 'var(--text-muted)' : '#06240F' }}>
              <Plus size={15} /> {enviando ? 'Invitando…' : 'Invitar'}
            </button>
          </div>
        </form>
      )}

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cargando ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando equipo…</div>
        ) : equipo.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Todavía no has invitado a nadie.</div>
        ) : (
          equipo.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3" style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>{m.nombre}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primario)' }}>{m.rol.toUpperCase()}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{m.permisosEfectivos.join(', ') || 'sin permisos'}</span>
              {esPropietario && (
                <button
                  type="button"
                  onClick={() => quitar(m.id)}
                  style={{ marginLeft: 'auto', height: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--peligro)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                >
                  Quitar
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─────────────── #9 Alianzas ─────────────── */

interface Alianza {
  id: string;
  titulo: string;
  tipo: string;
  valor: string | null;
  activo: boolean;
  canjes: number;
  vigenciaFin: string | null;
}

function SeccionAlianzas() {
  const [alianzas, setAlianzas] = useState<Alianza[]>([]);
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('');
  const [vigenciaDias, setVigenciaDias] = useState('30');
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/tienda/alianzas');
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setAlianzas(data.alianzas || []);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await fetch('/api/tienda/alianzas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, valor, tipo: 'descuento', vigenciaDias: Number(vigenciaDias) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        notify.error(data.error || 'No se pudo crear la alianza');
        return;
      }
      notify.success('Alianza publicada para los repartidores');
      setTitulo('');
      setValor('');
      await cargar();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={panel}>
      <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Star size={17} /> Alianzas con repartidores
      </h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 0' }}>
        Ofrece un beneficio a los repartidores; lo ven en su app y queda registrado cada canje.
      </p>

      <form onSubmit={crear} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-3" style={{ marginTop: 14 }}>
        <div>
          <label style={etiqueta}>Beneficio</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Café gratis al entregar" style={campo} required />
        </div>
        <div>
          <label style={etiqueta}>Valor</label>
          <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="10% / C$50" style={campo} />
        </div>
        <div>
          <label style={etiqueta}>Vigencia (días)</label>
          <input type="number" min="0" value={vigenciaDias} onChange={(e) => setVigenciaDias(e.target.value)} style={campo} />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={enviando} style={{ ...botonPrimario, background: enviando ? 'var(--bg-alt)' : 'var(--exito)', color: enviando ? 'var(--text-muted)' : '#06240F' }}>
            <Plus size={15} /> Publicar
          </button>
        </div>
      </form>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cargando ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando alianzas…</div>
        ) : alianzas.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin alianzas publicadas.</div>
        ) : (
          alianzas.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3" style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>{a.titulo}</span>
              {a.valor && <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--exito)' }}>{a.valor}</span>}
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>vence {fecha(a.vigenciaFin)}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 700 }}>{a.canjes} canje(s)</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─────────────── #8 Pauta ─────────────── */

interface Banner {
  id: string;
  titulo: string;
  estado: string;
  impresiones: number;
  clicks: number;
  precioMensual: number | null;
  pagado: boolean;
  programadoHasta: string | null;
}

function SeccionPauta() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [titulo, setTitulo] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [colorFondo, setColorFondo] = useState('var(--primario)');
  const [botonTexto, setBotonTexto] = useState('Ver oferta');
  const [botonLink, setBotonLink] = useState('');
  const [dias, setDias] = useState('15');
  const [precioMensual, setPrecioMensual] = useState('500');
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/tienda/banners');
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setBanners(data.banners || []);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const contratar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await fetch('/api/tienda/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          subtitulo,
          colorFondo,
          botonTexto,
          botonLink,
          dias: Number(dias),
          precioMensual: Number(precioMensual),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        notify.error(data.error || 'No se pudo contratar el anuncio');
        return;
      }
      notify.success('Anuncio contratado: ya se muestra en el inicio');
      setTitulo('');
      setSubtitulo('');
      await cargar();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={panel}>
      <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Megaphone size={17} /> Publicidad en el inicio
      </h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 0' }}>
        Tu anuncio aparece en el inicio de la app mientras esté vigente; se cuentan impresiones y clics.
      </p>

      <form onSubmit={contratar} className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginTop: 14 }}>
        <div>
          <label style={etiqueta}>Título</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="2x1 en Frescl hoy" style={campo} required />
        </div>
        <div>
          <label style={etiqueta}>Subtítulo</label>
          <input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} placeholder="Solo por hoy en tu tienda" style={campo} />
        </div>
        <div>
          <label style={etiqueta}>Texto del botón</label>
          <input value={botonTexto} onChange={(e) => setBotonTexto(e.target.value)} style={campo} />
        </div>
        <div>
          <label style={etiqueta}>Enlace del botón</label>
          <input value={botonLink} onChange={(e) => setBotonLink(e.target.value)} placeholder="/cliente/explorar" style={campo} />
        </div>
        <div>
          <label style={etiqueta}>Color</label>
          <input type="color" value={colorFondo} onChange={(e) => setColorFondo(e.target.value)} style={{ ...campo, padding: 4 }} />
        </div>
        <div>
          <label style={etiqueta}>Días de vigencia</label>
          <input type="number" min="1" value={dias} onChange={(e) => setDias(e.target.value)} style={campo} />
        </div>
        <div>
          <label style={etiqueta}>Tarifa acordada (C$)</label>
          <input type="number" min="0" value={precioMensual} onChange={(e) => setPrecioMensual(e.target.value)} style={campo} />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={enviando} style={{ ...botonPrimario, width: '100%', background: enviando ? 'var(--bg-alt)' : 'var(--exito)', color: enviando ? 'var(--text-muted)' : '#06240F' }}>
            <Plus size={15} /> {enviando ? 'Contratando…' : 'Contratar anuncio'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cargando ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando anuncios…</div>
        ) : banners.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin anuncios contratados.</div>
        ) : (
          banners.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-3" style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>{b.titulo}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>hasta {fecha(b.programadoHasta)}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {b.impresiones} vistas · {b.clicks} clics
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: b.pagado ? 'var(--exito)' : '#F59E0B' }}>
                {b.pagado ? 'PAGADO' : b.precioMensual ? `PENDIENTE ${money(b.precioMensual)}` : 'SIN TARIFA'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TiendaComercial;
