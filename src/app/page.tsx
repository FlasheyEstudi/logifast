'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Role data ─── */
const rolesData = [
  {
    id: 'cliente',
    tab: 'Cliente',
    title: 'Solicita y rastrea',
    desc: 'Pide un envío en segundos, obtén tu cotización al instante y sigue cada movimiento de tu paquete en tiempo real.',
    features: ['Autocompletado de direcciones', 'Cotización instantánea', 'GPS en tiempo real', 'Historial completo'],
    mockupBlocks: [
      { h: 48, cls: 'lf-mockup-block-navy', w: '60%' },
      { h: 32, cls: 'lf-mockup-block-accent', w: '80%' },
      { h: 24, cls: 'lf-mockup-block-muted', w: '50%' },
      { h: 64, cls: 'lf-mockup-block-navy', w: '100%' },
      { h: 24, cls: 'lf-mockup-block-muted', w: '40%' },
      { h: 40, cls: 'lf-mockup-block-accent', w: '70%' },
    ],
  },
  {
    id: 'repartidor',
    tab: 'Repartidor',
    title: 'Entrega con confianza',
    desc: 'Recibe asignaciones automáticas, navega rutas optimizadas y registra cada entrega sin fricción.',
    features: ['Asignación automática', 'Contador de kilómetros', 'Mapa de ruta', 'Reporte de incidencias'],
    mockupBlocks: [
      { h: 64, cls: 'lf-mockup-block-accent', w: '100%' },
      { h: 32, cls: 'lf-mockup-block-muted', w: '45%' },
      { h: 32, cls: 'lf-mockup-block-muted', w: '45%' },
      { h: 48, cls: 'lf-mockup-block-navy', w: '80%' },
      { h: 24, cls: 'lf-mockup-block-accent', w: '60%' },
      { h: 32, cls: 'lf-mockup-block-muted', w: '90%' },
    ],
  },
  {
    id: 'admin',
    tab: 'Administrador',
    title: 'Control total',
    desc: 'Visualiza toda la flota, gestiona pedidos y reasigna recursos con un dashboard operativo en tiempo real.',
    features: ['Mapa de flota en vivo', 'Gestión de pedidos', 'Reasignación inteligente', 'Reportes operativos'],
    mockupBlocks: [
      { h: 80, cls: 'lf-mockup-block-navy', w: '100%' },
      { h: 32, cls: 'lf-mockup-block-accent', w: '30%' },
      { h: 32, cls: 'lf-mockup-block-accent', w: '30%' },
      { h: 32, cls: 'lf-mockup-block-accent', w: '30%' },
      { h: 48, cls: 'lf-mockup-block-muted', w: '60%' },
      { h: 24, cls: 'lf-mockup-block-navy', w: '80%' },
    ],
  },
  {
    id: 'ingeniero',
    tab: 'Ingeniero',
    title: 'Mantiene la flota',
    desc: 'Monitorea el estado de cada moto, gestiona inventario de repuestos y programa mantenimientos preventivos.',
    features: ['Alertas por kilometraje', 'Inventario de repuestos', 'Mantenimiento programado', 'Detección de anomalías'],
    mockupBlocks: [
      { h: 40, cls: 'lf-mockup-block-accent', w: '50%' },
      { h: 40, cls: 'lf-mockup-block-muted', w: '45%' },
      { h: 64, cls: 'lf-mockup-block-navy', w: '100%' },
      { h: 24, cls: 'lf-mockup-block-accent', w: '40%' },
      { h: 24, cls: 'lf-mockup-block-muted', w: '55%' },
      { h: 48, cls: 'lf-mockup-block-navy', w: '70%' },
    ],
  },
];

/* ─── Feature data ─── */
const featuresData = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: 'Rastreo GPS',
    desc: 'Sigue cada envío en tiempo real con posición exacta, ETA actualizado y notificaciones de progreso.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: 'Alertas mantenimiento',
    desc: 'Recibe alertas automáticas cuando una moto necesita servicio basado en kilometraje y desgaste.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: 'Cotización automática',
    desc: 'Obtén precios instantáneos basados en distancia, zona y tipo de envío. Sin esperas, sin sorpresas.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
      </svg>
    ),
    title: 'Dashboard operativo',
    desc: 'Vista consolidada de la flota, entregas activas y métricas clave para decisiones rápidas.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    title: 'Inventario repuestos',
    desc: 'Control total de piezas y repuestos con stock mínimo, alertas de reorden y trazabilidad.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Reportes y análisis',
    desc: 'Datos accionables sobre rendimiento, tiempos de entrega y eficiencia de la flota.',
  },
];

