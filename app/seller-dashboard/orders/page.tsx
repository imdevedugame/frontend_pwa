"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Truck, CheckCircle, Clock, ChevronLeft } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface ManagedOrder {
  id: number
  status: string
  total_amount: number
  created_at: string
  product_name?: string
  buyer_name?: string
}

const statusLabel: Record<string,string> = {
  pending: 'Menunggu Pembayaran',
  confirmed: 'Terbayar',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan'
}

export default function ManageOrdersPage() {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<ManagedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    fetchOrders()
  }, [user, isLoading])

  const fetchOrders = async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        // Filter hanya order dimana user adalah seller
        const sellerOrders = (data.data || []).filter((o: any) => o.seller_id === user?.id)
        setOrders(sellerOrders)
      }
    } catch (e) {
      console.error('Fetch orders error', e)
    } finally {
      setLoading(false)
    }
  }

  const setShipped = async (orderId: number) => {
    if (!token) return
    setUpdatingId(orderId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'shipped' })
      })
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'shipped' } : o))
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.message || 'Gagal update status')
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
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto p-6 space-y-4">
          {[...Array(5)].map((_,i)=>(<div key={i} className="h-20 bg-slate-200 rounded animate-pulse"/>))}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-4">
          <Link href="/seller-dashboard" className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={22} /></Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kelola Pesanan</h1>
            <p className="text-sm text-slate-500">Atur status pesanan pembeli</p>
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {orders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Clock className="mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600">Belum ada pesanan sebagai penjual.</p>
          </div>
        )}
        {orders.map(order => {
          const canShip = !['shipped','delivered','cancelled'].includes(order.status)
          return (
            <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Order #{order.id}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{formatDate(order.created_at)}</p>
                  <p className="text-sm mt-1 text-slate-700">Produk: {order.product_name || '-'} | Pembeli: {order.buyer_name || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-xl font-bold text-emerald-600">{formatPrice(order.total_amount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {order.status === 'shipped' ? <Truck size={16} className="text-purple-600" /> : order.status === 'delivered' ? <CheckCircle size={16} className="text-emerald-600" /> : <Clock size={16} className="text-amber-600" />}
                <span className="font-medium">Status: {statusLabel[order.status] || order.status}</span>
              </div>
              {canShip && (
                <button
                  onClick={() => setShipped(order.id)}
                  disabled={updatingId === order.id}
                  className={`px-4 py-2 rounded-lg text-sm font-medium w-fit ${updatingId === order.id ? 'bg-purple-200 text-purple-700 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                >
                  {updatingId === order.id ? 'Memproses...' : 'Set ke Dikirim'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}
