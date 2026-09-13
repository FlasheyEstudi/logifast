/**
 * api-config.ts
 * Configuración centralizada de red y puente para Capacitor.
 * Resuelve automáticamente el error 404 al redirigir llamadas relativas
 * (/api/...) hacia el servidor en producción cuando se ejecuta en un móvil.
 */

export const DEFAULT_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://logifast.netlify.app';

/**
 * Detecta si la aplicación se está ejecutando dentro de un contenedor Capacitor nativo
 * o en un WebView empaquetado en localhost.
 */
export function isCapacitorEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const isCap = !!(window as any).Capacitor?.isNativePlatform?.();
  const isCapacitorScheme =
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && window.location.port === '');
  return isCap || isCapacitorScheme;
}

/**
 * Resuelve una ruta relativa (/api/...) a una URL absoluta apuntando al backend en la nube
 * si se está ejecutando dentro de Capacitor.
 */
export function resolveApiUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Si estamos en entorno Capacitor nativo, anteponer el backend en la nube
  if (isCapacitorEnvironment() && path.startsWith('/api')) {
    return `${DEFAULT_BACKEND_URL}${path}`;
  }

  return path;
}

/**
 * Instala un interceptor transparente en window.fetch para que TODAS las llamadas
 * a '/api/...' salgan automáticamente hacia la nube y con el token Bearer incluido
 * si existe una sesión activa en el móvil.
 */
export function installCapacitorFetchBridge(): void {
  if (typeof window === 'undefined') return;
  if ((window as any).__lf_fetch_bridge_installed) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Solo interceptar si estamos en Capacitor y la URL es relativa a /api
    if (isCapacitorEnvironment() && typeof url === 'string' && url.startsWith('/api')) {
      url = `${DEFAULT_BACKEND_URL}${url}`;

      // Clonar headers para inyectar Authorization Bearer si existe token en localStorage
      const headers = new Headers(init?.headers || {});
      const token = localStorage.getItem('lf-jwt-token') || localStorage.getItem('lf-session-token');
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const modifiedInit: RequestInit = {
        ...init,
        headers,
        credentials: init?.credentials || 'include',
      };

      if (typeof input === 'object' && !(input instanceof URL)) {
        return originalFetch(new Request(url, { ...input, ...modifiedInit }));
      }
      return originalFetch(url, modifiedInit);
    }

    return originalFetch(input, init);
  };

  (window as any).__lf_fetch_bridge_installed = true;
  console.log('[Capacitor Network] Interceptor de API instalado con éxito hacia:', DEFAULT_BACKEND_URL);
}