export default function Home() {
  const [activeRole, setActiveRole] = useState('cliente');
  const [isDark, setIsDark] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const revealRef = useRef<HTMLElement>(null);

  /* ─── Navbar scroll effect ─── */
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ─── Scroll reveal (IntersectionObserver) ─── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const el = revealRef.current;
    if (el) {
      el.querySelectorAll('.reveal').forEach((r) => observer.observe(r));
    }
    return () => observer.disconnect();
  }, []);

  /* ─── Theme toggle ─── */
  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
      return next;
    });
  }, []);

  /* ─── Smooth scroll to section ─── */
  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <main className="grain-overlay" ref={revealRef}>
      {/* ═══════════════════════════════════════════
          NAVBAR
          ═══════════════════════════════════════════ */}
      <nav className={`lf-navbar ${navScrolled ? 'scrolled' : ''}`}>
        <a href="#" className="lf-navbar-logo" onClick={(e) => { e.preventDefault(); scrollTo('hero'); }}>
          <div className="lf-logo-mark">LF</div>
          <span className="lf-logo-text font-serif">LOGIFAST</span>
        </a>

        <ul className="lf-nav-links">
          <li><a href="#como-funciona" onClick={(e) => { e.preventDefault(); scrollTo('como-funciona'); }}>Cómo funciona</a></li>
          <li><a href="#funciones" onClick={(e) => { e.preventDefault(); scrollTo('funciones'); }}>Funciones</a></li>
          <li><a href="#roles" onClick={(e) => { e.preventDefault(); scrollTo('roles'); }}>Roles</a></li>
          <li><a href="#contacto" onClick={(e) => { e.preventDefault(); scrollTo('contacto'); }}>Contacto</a></li>
        </ul>

        <div className="lf-nav-actions">
          <button className="lf-theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema">
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button className="lf-btn-primary nav-btn">Iniciar sesión</button>
          <button className="lf-hamburger" onClick={() => setMobileMenuOpen((p) => !p)} aria-label="Menú">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className={`lf-mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#como-funciona" onClick={(e) => { e.preventDefault(); scrollTo('como-funciona'); }}>Cómo funciona</a>
        <a href="#funciones" onClick={(e) => { e.preventDefault(); scrollTo('funciones'); }}>Funciones</a>
        <a href="#roles" onClick={(e) => { e.preventDefault(); scrollTo('roles'); }}>Roles</a>
        <a href="#contacto" onClick={(e) => { e.preventDefault(); scrollTo('contacto'); }}>Contacto</a>
        <button className="lf-btn-primary" style={{ marginTop: 16, width: 'fit-content' }}>Iniciar sesión</button>
      </div>

      {/* ═══════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════ */}
      <section className="lf-hero" id="hero">
        <div className="lf-hero-inner">
          <div className="lf-hero-content">
            <div className="lf-badge reveal">
              <span className="lf-badge-dot" />
              Flota activa en Managua
            </div>
            <h1 className="lf-hero-title reveal reveal-delay-1">
              Tus envíos,{' '}
              <span className="accent-italic">seguros</span> y{' '}
              <span className="accent-italic">rápidos</span>
            </h1>
            <p className="lf-hero-subtitle reveal reveal-delay-2">
              Gestión logística con flota motociclista para envíos urbanos en Managua.
              Rastreo en tiempo real, cotización automática y entregas que llegan.
            </p>
            <div className="lf-hero-buttons reveal reveal-delay-3">
              <button className="lf-btn-primary">
                Solicitar envío
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </button>
              <button className="lf-btn-outline">Ver demo</button>
            </div>
            <div className="lf-hero-stats reveal reveal-delay-4">
              <div className="lf-hero-stat">
                <span className="lf-hero-stat-number font-mono">12K+</span>
                <span className="lf-hero-stat-label">Envíos completados</span>
              </div>
              <div className="lf-hero-stat">
                <span className="lf-hero-stat-number font-mono">98%</span>
                <span className="lf-hero-stat-label">Entregas a tiempo</span>
              </div>
              <div className="lf-hero-stat">
                <span className="lf-hero-stat-number font-mono">45</span>
                <span className="lf-hero-stat-label">Motos en flota</span>
              </div>
            </div>
          </div>

          <div className="lf-hero-visual reveal reveal-delay-2">
            {/* Floating card 1 */}
            <div className="lf-float-card lf-float-card-1">
              <span className="lf-float-card-dot green" />
              <span className="lf-float-card-number font-mono">+24</span>
              <span className="lf-float-card-label">Entregado hoy</span>
            </div>

            {/* Phone mockup */}
            <div className="lf-phone">
              <div className="lf-phone-notch" />
              <div className="lf-phone-header">
                <div>
                  <div className="lf-phone-header-title">Seguimiento</div>
                  <div className="lf-phone-header-order font-mono">Orden #LF-2847</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </div>
              <div className="lf-phone-map">
                <div className="lf-phone-map-grid" />
                <div className="lf-phone-route">
                  <div className="lf-phone-route-line" />
                  <div className="lf-phone-route-line-2" />
                </div>
                <div className="lf-phone-pin lf-pin-pickup"><span>A</span></div>
                <div className="lf-phone-pin lf-pin-delivery"><span>B</span></div>
                <div className="lf-phone-pin lf-pin-rider"><span>🏍</span></div>
              </div>
              <div className="lf-phone-bottom">
                <div className="lf-phone-handle" />
                <div className="lf-phone-rider-info">
                  <div className="lf-phone-rider-avatar">CR</div>
                  <div>
                    <div className="lf-phone-rider-name">Carlos Rivera</div>
                    <div className="lf-phone-rider-vehicle">Honda Wave • Roja</div>
                  </div>
                </div>
                <div className="lf-phone-eta">
                  <div>
                    <div className="lf-phone-eta-label">Llegada estimada</div>
                    <div className="lf-phone-eta-time font-mono">12 min</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="lf-phone-eta-label">Hora</div>
                    <div className="lf-phone-eta-arrival font-mono">2:35 PM</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating card 2 */}
            <div className="lf-float-card lf-float-card-2">
              <span className="lf-float-card-dot orange" />
              <span className="lf-float-card-number font-mono">8</span>
              <span className="lf-float-card-label">En ruta activas</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TRUST BAR
          ═══════════════════════════════════════════ */}
      <section className="lf-trust-bar reveal">
        <div className="lf-trust-label">Empresas que confían en nosotros</div>
        <div className="lf-trust-logos">
          <span className="lf-trust-logo">NicaCommerce</span>
          <span className="lf-trust-logo">TecnoManagua</span>
          <span className="lf-trust-logo">DelSur Market</span>
          <span className="lf-trust-logo">CasaNica</span>
          <span className="lf-trust-logo">FastCargo NI</span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CÓMO FUNCIONA
          ═══════════════════════════════════════════ */}
      <section className="lf-how" id="como-funciona">
        <div className="lf-how-inner">
          <div className="lf-how-header">
            <div>
              <span className="lf-eyebrow reveal">Cómo funciona</span>
              <h2 className="lf-section-title reveal reveal-delay-1">
                De tu puerta a su destino
              </h2>
            </div>
            <p className="lf-how-desc reveal reveal-delay-2">
              Un proceso simple y transparente. Tú pides, nosotros nos encargamos del resto.
              Cada paso es rastreable para que siempre sepas dónde está tu envío.
            </p>
          </div>

          <div className="lf-steps">
            {[
              { num: '01', title: 'Solicita', desc: 'Ingresa el origen, destino y tipo de paquete. Cotización instantánea.' },
              { num: '02', title: 'Asignamos', desc: 'El sistema asigna el repartidor más cercano de forma automática.' },
              { num: '03', title: 'Rastrea', desc: 'Sigue tu envío en tiempo real con GPS y notificaciones.' },
              { num: '04', title: 'Entregado', desc: 'Confirmación con foto y firma. Comprobante digital al instante.' },
            ].map((step, i) => (
              <div className="lf-step reveal" key={step.num} style={{ transitionDelay: `${i * 0.12}s` }}>
                <div className="lf-step-number font-mono">{step.num}</div>
                <div className="lf-step-text">
                  <div className="lf-step-title">{step.title}</div>
                  <div className="lf-step-desc">{step.desc}</div>
                </div>
                {i < 3 && <div className="lf-step-line" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FUNCIONES
          ═══════════════════════════════════════════ */}
      <section className="lf-features" id="funciones">
        <div className="lf-features-inner">
          <div className="lf-features-header">
            <span className="lf-eyebrow reveal">Funciones</span>
            <h2 className="lf-section-title reveal reveal-delay-1">
              Todo lo que necesitas para operar
            </h2>
            <p className="reveal reveal-delay-2">
              Herramientas diseñadas para cada actor de la cadena logística, desde el cliente hasta el ingeniero de mantenimiento.
            </p>
          </div>

          <div className="lf-features-grid">
            {featuresData.map((f, i) => (
              <div className="lf-feature-card reveal" key={f.title} style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="lf-feature-icon">{f.icon}</div>
                <div className="lf-feature-title">{f.title}</div>
                <div className="lf-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ROLES
          ═══════════════════════════════════════════ */}
      <section className="lf-roles" id="roles">
        <div className="lf-roles-inner">
          <div className="lf-roles-header">
            <span className="lf-eyebrow reveal">Para cada rol</span>
            <h2 className="lf-section-title reveal reveal-delay-1">
              Una experiencia a tu medida
            </h2>
          </div>

          <div className="lf-roles-tabs reveal reveal-delay-2">
            {rolesData.map((r) => (
              <button
                key={r.id}
                className={`lf-role-tab ${activeRole === r.id ? 'active' : ''}`}
                onClick={() => setActiveRole(r.id)}
              >
                {r.tab}
              </button>
            ))}
          </div>

          <div className="lf-roles-preview reveal reveal-delay-3">
            <div className="lf-window-dots">
              <span className="lf-window-dot red" />
              <span className="lf-window-dot yellow" />
              <span className="lf-window-dot green" />
            </div>

            {rolesData.map((r) => (
              <div key={r.id} className={`lf-role-panel ${activeRole === r.id ? 'active' : ''}`}>
                <div className="lf-roles-content">
                  <div className="lf-roles-info">
                    <h3 className="lf-roles-info-title font-serif">{r.title}</h3>
                    <p className="lf-roles-info-desc">{r.desc}</p>
                    <ul className="lf-roles-features">
                      {r.features.map((f) => (
                        <li key={f}>
                          <span className="lf-check-icon">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="lf-roles-mockup">
                    {r.mockupBlocks.map((b, i) => (
                      <div
                        key={i}
                        className={`lf-mockup-block ${b.cls}`}
                        style={{ height: b.h, width: b.w }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA
          ═══════════════════════════════════════════ */}
      <section className="lf-cta" id="contacto">
        <div className="lf-cta-inner">
          <h2 className="lf-cta-title font-serif reveal">Empieza a enviar hoy</h2>
          <p className="lf-cta-desc reveal reveal-delay-1">
            Únete a las empresas que ya confían en LOGIFAST para sus entregas urbanas.
            Sin contratos, sin complicaciones.
          </p>
          <button className="lf-cta-btn reveal reveal-delay-2">
            Comenzar ahora
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
      <footer className="lf-footer">
        <div className="lf-footer-inner">
          <div className="lf-footer-grid">
            <div>
              <div className="lf-footer-brand-name font-serif">LOGIFAST</div>
              <p className="lf-footer-brand-desc">
                Sistema de gestión logística con flota motociclista para envíos urbanos en Managua, Nicaragua. Tus envíos seguros y rápidos.
              </p>
            </div>
            <div>
              <div className="lf-footer-col-title">Producto</div>
              <ul className="lf-footer-links">
                <li><a href="#">Rastreo GPS</a></li>
                <li><a href="#">Cotización</a></li>
                <li><a href="#">Dashboard</a></li>
                <li><a href="#">Reportes</a></li>
              </ul>
            </div>
            <div>
              <div className="lf-footer-col-title">Empresa</div>
              <ul className="lf-footer-links">
                <li><a href="#">Nosotros</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Carreras</a></li>
                <li><a href="#">Contacto</a></li>
              </ul>
            </div>
            <div>
              <div className="lf-footer-col-title">Legal</div>
              <ul className="lf-footer-links">
                <li><a href="#">Términos</a></li>
                <li><a href="#">Privacidad</a></li>
                <li><a href="#">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="lf-footer-bottom">
            <span>© 2025 LOGIFAST. Todos los derechos reservados.</span>
            <span>Managua, Nicaragua</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
