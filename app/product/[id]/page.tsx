'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, MapPin, Phone, Share2 } from 'lucide-react'
import { formatPrice, formatDate, getImageUrl } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/auth-context'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Product {
  id: number
  title: string
  price: number
  condition: string
  description: string
  image: string
  categoryId: number
  userId: number
  createdAt: string
  stock?: number
}

interface User {
  id: number
  name: string
  email: string
  phone: string
  address: string
  avatar: string
}

interface Category {
  id: number
  name: string
  icon: string
}

export default function ProductDetail() {
  const params = useParams()
  const id = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [seller, setSeller] = useState<User | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)
  const router = useRouter()
  const { token } = useAuth()

  useEffect(() => {
    fetchProductDetail()
  }, [id])

  const fetchProductDetail = async () => {
    setLoading(true)
    try {
      // Prefer direct Supabase query if client available
      if (supabase) {
        // Attempt to increment view count via RPC (ignore failure)
        try {
          await supabase.rpc('increment_product_view', { product_id_input: Number(id) })
        } catch (_) {}
        const { data, error } = await supabase
          .from('products')
          .select('id,user_id,category_id,name,description,price,condition,images,created_at,stock, users:users(id,name,email,phone,address,avatar), categories:categories(id,name,icon)')
          .eq('id', id)
          .single()
        if (!error && data) {
          const firstImage = Array.isArray(data.images)
            ? (data.images[0] || '')
            : (typeof data.images === 'string' ? data.images.split(',')[0].trim() : '')
          setProduct({
            id: Number(data.id)||0,
            title: data.name || 'Produk',
            price: Number(data.price)||0,
            condition: data.condition || '',
            description: data.description || '',
            image: getImageUrl(firstImage),
            categoryId: Number(data.category_id)||0,
            userId: Number(data.user_id)||0,
            createdAt: String(data.created_at||''),
            stock: data.stock !== undefined ? Number(data.stock) : undefined
          })
          if (data.users && !Array.isArray(data.users)) {
            const u:any = data.users
            setSeller({
              id: Number(u.id)||0,
              name: u.name || 'Penjual',
              email: u.email||'',
              phone: u.phone||'',
              address: u.address||'',
              avatar: u.avatar||''
            })
          }
          if (data.categories && !Array.isArray(data.categories)) {
            const c:any = data.categories
            setCategory({
              id: Number(c.id)||0,
              name: c.name||'',
              icon: c.icon||''
            })
          }
          return
        }
      }
      // Fallback to REST backend if Supabase unavailable or error
      const productRes = await fetch(`${API_BASE_URL}/api/products/${id}`)
      if (productRes.ok) {
        const data = await productRes.json()
        const raw = data.data
        const firstImage = Array.isArray(raw.images)
          ? (raw.images[0] || '')
          : (typeof raw.images === 'string' ? raw.images.split(',')[0].trim() : '')
        const normalized: Product = {
          id: Number(raw.id) || 0,
          title: typeof raw.name === 'string' ? raw.name : (typeof raw.title === 'string' ? raw.title : 'Produk'),
          price: Number(raw.price) || 0,
          condition: typeof raw.condition === 'string' ? raw.condition : '',
          description: typeof raw.description === 'string' ? raw.description : '',
          image: getImageUrl(firstImage),
          categoryId: Number(raw.category_id ?? raw.categoryId) || 0,
          userId: Number(raw.user_id ?? raw.userId) || 0,
          createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
          stock: raw.stock !== undefined ? Number(raw.stock) : undefined
        }
        setProduct(normalized)
        if (normalized.userId) {
          const userRes = await fetch(`${API_BASE_URL}/api/users/${normalized.userId}`)
          if (userRes.ok) {
            const userData = await userRes.json()
            setSeller(userData.data)
          }
        }
        const categoriesRes = await fetch(`${API_BASE_URL}/api/categories`)
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
            const cat = categoriesData.data?.find((c: Category) => c.id === normalized.categoryId)
            setCategory(cat)
        }
      }
    } catch (error) {
      console.error('Error fetching product detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChatSeller = () => {
    if (!product) return
    router.push(`/chat/${product.userId}`)
  }

  const handleBuyNow = async () => {
    if (!product) return
    if (!token) {
      router.push('/login')
      return
    }
    try {
      setOrdering(true)
      setOrderSuccess(null)
      const payload = {
        product_id: product.id,
        seller_id: product.userId,
        quantity: 1,
        payment_method: 'transfer',
        shipping_address: '',
        notes: ''
      }
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (res.status === 201) {
        const data = await res.json()
        // Update status to confirmed (paid)
        try {
          await fetch(`${API_BASE_URL}/api/orders/${data.order_id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'confirmed' })
          })
        } catch (_) {}
        setOrderSuccess(`Pesanan dibuat (#${data.order_id}) dan ditandai terbayar`) 
        setTimeout(() => {
          router.push('/orders')
        }, 1500)
      } else {
        const err = await res.json().catch(()=>({}))
        alert(err.message || 'Gagal membuat pesanan')
      }
    } catch (e) {
      console.error('Order error', e)
      alert('Terjadi kesalahan saat membuat pesanan')
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="space-y-4">
            <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[rgb(250,250,250)] pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[rgb(113,113,122)]">Produk tidak ditemukan</p>
          <Link href="/products" className="text-[rgb(34,197,94)] hover:underline mt-2 inline-block">
            Kembali ke Produk
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[rgb(228,228,231)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/products"
            className="text-[rgb(34,197,94)] hover:text-[rgb(22,163,74)]"
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-lg font-bold text-[rgb(39,39,46)]">Detail Produk</h1>
          <button className="text-[rgb(113,113,122)] hover:text-[rgb(34,197,94)]">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Product Image */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 bg-[rgb(249,115,22)] text-white px-3 py-1 rounded-full text-sm font-medium">
            {product.condition}
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-lg p-4 space-y-3">
          {orderSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm font-medium">
              {orderSuccess}
            </div>
          )}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[rgb(39,39,46)] mb-2">
                {product.title}
              </h2>
              <p className="text-2xl font-bold text-[rgb(34,197,94)]">
                {formatPrice(product.price)}
              </p>
            </div>
          </div>

          {category && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{category.icon}</span>
              <span className="text-sm text-[rgb(113,113,122)]">{category.name}</span>
            </div>
          )}

          <div className="text-sm text-[rgb(113,113,122)]">
            Diposting: {formatDate(product.createdAt)}
          </div>
          {product.stock !== undefined && (
            <div className="text-sm text-[rgb(113,113,122)]">Stok tersedia: {product.stock}</div>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg p-4 space-y-2">
          <h3 className="font-bold text-[rgb(39,39,46)]">Deskripsi</h3>
          <p className="text-sm text-[rgb(82,82,91)] leading-relaxed">
            {product.description || 'Tidak ada deskripsi'}
          </p>
        </div>

        {/* Seller Info */}
        {seller && (
          <div className="bg-white rounded-lg p-4 space-y-3">
            <h3 className="font-bold text-[rgb(39,39,46)]">Penjual</h3>
            <div className="flex items-start gap-3">
              <img
                src={seller.avatar || "/placeholder.svg"}
                alt={seller.name}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-bold text-[rgb(39,39,46)]">{seller.name}</p>
                {seller.address && (
                  <p className="text-xs text-[rgb(113,113,122)] flex items-center gap-1 mt-1">
                    <MapPin size={14} />
                    {seller.address}
                  </p>
                )}
                {seller.phone && (
                  <p className="text-xs text-[rgb(113,113,122)] flex items-center gap-1 mt-1">
                    <Phone size={14} />
                    {seller.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="fixed bottom-24 left-0 right-0 px-4 pb-4 bg-linear-to-t from-white to-transparent pt-4 max-w-2xl mx-auto">
          <div className="flex gap-3">
            <button
              onClick={handleChatSeller}
              className="flex-1 px-4 py-3 bg-white border-2 border-[rgb(34,197,94)] text-[rgb(34,197,94)] rounded-lg font-bold hover:bg-[rgb(240,253,244)] transition-colors disabled:opacity-50"
              disabled={ordering}
            >
              Chat Penjual
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 px-4 py-3 bg-[rgb(34,197,94)] text-white rounded-lg font-bold hover:bg-[rgb(22,163,74)] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={ordering}
            >
              {ordering ? 'Memproses...' : 'Beli Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
