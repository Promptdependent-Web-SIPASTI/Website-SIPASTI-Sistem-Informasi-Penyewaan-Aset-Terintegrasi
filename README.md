# SIPASTI — Sistem Informasi Penyewaan Aset Terintegrasi (Front End)

Front end SIPASTI FMIPA UNNES (proyek akhir web). Dibangun mengikuti desain Figma
"Sistem Informasi Penyewaan Aset Terintegrasi".

## Tech stack
- **Next.js** (App Router) dengan **JavaScript**
- **ESLint** (`npm run lint`)
- **Tailwind CSS** v4 (token warna di `app/globals.css`)
- Tambahan: **Framer Motion** (animasi hero, reveal, akordeon), **lucide-react** (ikon),
  **@fontsource-variable/plus-jakarta-sans** (font lokal, tanpa Google Fonts)

## Menjalankan
```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build && npm start
```

## Halaman tahap 1 (selesai)
| Rute | Isi |
|---|---|
| `/` | Beranda: hero beranimasi + Cek Ketersediaan, aset unggulan, kategori, cara menyewa, FAQ |
| `/aset` | Katalog: filter (kategori, subkategori, kapasitas, tanggal), urutan, paginasi, keadaan kosong |
| `/aset/[slug]` | Detail aset: galeri, tab, estimasi biaya, validasi H-2/jam operasional, kalender ketersediaan |
| `/masuk` | Masuk (validasi, galat, tampil/sembunyi sandi) |
| `/daftar` | Daftar akun penyewa (mahasiswa/dosen/staf, validasi domain email UNNES) |
| `/dashboard/*` | Placeholder — dikerjakan pada tahap berikutnya |

## Akun demo (simulasi, disimpan di localStorage)
| Peran | Email | Kata sandi |
|---|---|---|
| Penyewa | mahasiswa@students.unnes.ac.id | Sipasti123 |
| Petugas | petugas@mail.unnes.ac.id | Sipasti123 |
| Admin | admin@mail.unnes.ac.id | Sipasti123 |

## Struktur
```
app/(site)/   halaman dengan navbar + footer (beranda, aset, dashboard)
app/(auth)/   halaman masuk dan daftar
components/   Hero, Navbar, Footer, AsetCard, KatalogClient, DetailClient, FaqAccordion, ...
lib/data.js   data dummy 17 aset FMIPA (tarif, stok, kapasitas = contoh)
lib/waktu.js  aturan jadwal: Senin–Sabtu, sesi 07.00–11.30 & 12.30–18.00, pengajuan H-2
lib/auth.js   autentikasi simulasi (akan diganti Supabase Auth)
public/logo/  logo berlatar transparan (icon, wordmark, full)
```

## Catatan
- Foto aset: lihat `public/images/aset/README.txt`. Tanpa foto, tampil placeholder.
- Data dan jadwal bersifat simulasi; integrasi Supabase (Auth, database, Storage) menyusul.
