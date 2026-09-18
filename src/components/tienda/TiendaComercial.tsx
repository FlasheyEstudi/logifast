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
            variant={abierta === t.id ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setAbierta(abierta === t.id ? null : t.id)}
            className="h-9 rounded-full text-xs font-semibold px-4 gap-1.5"
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
    <Card className="rounded-3xl bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 shadow-xs">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
            <Users size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold font-syne text-[var(--text)] m-0">
              Equipo de la tienda
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 m-0 font-medium">
              Cada persona entra con su propia cuenta y ve <b>solo esta tienda</b>. El rol decide qué puede tocar.
            </p>
          </div>
        </div>

        {esPropietario && (
          <form onSubmit={invitar} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">
                Correo del usuario registrado
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cajero@correo.com"
                className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">
                Rol
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="w-full h-11 px-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-[var(--bg-alt)] text-[var(--text)] text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                {roles.filter((r) => r !== 'dueno').map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={enviando}
                className="h-11 rounded-full px-5 text-xs font-bold gap-1.5 shadow-md shadow-primary/20"
              >
                <Plus size={15} /> {enviando ? 'Invitando…' : 'Invitar'}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2.5 pt-2">
          {cargando ? (
            <div className="text-xs text-[var(--text-muted)] py-4 text-center">Cargando equipo…</div>
          ) : equipo.length === 0 ? (
            <div className="text-xs text-[var(--text-muted)] py-4 text-center">Todavía no has invitado a nadie.</div>
          ) : (
            equipo.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl bg-[var(--bg-alt)]/60 border border-slate-200/60 dark:border-slate-800/60 shadow-xs"
              >
                <span className="font-bold text-sm text-[var(--text)]">{m.nombre}</span>
                <span className="text-xs text-[var(--text-muted)]">{m.email}</span>
                <Badge variant="secondary" className="text-[10px] font-bold uppercase rounded-full px-2.5 py-0.5">
                  {m.rol}
                </Badge>
                <span className="text-[11px] text-[var(--text-muted)] font-medium">
                  {m.permisosEfectivos.join(', ') || 'sin permisos'}
                </span>
                {esPropietario && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quitar(m.id)}
                    className="ml-auto h-8 rounded-full px-3 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/10 shadow-xs"
                  >
                    Quitar
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
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
    <Card className="rounded-3xl bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 shadow-xs">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
            <Star size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold font-syne text-[var(--text)] m-0">
              Alianzas con repartidores
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 m-0 font-medium">
              Ofrece un beneficio a los repartidores; lo ven en su app y queda registrado cada canje.
            </p>
          </div>
        </div>

        <form onSubmit={crear} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">Beneficio</label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Café gratis al entregar"
              className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">Valor</label>
            <Input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="10% / C$50"
              className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">Vigencia (días)</label>
            <Input
              type="number"
              min="0"
              value={vigenciaDias}
              onChange={(e) => setVigenciaDias(e.target.value)}
              className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={enviando}
              className="h-11 rounded-full px-5 text-xs font-bold gap-1.5 shadow-md shadow-primary/20"
            >
              <Plus size={15} /> Publicar
            </Button>
          </div>
        </form>

        <div className="space-y-2.5 pt-2">
          {cargando ? (
            <div className="text-xs text-[var(--text-muted)] py-4 text-center">Cargando alianzas…</div>
          ) : alianzas.length === 0 ? (
            <div className="text-xs text-[var(--text-muted)] py-4 text-center">Sin alianzas publicadas.</div>
          ) : (
            alianzas.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl bg-[var(--bg-alt)]/60 border border-slate-200/60 dark:border-slate-800/60 shadow-xs"
              >
                <span className="font-bold text-sm text-[var(--text)]">{a.titulo}</span>
                {a.valor && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{a.valor}</span>
                )}
                <span className="text-[11px] text-[var(--text-muted)] font-medium">vence {fecha(a.vigenciaFin)}</span>
                <Badge variant="outline" className="ml-auto text-[11px] font-bold rounded-full px-3 py-0.5">
                  {a.canjes} canje(s)
                </Badge>
              </div>
            ))
          )}
        </div>
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
    <Card className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-[var(--surface)] shadow-xs overflow-hidden">
      <CardContent className="p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Megaphone size={19} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black tracking-tight text-[var(--text)] m-0">
              Publicidad en el inicio
            </h3>
            <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5">
              Tu anuncio aparece en el inicio de la app mientras esté vigente; se cuentan impresiones y clics.
            </p>
          </div>
        </div>

        <form onSubmit={contratar} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5 ml-1">Título</label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="2x1 en Fresco hoy"
              className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5 ml-1">Subtítulo</label>
            <Input
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              placeholder="Solo por hoy en tu tienda"
              className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5 ml-1">Texto del botón</label>
            <Input
              value={botonTexto}
              onChange={(e) => setBotonTexto(e.target.value)}
              className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5 ml-1">Enlace del botón</label>
            <Input
              value={botonLink}
              onChange={(e) => setBotonLink(e.target.value)}
              placeholder="/cliente/explorar"
              className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5 ml-1">Color</label>
            <input
              type="color"
              value={colorFondo}
              onChange={(e) => setColorFondo(e.target.value)}
              className="w-full h-11 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-[var(--bg-alt)] cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5 ml-1">Días de vigencia</label>
            <Input
              type="number"
              min="1"
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5 ml-1">Tarifa acordada (C$)</label>
            <Input
              type="number"
              min="0"
              value={precioMensual}
              onChange={(e) => setPrecioMensual(e.target.value)}
              className="h-11 rounded-2xl text-xs bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={enviando}
              className="w-full h-11 rounded-full text-xs font-bold gap-1.5 shadow-md shadow-primary/20"
            >
              <Plus size={15} /> {enviando ? 'Contratando…' : 'Contratar anuncio'}
            </Button>
          </div>
        </form>

        <div className="space-y-2.5 pt-2">
          {cargando ? (
            <div className="text-xs text-[var(--text-muted)] py-6 text-center">Cargando anuncios…</div>
          ) : banners.length === 0 ? (
            <div className="text-xs text-[var(--text-muted)] py-6 text-center">Sin anuncios contratados.</div>
          ) : (
            banners.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--bg-alt)]/60 border border-slate-200/60 dark:border-slate-800/60 transition-all hover:bg-[var(--bg-alt)]"
              >
                <div className="space-y-1">
                  <div className="font-bold text-sm text-[var(--text)]">{b.titulo}</div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>Hasta {fecha(b.programadoHasta)}</span>
                    <span>•</span>
                    <span>{b.impresiones} vistas · {b.clicks} clics</span>
                  </div>
                </div>
                <Badge
                  variant={b.pagado ? 'secondary' : 'outline'}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    b.pagado
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0'
                      : 'text-amber-600 dark:text-amber-400 border-amber-500/30'
                  }`}
                >
                  {b.pagado ? 'PAGADO' : b.precioMensual ? `PENDIENTE ${money(b.precioMensual)}` : 'SIN TARIFA'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TiendaComercial;
