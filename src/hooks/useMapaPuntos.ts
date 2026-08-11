'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseRealtime } from '@/lib/supabaseClient';

export interface TiendaPunto {
  id: string;
  tipo: 'tienda';
  nombre: string;
  categoria: string;
  lat: number;
  lng: number;
  direccion: string;
  telefono?: string | null;
  logoColor: string;
  imagenUrl?: string | null;
  calificacion: number;
}

export interface ClientePunto {
  id: string;
  tipo: 'cliente_direccion';
  etiqueta: string;
  nombreCliente: string;
  telefono: string;
  direccion: string;
  referencia?: string | null;
  lat: number;
  lng: number;
}

export interface RepartidorPunto {
  id: string;
  tipo: 'repartidor';
  nombre: string;
  vehiculoTipo: string;
  lat: number;
  lng: number;
  fotoUrl?: string | null;
  color: string;
}

export function useMapaPuntos() {
  const [tiendas, setTiendas] = useState<TiendaPunto[]>([]);
  const [clientePuntos, setClientePuntos] = useState<ClientePunto[]>([]);
  const [repartidoresPuntos, setRepartidoresPuntos] = useState<RepartidorPunto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPuntos = useCallback(async () => {
    try {
      const res = await fetch('/api/mapa/puntos');
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok) {
        setTiendas(data.tiendas || []);
        setClientePuntos(data.clientePuntos || []);
        setRepartidoresPuntos(data.repartidoresPuntos || []);
      }
    } catch (err) {
      console.error('[USE_MAPA_PUNTOS_ERROR]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPuntos();

    // Suscripción a Supabase Realtime por WebSockets para cambios vivos de GPS
    const channelId = `mapa-puntos-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabaseRealtime
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'RepartidorProfile' },
        (payload) => {
          const updated = payload.new as any;
          setRepartidoresPuntos((prev) => {
            if (!updated.conectado) {
              return prev.filter((r) => r.id !== updated.id);
            }
            const idx = prev.findIndex((r) => r.id === updated.id);
            if (idx !== -1) {
              const list = [...prev];
              list[idx] = {
                ...list[idx],
                lat: updated.lat ?? list[idx].lat,
                lng: updated.lng ?? list[idx].lng,
              };
              return list;
            }
            return prev;
          });
        }
      )
      .subscribe();

    const handleVisibilityAndPoll = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchPuntos();
      }
    };

    // Respaldo de actualización diferida cada 45s solo si la pestaña está visible
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchPuntos();
      }
    }, 45000);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityAndPoll);
    }

    return () => {
      clearInterval(interval);
      supabaseRealtime.removeChannel(channel);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityAndPoll);
      }
    };
  }, [fetchPuntos]);

  return { tiendas, clientePuntos, repartidoresPuntos, loading, refetch: fetchPuntos };
}
