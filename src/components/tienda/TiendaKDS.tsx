'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle2, AlertCircle, Bell, RefreshCw, Bike } from '@/components/icons';
import { notify } from '@/lib/notify';

interface ItemOrden {
  id?: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
}

interface OrdenKDS {
  id: string;
  estado: string;
  clienteNombre: string;
  clienteTelefono?: string;
  direccionEntrega: string;
  total: number;
  metodoPago: string;
  items: ItemOrden[];
  createdAt: string;
  repartidorNombre?: string;
}

export function TiendaKDS({ isDark }: { isDark: boolean }) {
  const [ordenes, setOrdenes] = useState<OrdenKDS[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const cargarOrdenes = useCallback(async () => {
    try {
      const res = await fetch('/api/cliente/tienda/pedidos');
      if (!res.ok) return;
      const data = await res.json();
      const ordenesRecibidas: OrdenKDS[] = (data.pedidos || []).map((p: any) => ({
        id: p.id,
        estado: p.estado || 'recibido',
        clienteNombre: p.clienteNombre || 'Cliente',
        clienteTelefono: p.clienteTelefono || '',
        direccionEntrega: p.direccionEntrega || 'Managua',
        total: p.total || 0,
        metodoPago: p.metodoPago || 'efectivo',
        items: p.items || [],
        createdAt: p.fecha ? `${p.fecha} ${p.hora || ''}` : new Date().toISOString(),
      }));

      // Reproducir sonido si hay órdenes nuevas recibidas sin aceptar
      const hayNuevas = ordenesRecibidas.some((o) => o.estado === 'recibido');
      if (hayNuevas && soundEnabled) {
        try {
          const audio = new Audio('/sounds/kds-alert.mp3');
          audio.play().catch(() => {});
        } catch (e) {}
      }

      setOrdenes(ordenesRecibidas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    cargarOrdenes();
    const interval = setInterval(cargarOrdenes, 15000);
    return () => clearInterval(interval);
  }, [cargarOrdenes]);

  const cambiarEstado = async (ordenId: string, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/ordenes/${ordenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.ok) {
        notify.success(`Pedido marcado como ${nuevoEstado}`);
        cargarOrdenes();
      } else {
        notify.error('Error al actualizar el estado');
      }
    } catch (e) {
      notify.error('Error de conexión');
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'recibido': return '#FF9500';
      case 'preparando': return '#0066FF';
      case 'listo': return '#34C759';
      case 'entregado': return '#8E8E93';
      default: return '#FF9500';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KDS Header Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface)',
          padding: '16px 20px',
          borderRadius: 16,
          border: '1px solid var(--border)',
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            Monitor KDS (Cocina y Despacho en Vivo)
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Control en tiempo real de comanda con alarma sonora y tiempos de preparación.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 10,
              border: `1px solid ${soundEnabled ? 'rgba(52, 199, 89, 0.4)' : 'var(--border)'}`,
              background: soundEnabled ? 'rgba(52, 199, 89, 0.1)' : 'var(--bg-alt)',
              color: soundEnabled ? '#34C759' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Bell size={16} />
            <span>{soundEnabled ? 'Alarma Sonora Activa' : 'Alarma Silenciada'}</span>
          </button>

          <button
            onClick={cargarOrdenes}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-alt)',
              color: 'var(--text)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {ordenes.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--surface)',
            borderRadius: 16,
            border: '1px dashed var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          <Clock size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            No hay pedidos activos en este momento
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Los nuevos pedidos recibidos desde la app o Marketplace sonarás aquí al instante.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {ordenes.map((ord) => {
            const colorStatus = getStatusColor(ord.estado);
            return (
              <div
                key={ord.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 16,
                  border: `2px solid ${colorStatus}`,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                }}
              >
                {/* Order Top Bar */}
                <div
                  style={{
                    background: colorStatus,
                    color: '#FFFFFF',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    Pedido #{ord.id.slice(-5).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                    {ord.estado}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                      Cliente: {ord.clienteNombre}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {ord.direccionEntrega}
                    </div>
                  </div>

                  {/* Items breakdown */}
                  <div
                    style={{
                      background: 'var(--bg-alt)',
                      padding: 12,
                      borderRadius: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Ítems de Comanda
                    </div>
                    {ord.items.map((it, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text)',
                        }}
                      >
                        <span>{it.cantidad}x {it.nombreProducto}</span>
                        <span>C$ {(it.cantidad * it.precioUnitario).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pago: {ord.metodoPago}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#0066FF' }}>
                      Total: C$ {ord.total.toFixed(2)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                    {ord.estado === 'recibido' && (
                      <button
                        onClick={() => cambiarEstado(ord.id, 'preparando')}
                        style={{
                          gridColumn: 'span 2',
                          height: 40,
                          borderRadius: 10,
                          background: '#0066FF',
                          color: 'white',
                          border: 'none',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Aceptar y Preparar
                      </button>
                    )}
                    {ord.estado === 'preparando' && (
                      <button
                        onClick={() => cambiarEstado(ord.id, 'listo')}
                        style={{
                          gridColumn: 'span 2',
                          height: 40,
                          borderRadius: 10,
                          background: '#34C759',
                          color: 'white',
                          border: 'none',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Marcar Pedido Listo
                      </button>
                    )}
                    {ord.estado === 'listo' && (
                      <button
                        onClick={() => cambiarEstado(ord.id, 'entregado')}
                        style={{
                          gridColumn: 'span 2',
                          height: 40,
                          borderRadius: 10,
                          background: '#8E8E93',
                          color: 'white',
                          border: 'none',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Finalizar / Despachado
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
