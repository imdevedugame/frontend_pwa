export function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price)
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'

  // Handle common MySQL zero date or invalid placeholders
  if (typeof date === 'string') {
    const trimmed = date.trim()
    if (!trimmed || trimmed.startsWith('0000-00-00')) return '-'
    // Normalize space-separated datetime "YYYY-MM-DD HH:MM:SS" -> ISO
    if (/^\d{4}-\d{2}-\d{2} /.test(trimmed)) {
      date = trimmed.replace(' ', 'T')
    }
  }

  const d = date instanceof Date ? date : new Date(date as string)
  if (!(d instanceof Date) || isNaN(d.getTime())) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d)
  } catch {
    return '-'
  }
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatTime(date: string): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Baru saja'
  if (diffMins < 60) return `${diffMins}m yang lalu`
  if (diffHours < 24) return `${diffHours}h yang lalu`
  if (diffDays < 7) return `${diffDays}d yang lalu`
  return formatDate(date)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+62|0)[0-9]{9,12}$/
  return phoneRegex.test(phone)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatProductCondition(condition: string): string {
  const conditions: Record<string, string> = {
    like_new: 'Seperti Baru',
    good: 'Baik',
    fair: 'Cukup',
    poor: 'Rusak'
  }
  return conditions[condition] || condition
}

export function truncateText(text: string, length: number = 50): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Bangun URL gambar absolut agar tidak 404 ketika frontend berjalan di port berbeda.
// Menangani path lama yang mungkin tersimpan "backend/uploads/..." atau tanpa leading slash.
const ASSET_BASE_ENV = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '')

export function getImageUrl(path: string | undefined | null): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  // Normalisasi variasi path
  let cleaned = path.trim()
  cleaned = cleaned.replace(/^backend\/uploads\//, '/uploads/')
  cleaned = cleaned.replace(/^\/backend\/uploads\//, '/uploads/')
  // Pastikan ada leading slash untuk static mount express
  if (!cleaned.startsWith('/')) cleaned = '/' + cleaned
  // Jika bukan uploads, kembalikan apa adanya (bisa placeholder svg dll.)
  if (!cleaned.startsWith('/uploads/')) return cleaned
  return ASSET_BASE_ENV + cleaned
}
