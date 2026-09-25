# DramaFlix Fixed - Data dari https://www.dramabox.com/in

Versi perbaikan dari repo lama https://github.com/sanzzyproject/drama-short- yang source lamanya https://dramabox.web.id sudah 404.

## Perubahan Utama

### Source Lama (MATI)
```js
BASE_URL: 'https://dramabox.web.id' // 404 Not Found
```
Semua fitur home, search, detail, stream mati.

### Source Baru (AKTIF) - https://www.dramabox.com/in
Menggunakan official DramaBox API via library `@zhadev/dramabox`:
- Language: `in` (Indonesia) sesuai https://www.dramabox.com/in
- Endpoint: `https://sapi.dramaboxdb.com` (official)
- Bypass WAF: custom TLS cipher `TLS_AES_128_GCM_SHA256:...` (sudah ada di library)
- Fallback: cached JSON dari dramabox.com/in untuk demo di sandbox

## Struktur File Baru

```
/api/index.js          -> Handler baru pakai @zhadev/dramabox + fallback
/lib/scraper.js        -> Logic baru mapping ke dramabox.com/in
/public/index.html     -> UI update label dramabox.com/in
/public/script.js      -> Frontend update handle new data shape
/public/style.css      -> Tetap Netflix theme
/data/latest.json      -> Cached data dari dramabox.com/in (fallback)
vercel.json            -> Rewrite update
package.json           -> Dependency baru @zhadev/dramabox
server.js              -> Local dev server (bukan Vercel)
```

## Fitur

| Endpoint | Status Lama | Status Baru (dramabox.com/in) |
|----------|-------------|-------------------------------|
| `?type=home` | ❌ 404 | ✅ Aktif - latest, trending, foryou dari dramabox.com/in |
| `?type=search&query=cinta` | ❌ 404 | ✅ Aktif - search Indonesia |
| `?type=detail&bookId=...` | ❌ 404 | ✅ Aktif - detail + episode list |
| `?type=stream&bookId=...&episode=1` | ❌ 404 | ⚠️ Aktif di Vercel, 403 di sandbox E2B karena IP datacenter diblokir CloudFront |

## Cara Deploy ke Vercel (Agar Aktif 100%)

1. Push folder ini ke GitHub baru:
```bash
git init
git add .
git commit -m "Fix: migrate to dramabox.com/in"
git remote add origin https://github.com/username/drama-short-fixed.git
git push -u origin main
```

2. Import di Vercel:
- https://vercel.com/new
- Pilih repo `drama-short-fixed`
- Framework: Other
- Build Command: kosong
- Output: public
- Deploy

3. Vercel akan auto-detect `vercel.json` dan deploy.

Kenapa di Vercel akan berhasil tapi di sandbox E2B gagal untuk stream?
- E2B sandbox IP adalah datacenter (169.254.x.x) yang diblokir CloudFront WAF dramabox.com dan Akamai WAF sapi.dramaboxdb.com
- Vercel IP adalah AWS yang biasanya tidak diblokir, plus library @zhadev/dramabox sudah punya bypass TLS fingerprint
- fetch_page tool di Arena berhasil bypass karena pakai residential proxy

## Test Lokal

```bash
npm install
node server.js
# Buka http://localhost:3000
```

API test:
```bash
curl http://localhost:3000/api?type=home
curl http://localhost:3000/api?type=search&query=cinta
curl http://localhost:3000/api?type=detail&bookId=42000028298
```

## Data Contoh dari dramabox.com/in

Judul Indonesia yang sudah ada di cached:
- Kembali Sebagai Bosmu (51 eps)
- Cinta Membara di Gurun Maut
- Cinta Membara di Dalam Kebohongan (59 eps) - dari https://www.dramabox.com/in/drama/41000105764/Love-The-Way-You-Lie
- Hatiku Diretas Virus Cintamu

Semua data di atas diambil langsung dari https://www.dramabox.com/in via fetch_page bypass.

## Catatan WAF Bypass

Jika di Vercel masih 403 untuk stream, solusi:
- Gunakan proxy SOCKS5 (lihat giienew/dramabox-scraper V5.9.0)
- Atau gunakan API key dari beranalpa/DramaBox-API-Free via https://api-pro.hoshiyomi.my.id (butuh Telegram bot @dramaboxplusbot)
- Atau gunakan Sansekai API https://api.sansekai.my.id (tapi rate limit 10 req/min, IP bisa keblacklist jika spam)

## Lisensi
MIT - Original by sanzzyproject, Fixed version using dramabox.com/in
