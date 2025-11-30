# SecondHand PWA – Jual Beli Barang Bekas (Supabase Edition)

Aplikasi Progressive Web App untuk jual-beli barang bekas dengan backend terintegrasi Supabase (Auth, Postgres, Storage) dan frontend Next.js 14.

## 🔰 Ringkas Fitur

- Produk: listing, filter, sorting, detail (increment view), upload, edit, delete
- Auth: register + login (Supabase), session restore, logout
- Pesanan: buat pesanan, kelola status (seller), tandai diterima (buyer), review seller
- Kategori: seed & listing kategori Indonesia (Tekstil, Elektronik, Plastik, Barang Daur Ulang)
- Dashboard Penjual: statistik produk, earning, view count
- PWA: service worker caching + installability
- Upload gambar: saat ini via backend (base64 → Supabase Storage), rencana migrasi direct client upload

## 🧱 Stack Teknologi

| Layer     | Teknologi |
|-----------|-----------|
| Frontend  | Next.js 154 App Router, TypeScript, Tailwind, Lucide Icons |
| Backend   | Node.js + Express (ES Modules) |
| Database  | Supabase Postgres |
| Auth      | Supabase Auth (email/password) |
| Storage   | Supabase Storage Bucket (gambar produk) |
| PWA       | Service Worker + Manifest |

## 📁 Struktur (Ringkas)
```
backend/
  server.js
  routes/
    auth.js products.js categories.js orders.js users.js cart.js upload.js
  lib/supabaseClient.js (public + admin client)
  scripts/seed-categories.js
frontend/
  app/ (pages: product/[id], seller-dashboard, seller-dashboard/orders, orders, sell, login, register ...)
  context/auth-context.tsx
  lib/supabaseClient.ts api.ts utils.ts
  components/sw-register.tsx bottom-nav.tsx dll
  public/manifest.json sw.js (service worker)
```

## 🔐 Environment Variables

Backend `.env`:
```
PORT=5000
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY   # JANGAN commit ke repo publik
```

Frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

## 🗃️ Model Data (Simplified)

Tables utama di Supabase:
- `users`: id, auth_user_id (mapping Supabase Auth), name, email, phone, address, city, avatar, is_seller, 
- `products`: id, user_id, category_id, name, description, price, condition, images (comma-separated), location, stock, is_sold, view_count
- `categories`: id, name, icon
- `orders`: id, buyer_id, seller_id, product_id, quantity, total_price, payment_method, shipping_address, notes, status, created_at
Optional: `cart` (jika digunakan) menyimpan item sementara.

## 🔄 Alur Utama
1. User register → buat auth user + row profil.
2. Login: dapat access token Supabase + profil terpisah.
3. Listing produk: query Postgres (join users & categories).
4. Detail produk: view_count ditingkatkan via RPC `increment_product_view`.
5. Pesanan: buyer buat order (stok otomatis berkurang), seller update status → shipped, buyer konfirmasi delivered.


## 📡 API (Backend Express)

Semua endpoint prefix: `/api/*`

Auth:
- `POST /api/auth/register` → body `{ name,email,password,phone? }`
- `POST /api/auth/login` → body `{ email,password }`

Products:
- `GET /api/products` → query: `category_id,search,sort,min_price,max_price,condition`
- `GET /api/products/:id`
- `GET /api/products/user/:userId`
- `POST /api/products` (auth)
- `PUT /api/products/:id` (auth owner)
- `DELETE /api/products/:id` (auth owner)

Orders:
- `GET /api/orders` (buyer atau seller terkait)
- `GET /api/orders/:id`
- `POST /api/orders` (buyer) → body `{ product_id,seller_id,quantity,payment_method?,shipping_address?,notes? }`
- `PUT /api/orders/:id/status` (buyer atau seller sesuai aturan) → body `{ status }`
- `POST /api/orders/:id/review` (buyer) → body `{ rating, comment? }`

Categories:
- `GET /api/categories`
Seed: `node scripts/seed-categories.js`

Upload:
- `POST /api/upload` → body `{ files: [{ filename, base64 }] }` (backend simpan ke Storage, kembalikan path)

Health:
- `GET /api/health`

Authorization header untuk protected: `Authorization: Bearer <access_token>`

## 🧪 Contoh Request
Tambah produk:
```bash
curl -X POST http://localhost:5000/api/products \
 -H "Authorization: Bearer TOKEN" \
 -H "Content-Type: application/json" \
 -d '{
   "name":"Keyboard Mekanik",
   "category_id":1,
   "price":250000,
   "condition":"good",
   "description":"Masih normal",
   "images":["uploads/img1.png"],
   "location":"Bandung",
   "stock":2
 }'
```

Update status order → shipped:
```bash
curl -X PUT http://localhost:5000/api/orders/123/status \
 -H "Authorization: Bearer TOKEN" \
 -H "Content-Type: application/json" \
 -d '{"status":"shipped"}'
```

## 🖥️ Fitur Frontend
- Auth Context: menyimpan `user`, `token`, auto restore session
- Seller Dashboard: statistik + CRUD + link kelola pesanan
- Order Management (seller): set status ke shipped (langkah 3)
- Orders Page (buyer): lacak progress + tombol “Pesanan sudah diterima” ketika status shipped
- Product Detail: direct Supabase fetch + fallback REST + increment view
- PWA: service worker (network-first navigation, stale-while-revalidate static assets), manifest siap, perlu ikon png production
- Responsive UI: bottom nav di mobile, komponen reusable (cards, tables, forms, toasts)

## 🔧 Service Worker (Ringkas Strategi)
- Precaches root dan manifest
- Navigation: network-first (fallback cache jika offline)
- Static asset: stale-while-revalidate
- API calls: tidak dicache untuk data segar

## 🌱 Seeding Kategori
Jalankan:
```bash
cd backend
node scripts/seed-categories.js
```
Kategori saat ini: Tekstil, Elektronik, Plastik, Barang Daur Ulang.

## 🚀 Menjalankan Proyek
Backend:
```bash
cd backend
pnpm install   # atau npm install
node server.js # atau nodemon
```
Frontend:
```bash
cd frontend
pnpm install
pnpm dev
```

## 🛡️ Catatan Keamanan
- Hindari menggunakan SERVICE_ROLE di frontend.
- Terapkan Row Level Security (RLS) Supabase untuk `products`, `orders`, `reviews` agar query bisa via anon client.
- Simpan keys sensitif hanya di backend / dashboard Supabase.

## 🔮 Rencana Perbaikan
- Migrasi upload ke direct client (signed URL / public bucket)
- Implement RLS policies lengkap (read/write per user role)
- Paginasi listing produk + infinite scroll
- Optimasi gambar (transformasi, webp)
- Offline fallback page `/offline.html`
- Notifikasi real-time (Supabase Realtime) untuk status pesanan

## ❓ Troubleshooting Singkat
| Masalah | Penyebab Umum | Solusi |
|---------|---------------|--------|
| 401 Unauthorized | Token kadaluarsa / hilang | Re-login, refresh token |
| View count tidak naik | RPC belum dibuat | Buat fungsi SQL `increment_product_view` |
| Gambar tidak tampil | Path Storage salah | Pastikan bucket publik / gunakan signed URL |

## 🧩 Fungsi RPC Diperlukan
Contoh pembuatan di SQL editor Supabase:
```sql
create or replace function increment_product_view(product_id_input int)
returns void as $$
  update products set view_count = coalesce(view_count,0) + 1
  where id = product_id_input;
$$ language sql security definer;
```

## 📄 License
MIT License

