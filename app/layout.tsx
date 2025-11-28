import type { Metadata, Viewport } from 'next'

import './globals.css'
import BottomNav from '@/components/bottom-nav'
import { AuthProvider } from '@/context/auth-context'
import { Inter } from 'next/font/google'
import SwRegister from '@/components/sw-register'
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'SecondHand - Jual Beli Barang Bekas',
  description: 'Platform sederhana untuk jual-beli barang bekas dengan kategori lengkap dan harga terjangkau',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SecondHand'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#22c55e'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="bg-white pb-20">
        <AuthProvider>
          {children}
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  )
}
