'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, UploadIcon } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Category {
  id: number
  name: string
  icon: string
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  condition: string
  category_id: number
  images: string[]
}

const CONDITIONS = ['like_new', 'good', 'fair', 'poor']

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const [categories, setCategories] = useState<Category[]>([])
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    condition: 'good',
    price: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [productId])

  const fetchData = async () => {
    try {
      const [productRes, categoriesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/products/${productId}`),
        fetch(`${API_BASE_URL}/api/categories`)
      ])

      if (productRes.ok) {
        const data = await productRes.json()
        const prod = data.data
        setProduct(prod)
        setFormData({
          name: prod.name,
          description: prod.description,
          category_id: prod.category_id,
          condition: prod.condition,
          price: prod.price
        })
        if (prod.images && prod.images.length > 0) {
          setPreviewImage(prod.images[0])
        }
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setPreviewImage(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nama barang wajib diisi'
    }
    if (!formData.category_id) {
      newErrors.category_id = 'Kategori wajib dipilih'
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Harga harus berupa angka positif'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category_id: parseInt(formData.category_id),
          price: parseInt(formData.price),
          condition: formData.condition,
          images: previewImage ? [previewImage] : []
        })
      })

      if (res.ok) {
        alert('Produk berhasil diperbarui')
        router.push('/seller-dashboard')
      } else {
        console.error('Error updating product')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
            ))}
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
          <Link href="/seller-dashboard" className="text-[rgb(34,197,94)] hover:underline mt-2 inline-block">
            Kembali ke Dashboard
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
            href="/seller-dashboard"
            className="text-[rgb(34,197,94)] hover:text-[rgb(22,163,74)]"
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-[rgb(39,39,46)]">Edit Produk</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="bg-white rounded-lg p-4 space-y-3">
          <label className="block">
            <span className="font-bold text-[rgb(39,39,46)] block mb-2">Foto Barang</span>
            <div className="relative">
              {previewImage ? (
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={previewImage || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[rgb(228,228,231)] rounded-lg p-8 cursor-pointer hover:border-[rgb(34,197,94)] transition-colors">
                  <UploadIcon size={32} className="text-[rgb(113,113,122)] mb-2" />
                  <span className="text-sm font-medium text-[rgb(113,113,122)]">
                    Klik untuk unggah foto
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </label>
        </div>

        <div className="bg-white rounded-lg p-4 space-y-4">
          <div>
            <label className="font-bold text-[rgb(39,39,46)] block mb-2">Nama Barang</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="font-bold text-[rgb(39,39,46)] block mb-2">Kategori</label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
            >
              <option value="">Pilih Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
          </div>

          <div>
            <label className="font-bold text-[rgb(39,39,46)] block mb-2">Kondisi Barang</label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
            >
              {CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-[rgb(39,39,46)] block mb-2">Harga (Rp)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="font-bold text-[rgb(39,39,46)] block mb-2">Deskripsi Barang</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)] resize-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 bg-[rgb(34,197,94)] text-white font-bold rounded-lg hover:bg-[rgb(22,163,74)] disabled:bg-gray-400 transition-colors"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </main>
  )
}
