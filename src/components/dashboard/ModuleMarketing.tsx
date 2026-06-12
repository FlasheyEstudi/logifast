'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Megaphone, Tag, Layout, Rss, TrendingUp, Plus, Send,
  Edit2, Trash2, Copy, Play, Clock, Users, Mail, MessageSquare,
  Eye, MousePointer, CheckCircle, XCircle, AlertCircle,
  Calendar, Hash, Percent, DollarSign, BarChart3, ArrowUpRight,
  ArrowDownRight, Sparkles, LayoutDashboard, ToggleLeft, ToggleRight,
  ChevronDown, Shuffle, Palette, Type, Image, Bell, Star,
  Gift, Heart, MapPin, CreditCard, Zap,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import type {
  Campana, CodigoPromocional, Banner, FeedItem, MarketingKPI,
} from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const genPromoCode = () => {
  const prefixes = ['LOGI', 'ENVIO', 'FAST', 'MGA', 'RIDE'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const n = Math.floor(Math.random() * 40) + 10;
  return `${p}${n}`;
};

const SEGMENTOS = ['todos', 'Clientes nuevos', 'Clientes frecuentes', 'Clientes inactivos', 'VIP'];
const TIPOS_CAMPANA: Campana['tipo'][] = ['push', 'email', 'sms'];
const TIPOS_BANNER: Banner['tipo'][] = ['promo_grande', 'tarjeta_compacta', 'slider', 'notificacion'];
const TIPOS_FEED: FeedItem['tipo'][] = ['anuncio', 'promocion', 'novedad', 'encuesta', 'recordatorio'];
const COLOR_PRESETS = ['#FF5722', '#1B1B2F', '#2979FF', '#00C853', '#FFB300', '#FF1744', '#9C27B0', '#00BCD4'];

const SEGMENT_LABELS: Record<string, string> = {
  todos: 'Todos',
  'Clientes nuevos': 'Nuevos',
  'Clientes frecuentes': 'Frecuentes',
  'Clientes inactivos': 'Inactivos',
  VIP: 'VIP',
};

/* ─── Badge Helpers ─── */

function CampanaStatusBadge({ estado }: { estado: Campana['estado'] }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    borrador: { bg: 'rgba(142,142,160,0.12)', color: 'var(--text-muted)', label: 'Borrador' },
    programada: { bg: 'rgba(41,121,255,0.12)', color: 'var(--info)', label: 'Programada' },
    enviada: { bg: 'rgba(0,200,83,0.12)', color: 'var(--exito)', label: 'Enviada' },
    fallida: { bg: 'rgba(255,23,68,0.12)', color: 'var(--peligro)', label: 'Fallida' },
  };
  const s = map[estado] || map.borrador;
  return <Badge style={{ background: s.bg, color: s.color, border: 'none', fontSize: 11 }}>{s.label}</Badge>;
}

function CodigoStatusBadge({ estado }: { estado: CodigoPromocional['estado'] }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    activo: { bg: 'rgba(0,200,83,0.12)', color: 'var(--exito)', label: 'Activo' },
    agotado: { bg: 'rgba(142,142,160,0.12)', color: 'var(--text-muted)', label: 'Agotado' },
    expirado: { bg: 'rgba(255,23,68,0.12)', color: 'var(--peligro)', label: 'Expirado' },
    pausado: { bg: 'rgba(255,179,0,0.12)', color: 'var(--warning)', label: 'Pausado' },
  };
  const s = map[estado] || map.activo;
  return <Badge style={{ background: s.bg, color: s.color, border: 'none', fontSize: 11 }}>{s.label}</Badge>;
}

function BannerStatusBadge({ estado }: { estado: Banner['estado'] }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    activo: { bg: 'rgba(0,200,83,0.12)', color: 'var(--exito)', label: 'Activo' },
    inactivo: { bg: 'rgba(142,142,160,0.12)', color: 'var(--text-muted)', label: 'Inactivo' },
    programado: { bg: 'rgba(41,121,255,0.12)', color: 'var(--info)', label: 'Programado' },
  };
  const s = map[estado] || map.inactivo;
  return <Badge style={{ background: s.bg, color: s.color, border: 'none', fontSize: 11 }}>{s.label}</Badge>;
}

/* ─── Chart Tooltip ─── */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--secundario)', color: '#fff', padding: '10px 14px',
      borderRadius: 10, boxShadow: 'var(--shadow-lg)', fontSize: 12, maxWidth: 220,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4, opacity: 0.7, fontSize: 11 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ opacity: 0.8 }}>{p.name}:</span>
          <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

/* ─── Mock Chart Data ─── */

const ACQUISITION_DATA = [
  { semana: 'S1', nuevos: 5 }, { semana: 'S2', nuevos: 8 }, { semana: 'S3', nuevos: 6 },
  { semana: 'S4', nuevos: 12 }, { semana: 'S5', nuevos: 9 }, { semana: 'S6', nuevos: 14 },
  { semana: 'S7', nuevos: 11 }, { semana: 'S8', nuevos: 16 }, { semana: 'S9', nuevos: 13 },
  { semana: 'S10', nuevos: 18 }, { semana: 'S11', nuevos: 15 }, { semana: 'S12', nuevos: 21 },
];

const RETENTION_DATA = [
  { mes: 'Ene', retencion: 62 }, { mes: 'Feb', retencion: 65 }, { mes: 'Mar', retencion: 64 },
  { mes: 'Abr', retencion: 68 }, { mes: 'May', retencion: 70 }, { mes: 'Jun', retencion: 68 },
];

const FREQUENCY_DATA = [
  { bracket: '1 envío', clientes: 35 }, { bracket: '2-3 envíos', clientes: 28 },
  { bracket: '4-5 envíos', clientes: 18 }, { bracket: '6-10 envíos', clientes: 12 },
  { bracket: '10+ envíos', clientes: 7 },
];

