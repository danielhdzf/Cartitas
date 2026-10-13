import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Cartitas", template: "%s · Cartitas" },
  description: "Tu colección de cartas con precios de CardMarket",
  appleWebApp: { capable: true, title: "Cartitas", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#16151a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="border-b border-borde">
          <nav className="mx-auto flex w-full max-w-3xl items-center gap-5 px-4 py-3">
            <Link href="/" className="font-semibold">Cartitas</Link>
            <Link href="/cartas" className="text-sm text-apagado hover:text-texto">Buscar cartas</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
