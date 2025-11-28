'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/auth-context'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/')
    } catch (err: any) {
      setError(err?.message || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[rgb(22,163,74)] to-[rgb(16,134,58)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Logo/Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[rgb(34,197,94)]">SecondHand</h1>
            <p className="text-sm text-[rgb(113,113,122)] mt-1">Jual Beli Barang Bekas</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[rgb(39,39,46)] mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-[rgb(113,113,122)]" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
                  required
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-[rgb(34,197,94)] text-white font-bold rounded-lg hover:bg-[rgb(22,163,74)] disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Loading...' : 'Masuk'}
            </button>
          </form>

          <div className="text-center text-sm text-[rgb(113,113,122)]">
            Belum punya akun?{' '}
            <Link
              href="/register"
              className="text-[rgb(34,197,94)] hover:text-[rgb(22,163,74)] font-bold"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