const REVENUE_SEGMENT_DATA = [
  { name: 'Nuevos', value: 12500 }, { name: 'Frecuentes', value: 34000 },
  { name: 'VIP', value: 21000 }, { name: 'Inactivos', value: 4500 },
];

const PIE_COLORS = ['#2979FF', '#FF5722', '#00C853', '#FFB300'];

/* ═══════════════════════════════════════════════
   SUB-TAB CONFIG
   ═══════════════════════════════════════════════ */

type SubTab = 'campanas' | 'codigos' | 'banners' | 'feed' | 'analitica';

const SUB_TABS: { key: SubTab; label: string; icon: typeof Megaphone }[] = [
  { key: 'campanas', label: 'Campañas', icon: Megaphone },
  { key: 'codigos', label: 'Códigos', icon: Tag },
  { key: 'banners', label: 'Banners', icon: Layout },
  { key: 'feed', label: 'Feed', icon: Rss },
  { key: 'analitica', label: 'Analítica', icon: TrendingUp },
];

/* ═══════════════════════════════════════════════
   CAMPAÑAS SUB-TAB (7A)
   ═══════════════════════════════════════════════ */

function SubCampanas() {
  const { campanas, addCampana, updateCampana, deleteCampana, addToast } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Campana | null>(null);

  // Form state
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<Campana['tipo']>('push');
  const [segmento, setSegmento] = useState('todos');
  const [contTitulo, setContTitulo] = useState('');
  const [contCuerpo, setContCuerpo] = useState('');
  const [contBoton, setContBoton] = useState('');
  const [programadaPara, setProgramadaPara] = useState('');

  const openCreate = () => {
    setEditing(null);
    setTitulo(''); setTipo('push'); setSegmento('todos');
    setContTitulo(''); setContCuerpo(''); setContBoton('');
    setProgramadaPara('');
    setModalOpen(true);
  };

  const openEdit = (c: Campana) => {
    setEditing(c);
    setTitulo(c.titulo); setTipo(c.tipo); setSegmento(c.segmento);
    setContTitulo(c.contenido.titulo || ''); setContCuerpo(c.contenido.cuerpo);
    setContBoton(c.contenido.boton || ''); setProgramadaPara(c.programadaPara || '');
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!titulo.trim() || !contCuerpo.trim()) {
      addToast('Completa título y cuerpo', 'warning');
      return;
    }
    const contenido = { titulo: contTitulo || undefined, cuerpo: contCuerpo, boton: contBoton || undefined };
    if (editing) {
      updateCampana(editing.id, { titulo, tipo, segmento, contenido, programadaPara: programadaPara || undefined });
      addToast('Campaña actualizada', 'success');
    } else {
      addCampana({
        id: genId(), titulo, tipo, segmento, contenido,
        estado: programadaPara ? 'programada' : 'borrador',
        programadaPara: programadaPara || undefined,
        destinatarios: 0, abiertos: 0, clicks: 0,
        creadoPor: 'admin', createdAt: new Date().toISOString(),
      });
      addToast('Campaña creada', 'success');
    }
    setModalOpen(false);
  };

  const handleDuplicate = (c: Campana) => {
    addCampana({
      ...c, id: genId(), titulo: `${c.titulo} (copia)`,
      estado: 'borrador', enviadaEn: undefined, destinatarios: 0, abiertos: 0, clicks: 0,
      createdAt: new Date().toISOString(),
    });
    addToast('Campaña duplicada', 'success');
  };

  const handleSendNow = (c: Campana) => {
    updateCampana(c.id, { estado: 'enviada', enviadaEn: new Date().toISOString(), destinatarios: Math.floor(Math.random() * 150) + 30 });
    addToast('Campaña enviada', 'success');
  };

  const handleDelete = (id: string) => {
    deleteCampana(id);
    addToast('Campaña eliminada', 'success');
  };

  const tipoIcon = (t: Campana['tipo']) => {
    if (t === 'push') return <Bell size={14} />;
    if (t === 'email') return <Mail size={14} />;
    return <MessageSquare size={14} />;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Campañas de notificación</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>Gestiona campañas push, email y SMS</p>
        </div>
        <Button onClick={openCreate} style={{ background: 'var(--primario)', color: '#fff', border: 'none', gap: 6, borderRadius: 8 }}>
          <Plus size={16} /> Nueva campaña
        </Button>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gap: 12 }}>
        <AnimatePresence mode="popLayout">
          {campanas.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
                padding: 16, display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--primario-soft)', color: 'var(--primario)', flexShrink: 0,
              }}>
                {tipoIcon(c.tipo)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{c.titulo}</span>
                  <Badge style={{ background: 'var(--primario-soft)', color: 'var(--primario)', border: 'none', fontSize: 10 }}>
                    {c.tipo.toUpperCase()}
                  </Badge>
                  <Badge style={{ background: 'rgba(142,142,160,0.1)', color: 'var(--text-secondary)', border: 'none', fontSize: 10 }}>
                    {SEGMENT_LABELS[c.segmento] || c.segmento}
                  </Badge>
                  <CampanaStatusBadge estado={c.estado} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, marginBottom: 6, lineHeight: 1.4 }}>
                  {c.contenido.cuerpo.slice(0, 100)}{c.contenido.cuerpo.length > 100 ? '...' : ''}
                </p>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  {c.enviadaEn && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {new Date(c.enviadaEn).toLocaleDateString('es-NI')}</span>}
                  {c.programadaPara && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> Programada: {new Date(c.programadaPara).toLocaleDateString('es-NI')}</span>}
                  {c.estado === 'enviada' && (
                    <>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} /> {c.destinatarios} enviados</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {c.abiertos} abiertos</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MousePointer size={12} /> {c.clicks} clicks</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)} title="Editar" style={{ color: 'var(--text-muted)' }}>
                  <Edit2 size={15} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDuplicate(c)} title="Duplicar" style={{ color: 'var(--info)' }}>
                  <Copy size={15} />
                </Button>
                {c.estado !== 'enviada' && (
                  <Button variant="ghost" size="sm" onClick={() => handleSendNow(c)} title="Enviar ahora" style={{ color: 'var(--exito)' }}>
                    <Send size={15} />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} title="Eliminar" style={{ color: 'var(--peligro)' }}>
                  <Trash2 size={15} />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {campanas.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <Megaphone size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No hay campañas. Crea la primera.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxWidth: 520 }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text)' }}>{editing ? 'Editar campaña' : 'Nueva campaña'}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nombre de la campaña" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as Campana['tipo'])}>
                  <SelectTrigger style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)', width: '100%' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    {TIPOS_CAMPANA.map((t) => (
                      <SelectItem key={t} value={t} style={{ color: 'var(--text)' }}>{t.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Segmento</Label>
                <Select value={segmento} onValueChange={setSegmento}>
                  <SelectTrigger style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)', width: '100%' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    {SEGMENTOS.map((s) => (
                      <SelectItem key={s} value={s} style={{ color: 'var(--text)' }}>{SEGMENT_LABELS[s] || s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Título del contenido</Label>
              <Input value={contTitulo} onChange={(e) => setContTitulo(e.target.value)} placeholder="Opcional" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
            </div>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Cuerpo del mensaje</Label>
              <Textarea value={contCuerpo} onChange={(e) => setContCuerpo(e.target.value)} placeholder="Escribe el mensaje..." rows={3} style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
            </div>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Texto del botón</Label>
              <Input value={contBoton} onChange={(e) => setContBoton(e.target.value)} placeholder="Opcional" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
            </div>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Programar envío</Label>
              <Input type="datetime-local" value={programadaPara} onChange={(e) => setProgramadaPara(e.target.value)} style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
            </div>
          </div>
          <DialogFooter style={{ marginTop: 16 }}>
            <Button variant="outline" onClick={() => setModalOpen(false)} style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancelar</Button>
            <Button onClick={handleSubmit} style={{ background: 'var(--primario)', color: '#fff', border: 'none' }}>
              {editing ? 'Guardar' : 'Crear campaña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CÓDIGOS PROMOCIONALES SUB-TAB (7B)
   ═══════════════════════════════════════════════ */

function SubCodigos() {
  const { codigos, addCodigo, updateCodigo, deleteCodigo, addToast } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CodigoPromocional | null>(null);

  const [codigo, setCodigo] = useState('');
  const [tipoDescuento, setTipoDescuento] = useState<CodigoPromocional['tipoDescuento']>('porcentaje');
  const [valor, setValor] = useState('');
  const [aplicableA, setAplicableA] = useState('Todos los envíos');
  const [montoMinimo, setMontoMinimo] = useState('');
  const [maxUsos, setMaxUsos] = useState('100');
  const [segmento, setSegmento] = useState('todos');
  const [vigenciaInicio, setVigenciaInicio] = useState('');
  const [vigenciaFin, setVigenciaFin] = useState('');

  const openCreate = () => {
    setEditing(null);
    setCodigo(genPromoCode()); setTipoDescuento('porcentaje'); setValor('');
    setAplicableA('Todos los envíos'); setMontoMinimo(''); setMaxUsos('100');
    setSegmento('todos'); setVigenciaInicio(''); setVigenciaFin('');
    setModalOpen(true);
  };

  const openEdit = (c: CodigoPromocional) => {
    setEditing(c);
    setCodigo(c.codigo); setTipoDescuento(c.tipoDescuento); setValor(String(c.valor));
    setAplicableA(c.aplicableA); setMontoMinimo(c.montoMinimo ? String(c.montoMinimo) : '');
    setMaxUsos(String(c.maxUsos)); setSegmento(c.segmento);
    setVigenciaInicio(c.vigenciaInicio); setVigenciaFin(c.vigenciaFin);
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!codigo.trim() || !valor) {
      addToast('Completa código y valor', 'warning');
      return;
    }
    const valorNum = parseFloat(valor);
    const maxUsosNum = parseInt(maxUsos) || 100;
    const montoMinNum = montoMinimo ? parseFloat(montoMinimo) : undefined;
    if (editing) {
      updateCodigo(editing.id, {
        codigo, tipoDescuento, valor: valorNum, aplicableA, montoMinimo: montoMinNum,
        maxUsos: maxUsosNum, segmento, vigenciaInicio, vigenciaFin,
      });
      addToast('Código actualizado', 'success');
    } else {
      addCodigo({
        id: genId(), codigo, tipoDescuento, valor: valorNum, aplicableA, montoMinimo: montoMinNum,
        maxUsos: maxUsosNum, usosActuales: 0, segmento, vigenciaInicio, vigenciaFin,
        estado: 'activo', creadoPor: 'admin', createdAt: new Date().toISOString().split('T')[0],
      });
      addToast('Código creado', 'success');
    }
    setModalOpen(false);
  };

  const handleTogglePausa = (c: CodigoPromocional) => {
    const newEstado = c.estado === 'pausado' ? 'activo' : 'pausado';
    updateCodigo(c.id, { estado: newEstado });
    addToast(newEstado === 'pausado' ? 'Código pausado' : 'Código reactivado', 'success');
  };

  const handleDelete = (id: string) => {
    deleteCodigo(id);
    addToast('Código eliminado', 'success');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Códigos promocionales</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>Gestiona descuentos y promociones</p>
        </div>
        <Button onClick={openCreate} style={{ background: 'var(--primario)', color: '#fff', border: 'none', gap: 6, borderRadius: 8 }}>
          <Plus size={16} /> Nuevo código
        </Button>
      </div>

      {/* List */}
      <div style={{ display: 'grid', gap: 10 }}>
        <AnimatePresence mode="popLayout">
          {codigos.map((c) => {
            const usoPct = c.maxUsos > 0 ? Math.round((c.usosActuales / c.maxUsos) * 100) : 0;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
                  padding: '14px 16px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
                }}
              >
                {/* Code Pill */}
                <div style={{
                  fontFamily: 'monospace', fontSize: 14, fontWeight: 700, letterSpacing: 1,
                  background: 'var(--primario-soft)', color: 'var(--primario)',
                  padding: '6px 14px', borderRadius: 8,
                }}>
                  {c.codigo}
                </div>

                {/* Discount */}
                <div style={{ minWidth: 80 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    {c.tipoDescuento === 'porcentaje' ? `${c.valor}%` : `C$${c.valor}`}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
                    {c.tipoDescuento === 'porcentaje' ? 'desc.' : 'off'}
                  </span>
                </div>

                {/* Segment */}
                <Badge style={{ background: 'rgba(142,142,160,0.1)', color: 'var(--text-secondary)', border: 'none', fontSize: 10 }}>
                  {SEGMENT_LABELS[c.segmento] || c.segmento}
                </Badge>

                {/* Usages */}
                <div style={{ flex: 1, minWidth: 100 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>
                    {c.usosActuales} / {c.maxUsos > 0 ? c.maxUsos : '∞'} usos
                  </div>
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(usoPct, 100)}%`, background: 'var(--primario)', borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                </div>

                {/* Vigencia */}
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {c.vigenciaInicio} → {c.vigenciaFin}
                </span>

                <CodigoStatusBadge estado={c.estado} />

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)} title="Editar" style={{ color: 'var(--text-muted)' }}>
                    <Edit2 size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleTogglePausa(c)} title={c.estado === 'pausado' ? 'Reactivar' : 'Pausar'}
                    style={{ color: c.estado === 'pausado' ? 'var(--exito)' : 'var(--warning)' }}>
                    {c.estado === 'pausado' ? <Play size={14} /> : <PauseIcon size={14} />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} title="Eliminar" style={{ color: 'var(--peligro)' }}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {codigos.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <Tag size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No hay códigos. Crea el primero.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxWidth: 520 }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text)' }}>{editing ? 'Editar código' : 'Nuevo código promocional'}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Código</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="Ej: LOGI20" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)', fontFamily: 'monospace', letterSpacing: 1, flex: 1 }} />
                <Button variant="outline" onClick={() => setCodigo(genPromoCode())} style={{ borderColor: 'var(--border)', color: 'var(--primario)', gap: 4 }} title="Generar aleatorio">
                  <Shuffle size={14} /> Generar
                </Button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Tipo descuento</Label>
                <Select value={tipoDescuento} onValueChange={(v) => setTipoDescuento(v as CodigoPromocional['tipoDescuento'])}>
                  <SelectTrigger style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)', width: '100%' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <SelectItem value="porcentaje" style={{ color: 'var(--text)' }}>Porcentaje (%)</SelectItem>
                    <SelectItem value="monto" style={{ color: 'var(--text)' }}>Monto fijo (C$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Valor</Label>
                <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder={tipoDescuento === 'porcentaje' ? '20' : '50'} style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
              </div>
            </div>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Aplicable a</Label>
              <Input value={aplicableA} onChange={(e) => setAplicableA(e.target.value)} placeholder="Todos los envíos" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Monto mínimo (C$)</Label>
                <Input type="number" value={montoMinimo} onChange={(e) => setMontoMinimo(e.target.value)} placeholder="Opcional" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Máx. usos</Label>
                <Input type="number" value={maxUsos} onChange={(e) => setMaxUsos(e.target.value)} placeholder="100" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
              </div>
            </div>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Segmento</Label>
              <Select value={segmento} onValueChange={setSegmento}>
                <SelectTrigger style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)', width: '100%' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  {SEGMENTOS.map((s) => (
                    <SelectItem key={s} value={s} style={{ color: 'var(--text)' }}>{SEGMENT_LABELS[s] || s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Vigencia inicio</Label>
                <Input type="date" value={vigenciaInicio} onChange={(e) => setVigenciaInicio(e.target.value)} style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Vigencia fin</Label>
                <Input type="date" value={vigenciaFin} onChange={(e) => setVigenciaFin(e.target.value)} style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
              </div>
            </div>
          </div>
          <DialogFooter style={{ marginTop: 16 }}>
            <Button variant="outline" onClick={() => setModalOpen(false)} style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancelar</Button>
            <Button onClick={handleSubmit} style={{ background: 'var(--primario)', color: '#fff', border: 'none' }}>
              {editing ? 'Guardar' : 'Crear código'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Simple Pause icon since lucide Pause might conflict */
function PauseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   BANNERS SUB-TAB (7C)
   ═══════════════════════════════════════════════ */

function SubBanners() {
  const { banners, addBanner, updateBanner, deleteBanner, addToast } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);

  const [titulo, setTitulo] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [tipo, setTipo] = useState<Banner['tipo']>('promo_grande');
  const [colorFondo, setColorFondo] = useState('#FF5722');
  const [colorTexto, setColorTexto] = useState('#FFFFFF');
  const [useGradient, setUseGradient] = useState(false);
  const [gradFrom, setGradFrom] = useState('#1B1B2F');
  const [gradTo, setGradTo] = useState('#FF5722');
  const [gradDirection, setGradDirection] = useState('to right');
  const [botonTexto, setBotonTexto] = useState('');
  const [icono, setIcono] = useState('');
  const [segmento, setSegmento] = useState('todos');
  const [mostrarEn, setMostrarEn] = useState('app');
  const [posicion, setPosicion] = useState('1');

  const activeBanners = banners.filter((b) => b.estado === 'activo').length;

  const openCreate = () => {
    setEditing(null);
    setTitulo(''); setSubtitulo(''); setTipo('promo_grande');
    setColorFondo('#FF5722'); setColorTexto('#FFFFFF');
    setUseGradient(false); setGradFrom('#1B1B2F'); setGradTo('#FF5722');
    setGradDirection('to right'); setBotonTexto(''); setIcono('');
    setSegmento('todos'); setMostrarEn('app'); setPosicion(String(banners.length + 1));
    setModalOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setTitulo(b.titulo); setSubtitulo(b.subtitulo || ''); setTipo(b.tipo);
    setColorFondo(b.colorFondo); setColorTexto(b.colorTexto);
    setUseGradient(!!b.gradiente); setGradFrom(b.gradiente?.from || '#1B1B2F');
    setGradTo(b.gradiente?.to || '#FF5722'); setGradDirection(b.gradiente?.direction || 'to right');
    setBotonTexto(b.botonTexto || ''); setIcono(b.icono || '');
    setSegmento(b.segmento); setMostrarEn(b.mostrarEn); setPosicion(String(b.posicion));
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!titulo.trim()) {
      addToast('Ingresa un título', 'warning');
      return;
    }
    const gradiente = useGradient ? { from: gradFrom, to: gradTo, direction: gradDirection } : undefined;
    if (editing) {
      updateBanner(editing.id, {
        titulo, subtitulo: subtitulo || undefined, tipo, colorFondo, colorTexto, gradiente,
        botonTexto: botonTexto || undefined, icono: icono || undefined,
        segmento, mostrarEn, posicion: parseInt(posicion) || 1,
      });
      addToast('Banner actualizado', 'success');
    } else {
      addBanner({
        id: genId(), titulo, subtitulo: subtitulo || undefined, tipo, colorFondo, colorTexto, gradiente,
        botonTexto: botonTexto || undefined, icono: icono || undefined,
        segmento, mostrarEn, posicion: parseInt(posicion) || 1,
        estado: 'activo', impresiones: 0, clicks: 0,
        creadoPor: 'admin', createdAt: new Date().toISOString().split('T')[0],
      });
      addToast('Banner creado', 'success');
    }
    setModalOpen(false);
  };

  const toggleEstado = (b: Banner) => {
    const newEstado = b.estado === 'activo' ? 'inactivo' : 'activo';
    updateBanner(b.id, { estado: newEstado });
    addToast(newEstado === 'activo' ? 'Banner activado' : 'Banner desactivado', 'success');
  };

  const handleDelete = (id: string) => {
    deleteBanner(id);
    addToast('Banner eliminado', 'success');
  };

  const tipoLabel: Record<string, string> = {
    promo_grande: 'Promo Grande', tarjeta_compacta: 'Compacta', slider: 'Slider', notificacion: 'Notificación',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Banners y promociones</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
            {activeBanners}/5 banners activos
          </p>
        </div>
        <Button onClick={openCreate} style={{ background: 'var(--primario)', color: '#fff', border: 'none', gap: 6, borderRadius: 8 }}>
          <Plus size={16} /> Nuevo banner
        </Button>
      </div>

      {/* Active indicator bar */}
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(activeBanners / 5) * 100}%`, background: activeBanners >= 5 ? 'var(--peligro)' : 'var(--primario)', borderRadius: 2, transition: 'width 0.3s' }} />
      </div>

      {/* Banner Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        <AnimatePresence mode="popLayout">
          {banners.map((b) => {
            const bgStyle = b.gradiente
              ? { background: `linear-gradient(${b.gradiente.direction}, ${b.gradiente.from}, ${b.gradiente.to})` }
              : { background: b.colorFondo };
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
                }}
              >
                {/* Preview Strip */}
                <div
                  style={{ ...bgStyle, padding: b.tipo === 'promo_grande' ? 20 : 14, position: 'relative', minHeight: 70, cursor: 'pointer' }}
                  onClick={() => setPreviewBanner(b)}
                >
                  <div style={{ color: b.colorTexto }}>
                    <div style={{ fontSize: b.tipo === 'promo_grande' ? 16 : 14, fontWeight: 700 }}>{b.titulo}</div>
                    {b.subtitulo && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{b.subtitulo}</div>}
                    {b.botonTexto && (
                      <div style={{ marginTop: 8, display: 'inline-block', background: 'rgba(255,255,255,0.25)', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                        {b.botonTexto}
                      </div>
                    )}
                  </div>
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <Badge style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', border: 'none', fontSize: 9 }}>
                      {tipoLabel[b.tipo]}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <BannerStatusBadge estado={b.estado} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pos. {b.posicion}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span><Eye size={11} /> {b.impresiones}</span>
                    <span><MousePointer size={11} /> {b.clicks}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(b)} style={{ color: 'var(--text-muted)', padding: '2px 6px' }}><Edit2 size={13} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleEstado(b)} style={{ color: b.estado === 'activo' ? 'var(--warning)' : 'var(--exito)', padding: '2px 6px' }}>
                      {b.estado === 'activo' ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)} style={{ color: 'var(--peligro)', padding: '2px 6px' }}><Trash2 size={13} /></Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {banners.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <Layout size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>No hay banners. Crea el primero.</p>
        </div>
      )}

      {/* Phone Preview Modal */}
      <Dialog open={!!previewBanner} onOpenChange={() => setPreviewBanner(null)}>
        <DialogContent style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxWidth: 400 }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text)' }}>Vista previa</DialogTitle>
          </DialogHeader>
          {previewBanner && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {/* Phone mockup */}
              <div style={{
                width: 260, background: 'var(--bg)', borderRadius: 24, border: '3px solid var(--border)',
                padding: 8, overflow: 'hidden',
              }}>
                <div style={{
                  width: 60, height: 5, background: 'var(--border)', borderRadius: 3, margin: '4px auto 8px',
                }} />
                <div style={{
                  ...(previewBanner.gradiente
                    ? { background: `linear-gradient(${previewBanner.gradiente.direction}, ${previewBanner.gradiente.from}, ${previewBanner.gradiente.to})` }
                    : { background: previewBanner.colorFondo }),
                  borderRadius: 12, padding: previewBanner.tipo === 'promo_grande' ? 20 : 14,
                  minHeight: 80,
                }}>
                  <div style={{ color: previewBanner.colorTexto }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{previewBanner.titulo}</div>
                    {previewBanner.subtitulo && <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{previewBanner.subtitulo}</div>}
                    {previewBanner.botonTexto && (
                      <div style={{ marginTop: 10, display: 'inline-block', background: 'rgba(255,255,255,0.25)', padding: '5px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
                        {previewBanner.botonTexto}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ padding: 8, fontSize: 10, color: 'var(--text-muted)' }}>
                  Vista previa en dispositivo
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text)' }}>{editing ? 'Editar banner' : 'Nuevo banner'}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Tipo de layout</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as Banner['tipo'])}>
                  <SelectTrigger style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)', width: '100%' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    {TIPOS_BANNER.map((t) => (
                      <SelectItem key={t} value={t} style={{ color: 'var(--text)' }}>{tipoLabel[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Posición</Label>
                <Input type="number" min={1} max={10} value={posicion} onChange={(e) => setPosicion(e.target.value)} style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
              </div>
            </div>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título del banner" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
            </div>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Subtítulo</Label>
              <Input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} placeholder="Opcional" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
            </div>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Texto del botón</Label>
              <Input value={botonTexto} onChange={(e) => setBotonTexto(e.target.value)} placeholder="Opcional" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
            </div>

            {/* Color Pickers */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Color fondo</Label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="color" value={colorFondo} onChange={(e) => setColorFondo(e.target.value)} style={{ width: 36, height: 30, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'transparent' }} />
                  <Input value={colorFondo} onChange={(e) => setColorFondo(e.target.value)} style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)', flex: 1 }} />
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {COLOR_PRESETS.map((c) => (
                    <button key={c} onClick={() => setColorFondo(c)} style={{ width: 22, height: 22, borderRadius: 6, background: c, border: colorFondo === c ? '2px solid var(--text)' : '1px solid var(--border)', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Color texto</Label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="color" value={colorTexto} onChange={(e) => setColorTexto(e.target.value)} style={{ width: 36, height: 30, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'transparent' }} />
                  <Input value={colorTexto} onChange={(e) => setColorTexto(e.target.value)} style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)', flex: 1 }} />
                </div>
              </div>
            </div>

            {/* Gradient Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Switch checked={useGradient} onCheckedChange={setUseGradient} />
              <Label style={{ color: 'var(--text-secondary)' }}>Usar gradiente</Label>
            </div>
            {useGradient && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div>
                  <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Desde</Label>
                  <input type="color" value={gradFrom} onChange={(e) => setGradFrom(e.target.value)} style={{ width: 36, height: 30, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
                </div>
                <div>
                  <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Hasta</Label>
                  <input type="color" value={gradTo} onChange={(e) => setGradTo(e.target.value)} style={{ width: 36, height: 30, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Dirección</Label>
                  <Select value={gradDirection} onValueChange={setGradDirection}>
                    <SelectTrigger style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)', width: '100%' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                      <SelectItem value="to right" style={{ color: 'var(--text)' }}>Horizontal</SelectItem>
                      <SelectItem value="to bottom" style={{ color: 'var(--text)' }}>Vertical</SelectItem>
                      <SelectItem value="to bottom right" style={{ color: 'var(--text)' }}>Diagonal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Segmento</Label>
                <Select value={segmento} onValueChange={setSegmento}>
                  <SelectTrigger style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)', width: '100%' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    {SEGMENTOS.map((s) => (
                      <SelectItem key={s} value={s} style={{ color: 'var(--text)' }}>{SEGMENT_LABELS[s] || s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Mostrar en</Label>
                <Select value={mostrarEn} onValueChange={setMostrarEn}>
                  <SelectTrigger style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)', width: '100%' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <SelectItem value="app" style={{ color: 'var(--text)' }}>App</SelectItem>
                    <SelectItem value="web" style={{ color: 'var(--text)' }}>Web</SelectItem>
                    <SelectItem value="ambos" style={{ color: 'var(--text)' }}>Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live Preview */}
            <div style={{ marginTop: 4 }}>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>Vista previa</Label>
              <div style={{
                ...(useGradient
                  ? { background: `linear-gradient(${gradDirection}, ${gradFrom}, ${gradTo})` }
                  : { background: colorFondo }),
                borderRadius: 12, padding: 18, minHeight: 60,
              }}>
                <div style={{ color: colorTexto }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{titulo || 'Título del banner'}</div>
                  {subtitulo && <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{subtitulo}</div>}
                  {botonTexto && (
                    <div style={{ marginTop: 8, display: 'inline-block', background: 'rgba(255,255,255,0.25)', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      {botonTexto}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter style={{ marginTop: 16 }}>
            <Button variant="outline" onClick={() => setModalOpen(false)} style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancelar</Button>
            <Button onClick={handleSubmit} style={{ background: 'var(--primario)', color: '#fff', border: 'none' }}>
              {editing ? 'Guardar' : 'Crear banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FEED SUB-TAB (7D)
   ═══════════════════════════════════════════════ */

const FEED_ICONS: Record<string, typeof Star> = {
  star: Star, tag: Tag, clock: Clock, heart: Heart, 'map-pin': MapPin,
  'credit-card': CreditCard, zap: Zap, gift: Gift, bell: Bell,
};

function SubFeed() {
  const { feedItems, addFeedItem, updateFeedItem, deleteFeedItem, addToast } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FeedItem | null>(null);

  const [tipo, setTipo] = useState<FeedItem['tipo']>('anuncio');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [botonTexto, setBotonTexto] = useState('');
  const [codigoPromo, setCodigoPromo] = useState('');
  const [segmento, setSegmento] = useState('todos');
  const [posicion, setPosicion] = useState('1');

  const openCreate = () => {
    setEditing(null);
    setTipo('anuncio'); setTitulo(''); setDescripcion('');
    setBotonTexto(''); setCodigoPromo(''); setSegmento('todos');
    setPosicion(String(feedItems.length + 1));
    setModalOpen(true);
  };

  const openEdit = (f: FeedItem) => {
    setEditing(f);
    setTipo(f.tipo); setTitulo(f.titulo); setDescripcion(f.descripcion);
    setBotonTexto(f.botonTexto || ''); setCodigoPromo(f.codigoPromo || '');
    setSegmento(f.segmento); setPosicion(String(f.posicion));
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!titulo.trim() || !descripcion.trim()) {
      addToast('Completa título y descripción', 'warning');
      return;
    }
    if (editing) {
      updateFeedItem(editing.id, {
        tipo, titulo, descripcion, botonTexto: botonTexto || undefined,
        codigoPromo: codigoPromo || undefined, segmento, posicion: parseInt(posicion) || 1,
      });
      addToast('Feed item actualizado', 'success');
    } else {
      addFeedItem({
        id: genId(), tipo, titulo, descripcion, icono: tipo === 'promocion' ? 'tag' : tipo === 'recordatorio' ? 'bell' : 'star',
        botonTexto: botonTexto || undefined, codigoPromo: codigoPromo || undefined,
        segmento, posicion: parseInt(posicion) || 1, estado: 'activo',
        impresiones: 0, clicks: 0, creadoPor: 'admin', createdAt: new Date().toISOString().split('T')[0],
      });
      addToast('Feed item creado', 'success');
    }
    setModalOpen(false);
  };

  const toggleEstado = (f: FeedItem) => {
    const newEstado = f.estado === 'activo' ? 'inactivo' : 'activo';
    updateFeedItem(f.id, { estado: newEstado });
    addToast(newEstado === 'activo' ? 'Item activado' : 'Item desactivado', 'success');
  };

  const handleDelete = (id: string) => {
    deleteFeedItem(id);
    addToast('Feed item eliminado', 'success');
  };

  const tipoColor: Record<string, { bg: string; color: string }> = {
    anuncio: { bg: 'rgba(41,121,255,0.12)', color: 'var(--info)' },
    promocion: { bg: 'rgba(255,87,34,0.12)', color: 'var(--primario)' },
    novedad: { bg: 'rgba(0,200,83,0.12)', color: 'var(--exito)' },
    encuesta: { bg: 'rgba(255,179,0,0.12)', color: 'var(--warning)' },
    recordatorio: { bg: 'rgba(156,39,176,0.12)', color: '#9C27B0' },
  };

  const sorted = [...feedItems].sort((a, b) => a.posicion - b.posicion);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Feed de contenido</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>Contenido dinámico para la app del cliente</p>
        </div>
        <Button onClick={openCreate} style={{ background: 'var(--primario)', color: '#fff', border: 'none', gap: 6, borderRadius: 8 }}>
          <Plus size={16} /> Nuevo item
        </Button>
      </div>

      {/* List */}
      <div style={{ display: 'grid', gap: 10 }}>
        <AnimatePresence mode="popLayout">
          {sorted.map((f) => {
            const tc = tipoColor[f.tipo] || tipoColor.anuncio;
            const IconComp = FEED_ICONS[f.icono || 'star'] || Star;
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
                  padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap',
                  opacity: f.estado === 'inactivo' ? 0.6 : 1,
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: tc.bg, color: tc.color, flexShrink: 0,
                }}>
                  <IconComp size={16} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{f.titulo}</span>
                    <Badge style={{ background: tc.bg, color: tc.color, border: 'none', fontSize: 10, textTransform: 'capitalize' }}>{f.tipo}</Badge>
                    <Badge style={{ background: 'rgba(142,142,160,0.1)', color: 'var(--text-secondary)', border: 'none', fontSize: 10 }}>
                      {SEGMENT_LABELS[f.segmento] || f.segmento}
                    </Badge>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{f.descripcion}</p>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    <span><Eye size={11} /> {f.impresiones}</span>
                    <span><MousePointer size={11} /> {f.clicks}</span>
                    <span>Pos. {f.posicion}</span>
                    {f.codigoPromo && <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{f.codigoPromo}</span>}
                  </div>
                </div>

                {/* Toggle + Actions */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Switch checked={f.estado === 'activo'} onCheckedChange={() => toggleEstado(f)} />
                  <Button variant="ghost" size="sm" onClick={() => openEdit(f)} style={{ color: 'var(--text-muted)', padding: '2px 6px' }}><Edit2 size={14} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(f.id)} style={{ color: 'var(--peligro)', padding: '2px 6px' }}><Trash2 size={14} /></Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {feedItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <Rss size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No hay items en el feed. Crea el primero.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxWidth: 480 }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text)' }}>{editing ? 'Editar item' : 'Nuevo item del feed'}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as FeedItem['tipo'])}>
                  <SelectTrigger style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)', width: '100%' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    {TIPOS_FEED.map((t) => (
                      <SelectItem key={t} value={t} style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div style={{ flex: 1 }}>
                <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Posición</Label>
                <Input type="number" min={1} value={posicion} onChange={(e) => setPosicion(e.target.value)} style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
              </div>
            </div>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título del item" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
            </div>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Descripción</Label>
              <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describe el contenido..." rows={2} style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
            </div>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Texto del botón</Label>
              <Input value={botonTexto} onChange={(e) => setBotonTexto(e.target.value)} placeholder="Opcional" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)' }} />
            </div>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Código promo vinculado</Label>
              <Input value={codigoPromo} onChange={(e) => setCodigoPromo(e.target.value.toUpperCase())} placeholder="Ej: LOGI20" style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)', fontFamily: 'monospace' }} />
            </div>
            <div>
              <Label style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Segmento</Label>
              <Select value={segmento} onValueChange={setSegmento}>
                <SelectTrigger style={{ background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)', width: '100%' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  {SEGMENTOS.map((s) => (
                    <SelectItem key={s} value={s} style={{ color: 'var(--text)' }}>{SEGMENT_LABELS[s] || s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter style={{ marginTop: 16 }}>
            <Button variant="outline" onClick={() => setModalOpen(false)} style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancelar</Button>
            <Button onClick={handleSubmit} style={{ background: 'var(--primario)', color: '#fff', border: 'none' }}>
              {editing ? 'Guardar' : 'Crear item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ANALÍTICA SUB-TAB (7E)
   ═══════════════════════════════════════════════ */

function SubAnalitica() {
  const { marketingKPI, campanas, codigos } = useStore();

  const kpi = marketingKPI;

  const kpiCards = [
    {
      label: 'Clientes activos', value: kpi.clientesActivosMes, suffix: '',
      trend: kpi.tendenciaActivos, icon: Users, color: 'var(--info)',
    },
    {
      label: 'Tasa retención', value: kpi.tasaRetencion, suffix: '%',
      trend: 3, icon: TrendingUp, color: 'var(--exito)',
    },
    {
      label: 'Frecuencia promedio', value: kpi.frecuenciaPromedio, suffix: '/mes',
      trend: 0.2, icon: BarChart3, color: 'var(--primario)',
    },
    {
      label: 'Valor promedio envío', value: `C$${kpi.valorPromedioEnvio}`, suffix: '',
      trend: 8, icon: DollarSign, color: 'var(--warning)',
    },
    {
      label: 'Costo adquisición', value: `C$${kpi.costoAdquisicion}`, suffix: '',
      trend: -2, icon: ArrowDownRight, color: '#9C27B0',
    },
  ];

  // Campaign effectiveness data
  const campaignData = campanas.filter((c) => c.estado === 'enviada').map((c) => ({
    name: c.titulo.length > 15 ? c.titulo.slice(0, 15) + '…' : c.titulo,
    abiertos: c.abiertos,
    clicks: c.clicks,
  }));

  // Promo code usage (mock 30-day data)
  const codeUsageData = useMemo(() => {
    const days: { dia: string; usos: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dia: `${d.getDate()}/${d.getMonth() + 1}`,
        usos: Math.floor(Math.random() * 8) + 1,
      });
    }
    return days;
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Analítica de marketing</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>Métricas y rendimiento de campañas</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: 24 }}>
        {kpiCards.map((k, i) => {
          const IconComp = k.icon;
          const isUp = k.trend > 0;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${k.color}15`, color: k.color,
                }}>
                  <IconComp size={18} />
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  fontSize: 11, fontWeight: 600,
                  color: isUp ? 'var(--exito)' : 'var(--peligro)',
                }}>
                  {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(k.trend)}%
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
                {k.value}{k.suffix}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
        {/* 1. Adquisición de clientes - AreaChart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}
        >
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0, marginBottom: 16 }}>Adquisición de clientes</h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ACQUISITION_DATA}>
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--exito)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--exito)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="semana" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="nuevos" name="Nuevos clientes" stroke="var(--exito)" fill="url(#gradGreen)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 2. Retención - LineChart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}
        >
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0, marginBottom: 16 }}>Retención de clientes</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={RETENTION_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[50, 80]} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="retencion" name="% Retención" stroke="var(--info)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--info)' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 3. Distribución de frecuencia - BarChart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}
        >
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0, marginBottom: 16 }}>Distribución de frecuencia</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={FREQUENCY_DATA}>
              <defs>
                <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primario)" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="var(--primario)" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="bracket" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="clientes" name="Clientes" fill="url(#gradOrange)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 4. Revenue por segmento - PieChart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}
        >
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0, marginBottom: 16 }}>Revenue por segmento</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={REVENUE_SEGMENT_DATA}
                cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                paddingAngle={3} dataKey="value" nameKey="name"
              >
                {REVENUE_SEGMENT_DATA.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="bottom" height={36}
                formatter={(value: string) => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 5. Efectividad de campañas - BarChart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}
        >
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0, marginBottom: 16 }}>Efectividad de campañas</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={campaignData.length > 0 ? campaignData : [{ name: 'Sin datos', abiertos: 0, clicks: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend formatter={(value: string) => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{value}</span>} />
              <Bar dataKey="abiertos" name="Abiertos" fill="var(--info)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="clicks" name="Clicks" fill="var(--primario)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 6. Códigos promocionales - BarChart (30 days) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}
        >
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0, marginBottom: 16 }}>Uso de códigos (30 días)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={codeUsageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="dia" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="usos" name="Usos diarios" fill="var(--warning)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ModuleMarketing() {
  const [activeTab, setActiveTab] = useState<SubTab>('campanas');

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Module Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--primario-soft)', color: 'var(--primario)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Megaphone size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Marketing</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Gestiona campañas, promociones y contenido</p>
          </div>
        </div>
      </motion.div>

      {/* Sub-tab Navigation */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto',
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 4,
      }}>
        {SUB_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isActive ? 'var(--primario)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              <IconComp size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'campanas' && <SubCampanas />}
          {activeTab === 'codigos' && <SubCodigos />}
          {activeTab === 'banners' && <SubBanners />}
          {activeTab === 'feed' && <SubFeed />}
          {activeTab === 'analitica' && <SubAnalitica />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
