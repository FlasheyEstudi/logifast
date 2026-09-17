import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0764E2",
};

export const metadata: Metadata = {
  title: "LOGIFAST — Tus Envíos Seguros y Rápidos",
  description:
    "Plataforma integral de gestión logística con flota motociclista. Solicita, rastrea y gestiona envíos urbanos en Managua, Nicaragua.",
  keywords: [
    "LOGIFAST",
    "logística",
    "envíos",
    "Managua",
    "Nicaragua",
    "delivery",
    "flota motociclista",
  ],
  authors: [{ name: "LOGIFAST" }],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/icons/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LOGIFAST",
  },
  openGraph: {
    title: "LOGIFAST — Tus Envíos Seguros y Rápidos",
    description:
      "Plataforma integral de gestión logística con flota motociclista en Managua.",
    type: "website",
  },
};

import SileoToaster from "@/components/ui/SileoToaster";
import NetworkStatusIndicator from "@/components/ui/NetworkStatusIndicator";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              // Auto-recover from Next.js ChunkLoadError after deployment/HMR asset updates
              window.addEventListener('error', function(e) {
                var msg = e && e.message ? String(e.message) : '';
                if (msg.indexOf('Loading chunk') !== -1 || msg.indexOf('failed to load chunk') !== -1 || msg.indexOf('ChunkLoadError') !== -1) {
                  console.warn('Next.js ChunkLoadError interceptado. Recargando aplicación con assets actualizados...');
                  var reloadKey = 'lf_chunk_reload';
                  var now = Date.now();
                  var lastReload = Number(sessionStorage.getItem(reloadKey) || 0);
                  if (now - lastReload > 15000) {
                    sessionStorage.setItem(reloadKey, String(now));
                    window.location.reload();
                  }
                }
              }, true);

              // Register PWA Service Worker
              if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('LOGIFAST PWA Service Worker registrado:', reg.scope);
                  }).catch(function(err) {
                    console.warn('Error registrando PWA Service Worker:', err);
                  });
                });
              }
              
              // Load theme
              const raw = localStorage.getItem('logifast-config');
              if (raw) {
                const parsed = JSON.parse(raw);
                const tema = parsed?.state?.tema || 'system';
                let resolved = tema;
                if (tema === 'system') {
                  resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.setAttribute('data-theme', resolved);
              }
            } catch (e) {}
          })();
        ` }} />
      </head>
      <body
        className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <NetworkStatusIndicator />
          <SileoToaster />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
