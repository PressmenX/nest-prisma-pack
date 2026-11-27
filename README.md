# nest-prisma-pack

Template backend REST API dengan NestJS, Prisma, dan PostgreSQL.

Template ini mencakup validasi, format response, penanganan error, logging, dan health check.

## Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Instalasi](#instalasi)
- [Penggunaan](#penggunaan)
- [Konfigurasi](#konfigurasi)
- [Format API](#format-api)
- [Struktur Proyek](#struktur-proyek)
- [Deployment](#deployment)
- [Lisensi](#lisensi)

## Fitur

- Validasi environment variable saat aplikasi dimulai
- Validasi request global dengan Zod (`nestjs-zod`)
- Format response sukses dan error yang konsisten
- Pemetaan error Prisma ke status HTTP
- Logging dengan Pino
- Health check koneksi database
- PostgreSQL lewat Docker Compose

## Tech Stack

| Teknologi | Versi |
|---|---|
| NestJS | 11 |
| Prisma | 7 |
| PostgreSQL | 16 |
| Zod | 4 |
| TypeScript | 6 |

## Instalasi

### Prasyarat

- Node.js 20.19+, 22.13+, atau 24+
- Docker dan Docker Compose

### Langkah

1. Clone repository dan pasang dependensi:

   ```bash
   git clone https://github.com/PressmenX/nest-prisma-pack.git
   cd nest-prisma-pack
   npm install
   ```

2. Buat file environment, lalu isi nilainya sesuai bagian [Konfigurasi](#konfigurasi):

   ```bash
   cp .env.example .env
   ```

3. Nyalakan database:

   ```bash
   docker compose up -d
   ```

4. Buat Prisma Client:

   ```bash
   npm run prisma:generate
   ```

## Penggunaan

Jalankan server development:

```bash
npm run dev
```

Pastikan database terhubung (sesuaikan port jika `PORT` diubah):

```bash
curl http://localhost:3000/health/check
```

Status `200` berarti koneksi berhasil.

| Endpoint | Fungsi |
|---|---|
| `GET /` | Response contoh |
| `GET /health/check` | Cek koneksi database |

### Skrip

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Mode development dengan restart otomatis |
| `npm run build` | Build ke `dist/` |
| `npm run start:prod` | Menjalankan hasil build |
| `npm run lint` | Lint sekaligus memperbaiki otomatis |
| `npm run format` | Format kode dengan Prettier |
| `npm run prisma:studio` | Membuka Prisma Studio |

### Migrasi database

Setelah menambah atau mengubah model di `prisma/schema.prisma`:

```bash
npm run prisma:migrate
npm run prisma:generate
```

Menjalankan seed dari `prisma/seed.ts`:

```bash
npx prisma db seed
```

## Konfigurasi

Semua nilai dibaca dari file `.env` atau environment variable.

| Variabel | Dipakai oleh | Keterangan |
|---|---|---|
| `DB_USER` | Docker Compose | User PostgreSQL |
| `DB_PASSWORD` | Docker Compose | Password PostgreSQL |
| `DB_NAME` | Docker Compose | Nama database |
| `DATABASE_URL` | Aplikasi dan Prisma | Wajib diisi |
| `NODE_ENV` | Aplikasi | `development` (bawaan), `production`, atau `test` |
| `PORT` | Aplikasi | Bawaan `3000` |

Contoh format `DATABASE_URL`, dengan nilai yang sama seperti `DB_*`:

```
postgresql://DB_USER:DB_PASSWORD@localhost:5432/DB_NAME
```

## Format API

### Response sukses

```json
{
  "statusCode": 200,
  "status": "success",
  "endpoint": "GET /health/check",
  "message": "Database connection is healthy",
  "result": { "status": "ok" }
}
```

Data yang dikembalikan controller ditempatkan pada field `result`. Pesan bawaan ditentukan berdasarkan method HTTP.

Pesan khusus digunakan jika nilai yang dikembalikan berupa object dengan tepat dua field, yaitu `message` (string) dan `data`:

```ts
return { message: 'User activated', data: user };
```

Pada object tersebut, isi `data` ditempatkan pada `result`. Object dengan susunan field lain dikirim utuh pada `result`.

### Response error

Error ditangani secara global. Contoh melempar exception dari service:

```ts
throw new NotFoundException('User not found');
```

| Kejadian | Hasil |
|---|---|
| `HttpException` dan turunannya | Status dan pesan mengikuti exception |
| Validasi Zod gagal | `400`, dengan daftar `errors` per field |
| Prisma `P2002` (data duplikat) | `409` |
| Prisma `P2003` (foreign key) | `409` |
| Prisma `P2025` (data tidak ditemukan) | `404` |
| Prisma `P2000` (nilai terlalu panjang) | `400` |
| Request ditolak body parser | `4xx` sesuai penyebabnya |
| Error lain | `500`, pesan asli tidak dikirim ke client |

### Validasi request

DTO dibuat dari schema Zod. `ZodValidationPipe` sudah terpasang global.

```ts
export const CreateItemSchema = z.strictObject({
  name: z.string().min(3),
});

export class CreateItemDto extends createZodDto(CreateItemSchema) {}
```

`z.strictObject` menolak field yang tidak terdaftar di schema.

## Struktur Proyek

```
src/
  core/
    config/         konfigurasi env dan logger
    filters/        format error
    interceptors/   format response sukses
  modules/
    health/         health check
    prisma/         PrismaService (global)
```

Modul fitur diletakkan di `src/modules/`.

## Deployment

```bash
npm run build
npm run prisma:deploy   # menerapkan migrasi
npm run start:prod
```

Proses build memerlukan dependensi yang sudah terpasang dan Prisma Client yang sudah dibuat.

Set environment variable `NODE_ENV=production` di server. Nilai bawaannya adalah `development`.

Perbedaan perilaku berdasarkan `NODE_ENV`:

| | `development` | `production` |
|---|---|---|
| `exceptionName` di response error | tampil | disembunyikan |
| Format log | `pino-pretty` | JSON |
| Level log | `debug` | `info` |

## Lisensi

`UNLICENSED` © PressmenX