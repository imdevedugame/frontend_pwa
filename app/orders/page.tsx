"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, Clock, CheckCircle, Truck, CreditCard, ShoppingBag } from "lucide-react"
import { formatPrice, formatDate } from "@/lib/utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface Order {
  id: number
  status: string
  total_amount: number
  created_at: string
  items: any[]
}

const statusConfig: Record<string, { icon: any; label: string; color: string; bgColor: string; stepNumber: number }> = {
  pending: {
    icon: Clock,
    label: "Menunggu Pembayaran",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    stepNumber: 1,
  },
  confirmed: { icon: CreditCard, label: "Terbayar", color: "text-blue-600", bgColor: "bg-blue-50", stepNumber: 2 },
  shipped: { icon: Truck, label: "Dikirim", color: "text-purple-600", bgColor: "bg-purple-50", stepNumber: 3 },
  delivered: {
    icon: CheckCircle,
    label: "Selesai",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    stepNumber: 4,
  },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const markReceived = async (orderId: number) => {
    const token = localStorage.getItem('token')
    if (!token) return alert('Token tidak ditemukan')
    setUpdatingId(orderId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'delivered' })
      })
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o))
      } else {
        const err = await res.json().catch(()=>({}))
        alert(err.message || 'Gagal memperbarui status')
      }
    } catch (e) {
      console.error('Update status error', e)
      alert('Kesalahan jaringan')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 pb-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ChevronLeft size={24} className="text-slate-700" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pesanan Saya</h1>
            <p className="text-sm text-slate-500 mt-0.5">Pantau status pesanan Anda</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const config = statusConfig[order.status] || statusConfig.pending
              const Icon = config.icon

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className=""
                >
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-bold text-slate-900">Order #{order.id}</h2>
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: config.bgColor,
                            color: config.color,
                          }}
                        >
                          <Icon size={14} />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Total</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatPrice(order.total_amount)}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          order.status === "pending"
                            ? "w-1/4 bg-amber-400"
                            : order.status === "confirmed"
                              ? "w-2/4 bg-blue-400"
                              : order.status === "shipped"
                                ? "w-3/4 bg-purple-400"
                                : order.status === "delivered"
                                  ? "w-full bg-emerald-400"
                                  : "w-1/4 bg-slate-300"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Step Indicators */}
                  <div className="flex justify-between text-xs text-slate-600">
                    <div className="text-center">
                      <div className="text-slate-400 font-medium">1</div>
                      <div className="text-xs mt-0.5">Pesanan</div>
                    </div>
                    <div className="text-center">
                      <div className={config.stepNumber >= 2 ? "text-emerald-600 font-bold" : "text-slate-400"}>2</div>
                      <div className="text-xs mt-0.5">Pembayaran</div>
                    </div>
                    <div className="text-center">
                      <div className={config.stepNumber >= 3 ? "text-emerald-600 font-bold" : "text-slate-400"}>3</div>
                      <div className="text-xs mt-0.5">Pengiriman</div>
                    </div>
                    <div className="text-center">
                      <div className={config.stepNumber >= 4 ? "text-emerald-600 font-bold" : "text-slate-400"}>4</div>
                      <div className="text-xs mt-0.5">Selesai</div>
                    </div>
                  </div>

                  {/* Items + Actions */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <ShoppingBag size={16} />
                      {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-3">
                      {order.status === 'shipped' && (
                        <button
                          onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); markReceived(order.id) }}
                          disabled={updatingId === order.id}
                          className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${updatingId === order.id ? 'bg-emerald-200 border-emerald-300 text-emerald-700 cursor-not-allowed' : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'}`}
                        >
                          {updatingId === order.id ? 'Memproses...' : 'Pesanan sudah diterima'}
                        </button>
                      )}
                      <div className="text-emerald-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                        Lihat Detail →
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-white rounded-full p-6 mb-6 shadow-sm">
              <ShoppingBag size={40} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Belum ada pesanan</h3>
            <p className="text-slate-600 text-center mb-6 max-w-xs">
              Mulai berbelanja sekarang dan pesanan Anda akan muncul di sini
            </p>
            <Link
              href="/products"
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
            >
              Mulai Berbelanja
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
