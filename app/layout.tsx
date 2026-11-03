import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agente Bodega — Administración Inteligente",
  description: "Sistema de administración inteligente para tienda de conveniencia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
