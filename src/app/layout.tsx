import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://satu-pintu.vercel.app"),
  title: {
    default: "SatuPintu - Satu Nomor untuk Semua Keluhan Kota",
    template: "%s | SatuPintu",
  },
  description:
    "Revolusi layanan publik dengan AI. Laporkan masalah kota via telepon, AI kami akan mengurus sisanya. Cepat, tepat, dan transparan. Layanan pengaduan 24/7.",
  keywords: [
    "SatuPintu",
    "layanan pengaduan",
    "smart city",
    "lapor keluhan",
    "call center",
    "AI",
    "pelayanan publik",
    "pengaduan warga",
    "infrastruktur kota",
    "darurat",
    "hotline",
    "lapor masalah kota",
    "tracking laporan",
  ],
  authors: [{ name: "SIAGA Teams" }],
  creator: "SIAGA Teams",
  publisher: "SatuPintu",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://satu-pintu.vercel.app",
    siteName: "SatuPintu",
    title: "SatuPintu - Satu Nomor untuk Semua Keluhan Kota",
    description:
      "Revolusi layanan publik dengan AI. Laporkan masalah kota via telepon, AI kami akan mengurus sisanya. Cepat, tepat, dan transparan.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SatuPintu - Satu Nomor untuk Semua Keluhan Kota",
    description:
      "Revolusi layanan publik dengan AI. Laporkan masalah kota via telepon, AI kami akan mengurus sisanya. Cepat, tepat, dan transparan.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.svg",
  },
  alternates: {
    canonical: "https://satu-pintu.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground selection:bg-white/20 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
