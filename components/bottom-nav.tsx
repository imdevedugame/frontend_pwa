'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, Plus, User } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: 'Home', key: 'home' },
  { href: '/products', icon: Package, label: 'Produk', key: 'products' },
  { href: '/sell', icon: Plus, label: 'Jual', key: 'sell' },
  { href: '/profile', icon: User, label: 'Profil', key: 'profile' }
]

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[rgb(228,228,231)] shadow-lg">
      <div className="flex items-center justify-around max-w-2xl mx-auto h-20">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                active
                  ? 'text-[rgb(34,197,94)]'
                  : 'text-[rgb(113,113,122)] hover:text-[rgb(82,82,91)]'
              }`}
            >
              <Icon size={24} strokeWidth={2} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
