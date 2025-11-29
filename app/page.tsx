'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import Link from 'next/link'
import { Search, ChevronRight, Heart, ShoppingCart } from 'lucide-react'
import CategoryCard from '@/components/category-card'
import ProductCard from '@/components/product-card'
import { getImageUrl } from '@/lib/utils'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

interface Category {
  id: number
  name: string
  icon: string
}

interface Product {
  id: number
  title: string
  price: number
  condition: string
  image: string
  categoryId: number
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const { token } = useAuth()

  useEffect(() => {
    fetchData()
    fetchCartCount()
    loadFavoriteCount()
    // Listen for custom events
    const favListener = () => loadFavoriteCount()
    const cartListener = () => fetchCartCount()
    window.addEventListener('favorites-changed', favListener)
    window.addEventListener('cart-changed', cartListener)
    return () => {
      window.removeEventListener('favorites-changed', favListener)
      window.removeEventListener('cart-changed', cartListener)
    }
  }, [])

  const fetchCartCount = async () => {
    try {
      if (!token) return
      const res = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCartCount(Array.isArray(data.data) ? data.data.length : 0)
      }
    } catch (e) {
      // silent fail
    }
  }

  const loadFavoriteCount = () => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('favorites') : null
      if (!saved) {
        setFavoriteCount(0)
        return
      }
      const arr = JSON.parse(saved)
      setFavoriteCount(Array.isArray(arr) ? arr.length : 0)
    } catch {
      setFavoriteCount(0)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      const [categoriesRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/categories`),
        fetch(`${API_BASE_URL}/api/products`)
      ])

      // Categories
      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(Array.isArray(data.data) ? data.data : [])
      } else {
        setCategories([])
      }

      // Products
      if (productsRes.ok) {
        const data = await productsRes.json()
        const raw: any[] = Array.isArray(data.data) ? data.data : []

        const mapped: Product[] = raw.map((item) => {
          const firstImage = Array.isArray(item.images) && item.images.length > 0
            ? item.images[0]
            : (typeof item.images === 'string' ? item.images.split(',')[0] : '')
          return {
            id: Number(item.id) || 0,
            title: item.name || item.title || 'Produk',
            price: Number(item.price ?? item.cost ?? 0) || 0,
            condition: item.condition || '',
            image: getImageUrl(firstImage),
            categoryId: Number(item.categoryId ?? item.category_id ?? item.category ?? 0)
          }
        })

        setProducts(mapped)
      } else {
        setProducts([])
      }
    } catch (err) {
      console.error('Failed to fetch data', err)
      setCategories([])
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Search filter
  const safeSearch = searchTerm.trim().toLowerCase()
  const filteredProducts = safeSearch
    ? products.filter(p => p.title.toLowerCase().includes(safeSearch))
    : products

  return (
    <main className="min-h-screen bg-linear-to-b from-[rgb(240,253,244)] to-[rgb(250,250,250)]">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">R3CLAIAM.ID</h1>
            <div className="flex items-center gap-3">
              <Link
                href="/favorites"
                className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Favorit"
              >
                <Heart size={20} className="text-white" />
                {favoriteCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {favoriteCount}
                  </span>
                )}
              </Link>
              <Link
                href="/cart"
                className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Keranjang"
              >
                <ShoppingCart size={20} className="text-white" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-white/60" size={20} />
              <input
                type="text"
                placeholder="Cari barang bekas..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white/90 text-gray-900 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Categories Section */}
        {!safeSearch && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-[rgb(39,39,46)]">Kategori</h2>
              <Link href="/products" className="flex items-center gap-1 text-[rgb(34,197,94)] hover:text-[rgb(22,163,74)] font-medium">
                Lihat Semua <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {categories.slice(0, 6).map(c => <CategoryCard key={c.id} category={c} />)}
            </div>
          </section>
        )}

        {/* Products Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[rgb(39,39,46)]">
              {safeSearch ? 'Hasil Pencarian' : 'Produk Terbaru'}
            </h2>
            {!safeSearch && (
              <Link href="/products" className="flex items-center gap-1 text-[rgb(34,197,94)] hover:text-[rgb(22,163,74)] font-medium">
                Lihat Semua <ChevronRight size={16} />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.slice(0, 6).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[rgb(113,113,122)]">Produk tidak ditemukan</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
