'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Filter } from 'lucide-react'
import ProductCard from '@/components/product-card'
import { getImageUrl } from '@/lib/utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

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
  stock?: number
}

function ProductsInner() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category')

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    categoryId ? parseInt(categoryId) : null
  )
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [categoriesRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/categories`),
        fetch(`${API_BASE_URL}/api/products`)
      ])

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.data || [])
      }

      if (productsRes.ok) {
        const data = await productsRes.json()
        const raw = Array.isArray(data.data) ? data.data : []
        const mapped: Product[] = raw.map((item: any) => {
          const firstImage = Array.isArray(item.images) && item.images.length > 0
            ? item.images[0]
            : (typeof item.images === 'string' ? item.images.split(',')[0] : '')
          return {
            id: Number(item.id) || 0,
            title: item.name || item.title || 'Produk',
            price: Number(item.price ?? 0) || 0,
            condition: item.condition || '',
            image: getImageUrl(firstImage),
            categoryId: Number(item.category_id ?? item.categoryId ?? item.category ?? 0),
            stock: item.stock !== undefined ? Number(item.stock) : undefined
          }
        })
        setProducts(mapped)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  let filteredProducts = products

  // Filter by category
  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(p => p.categoryId === selectedCategory)
  }

  // Sort
  if (sortBy === 'price-low') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price)
  } else if (sortBy === 'price-high') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price)
  }

  return (
    <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[rgb(228,228,231)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="text-[rgb(34,197,94)] hover:text-[rgb(22,163,74)]"
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-[rgb(39,39,46)]">Semua Produk</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Filter Section */}
        <div className="space-y-3">
          {/* Category Filter */}
          <div>
            <h3 className="text-sm font-bold text-[rgb(39,39,46)] mb-2 flex items-center gap-2">
              <Filter size={16} /> Kategori
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                  selectedCategory === null
                    ? 'bg-[rgb(34,197,94)] text-white'
                    : 'bg-white text-[rgb(113,113,122)] border border-[rgb(228,228,231)]'
                }`}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[rgb(34,197,94)] text-white'
                      : 'bg-white text-[rgb(113,113,122)] border border-[rgb(228,228,231)]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-bold text-[rgb(39,39,46)]">Urutkan</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg text-sm"
            >
              <option value="newest">Terbaru</option>
              <option value="price-low">Harga: Terendah</option>
              <option value="price-high">Harga: Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[rgb(113,113,122)]">Produk tidak ditemukan</p>
          </div>
        )}
      </div>
    </main>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-[rgb(113,113,122)]">Memuat produk...</div>}>
      <ProductsInner />
    </Suspense>
  )
}

// Force dynamic rendering to avoid static pre-render bailout errors when using search params
export const dynamic = 'force-dynamic'
