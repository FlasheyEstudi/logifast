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

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const money = (n: number) => `C$ ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fecha = (v: string | null) => (v ? new Date(v).toLocaleDateString('es-NI') : '—');

export function TiendaComercial() {
  const [abierta, setAbierta] = useState<'equipo' | 'alianzas' | 'pauta' | null>('equipo');

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'equipo' as const, label: 'Equipo de la tienda', icon: <Users size={15} /> },
          { id: 'alianzas' as const, label: 'Alianzas con repartidores', icon: <Star size={15} /> },
          { id: 'pauta' as const, label: 'Publicidad en el inicio', icon: <Megaphone size={15} /> },
        ].map((t) => (
          <Button
            key={t.id}
            type="button"
            variant={abierta === t.id ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setAbierta(abierta === t.id ? null : t.id)}
            className={`h-11 sm:h-10 rounded-full text-sm font-semibold px-4 gap-1.5 ${
              abierta === t.id
                ? 'bg-[var(--primario)]/10 text-[var(--primario)] border border-[var(--primario)]'
                : 'border border-transparent text-[var(--text-secondary)]'
            }`}
          >
            {t.icon} {t.label}
          </Button>
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
    <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)]">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[var(--lf-card-radius)] bg-[var(--primario)]/10 text-[var(--primario)] flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold font-syne text-[var(--text)] m-0">
              Equipo de la tienda
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 m-0 font-medium">
              Cada persona entra con su propia cuenta y ve <b>solo esta tienda</b>. El rol decide qué puede tocar.
            </p>
          </div>
        </div>

        {esPropietario && (
          <form
            onSubmit={invitar}
            className="rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--bg-alt)] p-4 grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-3"
          >
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                Correo del usuario registrado
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cajero@correo.com"
                className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)]"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                Rol
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="w-full h-11 px-3 rounded-[var(--lf-input-radius)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primario)] font-medium"
              >
                {roles.filter((r) => r !== 'dueno').map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-end">
              <Button
                type="submit"
                disabled={enviando}
                className="w-full sm:w-auto h-11 rounded-full px-5 text-sm font-bold gap-1.5"
              >
                <Plus size={15} /> {enviando ? 'Invitando…' : 'Invitar'}
              </Button>
            </div>
          </form>
        )}

        {cargando ? (
          <div className="text-xs text-[var(--text-muted)] py-6 text-center">Cargando equipo…</div>
        ) : equipo.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--bg-alt)]/60">
            <Users size={28} className="mx-auto mb-2 text-[var(--text-muted)]" />
            <p className="text-xs text-[var(--text-muted)] m-0 font-medium">Todavía no has invitado a nadie.</p>
          </div>
        ) : (
          <div className="rounded-[var(--lf-card-radius)] border border-[var(--border)] overflow-hidden">
            {equipo.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3.5 border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-[var(--bg-alt)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--text)]">{m.nombre}</span>
                    <Badge
                      variant="outline"
                      className="text-[11px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 bg-[var(--bg-alt)] text-[var(--text-muted)] border border-[var(--border)]"
                    >
                      {m.rol}
                    </Badge>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{m.email}</div>
                  <div className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
                    {m.permisosEfectivos.join(', ') || 'sin permisos'}
                  </div>
                </div>
                {esPropietario && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quitar(m.id)}
                    className="h-9 rounded-full px-3 text-xs font-semibold text-[var(--peligro)] border-[var(--border)] hover:bg-[var(--peligro)]/10 hover:text-[var(--peligro)]"
                  >
                    Quitar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
    <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)]">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[var(--lf-card-radius)] bg-[var(--primario)]/10 text-[var(--primario)] flex items-center justify-center shrink-0">
            <Star size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold font-syne text-[var(--text)] m-0">
              Alianzas con repartidores
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 m-0 font-medium">
              Ofrece un beneficio a los repartidores; lo ven en su app y queda registrado cada canje.
            </p>
          </div>
        </div>

        <form
          onSubmit={crear}
          className="rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--bg-alt)] p-4 grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-3"
        >
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Beneficio</label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Café gratis al entregar"
              className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)]"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Valor</label>
            <Input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="10% / C$50"
              className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)] font-mono"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Vigencia (días)</label>
            <Input
              type="number"
              min="0"
              value={vigenciaDias}
              onChange={(e) => setVigenciaDias(e.target.value)}
              className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)] font-mono"
            />
          </div>
          <div className="flex items-end justify-end">
            <Button
              type="submit"
              disabled={enviando}
              className="w-full sm:w-auto h-11 rounded-full px-5 text-sm font-bold gap-1.5"
            >
              <Plus size={15} /> Publicar
            </Button>
          </div>
        </form>

        {cargando ? (
          <div className="text-xs text-[var(--text-muted)] py-6 text-center">Cargando alianzas…</div>
        ) : alianzas.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--bg-alt)]/60">
            <Star size={28} className="mx-auto mb-2 text-[var(--text-muted)]" />
            <p className="text-xs text-[var(--text-muted)] m-0 font-medium">Sin alianzas publicadas.</p>
          </div>
        ) : (
          <div className="rounded-[var(--lf-card-radius)] border border-[var(--border)] overflow-hidden">
            {alianzas.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3.5 border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-[var(--bg-alt)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-[var(--text)]">{a.titulo}</div>
                  <div className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5">vence {fecha(a.vigenciaFin)}</div>
                </div>
                {a.valor && (
                  <span className="font-mono text-lg font-bold text-[var(--text)]">{a.valor}</span>
                )}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">canje(s)</div>
                  <div className="font-mono text-base font-bold text-[var(--text)] leading-tight">{a.canjes}</div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 ${
                    a.activo
                      ? 'bg-[var(--exito)]/10 text-[var(--exito)] border border-[var(--exito)]'
                      : 'bg-[var(--bg-alt)] text-[var(--text-muted)] border border-[var(--border)]'
                  }`}
                >
                  {a.activo ? 'activo' : 'inactivo'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
    <Card className="rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--lf-shadow-card)]">
      <CardContent className="p-4 sm:p-5 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[var(--lf-card-radius)] bg-[var(--primario)]/10 text-[var(--primario)] flex items-center justify-center shrink-0">
            <Megaphone size={19} />
          </div>
          <div>
            <h3 className="text-base font-semibold font-syne text-[var(--text)] m-0">
              Publicidad en el inicio
            </h3>
            <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5">
              Tu anuncio aparece en el inicio de la app mientras esté vigente; se cuentan impresiones y clics.
            </p>
          </div>
        </div>

        <form
          onSubmit={contratar}
          className="rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--bg-alt)] p-4 space-y-3.5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Título</label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="2x1 en Fresco hoy"
                className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)]"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Subtítulo</label>
              <Input
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
                placeholder="Solo por hoy en tu tienda"
                className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Texto del botón</label>
              <Input
                value={botonTexto}
                onChange={(e) => setBotonTexto(e.target.value)}
                className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Enlace del botón</label>
              <Input
                value={botonLink}
                onChange={(e) => setBotonLink(e.target.value)}
                placeholder="/cliente/explorar"
                className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Color</label>
              <input
                type="color"
                value={colorFondo}
                onChange={(e) => setColorFondo(e.target.value)}
                className="w-full h-11 p-1 rounded-[var(--lf-input-radius)] border border-[var(--border)] bg-[var(--surface)] cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Días de vigencia</label>
              <Input
                type="number"
                min="1"
                value={dias}
                onChange={(e) => setDias(e.target.value)}
                className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)] font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">Tarifa acordada (C$)</label>
              <Input
                type="number"
                min="0"
                value={precioMensual}
                onChange={(e) => setPrecioMensual(e.target.value)}
                className="h-11 rounded-[var(--lf-input-radius)] text-sm bg-[var(--surface)] border-[var(--border)] font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end border-t border-[var(--border)] pt-3.5">
            <Button
              type="submit"
              disabled={enviando}
              className="w-full sm:w-auto h-11 rounded-full px-5 text-sm font-bold gap-1.5"
            >
              <Plus size={15} /> {enviando ? 'Contratando…' : 'Contratar anuncio'}
            </Button>
          </div>
        </form>

        {cargando ? (
          <div className="text-xs text-[var(--text-muted)] py-6 text-center">Cargando anuncios…</div>
        ) : banners.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--bg-alt)]/60">
            <Megaphone size={28} className="mx-auto mb-2 text-[var(--text-muted)]" />
            <p className="text-xs text-[var(--text-muted)] m-0 font-medium">Sin anuncios contratados.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {banners.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--surface)] transition-colors hover:bg-[var(--bg-alt)] space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[var(--text)]">{b.titulo}</div>
                    <div className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5">Hasta {fecha(b.programadoHasta)}</div>
                  </div>
                  <Badge
                    variant={b.pagado ? 'secondary' : 'outline'}
                    className={`text-[11px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 ${
                      b.pagado
                        ? 'bg-[var(--exito)]/10 text-[var(--exito)] border border-[var(--exito)]'
                        : b.precioMensual
                        ? 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]'
                        : 'bg-[var(--bg-alt)] text-[var(--text-muted)] border border-[var(--border)]'
                    }`}
                  >
                    {b.pagado ? 'PAGADO' : b.precioMensual ? `PENDIENTE ${money(b.precioMensual)}` : 'SIN TARIFA'}
                  </Badge>
                </div>
                <div className="flex items-end gap-5 border-t border-[var(--border)] pt-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">vistas</div>
                    <div className="font-mono text-lg font-bold text-[var(--text)] leading-tight">{b.impresiones}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">clics</div>
                    <div className="font-mono text-lg font-bold text-[var(--text)] leading-tight">{b.clicks}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TiendaComercial;
