'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, AlertCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface OrderItem {
  product_id: number
  quantity: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
    const { token } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('transfer')
  const [shippingAddress, setShippingAddress] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCartItems(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      setError('Gagal memuat keranjang')
    } finally {
      setLoading(false)
    }
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingCost = 25000

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!shippingAddress.trim()) {
      setError('Alamat pengiriman wajib diisi')
      return
    }

    if (cartItems.length === 0) {
      setError('Keranjang kosong')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      if (!token) {
        setError('Harus login terlebih dahulu')
        setSubmitting(false)
        return
      }

      // Backend saat ini hanya mendukung satu produk per order.
      // Kita buat beberapa order jika item berbeda (multi seller atau multi produk).
      const orderRequests = cartItems.map(item => {
        const payload = {
          product_id: item.product_id,
          seller_id: item.seller_id,
          quantity: item.quantity,
          payment_method: paymentMethod,
          shipping_address: shippingAddress
        }
        return fetch(`${API_BASE_URL}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
      })

      const results = await Promise.all(orderRequests)
      const failed = []
      const successOrderIds: number[] = []
      for (let i = 0; i < results.length; i++) {
        const r = results[i]
        if (!r.ok) {
          try {
            const data = await r.json()
            failed.push(data.message || `Item ${i + 1} gagal`)
          } catch (_) {
            failed.push(`Item ${i + 1} gagal`)
          }
        } else {
          try {
            const data = await r.json()
            if (data.order_id) successOrderIds.push(data.order_id)
          } catch (_) {}
        }
      }

      // Tandai setiap order berhasil sebagai 'confirmed' (dianggap sudah dibayar)
      if (successOrderIds.length > 0) {
        await Promise.all(
          successOrderIds.map(id => fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'confirmed' })
          }))
        )
      }

      if (failed.length === 0) {
        router.push('/orders')
      } else {
        setError(`Sebagian pesanan gagal: ${failed.join(', ')}`)
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
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

  return (
    <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
      <div className="bg-white border-b border-[rgb(228,228,231)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/cart"
            className="text-[rgb(34,197,94)] hover:text-[rgb(22,163,74)]"
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-[rgb(39,39,46)]">Checkout</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-lg p-4 space-y-3">
          <h2 className="font-bold text-[rgb(39,39,46)]">Ringkasan Pesanan</h2>
          <div className="space-y-2 border-t border-[rgb(228,228,231)] pt-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name || item.product_name} x{item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[rgb(228,228,231)] pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-[rgb(113,113,122)]">Subtotal ({cartItems.length} produk)</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[rgb(113,113,122)]">Ongkir</span>
              <span>{formatPrice(shippingCost)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-[rgb(34,197,94)]">{formatPrice(total + shippingCost)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <form onSubmit={handleCheckout} className="bg-white rounded-lg p-4 space-y-4">
          <div>
            <label className="font-bold text-[rgb(39,39,46)] block mb-2">
              Alamat Pengiriman
            </label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Jl. Contoh No. 123, Kota, Provinsi, 12345"
              rows={3}
              className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)] resize-none"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="font-bold text-[rgb(39,39,46)] block mb-3">
              Metode Pembayaran
            </label>
            <div className="space-y-2">
              {['transfer', 'cod', 'ewallet'].map((method) => (
                <label key={method} className="flex items-center gap-3 p-3 border border-[rgb(228,228,231)] rounded-lg cursor-pointer hover:bg-[rgb(240,253,244)]">
                  <input
                    type="radio"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="font-medium text-[rgb(39,39,46)]">
                    {method === 'transfer' && 'Transfer Bank'}
                    {method === 'cod' && 'Bayar di Tempat'}
                    {method === 'ewallet' && 'E-Wallet'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || cartItems.length === 0}
            className="w-full px-4 py-3 bg-[rgb(34,197,94)] text-white font-bold rounded-lg hover:bg-[rgb(22,163,74)] disabled:bg-gray-400 transition-colors"
          >
            {submitting ? 'Memproses...' : 'Buat Pesanan'}
          </button>
        </form>
      </div>
    </main>
  )
}
