import type { Metadata } from "next";
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
  openGraph: {
    title: "LOGIFAST — Tus Envíos Seguros y Rápidos",
    description:
      "Plataforma integral de gestión logística con flota motociclista en Managua.",
    type: "website",
  },
};

import { Toaster } from "sileo";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              // Register PWA Service Worker
              if ('serviceWorker' in navigator && window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0764E2" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LOGIFAST" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider>
          <Toaster
            position="top-center"
            theme="light"
            options={{
              duration: 4000,
              roundness: 18,
            }}
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
