'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/auth-context'

// API_BASE_URL sebelumnya menyebabkan kebingungan (double /api). Gunakan auth-context + axios baseURL.
// Hapus variabel ini agar tidak dipakai fetch manual yang membentuk URL salah.

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  useEffect(() => {
    // Debug base URL
    // eslint-disable-next-line no-console
    console.log('[REGISTER] axios baseURL =', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok')
      return
    }

    setLoading(true)
    try {
      await register(formData.name, formData.email, formData.password, formData.phone)
      router.push('/')
    } catch (err: any) {
      setError(err?.message || 'Registrasi gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-[rgb(22,163,74)] to-[rgb(16,134,58)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Logo/Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[rgb(34,197,94)]">SecondHand</h1>
            <p className="text-sm text-[rgb(113,113,122)] mt-1">Daftar Akun Baru</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[rgb(39,39,46)] mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-[rgb(113,113,122)]" size={20} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nama lengkap Anda"
                  className="w-full pl-10 pr-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[rgb(39,39,46)] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-[rgb(113,113,122)]" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[rgb(39,39,46)] mb-2">
                No. Telepon
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-[rgb(113,113,122)]" size={20} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  className="w-full pl-10 pr-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[rgb(39,39,46)] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-[rgb(113,113,122)]" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[rgb(113,113,122)]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[rgb(39,39,46)] mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-[rgb(113,113,122)]" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-[rgb(34,197,94)] text-white font-bold rounded-lg hover:bg-[rgb(22,163,74)] disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Loading...' : 'Daftar'}
            </button>
          </form>

          <div className="text-center text-sm text-[rgb(113,113,122)]">
            Sudah punya akun?{' '}
            <Link
              href="/login"
              className="text-[rgb(34,197,94)] hover:text-[rgb(22,163,74)] font-bold"
            >
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
