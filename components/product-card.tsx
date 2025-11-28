"use client"
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { Heart, ShoppingCart } from 'lucide-react'

interface Product {
  id: number
  title: string
  price: number
  condition: string
  image: string
  stock?: number
}

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter()
  const [fav, setFav] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('favorites')
    if (stored) {
      try {
        const arr = JSON.parse(stored)
        setFav(Array.isArray(arr) && arr.includes(product.id))
      } catch {}
    }
  }, [product.id])

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault()
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('favorites')
    let arr: number[] = []
    if (stored) {
      try { arr = JSON.parse(stored) } catch { arr = [] }
    }
    if (fav) {
      arr = arr.filter(id => id !== product.id)
    } else {
      if (!arr.includes(product.id)) arr.push(product.id)
    }
    localStorage.setItem('favorites', JSON.stringify(arr))
    setFav(!fav)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('favorites-changed'))
    }
  }

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (adding) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.push('/login')
      return
    }
    try {
      setAdding(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: product.id, quantity: 1 })
      })
      if (!res.ok) {
        const err = await res.json().catch(()=>({}))
        alert(err.message || 'Gagal menambahkan ke keranjang')
      } else {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cart-changed'))
        }
      }
    } catch (err) {
      console.error('Cart error', err)
      alert('Terjadi kesalahan')
    } finally {
      setAdding(false)
    }
  }

  return (
    <Link
      href={`/product/${product.id}`}
      className="block rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow border border-[rgb(228,228,231)] hover:border-[rgb(34,197,94)]"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-[rgb(249,115,22)] text-white px-2 py-1 rounded text-xs font-medium">
          {product.condition}
        </div>
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          <button
            onClick={toggleFav}
            aria-label={fav ? 'Hapus dari favorit' : 'Tambah ke favorit'}
            className={`p-2 rounded-full shadow bg-white/90 hover:bg-white transition-colors ${fav ? 'text-red-500' : 'text-[rgb(113,113,122)]'}`}
          >
            <Heart size={16} className={fav ? 'fill-red-500' : ''} />
          </button>
          <button
            onClick={addToCart}
            aria-label="Tambah ke keranjang"
            className="p-2 rounded-full shadow bg-white/90 hover:bg-white transition-colors text-[rgb(113,113,122)] disabled:opacity-50"
            disabled={adding}
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-sm text-[rgb(39,39,46)] line-clamp-2 mb-1">
          {product.title}
        </h3>
        <p className="text-lg font-bold text-[rgb(34,197,94)]">
          {formatPrice(product.price)}
        </p>
        {product.stock !== undefined && (
          <p className="text-xs mt-1 text-[rgb(113,113,122)]">Stok: {product.stock}</p>
        )}
      </div>
    </Link>
  )
}
