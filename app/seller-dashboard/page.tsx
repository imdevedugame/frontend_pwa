'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Product {
  id: number
  name: string
  price: number
  condition: string
  images: string[]
  is_sold: boolean
  created_at: string
  view_count: number
  stock?: number
}

export default function SellerDashboard() {
  const { user, token, isLoading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    soldProducts: 0,
    totalViews: 0,
    totalEarnings: 0
  })
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    // Tunggu sampai proses load auth selesai agar tidak redirect prematur
    if (isLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    fetchSellerData()
  }, [user, isLoading])

  const fetchSellerData = async () => {
    if (!user || !token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        const productsData: Product[] = (data.data || []).map((p: any) => {
          // Normalisasi images: dukung string comma-separated atau array
          let images: string[] = []
          if (Array.isArray(p.images)) {
            images = p.images
          } else if (typeof p.images === 'string') {
            images = p.images.split(',').map((s: string) => s.trim()).filter(Boolean)
          }
          return { ...p, images, stock: p.stock !== undefined ? Number(p.stock) : undefined }
        })
        setProducts(productsData)

        const totalViews = productsData.reduce((sum: number, p: Product) => sum + (p.view_count || 0), 0)
        const soldProducts = productsData.filter((p: Product) => p.is_sold).length
        const totalEarnings = productsData.filter((p: Product) => p.is_sold).reduce((sum: number, p: Product) => sum + p.price, 0)

        setStats({
          totalProducts: productsData.length,
          soldProducts,
          totalViews,
            totalEarnings
        })
      }
    } catch (error) {
      console.error('Error fetching seller data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    if (!token) {
      alert('Token tidak tersedia. Silakan login ulang.')
      return
    }
    if (!confirm('Yakin ingin menghapus produk ini?')) return
    setDeletingId(productId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId))
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.message || 'Gagal menghapus produk')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Terjadi kesalahan jaringan')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
      <div className="bg-gradient-to-r from-[rgb(22,163,74)] to-[rgb(16,134,58)] text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Dashboard Penjual</h1>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[rgb(34,197,94)] rounded-lg font-bold hover:bg-gray-100"
            >
              <Plus size={20} />
              Jual Barang Baru
            </Link>
            <Link
              href="/seller-dashboard/orders"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 text-white border border-white rounded-lg font-bold hover:bg-white hover:text-[rgb(34,197,94)]"
            >
              Kelola Pesanan
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-[rgb(34,197,94)]">{stats.totalProducts}</p>
            <p className="text-sm text-[rgb(113,113,122)]">Total Produk</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-[rgb(34,197,94)]">{stats.soldProducts}</p>
            <p className="text-sm text-[rgb(113,113,122)]">Terjual</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-[rgb(34,197,94)]">{stats.totalViews}</p>
            <p className="text-sm text-[rgb(113,113,122)]">Total Dilihat</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-lg font-bold text-[rgb(34,197,94)]">{formatPrice(stats.totalEarnings)}</p>
            <p className="text-sm text-[rgb(113,113,122)]">Total Earning</p>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgb(228,228,231)] font-bold">
            Daftar Produk Saya
          </div>
          
          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[rgb(250,250,250)] border-b border-[rgb(228,228,231)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold">Produk</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Harga</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Stok</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Dilihat</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-[rgb(228,228,231)] hover:bg-[rgb(250,250,250)]">
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          {(() => {
                            const firstImage = product.images && product.images.length > 0 ? product.images[0] : ''
                            const src = firstImage ? (firstImage.startsWith('http') ? firstImage : `/uploads/${firstImage.replace(/^uploads\//,'')}`) : '/placeholder.svg'
                            return (
                              <img
                                src={src}
                                alt={product.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )
                          })()}
                          <div>
                            <p className="font-medium text-[rgb(39,39,46)]">{product.name}</p>
                            <p className="text-xs text-[rgb(113,113,122)]">{product.condition}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-[rgb(34,197,94)]">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          product.is_sold
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {product.is_sold ? 'Terjual' : 'Aktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex items-center gap-1 text-[rgb(113,113,122)]">
                        <Eye size={16} />
                        {product.view_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-[rgb(39,39,46)]">
                        {product.stock !== undefined ? product.stock : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/edit-product/${product.id}`}
                            className="p-2 hover:bg-blue-100 rounded text-blue-600"
                          >
                            <Edit2 size={16} />
                          </Link>
                          <button
                            onClick={() => deletingId === null && handleDeleteProduct(product.id)}
                            disabled={deletingId === product.id}
                            className={`p-2 rounded text-red-600 ${deletingId === product.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100'}`}
                          >
                            {deletingId === product.id ? (
                              <span className="animate-pulse text-xs font-semibold">...</span>
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-[rgb(113,113,122)]">
              <p>Belum ada produk</p>
              <Link
                href="/sell"
                className="text-[rgb(34,197,94)] hover:underline inline-block mt-2"
              >
                Mulai Jual Barang
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
