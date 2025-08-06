import type { Metadata } from 'next'
import { Geist, Geist_Mono } from "next/font/google"
import { Poppins, Nunito } from 'next/font/google';
import "@/styles/globals.css"
import RestoreLastPage from '@/components/RestoreLastPage';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: 'Sistem Tagihan Air',
  description: 'Aplikasi Pengelolaan Tagihan Air',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${nunito.variable}`}>
        <RestoreLastPage />
        {children}
        <div id="modal-root"></div>
      </body>
    </html>
  )
}