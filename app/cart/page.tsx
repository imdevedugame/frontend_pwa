'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import Link from 'next/link'
import { ChevronLeft, Trash2, Minus, Plus } from 'lucide-react'
import { formatPrice, getImageUrl } from '@/lib/utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface CartItem {
  id: number
  product_id: number
  product_name: string
  price: number
  quantity: number
  image: string
  seller_id?: number
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

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
        const raw: any[] = Array.isArray(data.data) ? data.data : []
        const mapped: CartItem[] = raw.map(item => {
          const firstImage = Array.isArray(item.images) && item.images.length > 0
            ? item.images[0]
            : (typeof item.images === 'string' ? item.images.split(',')[0] : '')
          return {
            id: Number(item.id) || 0,
            product_id: Number(item.product_id) || 0,
            product_name: item.name || item.product_name || 'Produk',
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            image: getImageUrl(firstImage) || '/placeholder.svg',
            seller_id: Number(item.seller_id) || undefined
          }
        })
        setCartItems(mapped)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return
    try {
      await fetch(`${API_BASE_URL}/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      })
      fetchCart()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cart-changed'))
      }
    } catch (error) {
      console.error('Error updating cart:', error)
    }
  }

  const removeItem = async (itemId: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/cart/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchCart()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cart-changed'))
      }
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

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
    <main className="min-h-screen bg-[rgb(250,250,250)] pb-28">
      <div className="bg-white border-b border-[rgb(228,228,231)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="text-[rgb(34,197,94)] hover:text-[rgb(22,163,74)]"
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-[rgb(39,39,46)]">Keranjang ({cartItems.length})</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {cartItems.length > 0 ? (
          <>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-4 flex gap-4">
                  <img
                    src={item.image || '/placeholder.svg'}
                    alt={item.product_name}
                    className="w-24 h-24 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-[rgb(39,39,46)]">{item.product_name}</p>
                    <p className="text-lg font-bold text-[rgb(34,197,94)]">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-3 py-1 bg-gray-100 rounded">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-red-500 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-white border-t border-[rgb(228,228,231)]">
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[rgb(39,39,46)]">Total:</span>
                  <span className="text-2xl font-bold text-[rgb(34,197,94)]">
                    {formatPrice(total)}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  className="block w-full px-4 py-3 bg-[rgb(34,197,94)] text-white text-center rounded-lg font-bold hover:bg-[rgb(22,163,74)] transition-colors"
                >
                  Lanjut ke Pembayaran
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-[rgb(113,113,122)] mb-4">Keranjang Anda kosong</p>
            <Link
              href="/products"
              className="px-4 py-2 bg-[rgb(34,197,94)] text-white rounded-lg hover:bg-[rgb(22,163,74)]"
            >
              Belanja Sekarang
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
