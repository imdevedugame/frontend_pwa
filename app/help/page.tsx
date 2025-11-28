'use client'

import Link from 'next/link'

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[rgb(250,250,250)] pb-20">
      <div className="bg-linear-to-r from-[rgb(22,163,74)] to-[rgb(16,134,58)] text-white px-4 py-6 sticky top-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Bantuan</h1>
          <Link href="/profile" className="text-white hover:underline text-sm">Kembali</Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white p-4 rounded-lg space-y-2">
          <h2 className="text-lg font-bold text-[rgb(39,39,46)]">FAQ Cepat</h2>
          <ul className="text-sm text-[rgb(82,82,91)] list-disc pl-5 space-y-1">
            <li>Cara menjual barang: buka halaman Jual, isi form lalu submit.</li>
            <li>Cara mengedit profil: klik ikon Settings atau tombol Edit Profil.</li>
            <li>Tidak bisa unggah produk? Pastikan sudah login dan semua field wajib terisi.</li>
          </ul>
        </section>

        <section className="bg-white p-4 rounded-lg space-y-2">
          <h2 className="text-lg font-bold text-[rgb(39,39,46)]">Kontak Dukungan</h2>
          <p className="text-sm text-[rgb(82,82,91)]">Email: support@secondhand.local</p>
          <p className="text-xs text-[rgb(113,113,122)]">Ini halaman bantuan placeholder.</p>
        </section>
      </div>
    </main>
  )
}
