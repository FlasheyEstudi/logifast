'use client';

import { useState, useEffect, useCallback } from 'react';

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

    const handleVisibilityAndPoll = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchPuntos();
      }
    };

    // Actualizar automáticamente los puntos del mapa cada 35s solo cuando la pestaña es visible
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchPuntos();
      }
    }, 35000);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityAndPoll);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityAndPoll);
      }
    };
  }, [fetchPuntos]);

  return { tiendas, clientePuntos, repartidoresPuntos, loading, refetch: fetchPuntos };
}
