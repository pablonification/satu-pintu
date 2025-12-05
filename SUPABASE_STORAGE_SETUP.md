# Panduan Setup Supabase Storage untuk Foto Tiket

## Langkah 1: Buat Bucket Storage

1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project SatuPintu Anda
3. Navigasi ke menu **Storage** di sidebar kiri
4. Klik tombol **New bucket**
5. Isi konfigurasi bucket:
   - **Name**: `ticket-photos`
   - **Public bucket**: ✅ Centang (untuk memungkinkan akses publik ke foto)
   - **File size limit**: 5MB (opsional, sesuaikan kebutuhan)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp` (opsional)
6. Klik **Create bucket**

## Langkah 2: Konfigurasi Policy

### Policy untuk Public Read (Akses Baca Publik)

1. Di halaman Storage, klik bucket `ticket-photos`
2. Klik tab **Policies**
3. Klik **New policy**
4. Pilih **For full customization** 
5. Buat policy dengan konfigurasi:
   - **Policy name**: `Public Read Access`
   - **Allowed operation**: SELECT
   - **Target roles**: (kosongkan untuk public)
   - **Policy definition**: 
     ```sql
     true
     ```
6. Klik **Review** lalu **Save policy**

### Policy untuk Authenticated Write (Akses Tulis untuk User Terautentikasi)

1. Klik **New policy** lagi
2. Pilih **For full customization**
3. Buat policy dengan konfigurasi:
   - **Policy name**: `Authenticated Write Access`
   - **Allowed operation**: INSERT
   - **Target roles**: `authenticated`
   - **Policy definition**:
     ```sql
     true
     ```
4. Klik **Review** lalu **Save policy**

### Policy untuk Update dan Delete (Opsional)

Jika diperlukan kemampuan update/delete foto:

1. Klik **New policy**
2. Pilih **For full customization**
3. Buat policy:
   - **Policy name**: `Authenticated Update Delete`
   - **Allowed operation**: UPDATE, DELETE
   - **Target roles**: `authenticated`
   - **Policy definition**:
     ```sql
     true
     ```
4. Klik **Review** lalu **Save policy**

## Langkah 3: Environment Variables

Pastikan environment variables berikut sudah dikonfigurasi di file `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Service Role Key (hanya untuk server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Cara Mendapatkan Keys:

1. Di Supabase Dashboard, navigasi ke **Settings** > **API**
2. Salin:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## Langkah 4: Struktur Folder Storage

Foto akan disimpan dengan struktur berikut:
```
ticket-photos/
├── {ticketId}/
│   ├── before-{timestamp}.jpg
│   └── after-{timestamp}.jpg
```

Contoh:
```
ticket-photos/
├── SP-20251203-0001/
│   ├── before-1701619200000.jpg
│   └── after-1701619200000.jpg
```

## Langkah 5: Verifikasi Setup

1. Upload file test melalui dashboard Supabase Storage
2. Cek apakah file dapat diakses publik via URL:
   ```
   https://your-project-ref.supabase.co/storage/v1/object/public/ticket-photos/test.jpg
   ```
3. Pastikan aplikasi dapat upload foto saat menyelesaikan tiket

## Troubleshooting

### Error: "new row violates row-level security policy"
- Pastikan policy INSERT sudah dibuat dengan benar
- Jika menggunakan anon key, pastikan policy memperbolehkan akses tanpa autentikasi atau gunakan service role key di server-side

### Error: "Bucket not found"
- Pastikan nama bucket persis `ticket-photos`
- Cek apakah bucket sudah dibuat di region yang benar

### Error: "File too large"
- Sesuaikan file size limit di bucket settings
- Kompres gambar sebelum upload di client-side

## Catatan Keamanan

- Untuk production, pertimbangkan untuk menambahkan validasi tambahan pada policy
- Gunakan service role key hanya di server-side (API routes)
- Jangan expose service role key ke client-side
