'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft, Clock, CheckCircle, Truck, MessageCircle, Star, CreditCard } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Order {
  id: number
  status: string
  total_price: number
  payment_method: string
  shipping_address: string
  created_at: string
  product_name: string
  quantity: number
  seller_name: string
  buyer_name: string
}

const statusSteps = ['pending', 'confirmed', 'shipped', 'delivered']

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [payLoading, setPayLoading] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setOrder(data.data)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayNow = async () => {
    if (!order || order.status !== 'pending' || payLoading) return
    try {
      setPayLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'confirmed' })
      })
      if (res.ok) {
        await fetchOrder()
      } else {
        const data = await res.json().catch(()=>({}))
        alert(data.message || 'Gagal memperbarui status')
      }
    } catch (e) {
      console.error('Pay error', e)
      alert('Terjadi kesalahan saat bayar')
    } finally {
      setPayLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setReviewSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      })

      if (res.ok) {
        alert('Review berhasil dikirim!')
        setComment('')
        fetchOrder()
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[rgb(250,250,250)] pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[rgb(113,113,122)]">Pesanan tidak ditemukan</p>
          <Link href="/orders" className="text-[rgb(34,197,94)] hover:underline mt-2 inline-block">
            Kembali ke Pesanan
          </Link>
        </div>
      </main>
    )
  }

  const currentStatusIndex = statusSteps.indexOf(order.status)

  return (
    <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
      <div className="bg-white border-b border-[rgb(228,228,231)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/orders"
            className="text-[rgb(34,197,94)] hover:text-[rgb(22,163,74)]"
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-[rgb(39,39,46)]">Order #{order.id}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Status Timeline */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="font-bold text-[rgb(39,39,46)] mb-4">Status Pengiriman</h3>
          <div className="flex justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-[rgb(228,228,231)]" />
            <div 
              className="absolute top-5 left-0 h-1 bg-[rgb(34,197,94)] transition-all"
              style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
            />
            {statusSteps.map((step, index) => (
              <div key={step} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index <= currentStatusIndex
                      ? 'bg-[rgb(34,197,94)] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index <= currentStatusIndex ? '✓' : index + 1}
                </div>
                <p className="text-xs mt-2 font-medium capitalize">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Info */}
        <div className="bg-white rounded-lg p-4 space-y-3">
          <h3 className="font-bold text-[rgb(39,39,46)]">Detail Pesanan</h3>
          <div className="space-y-2 border-t border-[rgb(228,228,231)] pt-3">
            <div className="flex justify-between">
              <span className="text-[rgb(113,113,122)]">Produk</span>
              <span className="font-medium">{order.product_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgb(113,113,122)]">Jumlah</span>
              <span className="font-medium">{order.quantity} item</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgb(113,113,122)]">Metode Pembayaran</span>
              <span className="font-medium capitalize">{order.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgb(113,113,122)]">Tanggal Pesanan</span>
              <span className="font-medium">{formatDate(order.created_at)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-[rgb(228,228,231)] pt-3">
              <span>Total</span>
              <span className="text-[rgb(34,197,94)]">{formatPrice(order.total_price)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="font-bold text-[rgb(39,39,46)] mb-2">Alamat Pengiriman</h3>
          <p className="text-sm text-[rgb(82,82,91)]">{order.shipping_address}</p>
        </div>

        {/* Review Section */}
        {order.status === 'delivered' && (
          <form onSubmit={handleSubmitReview} className="bg-white rounded-lg p-4 space-y-3">
            <h3 className="font-bold text-[rgb(39,39,46)]">Beri Rating & Review</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Komentar</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Bagikan pengalaman Anda..."
                rows={3}
                className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={reviewSubmitting}
              className="w-full px-4 py-2 bg-[rgb(34,197,94)] text-white font-bold rounded-lg hover:bg-[rgb(22,163,74)] disabled:bg-gray-400 transition-colors"
            >
              {reviewSubmitting ? 'Mengirim...' : 'Kirim Review'}
            </button>
          </form>
        )}

        {/* Action Bar */}
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-white border-t border-[rgb(228,228,231)]">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[rgb(240,253,244)] text-[rgb(34,197,94)] rounded-lg font-bold hover:bg-[rgb(220,252,231)] transition-colors"
            >
              <MessageCircle size={20} />
              Chat Penjual
            </button>
            {order.status === 'pending' ? (
              <button
                onClick={handlePayNow}
                disabled={payLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[rgb(34,197,94)] text-white rounded-lg font-bold hover:bg-[rgb(22,163,74)] transition-colors disabled:opacity-60"
              >
                <CreditCard size={20} />
                {payLoading ? 'Memproses...' : 'Bayar Sekarang'}
              </button>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg font-bold">
                <CheckCircle size={20} />
                Terbayar
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
