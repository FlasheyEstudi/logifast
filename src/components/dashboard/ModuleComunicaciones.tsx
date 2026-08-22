'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Mail, Smartphone, Bell, Send, Paperclip,
  Search, Filter, Plus, Edit2, Trash2, Check, CheckCheck,
  X, ChevronLeft, Users, Bike, Clock, Shield, Sparkles,
} from '@/components/icons';
import { useStore } from '@/lib/store';
import type {
  Conversacion,
  MensajeDirecto,
  PlantillaMensaje,
  NotificacionAutomatica,
} from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ═══════════════════════════════════════════════
   HELPERS & STYLING
   ═══════════════════════════════════════════════ */

function getInitials(name: string) {
  if (!name) return 'US';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = [
    '#002A5C', '#FF6600', '#16A34A', '#8B5CF6', '#DC2626',
    '#D97706', '#0891B2', '#7C3AED', '#059669', '#BE185D',
  ];
  return palette[Math.abs(hash) % palette.length];
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hour}:${min}`;
}

function timeElapsed(ts: string): string {
  const then = new Date(ts).getTime();
  const now = Date.now();
  const diffMin = Math.max(0, Math.floor((now - then) / 60000));
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m > 0 ? `Hace ${h}h ${m}min` : `Hace ${h}h`;
}

const CATEGORIA_CONFIG: Record<PlantillaMensaje['categoria'], { label: string; bg: string; color: string }> = {
  orden: { label: 'Orden', bg: 'rgba(41,121,255,0.12)', color: '#2979FF' },
  incidencia: { label: 'Incidencia', bg: 'rgba(220,38,38,0.12)', color: '#DC2626' },
  promocion: { label: 'Promoción', bg: 'rgba(255,179,0,0.12)', color: '#FFB300' },
  general: { label: 'General', bg: 'rgba(22,163,74,0.12)', color: '#16A34A' },
};

const CANAL_CONFIG: Record<NotificacionAutomatica['canal'], { label: string; icon: typeof Bell; bg: string; color: string }> = {
  push: { label: 'Push', icon: Bell, bg: 'rgba(41,121,255,0.12)', color: '#2979FF' },
  email: { label: 'Email', icon: Mail, bg: 'rgba(255,102,0,0.12)', color: '#FF6600' },
  sms: { label: 'SMS', icon: Smartphone, bg: 'rgba(22,163,74,0.12)', color: '#16A34A' },
  todos: { label: 'Todos', icon: MessageCircle, bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6' },
};

const DESTINATARIO_CONFIG: Record<NotificacionAutomatica['destinatario'], { label: string; bg: string; color: string }> = {
  cliente: { label: 'Cliente', bg: 'rgba(41,121,255,0.12)', color: '#2979FF' },
  repartidor: { label: 'Repartidor', bg: 'rgba(255,102,0,0.12)', color: '#FF6600' },
  admin: { label: 'Admin', bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6' },
  ingeniero: { label: 'Ingeniero', bg: 'rgba(22,163,74,0.12)', color: '#16A34A' },
};

type SubTab = 'buzon' | 'plantillas' | 'notificaciones';
type BuzonFilter = 'todos' | 'clientes' | 'repartidores' | 'noLeidos';

const SUB_TABS: { key: SubTab; label: string; icon: typeof MessageCircle }[] = [
  { key: 'buzon', label: 'Buzón en Vivo', icon: MessageCircle },
  { key: 'plantillas', label: 'Plantillas de Mensajes', icon: Mail },
  { key: 'notificaciones', label: 'Automatizaciones Push', icon: Bell },
];

/* ═══════════════════════════════════════════════
   BUZÓN SUB-COMPONENT (CHAT EN VIVO)
   ═══════════════════════════════════════════════ */

function BuzonPanel() {
  const { conversaciones: storeConvs, addMensaje, markConversacionLeida, addToast } = useStore();
  const [dbConversaciones, setDbConversaciones] = useState<Conversacion[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<BuzonFilter>('todos');
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadUsers = useCallback(() => {
    fetch('/api/admin/users?limit=100')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.users) setSystemUsers(data.users);
      })
      .catch(() => null);
  }, []);

  const handleStartChatWithUser = (u: any) => {
    const targetId = u.id;
    const existing = conversaciones.find(
      (c) => c.participanteId === targetId || c.id === `CONV-${targetId}`
    );
    if (existing) {
      setActiveConvId(existing.id);
    } else {
      const newConv: Conversacion = {
        id: `CONV-${targetId}`,
        participanteId: targetId,
        participanteNombre: u.name || u.email.split('@')[0],
        participanteRol: u.role || 'cliente',
        ultimoMensaje: 'Conversación iniciada',
        ultimoTimestamp: new Date().toISOString(),
        noLeidos: 0,
        mensajes: [],
      };
      setDbConversaciones((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
    }
    setMobileShowChat(true);
    setNewChatModalOpen(false);
  };

  const fetchConvs = useCallback(() => {
    fetch('/api/mensajes')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.data && Array.isArray(data.data)) {
          setDbConversaciones(data.data);
          if (!activeConvId && data.data.length > 0) {
            setActiveConvId(data.data[0].id);
          }
        }
      })
      .catch(() => null);
  }, [activeConvId]);

  useEffect(() => {
    fetchConvs();
  }, [fetchConvs]);

  const conversaciones = dbConversaciones.length > 0 ? dbConversaciones : storeConvs;

  const activeConv = useMemo(
    () => conversaciones.find((c) => c.id === activeConvId) ?? null,
    [conversaciones, activeConvId],
  );

  const filteredConvs = useMemo(() => {
    let list = [...conversaciones];
    if (filter === 'clientes') list = list.filter((c) => c.participanteRol === 'cliente');
    else if (filter === 'repartidores') list = list.filter((c) => c.participanteRol === 'repartidor');
    else if (filter === 'noLeidos') list = list.filter((c) => c.noLeidos > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.participanteNombre.toLowerCase().includes(q) ||
          c.ultimoMensaje.toLowerCase().includes(q),
      );
    }
    return list.sort(
      (a, b) => new Date(b.ultimoTimestamp).getTime() - new Date(a.ultimoTimestamp).getTime(),
    );
  }, [conversaciones, filter, search]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.mensajes.length]);

  const handleSelectConv = useCallback(
    (convId: string) => {
      setActiveConvId(convId);
      setMobileShowChat(true);
      const conv = conversaciones.find((c) => c.id === convId);
      if (conv && conv.noLeidos > 0) {
        markConversacionLeida(convId);
      }
    },
    [conversaciones, markConversacionLeida],
  );

  const handleSend = useCallback(() => {
    if (!activeConvId || !messageText.trim()) return;
    const conv = conversaciones.find((c) => c.id === activeConvId);
    if (!conv) return;
    const trimmed = messageText.trim();
    const msg: MensajeDirecto = {
      id: `MSG-${Date.now()}`,
      emisorId: 'admin',
      emisorNombre: 'Admin',
      receptorId: conv.participanteId,
      receptorNombre: conv.participanteNombre,
      contenido: trimmed,
      leido: false,
      enviadoEn: new Date().toISOString(),
    };

    setDbConversaciones((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              ultimoMensaje: trimmed,
              ultimoTimestamp: new Date().toISOString(),
              mensajes: [...c.mensajes, msg],
            }
          : c
      )
    );
    addMensaje(activeConvId, msg);

    fetch('/api/mensajes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receptorId: conv.participanteId,
        contenido: trimmed,
      }),
    }).catch((err) => console.error('[POST /api/mensajes error]', err));

    setMessageText('');
  }, [activeConvId, messageText, conversaciones, addMensaje]);

  const handleQuickReply = useCallback(
    (text: string) => {
      if (!activeConvId) return;
      const conv = conversaciones.find((c) => c.id === activeConvId);
      if (!conv) return;
      const msg: MensajeDirecto = {
        id: `MSG-${Date.now()}`,
        emisorId: 'admin',
        emisorNombre: 'Admin',
        receptorId: conv.participanteId,
        receptorNombre: conv.participanteNombre,
        contenido: text,
        leido: false,
        enviadoEn: new Date().toISOString(),
      };

      setDbConversaciones((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                ultimoMensaje: text,
                ultimoTimestamp: new Date().toISOString(),
                mensajes: [...c.mensajes, msg],
              }
            : c
        )
      );
      addMensaje(activeConvId, msg);

      fetch('/api/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receptorId: conv.participanteId,
          contenido: text,
        }),
      }).catch((err) => console.error('[POST /api/mensajes error]', err));

      addToast('Respuesta rápida enviada', 'success');
    },
    [activeConvId, conversaciones, addMensaje, addToast],
  );

  const quickReplies = [
    'Tu orden está en camino',
    'Estamos verificando tu caso con el repartidor',
    'Muchas gracias por comunicarte con LOGIFAST',
  ];

  const totalUnread = conversaciones.reduce((acc, c) => acc + c.noLeidos, 0);

  /* ─── Conversation List ─── */
  const convList = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search & Action bar */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--lf-border)', background: 'var(--lf-surface)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--lf-text-muted)' }}
            />
            <input
              placeholder="Buscar conversación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                borderRadius: 8,
                border: '1px solid var(--lf-border)',
                background: 'var(--lf-bg-base)',
                color: 'var(--lf-text-main)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
          <button
            onClick={() => {
              loadUsers();
              setNewChatModalOpen(true);
            }}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--lf-accent)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              transition: 'opacity 0.15s',
            }}
          >
            <Plus size={14} /> Redactar
          </button>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(
            [
              ['todos', 'Todos'],
              ['clientes', 'Clientes'],
              ['repartidores', 'Repartidores'],
              ['noLeidos', `No leídos${totalUnread > 0 ? ` (${totalUnread})` : ''}`],
            ] as [BuzonFilter, string][]
          ).map(([key, label]) => {
            const isSel = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: `1px solid ${isSel ? 'var(--lf-accent)' : 'var(--lf-border)'}`,
                  background: isSel ? 'var(--lf-accent)' : 'transparent',
                  color: isSel ? '#fff' : 'var(--lf-text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List items */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="lf-scrollbar">
        {filteredConvs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24, color: 'var(--lf-text-muted)' }}>
            <MessageCircle size={32} style={{ marginBottom: 8, opacity: 0.35 }} />
            <p style={{ fontSize: 13 }}>No hay conversaciones</p>
          </div>
        ) : (
          filteredConvs.map((conv) => {
            const isSelected = activeConvId === conv.id;
            return (
              <div
                key={conv.id}
                onClick={() => handleSelectConv(conv.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--lf-border)',
                  background: isSelected ? 'var(--lf-accent-soft)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: hashColor(conv.participanteId),
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {getInitials(conv.participanteNombre)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--lf-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.participanteNombre}
                    </span>
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--lf-text-muted)', flexShrink: 0 }}>
                      {timeElapsed(conv.ultimoTimestamp)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--lf-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.ultimoMensaje}
                    </span>
                    {conv.noLeidos > 0 && (
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          background: 'var(--lf-accent)',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {conv.noLeidos}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  /* ─── Chat View ─── */
  const chatView = activeConv ? (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid var(--lf-border)',
          background: 'var(--lf-surface)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setMobileShowChat(false)}
          className="lg:hidden"
          style={{ border: 'none', background: 'transparent', color: 'var(--lf-text-main)', cursor: 'pointer', padding: 4 }}
        >
          <ChevronLeft size={20} />
        </button>

        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: hashColor(activeConv.participanteId),
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {getInitials(activeConv.participanteNombre)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--lf-text-main)' }}>
              {activeConv.participanteNombre}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: activeConv.participanteRol === 'repartidor' ? 'rgba(255,102,0,0.1)' : 'rgba(41,121,255,0.1)',
                color: activeConv.participanteRol === 'repartidor' ? 'var(--lf-accent)' : '#2979FF',
                textTransform: 'uppercase',
              }}
            >
              {activeConv.participanteRol}
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>
            Canal de soporte y despacho en vivo
          </span>
        </div>

        <button
          onClick={() => {
            setActiveConvId(null);
            setMobileShowChat(false);
          }}
          style={{ border: 'none', background: 'transparent', color: 'var(--lf-text-muted)', cursor: 'pointer', padding: 4 }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Thread */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }} className="lf-scrollbar">
        {activeConv.mensajes.map((msg) => {
          const isAdmin = msg.emisorId === 'admin';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isAdmin ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '75%',
                  padding: '10px 14px',
                  fontSize: 13,
                  lineHeight: 1.45,
                  borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isAdmin ? 'var(--lf-accent)' : 'var(--lf-bg-base)',
                  color: isAdmin ? '#FFFFFF' : 'var(--lf-text-main)',
                  border: isAdmin ? 'none' : '1px solid var(--lf-border)',
                  boxShadow: isAdmin ? '0 2px 8px rgba(255,102,0,0.2)' : 'var(--lf-shadow-sm)',
                }}
              >
                {msg.contenido}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, padding: '0 4px' }}>
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--lf-text-muted)' }}>
                  {formatTime(msg.enviadoEn)}
                </span>
                {isAdmin && (
                  msg.leido ? (
                    <CheckCheck size={12} style={{ color: '#2979FF' }} />
                  ) : (
                    <Check size={12} style={{ color: 'var(--lf-text-muted)' }} />
                  )
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <div style={{ padding: '8px 16px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--lf-border)', background: 'var(--lf-surface)' }}>
        {quickReplies.map((qr) => (
          <button
            key={qr}
            onClick={() => handleQuickReply(qr)}
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              border: '1px solid rgba(255,102,0,0.25)',
              background: 'var(--lf-accent-soft)',
              color: 'var(--lf-accent)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            {qr}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderTop: '1px solid var(--lf-border)',
          background: 'var(--lf-surface)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => addToast('Adjuntar archivo (simulado)', 'info')}
          style={{ border: 'none', background: 'transparent', color: 'var(--lf-text-muted)', cursor: 'pointer', padding: 6 }}
        >
          <Paperclip size={18} />
        </button>

        <input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Escribe un mensaje aquí... (Presiona Enter)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--lf-border)',
            background: 'var(--lf-bg-base)',
            color: 'var(--lf-text-main)',
            fontSize: 13,
            outline: 'none',
          }}
        />

        <button
          onClick={handleSend}
          disabled={!messageText.trim()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            border: 'none',
            background: messageText.trim() ? 'var(--lf-accent)' : 'var(--lf-border)',
            color: '#fff',
            cursor: messageText.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--lf-text-muted)', padding: 24 }}>
      <MessageCircle size={44} style={{ marginBottom: 12, opacity: 0.3 }} />
      <p style={{ fontSize: 14, fontWeight: 500 }}>Selecciona una conversación para interactuar</p>
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        height: '620px',
        background: 'var(--lf-surface)',
        border: '1px solid var(--lf-border)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: 'var(--lf-shadow-sm)',
      }}
    >
      {/* Left panel - conversation list */}
      <div
        className={`w-full lg:w-80 lg:min-w-[320px] flex flex-col ${
          mobileShowChat ? 'hidden lg:flex' : 'flex'
        }`}
        style={{ borderRight: '1px solid var(--lf-border)' }}
      >
        {convList}
      </div>

      {/* Right panel - active chat */}
      <div
        className={`flex-1 ${
          mobileShowChat ? 'flex' : 'hidden lg:flex'
        } flex-col`}
      >
        {chatView}
      </div>

      {/* Modal Redactar Nuevo Mensaje */}
      <Dialog open={newChatModalOpen} onOpenChange={setNewChatModalOpen}>
        <DialogContent style={{ background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', maxWidth: 460 }}>
          <DialogHeader>
            <DialogTitle className="font-serif" style={{ color: 'var(--lf-text-main)', fontSize: 18 }}>
              Iniciar Nueva Conversación
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--lf-text-muted)' }} />
              <input
                placeholder="Buscar cliente o repartidor por nombre o correo..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 32px',
                  borderRadius: 8,
                  border: '1px solid var(--lf-border)',
                  background: 'var(--lf-bg-base)',
                  color: 'var(--lf-text-main)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }} className="lf-scrollbar">
              {systemUsers
                .filter((u) =>
                  !userSearch.trim() ||
                  u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                  u.email?.toLowerCase().includes(userSearch.toLowerCase())
                )
                .slice(0, 20)
                .map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleStartChatWithUser(u)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'var(--lf-bg-base)',
                      border: '1px solid var(--lf-border)',
                      cursor: 'pointer',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: hashColor(u.id),
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 12,
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        {getInitials(u.name || u.email)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--lf-text-main)' }}>
                          {u.name || u.email.split('@')[0]}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>
                          {u.email}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: u.role === 'repartidor' ? 'rgba(255,102,0,0.1)' : 'rgba(41,121,255,0.1)',
                        color: u.role === 'repartidor' ? 'var(--lf-accent)' : '#2979FF',
                        textTransform: 'uppercase',
                      }}
                    >
                      {u.role || 'cliente'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
          <DialogFooter style={{ marginTop: 12 }}>
            <Button variant="outline" onClick={() => setNewChatModalOpen(false)} style={{ borderColor: 'var(--lf-border)', color: 'var(--lf-text-main)' }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PLANTILLAS SUB-COMPONENT
   ═══════════════════════════════════════════════ */

function PlantillasPanel() {
  const { plantillas: storePlantillas, addPlantilla, updatePlantilla, deletePlantilla, addToast } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<PlantillaMensaje['categoria']>('general');
  const [contenido, setContenido] = useState('');

  const handleOpenNew = () => {
    setEditingId(null);
    setNombre('');
    setCategoria('general');
    setContenido('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p: PlantillaMensaje) => {
    setEditingId(p.id);
    setNombre(p.nombre);
    setCategoria(p.categoria);
    setContenido(p.contenido);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!nombre.trim() || !contenido.trim()) {
      addToast('Nombre y contenido son requeridos', 'error');
      return;
    }
    const vars = (contenido.match(/\{\{(\w+)\}\}/g) || []).map((v) => v.replace(/[{}]/g, ''));
    if (editingId) {
      updatePlantilla(editingId, { nombre: nombre.trim(), categoria, contenido: contenido.trim(), variables: vars });
      addToast('Plantilla actualizada', 'success');
    } else {
      addPlantilla({
        id: `PLANT-${Date.now()}`,
        nombre: nombre.trim(),
        categoria,
        contenido: contenido.trim(),
        variables: vars,
        esDefault: false,
        createdAt: new Date().toISOString(),
      });
      addToast('Plantilla creada', 'success');
    }
    setModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="font-serif" style={{ fontSize: 16, fontWeight: 700, color: 'var(--lf-text-main)', margin: 0 }}>
            Plantillas de Mensajes Predefinidos
          </h3>
          <p style={{ fontSize: 12, color: 'var(--lf-text-muted)', margin: '2px 0 0' }}>
            Respuestas automatizadas para soporte y despacho
          </p>
        </div>
        <Button onClick={handleOpenNew} style={{ background: 'var(--lf-accent)', color: '#fff', fontSize: 12, fontWeight: 600 }}>
          <Plus size={14} className="mr-1" /> Nueva Plantilla
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {storePlantillas.map((p) => {
          const cat = CATEGORIA_CONFIG[p.categoria] || CATEGORIA_CONFIG.general;
          return (
            <div
              key={p.id}
              style={{
                background: 'var(--lf-surface)',
                border: '1px solid var(--lf-border)',
                borderRadius: 12,
                padding: 16,
                boxShadow: 'var(--lf-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--lf-text-main)' }}>{p.nombre}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: cat.bg, color: cat.color }}>
                  {cat.label}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--lf-text-muted)', lineHeight: 1.4, margin: '8px 0' }}>
                {p.contenido}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--lf-border)' }}>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>
                  {p.variables.length} variables
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleOpenEdit(p)} style={{ border: 'none', background: 'transparent', color: 'var(--lf-accent)', cursor: 'pointer', padding: 4 }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deletePlantilla(p.id)} style={{ border: 'none', background: 'transparent', color: 'var(--lf-danger, #DC2626)', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent style={{ background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', maxWidth: 480 }}>
          <DialogHeader>
            <DialogTitle className="font-serif" style={{ color: 'var(--lf-text-main)', fontSize: 18 }}>
              {editingId ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', marginBottom: 4, display: 'block' }}>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Confirmación de entrega"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--lf-border)', background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', marginBottom: 4, display: 'block' }}>Categoría</label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as any)}>
                <SelectTrigger style={{ background: 'var(--lf-bg-base)', borderColor: 'var(--lf-border)', color: 'var(--lf-text-main)' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'var(--lf-surface)', borderColor: 'var(--lf-border)' }}>
                  <SelectItem value="orden">Orden</SelectItem>
                  <SelectItem value="incidencia">Incidencia</SelectItem>
                  <SelectItem value="promocion">Promoción</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', marginBottom: 4, display: 'block' }}>Contenido</label>
              <Textarea value={contenido} onChange={(e) => setContenido(e.target.value)} rows={3} placeholder="Hola {{nombre}}, tu orden {{orden}}..."
                style={{ background: 'var(--lf-bg-base)', borderColor: 'var(--lf-border)', color: 'var(--lf-text-main)' }} />
            </div>
          </div>
          <DialogFooter style={{ marginTop: 12 }}>
            <Button variant="outline" onClick={() => setModalOpen(false)} style={{ borderColor: 'var(--lf-border)', color: 'var(--lf-text-main)' }}>Cancelar</Button>
            <Button onClick={handleSave} style={{ background: 'var(--lf-accent)', color: '#fff' }}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   NOTIFICACIONES SUB-COMPONENT
   ═══════════════════════════════════════════════ */

function NotificacionesPanel() {
  const { notificacionesAuto: storeNotifs, toggleNotificacionAuto, addToast } = useStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h3 className="font-serif" style={{ fontSize: 16, fontWeight: 700, color: 'var(--lf-text-main)', margin: 0 }}>
          Reglas de Automatización de Notificaciones
        </h3>
        <p style={{ fontSize: 12, color: 'var(--lf-text-muted)', margin: '2px 0 0' }}>
          Disparadores automáticos por eventos en la plataforma
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {storeNotifs.map((n) => {
          const canal = CANAL_CONFIG[n.canal] || CANAL_CONFIG.push;
          const CanalIcon = canal.icon;
          return (
            <div
              key={n.id}
              style={{
                background: 'var(--lf-surface)',
                border: '1px solid var(--lf-border)',
                borderRadius: 12,
                padding: 16,
                boxShadow: 'var(--lf-shadow-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: canal.bg, color: canal.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CanalIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--lf-text-main)' }}>{n.evento}</div>
                  <div style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>Destinatario: {n.destinatario} • Canal: {canal.label}</div>
                </div>
              </div>
              <Switch checked={n.activa} onCheckedChange={() => {
                toggleNotificacionAuto(n.id);
                addToast(`Notificación "${n.evento}" ${n.activa ? 'desactivada' : 'activada'}`);
              }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ModuleComunicaciones() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('buzon');
  const { conversaciones, plantillas, notificacionesAuto, riders } = useStore();

  const totalUnread = conversaciones.reduce((acc, c) => acc + c.noLeidos, 0);
  const ridersOnline = riders.filter((r) => r.conectado).length;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 20px',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
      }}
      className="lf-scrollbar"
    >
      {/* ═══ HEADER ═══ */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <h2
          className="font-serif"
          style={{
            fontWeight: 700,
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--lf-text-main)',
            letterSpacing: '-0.02em',
          }}
        >
          <MessageCircle size={22} style={{ color: '#FF6600' }} />
          Comunicaciones & Soporte
        </h2>
        <p style={{ fontSize: 13, color: 'var(--lf-text-muted)', marginTop: 4 }}>
          Centro unificado de mensajería en tiempo real, plantillas dinámicas y automatizaciones
        </p>
      </div>

      {/* ═══ METRICS STRIP ═══ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 16,
          flexShrink: 0,
        }}
      >
        {[
          { label: 'Conversaciones Activas', value: conversaciones.length || 8, icon: MessageCircle, color: '#FF6600', bg: 'rgba(255,102,0,0.1)' },
          { label: 'Mensajes No Leídos', value: totalUnread, icon: Bell, color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
          { label: 'Riders Conectados', value: ridersOnline || 5, icon: Bike, color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
          { label: 'Plantillas Listas', value: plantillas.length || 4, icon: Mail, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
        ].map((m, i) => (
          <div
            key={i}
            style={{
              background: 'var(--lf-surface)',
              border: '1px solid var(--lf-border)',
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--lf-shadow-sm)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>
                {m.label}
              </div>
              <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--lf-text-main)', marginTop: 2 }}>
                {m.value}
              </div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: m.bg, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <m.icon size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* ═══ SUB-TAB SWITCHER ═══ */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 16,
          background: 'var(--lf-surface)',
          border: '1px solid var(--lf-border)',
          borderRadius: 10,
          padding: 4,
          width: 'fit-content',
          flexShrink: 0,
        }}
      >
        {SUB_TABS.map((tab) => {
          const isActive = activeSubTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                background: isActive ? 'var(--lf-accent)' : 'transparent',
                color: isActive ? '#fff' : 'var(--lf-text-muted)',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══ SUB-TAB CONTENT ═══ */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{ height: '100%' }}
          >
            {activeSubTab === 'buzon' && <BuzonPanel />}
            {activeSubTab === 'plantillas' && <PlantillasPanel />}
            {activeSubTab === 'notificaciones' && <NotificacionesPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
