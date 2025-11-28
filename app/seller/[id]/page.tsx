'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft, Star, MapPin, MessageCircle } from 'lucide-react'
import ProductCard from '@/components/product-card'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Seller {
  id: number
  name: string
  avatar: string
  address: string
  city: string
  rating: number
  total_reviews: number
  active_products: number
  sold_products: number
}

interface Product {
  id: number
  title: string
  price: number
  condition: string
  image: string
}

export default function SellerPage() {
  const params = useParams()
  const sellerId = params.id as string
  const [seller, setSeller] = useState<Seller | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSellerData()
  }, [sellerId])

  const fetchSellerData = async () => {
    try {
      const [sellerRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/${sellerId}`),
        fetch(`${API_BASE_URL}/api/products/user/${sellerId}`)
      ])

      if (sellerRes.ok) {
        const data = await sellerRes.json()
        setSeller(data.data)
      }

      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.data.slice(0, 8) || [])
      }
    } catch (error) {
      console.error('Error fetching seller data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (!seller) {
    return (
      <main className="min-h-screen bg-[rgb(250,250,250)] pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[rgb(113,113,122)]">Penjual tidak ditemukan</p>
          <Link href="/" className="text-[rgb(34,197,94)] hover:underline mt-2 inline-block">
            Kembali ke Home
          </Link>
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
          <h1 className="text-xl font-bold text-[rgb(39,39,46)]">Profil Penjual</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Seller Info Card */}
        <div className="bg-white rounded-lg p-4 space-y-4">
          <div className="flex gap-4">
            <img
              src={seller.avatar || '/placeholder.svg'}
              alt={seller.name}
              className="w-20 h-20 rounded-full object-cover"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[rgb(39,39,46)]">{seller.name}</h2>
              <div className="flex items-center gap-1 text-sm mt-1">
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{seller.rating.toFixed(1)}</span>
                <span className="text-[rgb(113,113,122)]">({seller.total_reviews} reviews)</span>
              </div>
              {seller.city && (
                <p className="text-sm text-[rgb(113,113,122)] flex items-center gap-1 mt-1">
                  <MapPin size={14} />
                  {seller.city}
                </p>
              )}
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[rgb(34,197,94)] text-white rounded-lg font-medium hover:bg-[rgb(22,163,74)] transition-colors">
            <MessageCircle size={18} />
            Chat dengan Penjual
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-[rgb(34,197,94)]">{seller.active_products}</p>
            <p className="text-xs text-[rgb(113,113,122)]">Barang Aktif</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-[rgb(34,197,94)]">{seller.sold_products}</p>
            <p className="text-xs text-[rgb(113,113,122)]">Terjual</p>
          </div>
        </div>

        {/* Products */}
        {products.length > 0 && (
          <div className="bg-white rounded-lg p-4 space-y-3">
            <h3 className="font-bold text-[rgb(39,39,46)]">Barang Dagangan</h3>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {seller.active_products > 8 && (
              <Link
                href={`/products?seller=${sellerId}`}
                className="block w-full text-center px-4 py-2 bg-[rgb(240,253,244)] text-[rgb(34,197,94)] rounded-lg font-medium hover:bg-[rgb(220,252,231)] transition-colors"
              >
                Lihat Semua ({seller.active_products})
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
