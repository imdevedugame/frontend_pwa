'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Edit2, Package, Settings } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
import { productsAPI, usersAPI } from '@/lib/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface User {
  id: number
  name: string
  email: string
  phone: string
  address: string
  avatar: string
}

interface Product {
  id: number
  title: string
  price: number
  condition: string
  image: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [userProducts, setUserProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editData, setEditData] = useState<Partial<User>>({})

  const { user: authUser, logout, login, becomeSeller } = useAuth()
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Jika authUser ada, fetch by id; jika tidak tapi ada token di localStorage, coba endpoint profile/me
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (authUser) {
      fetchUserDataById(authUser.id)
    } else if (token) {
      fetchCurrentProfile()
    } else {
      setLoading(false)
    }
  }, [authUser])

  const fetchUserDataById = async (userId: number) => {
    try {
      setLoading(true)
      const userRes = await usersAPI.getById(userId)
      setUser(userRes.data.data)
      setEditData(userRes.data.data)
      const productsRes = await productsAPI.getByUser(userId)
      // Backend returns name/images; adapt to local interface expectations
      const mapped = (productsRes.data.data || []).map((p: any) => ({
        id: p.id,
        title: p.name,
        price: p.price,
        condition: p.condition,
        image: Array.isArray(p.images) ? p.images[0] : (p.images ? JSON.parse(p.images || '[]')[0] : '')
      }))
      setUserProducts(mapped)
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentProfile = async () => {
    try {
      setLoading(true)
      console.log('[PROFILE] fetch /users/profile/me')
      const profileRes = await usersAPI.getProfile()
      const profileData = profileRes.data.data
      setUser(profileData)
      setEditData(profileData)
      // Ambil produk milik user
      const productsRes = await productsAPI.getByUser(profileData.id)
      const mapped = (productsRes.data.data || []).map((p: any) => ({
        id: p.id,
        title: p.name,
        price: p.price,
        condition: p.condition,
        image: Array.isArray(p.images) ? p.images[0] : (p.images ? JSON.parse(p.images || '[]')[0] : '')
      }))
      setUserProducts(mapped)
    } catch (error) {
      console.error('[PROFILE] Error fetch profile/me:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditChange = (field: string, value: string) => {
    setEditData({ ...editData, [field]: value })
  }

  const handleSaveEdit = async () => {
    if (!authUser) return
    try {
      const res = await usersAPI.update(authUser.id, editData)
      setUser(res.data.data)
      setIsEditMode(false)
      localStorage.setItem('user', JSON.stringify(res.data.data))
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </main>
    )
  }

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    if (!loginEmail || !loginPassword) {
      setLoginError('Email dan password wajib diisi')
      return
    }
    try {
      setLoginLoading(true)
      await login(loginEmail, loginPassword)
      // Refresh profile after login
      if (authUser) {
        fetchUserDataById(authUser.id)
      } else {
        fetchCurrentProfile()
      }
    } catch (err: any) {
      setLoginError(err?.response?.data?.message || 'Login gagal')
    } finally {
      setLoginLoading(false)
    }
  }

  if (!authUser && !user && !loading) {
    return (
      <main className="min-h-screen bg-[rgb(250,250,250)] pb-20 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-sm space-y-4">
          <h1 className="text-xl font-bold text-[rgb(39,39,46)]">Login</h1>
          {loginError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {loginError}
            </div>
          )}
          <form onSubmit={handleInlineLogin} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-[rgb(39,39,46)]">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[rgb(39,39,46)]">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full px-4 py-2 bg-[rgb(34,197,94)] text-white rounded-lg hover:bg-[rgb(22,163,74)] font-medium disabled:opacity-60"
            >
              {loginLoading ? 'Memproses...' : 'Login'}
            </button>
          </form>
          <p className="text-xs text-center text-[rgb(113,113,122)]">Belum punya akun? <Link href="/register" className="text-[rgb(34,197,94)] hover:underline">Daftar</Link></p>
          <Link
            href="/"
            className="block text-center text-sm text-[rgb(113,113,122)] hover:text-[rgb(34,197,94)]"
          >
            Kembali ke Home
          </Link>
        </div>
      </main>
    )
  }
  if (!user && loading) {
    return (
      <main className="min-h-screen bg-[rgb(250,250,250)] pb-20 flex flex-col items-center justify-center">
        <p className="text-[rgb(113,113,122)] mb-4">Memuat data profil...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
      {/* Header */}
      <div className="bg-linear-to-r from-[rgb(22,163,74)] to-[rgb(16,134,58)] text-white px-4 py-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profil</h1>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <Settings size={24} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* User Info Card */}
        <div className="bg-white rounded-lg p-4 space-y-4">
          {!isEditMode ? (
            <>
              {/* Profile Display */}
              <div className="flex items-start gap-4">
                <img
                  src={user.avatar || "/placeholder.svg"}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[rgb(39,39,46)]">{user.name}</h2>
                  <p className="text-sm text-[rgb(113,113,122)]">{user.email}</p>
                  {user.phone && (
                    <p className="text-sm text-[rgb(113,113,122)]">{user.phone}</p>
                  )}
                  {user.address && (
                    <p className="text-sm text-[rgb(113,113,122)]">{user.address}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsEditMode(true)}
                className="w-full px-4 py-2 flex items-center justify-center gap-2 bg-[rgb(240,253,244)] text-[rgb(34,197,94)] rounded-lg hover:bg-[rgb(220,252,231)] font-medium transition-colors"
              >
                <Edit2 size={16} />
                Edit Profil
              </button>
            </>
          ) : (
            <>
              {/* Profile Edit Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-bold text-[rgb(39,39,46)]">Nama</label>
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => handleEditChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-[rgb(39,39,46)]">Email</label>
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => handleEditChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-[rgb(39,39,46)]">No. Telepon</label>
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => handleEditChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-[rgb(39,39,46)]">Alamat</label>
                  <input
                    type="text"
                    value={editData.address || ''}
                    onChange={(e) => handleEditChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-[rgb(34,197,94)] text-white rounded-lg hover:bg-[rgb(22,163,74)] font-medium"
                >
                  Simpan
                </button>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-[rgb(39,39,46)] rounded-lg hover:bg-gray-300 font-medium"
                >
                  Batal
                </button>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-[rgb(34,197,94)]">
              {userProducts.length}
            </p>
            <p className="text-xs text-[rgb(113,113,122)]">Barang Dijual</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-[rgb(34,197,94)]">4.8</p>
            <p className="text-xs text-[rgb(113,113,122)]">Rating</p>
          </div>
        </div>

        {/* User Products */}
        {userProducts.length > 0 && (
          <div className="bg-white rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-[rgb(34,197,94)]" />
              <h3 className="font-bold text-[rgb(39,39,46)]">Barang Saya</h3>
            </div>
            <div className="space-y-2">
              {userProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="flex gap-3 p-2 rounded-lg hover:bg-[rgb(240,253,244)] transition-colors"
                >
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-[rgb(39,39,46)] line-clamp-2">
                      {product.title}
                    </p>
                    <p className="text-sm text-[rgb(34,197,94)] font-bold">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="bg-white rounded-lg overflow-hidden">
          {/* Seller Dashboard / Become Seller */}
          {authUser && (
            authUser.is_seller ? (
              <button
                onClick={() => router.push('/seller-dashboard')}
                className="w-full px-4 py-3 text-left hover:bg-[rgb(240,253,244)] border-b border-[rgb(228,228,231)] transition-colors flex items-center gap-2"
              >
                <Package size={16} className="text-[rgb(34,197,94)]" />
                Dashboard Penjual
              </button>
            ) : (
              <button
                onClick={async () => { await becomeSeller(); router.push('/seller-dashboard') }}
                className="w-full px-4 py-3 text-left hover:bg-[rgb(240,253,244)] border-b border-[rgb(228,228,231)] transition-colors flex items-center gap-2"
              >
                <Package size={16} className="text-[rgb(34,197,94)]" />
                Jadi Penjual
              </button>
            )
          )}
          <button
            onClick={() => router.push('/favorites')}
            className="w-full px-4 py-3 text-left hover:bg-[rgb(240,253,244)] border-b border-[rgb(228,228,231)] transition-colors"
          >
            Favorit
          </button>
          <button
            onClick={() => router.push('/orders')}
            className="w-full px-4 py-3 text-left hover:bg-[rgb(240,253,244)] border-b border-[rgb(228,228,231)] transition-colors"
          >
            Riwayat Pembelian
          </button>
          <button
            onClick={() => router.push('/help')}
            className="w-full px-4 py-3 text-left hover:bg-[rgb(240,253,244)] border-b border-[rgb(228,228,231)] transition-colors"
          >
            Bantuan
          </button>
          <button
            onClick={() => logout(true)}
            className="w-full px-4 py-3 text-left flex items-center gap-2 text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="font-bold text-[rgb(39,39,46)] mb-2">Tentang Aplikasi</h3>
          <div className="text-sm text-[rgb(113,113,122)] space-y-2">
            <p>
              <strong>SecondHand</strong> adalah platform jual-beli barang bekas yang aman dan terpercaya.
            </p>
            <p>
              Kami berkomitmen untuk memberikan pengalaman berbelanja online yang terbaik dengan produk berkualitas dan harga terjangkau.
            </p>
            <p className="mt-3 text-xs text-[rgb(82,82,91)]">
              Version 1.0.0 | Built for Praktikum Web Development
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
