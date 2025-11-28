"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Send } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Seller {
  id: number
  name: string
  avatar: string
}

interface Message {
  id: number
  from: 'me' | 'seller'
  text: string
  time: string
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const sellerId = params.sellerId as string
  const [seller, setSeller] = useState<Seller | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  useEffect(() => {
    fetchSeller()
  }, [sellerId])

  const fetchSeller = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${sellerId}`)
      if (res.ok) {
        const data = await res.json()
        setSeller({ id: data.data.id, name: data.data.name, avatar: data.data.avatar || '' })
        // Seed sample messages
        setMessages([
          { id: 1, from: 'seller', text: 'Halo, barang masih tersedia ya.', time: new Date().toISOString() },
          { id: 2, from: 'me', text: 'Baik kak, terima kasih informasinya.', time: new Date().toISOString() }
        ])
      }
    } catch (e) {
      console.error('Fetch seller failed', e)
    }
  }

  const sendMessage = () => {
    if (!input.trim()) return
    const newMsg: Message = {
      id: messages.length + 1,
      from: 'me',
      text: input.trim(),
      time: new Date().toISOString()
    }
    setMessages(prev => [...prev, newMsg])
    setInput('')
    // Placeholder only; no backend persistence per requirement
  }

  return (
    <main className="min-h-screen bg-[rgb(250,250,250)] pb-24">
      <div className="bg-white border-b border-[rgb(228,228,231)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[rgb(34,197,94)] hover:text-[rgb(22,163,74)]"><ChevronLeft size={24} /></button>
          <h1 className="text-lg font-bold text-[rgb(39,39,46)] flex-1">Chat Penjual</h1>
          <Link href={`/product/${sellerId}`} className="text-xs text-[rgb(34,197,94)] hover:underline">Lihat Produk</Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {seller && (
          <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-[rgb(228,228,231)]">
            <img src={seller.avatar || '/placeholder.svg'} alt={seller.name} className="w-12 h-12 rounded-full object-cover" />
            <div>
              <p className="font-bold text-[rgb(39,39,46)]">{seller.name}</p>
              <p className="text-xs text-[rgb(113,113,122)]">Status: Online</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg p-4 h-96 overflow-y-auto space-y-2 border border-[rgb(228,228,231)]">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-3 py-2 rounded-lg text-sm max-w-[70%] whitespace-pre-wrap ${m.from === 'me' ? 'bg-[rgb(34,197,94)] text-white' : 'bg-gray-200 text-[rgb(39,39,46)]'}`}>{m.text}</div>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-xs text-[rgb(113,113,122)]">Belum ada pesan. Mulai percakapan sekarang.</p>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[rgb(228,228,231)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Tulis pesan..."
            className="flex-1 px-3 py-2 border border-[rgb(228,228,231)] rounded-lg focus:outline-none focus:border-[rgb(34,197,94)] text-sm"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-[rgb(34,197,94)] text-white rounded-lg font-bold hover:bg-[rgb(22,163,74)] flex items-center gap-2 text-sm"
          >
            <Send size={16} /> Kirim
          </button>
        </div>
      </div>
    </main>
  )
}
