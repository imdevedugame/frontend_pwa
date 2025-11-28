'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, Clock, CheckCircle, Truck, CreditCard } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Order {
  id: number
  status: string
  total_amount: number
  created_at: string
  items: any[]
}

const statusConfig: Record<string, { icon: any; label: string; color: string }> = {
  pending: { icon: Clock, label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { icon: CreditCard, label: 'Terbayar', color: 'bg-blue-100 text-blue-700' },
  shipped: { icon: Truck, label: 'Dikirim', color: 'bg-purple-100 text-purple-700' },
  delivered: { icon: CheckCircle, label: 'Selesai', color: 'bg-green-100 text-green-700' }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
      <div className="bg-white border-b border-[rgb(228,228,231)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="text-[rgb(34,197,94)] hover:text-[rgb(22,163,74)]"
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-[rgb(39,39,46)]">Pesanan Saya</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => {
              const config = statusConfig[order.status] || statusConfig.pending
              const Icon = config.icon
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow border border-[rgb(228,228,231)] hover:border-[rgb(34,197,94)]"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="space-y-1">
                      <p className="font-bold text-[rgb(39,39,46)]">Order #{order.id}</p>
                      <p className="text-xs text-[rgb(113,113,122)]">{formatDate(order.created_at)}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${config.color} text-xs font-medium whitespace-nowrap`}>
                      <Icon size={14} />
                      {config.label}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[rgb(113,113,122)]">Total</span>
                    <span className="text-[rgb(34,197,94)] font-bold text-base">{formatPrice(order.total_amount)}</span>
                  </div>
                  <div className="h-1 rounded bg-[rgb(240,253,244)] overflow-hidden">
                    <div
                      className={`h-full transition-all ${order.status === 'pending' ? 'bg-yellow-400 w-1/6' : order.status === 'confirmed' ? 'bg-blue-500 w-2/6' : order.status === 'shipped' ? 'bg-purple-500 w-4/6' : order.status === 'delivered' ? 'bg-green-500 w-full' : 'bg-gray-300 w-1/6'}`}
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[rgb(113,113,122)] mb-4">Belum ada pesanan</p>
            <Link
              href="/products"
              className="px-4 py-2 bg-[rgb(34,197,94)] text-white rounded-lg hover:bg-[rgb(22,163,74)]"
            >
              Mulai Berbelanja
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
