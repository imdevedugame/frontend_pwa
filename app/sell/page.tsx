'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import Link from 'next/link'
import { ChevronLeft, UploadIcon } from 'lucide-react'
import { categoriesAPI, productsAPI, uploadAPI } from '@/lib/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Category {
  id: number
  name: string
  icon: string
}

interface FormData {
  title: string
  description: string
  categoryId: string
  condition: 'like_new' | 'good' | 'fair' | 'poor'
  price: string
  // store file list for upload instead of base64
  images: File[]
  stock: string
}

const CONDITION_OPTIONS: { value: FormData['condition']; label: string }[] = [
  { value: 'like_new', label: 'Seperti Baru' },
  { value: 'good', label: 'Baik' },
  { value: 'fair', label: 'Cukup' },
  { value: 'poor', label: 'Buruk' },
]

export default function SellPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    categoryId: '',
    condition: 'like_new',
    price: '',
    images: [],
    stock: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const { token } = useAuth()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.getAll()
      setCategories(res.data.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Nama barang wajib diisi'
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Kategori wajib dipilih'
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Harga harus berupa angka positif'
    }
    if (!formData.images.length) {
      newErrors.image = 'Foto barang wajib diunggah'
    }
    if (!formData.stock || isNaN(Number(formData.stock)) || Number(formData.stock) < 0 || !Number.isInteger(Number(formData.stock))) {
      newErrors.stock = 'Stok harus bilangan bulat >= 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length) {
      // limit to 5 like backend
      const selected = files.slice(0,5)
      setFormData({ ...formData, images: selected })
      // show first preview
      setPreviewImage(URL.createObjectURL(selected[0]))
      // clear error
      if (errors.image) setErrors({ ...errors, image: '' })
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)

      // Pastikan user sudah login (token tersedia)
      if (!token) {
        alert('Silakan login terlebih dahulu sebelum menjual barang.')
        return
      }

      // 1. Upload files first (if any)
      let imagePaths: string[] = []
      if (formData.images.length) {
        try {
          const uploadRes = await uploadAPI.uploadImages(formData.images)
          if (uploadRes.data?.success) {
            imagePaths = (uploadRes.data.files || []).map((f: any) => f.path)
          } else {
            console.error('Upload gagal:', uploadRes.data)
            alert(uploadRes.data?.message || 'Gagal mengunggah file gambar')
            return
          }
        } catch (uploadErr) {
          console.error('Error upload gambar:', uploadErr)
          alert('Gagal mengunggah gambar')
          return
        }
      }

      // 2. Create product with file paths
      const payload = {
        name: formData.title,
        category_id: parseInt(formData.categoryId),
        price: parseInt(formData.price),
        condition: formData.condition,
        description: formData.description,
        images: imagePaths,
        stock: parseInt(formData.stock || '0')
      }

      const res = await productsAPI.create(payload)

      if (res.status === 201) {
        setSuccess(true)
        setFormData({
          title: '',
          description: '',
          categoryId: '',
          condition: 'like_new',
          price: '',
          images: [],
          stock: ''
        })
        setPreviewImage(null)

        // Reset success message after 3 seconds
        setTimeout(() => {
          setSuccess(false)
        }, 3000)
      } else {
        console.error('Error uploading product', res.data)
        alert(res.data?.message || 'Gagal mengunggah produk')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Terjadi kesalahan saat unggah produk')
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
          <h1 className="text-xl font-bold text-[rgb(39,39,46)]">Jual Barang</h1>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg m-4">
          <p className="font-bold">Berhasil!</p>
          <p className="text-sm">Barang Anda berhasil diunggah</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Image Upload */}
        <div className="bg-white rounded-lg p-4 space-y-3">
          <label className="block">
            <span className="font-bold text-[rgb(39,39,46)] block mb-2">
              Foto Barang <span className="text-red-500">*</span>
            </span>
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
                    onClick={() => {
                      setPreviewImage(null)
                      setFormData({ ...formData, images: [] })
                    }}
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
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {errors.image && (
              <p className="text-red-500 text-sm mt-1">{errors.image}</p>
            )}
          </label>
        </div>

        {/* Form Fields */}
        <div className="bg-white rounded-lg p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="font-bold text-[rgb(39,39,46)] block mb-2">
              Nama Barang <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Contoh: Laptop ASUS VivoBook"
              className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="font-bold text-[rgb(39,39,46)] block mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
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
            {errors.categoryId && (
              <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
            )}
          </div>

          {/* Condition */}
          <div>
            <label className="font-bold text-[rgb(39,39,46)] block mb-2">
              Kondisi Barang
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
            >
              {CONDITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="font-bold text-[rgb(39,39,46)] block mb-2">
              Harga (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="Contoh: 500000"
              className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price}</p>
            )}
          </div>

          {/* Stock */}
          <div>
            <label className="font-bold text-[rgb(39,39,46)] block mb-2">
              Stok <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="stock"
              min={0}
              value={formData.stock}
              onChange={handleInputChange}
              placeholder="Contoh: 10"
              className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)]"
            />
            {errors.stock && (
              <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-[rgb(39,39,46)] block mb-2">
              Deskripsi Barang
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Jelaskan kondisi dan detail barang..."
              rows={4}
              className="w-full px-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)] resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-lg p-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 bg-[rgb(34,197,94)] text-white font-bold rounded-lg hover:bg-[rgb(22,163,74)] disabled:bg-gray-400 transition-colors"
          >
            {submitting ? 'Mengunggah...' : 'Jual Barang'}
          </button>
        </div>
      </form>
    </main>
  )
}
