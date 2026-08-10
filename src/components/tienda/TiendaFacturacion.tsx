'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Save, CheckCircle2, Shield, AlertCircle } from '@/components/icons';
import { notify } from '@/lib/notify';

export function TiendaFacturacion({ isDark }: { isDark: boolean }) {
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [regimenDgi, setRegimenDgi] = useState('Cuota Fija');
  const [saludoFactura, setSaludoFactura] = useState('');
  const [piePaginaFactura, setPiePaginaFactura] = useState('');
  const [serieFactura, setSerieFactura] = useState('F001');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const res = await fetch('/api/tienda/perfil');
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok && data.tienda) {
        const t = data.tienda;
        setRuc(t.ruc || '');
        setRazonSocial(t.razonSocial || t.nombre || '');
        setRegimenDgi(t.regimenDgi || 'Cuota Fija');
        setSaludoFactura(t.saludoFactura || '¡Gracias por su compra!');
        setPiePaginaFactura(t.piePaginaFactura || 'Conservar este comprobante para cambios o reclamos.');
        setSerieFactura(t.serieFactura || 'F001');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const guardarFacturacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch('/api/tienda/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruc,
          razonSocial,
          regimenDgi,
          saludoFactura,
          piePaginaFactura,
          serieFactura,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        notify.success('Configuración fiscal y de facturación actualizada');
      } else {
        notify.error(data.error || 'Error al guardar configuración');
      }
    } catch (err) {
      notify.error('Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
      {/* Columna Izquierda: Formulario de Configuración Fiscal */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
            Configuración de Facturación & DGI
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Ajustes fiscales para la emisión de comprobantes, tickets y facturas en POS y ventas.
          </p>
        </div>

        <form onSubmit={guardarFacturacion} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                Número RUC de la Empresa *
              </label>
              <input
                type="text"
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                placeholder="Ej: J0310000000000"
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-alt)',
                  padding: '0 12px',
                  color: 'var(--text)',
                  fontSize: 13,
                  marginTop: 4,
                }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                Razón Social Legal *
              </label>
              <input
                type="text"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                placeholder="Ej: Comercial Distribuidora S.A."
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-alt)',
                  padding: '0 12px',
                  color: 'var(--text)',
                  fontSize: 13,
                  marginTop: 4,
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                Régimen Fiscal DGI
              </label>
              <select
                value={regimenDgi}
                onChange={(e) => setRegimenDgi(e.target.value)}
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-alt)',
                  padding: '0 12px',
                  color: 'var(--text)',
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                <option value="Cuota Fija">Cuota Fija (Pequeño Contribuyente)</option>
                <option value="Régimen General">Régimen General (IVA 15%)</option>
                <option value="Exento">Exento de Impuestos</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                Serie de Comprobante / Serie Factura
              </label>
              <input
                type="text"
                value={serieFactura}
                onChange={(e) => setSerieFactura(e.target.value)}
                placeholder="F001"
                style={{
                  width: '100%',
                  height: 40,
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-alt)',
                  padding: '0 12px',
                  color: 'var(--text)',
                  fontSize: 13,
                  marginTop: 4,
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
              Mensaje de Saludo o Agradecimiento en la Factura
            </label>
            <input
              type="text"
              value={saludoFactura}
              onChange={(e) => setSaludoFactura(e.target.value)}
              placeholder="Ej: ¡Gracias por su compra! Vuelva pronto."
              style={{
                width: '100%',
                height: 40,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-alt)',
                padding: '0 12px',
                color: 'var(--text)',
                fontSize: 13,
                marginTop: 4,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
              Pie de Página Legal o Términos de Garantía
            </label>
            <textarea
              value={piePaginaFactura}
              onChange={(e) => setPiePaginaFactura(e.target.value)}
              placeholder="Ej: Conservar este comprobante para cualquier garantía dentro de 15 días."
              rows={3}
              style={{
                width: '100%',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-alt)',
                padding: 10,
                color: 'var(--text)',
                fontSize: 13,
                marginTop: 4,
              }}
            />
          </div>

          {/* Pie de Marca Institucional LogiFast */}
          <div
            style={{
              background: 'rgba(0,102,255,0.08)',
              border: '1px solid rgba(0,102,255,0.2)',
              borderRadius: 12,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Shield size={20} style={{ color: '#0066FF' }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0066FF' }}>
                Pie de Marca Institucional Permanente
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Todas las facturas emitidas llevarán la leyenda "Generado por LogiFast PWA - Sistema POS & E-Commerce".
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 44,
              borderRadius: 12,
              border: 'none',
              background: '#0066FF',
              color: 'white',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              marginTop: 10,
              boxShadow: '0 4px 14px rgba(0,102,255,0.3)',
            }}
          >
            <Save size={16} />
            <span>{guardando ? 'Guardando Ajustes...' : 'Guardar Configuración Fiscal'}</span>
          </button>
        </form>
      </div>

      {/* Columna Derecha: Vista Previa Interactiva del Ticket/Factura */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>
          Vista Previa de Factura Térmica
        </div>

        <div
          style={{
            background: '#FFFFFF',
            color: '#000000',
            width: '100%',
            borderRadius: 12,
            padding: 20,
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 11,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 'bold' }}>{razonSocial || 'MI TIENDA S.A.'}</div>
            <div>RUC: {ruc || 'J0310000000000'}</div>
            <div>DGI: {regimenDgi}</div>
            <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
            <div>FACTURA POS #{serieFactura}-000104</div>
            <div>Fecha: {new Date().toLocaleDateString('es-NI')}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>2x Producto Muestra A</span>
              <span>C$ 240.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>1x Producto Muestra B</span>
              <span>C$ 110.00</span>
            </div>
          </div>

          <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>TOTAL:</span>
            <span>C$ 350.00</span>
          </div>

          <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

          <div style={{ textAlign: 'center', fontSize: 9, marginTop: 6 }}>
            <div>{saludoFactura || '¡Gracias por su compra!'}</div>
            <div style={{ marginTop: 2 }}>{piePaginaFactura || 'Conservar este comprobante.'}</div>
            <div style={{ marginTop: 6, fontWeight: 'bold' }}>
              *** Generado por LogiFast PWA - Sistema POS & E-Commerce ***
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
