'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, Heart } from 'lucide-react'
import ProductCard from '@/components/product-card'
import { getImageUrl, formatPrice } from '@/lib/utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Product {
  id: number
  title: string
  price: number
  condition: string
  image: string
  categoryId?: number
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      const saved = localStorage.getItem('favorites')
      if (!saved) {
        setFavorites([])
        return
      }
      let ids: number[] = []
      try { ids = JSON.parse(saved) } catch { ids = [] }
      if (!Array.isArray(ids) || ids.length === 0) {
        setFavorites([])
        return
      }
      // Fetch all products then filter by IDs (simpler than many calls)
      const res = await fetch(`${API_BASE_URL}/api/products`)
      if (res.ok) {
        const data = await res.json()
        const raw: any[] = Array.isArray(data.data) ? data.data : []
        const filtered: Product[] = raw.filter(p => ids.includes(Number(p.id))).map(p => {
          const firstImage = Array.isArray(p.images) && p.images.length > 0
            ? p.images[0]
            : (typeof p.images === 'string' ? p.images.split(',')[0] : '')
          return {
            id: Number(p.id) || 0,
            title: p.name || p.title || 'Produk',
            price: Number(p.price) || 0,
            condition: p.condition || '',
            image: getImageUrl(firstImage),
            categoryId: Number(p.category_id ?? p.categoryId ?? 0)
          }
        })
        setFavorites(filtered)
      }
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = (productId: number) => {
    const saved = localStorage.getItem('favorites')
    let ids: number[] = []
    if (saved) {
      try { ids = JSON.parse(saved) } catch { ids = [] }
    }
    const updatedIds = ids.filter(id => id !== productId)
    localStorage.setItem('favorites', JSON.stringify(updatedIds))
    setFavorites(favorites.filter(p => p.id !== productId))
    // Dispatch event so header count can update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('favorites-changed'))
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
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
          <h1 className="text-xl font-bold text-[rgb(39,39,46)]">Favorit ({favorites.length})</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((product) => (
              <div key={product.id} className="relative group">
                <ProductCard product={product} />
                <button
                  onClick={() => removeFavorite(product.id)}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:shadow-lg"
                  aria-label="Hapus dari favorit"
                >
                  <Heart size={18} className="fill-red-500 text-red-500" />
                </button>
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-medium text-[rgb(39,39,46)]">
                  {formatPrice(product.price)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-[rgb(113,113,122)] mb-4">Belum ada favorit</p>
            <Link
              href="/products"
              className="px-4 py-2 bg-[rgb(34,197,94)] text-white rounded-lg hover:bg-[rgb(22,163,74)]"
            >
              Jelajahi Produk
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
