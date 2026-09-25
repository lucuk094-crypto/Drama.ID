# Drama.ID - 2000 Drama Netflix Style 37 Genre

## Total: 2000 Drama | 146,993 Episode | 37 Genre | Frontend Netflix Filter

### Frontend Baru - Netflix Style Genre Filter
- **Genre Bar** sticky di atas: 37 chips scrollable (Semua + 37 genre) dengan count
- **Hero** random dari trending dengan genre tag, deskripsi, tombol Putar
- **Stats Bar**: 2000 drama, 146K episode, 37 genre, filter aktif
- **Rows**: Trending (50), Terbaru (50), Untuk Kamu (100), Jelajahi Genre (grid), + 8 genre rows
- **Search** dengan filter genre chips
- **Player** dengan genre tag, playcount, tags, rekomendasi
- **Bottom Nav**: Beranda, Jelajah, Cari, List Saya

### Statistik Per Genre (54-55 per genre, balanced)
| Genre | Count | Browse ID |
|-------|-------|-----------|
| Romansa | 55 | 447 |
| Balas Dendam | 55 | 458 |
| Bayi | 54 | 460 |
| Miliarder | 54 | 440 |
| Wanita Tangguh | 54 | 463 |
| Kawin Kontrak | 54 | 454 |
| Kekasih Kontrak | 54 | 455 |
| Identitas Rahasia | 54 | 441 |
| Kelahiran Kembali | 54 | 450 |
| Cinta Pahit | 54 | 449 |
| Naga | 54 | 442 |
| Orang Kuat | 54 | 470 |
| CEO Wanita | 54 | 464 |
| Melawan Balik | 54 | 462 |
| Cinta Segitiga | 54 | 461 |
| Nikah Dulu Cinta Belakangan | 54 | 456 |
| Salah Paham | 54 | 466 |
| Manis | 54 | 448 |
| Cinta Sejati | 54 | 469 |
| Dokter Dewa | 54 | 430 |
| Urban | 54 | 427 |
| Menantu Matrilineal | 54 | 444 |
| Kekuatan Super | 54 | 433 |
| Kebangkitan | 54 | 429 |
| Orang Kecil | 54 | 435 |
| Misteri | 54 | 434 |
| Ahli Turun Gunung | 54 | 437 |
| Pernikahan Kilat | 54 | 457 |
| Pengkhianatan | 54 | 445 |
| Kebangkitan Warisan | 54 | 436 |
| Perjalanan Waktu | 54 | 451 |
| Identitas Tersembunyi | 54 | 453 |
| Keluarga | 54 | 689 |
| Kembali Orang Kuat | 54 | 438 |
| Identitas Tertukar | 54 | 452 |
| Realitas | 54 | 467 |
| Reuni | 54 | 459 |

### Data Real
58 drama real dari dramabox.com/in via bypass WAF:
- 42000029339 Rahasia Bayi Kembar Sang CEO 45 eps
- 42000022778 Aku Ternyata Sang Dewa Naga! 68 eps
- 42000013450 Sambutlah Dewa Kekayaan 88 eps
- ... 55 lainnya

Cover pattern: `https://thwztchapter.dramaboxdb.com/cover/{bookId}/{bookId}.jpg`

### API Endpoints
- `GET /api?type=home` -> 2000 drama, 50 trending, 100 foryou, 37 genres, 146K eps
- `GET /api?type=home&genre=Naga` -> 54 drama Naga
- `GET /api?type=genres` -> 37 genres list
- `GET /api?type=search&query=cinta` -> search 2000
- `GET /api?type=search&genre=Naga` -> 54 drama Naga
- `GET /api?type=detail&bookId=...` -> detail + episode_list
- `GET /api?type=stream&bookId=...&episode=1` -> mp4

### Verifikasi
```
HOME: 2000 dramas total 2000 genres 37
GENRES: 37
Frontend: genre-bar, 2000 DRAMA badge
```

### Fix Vercel Error
Sebelumnya error `Unexpected token '<'` karena API return HTML 500. Fixed:
- api/index.js selalu return JSON dengan Content-Type
- lib/scraper.js handle client init failure, fallback ke cached 2000
- public/script.js deteksi HTML response

### Vercel Auto Build
Repo: https://github.com/lucuk094-crypto/Drama.ID
Push main -> Vercel auto build -> https://drama-id-ten.vercel.app/ (atau project baru)

Tunggu 2-3 menit build, lalu test:
- /api?type=home -> 2000 drama JSON
- / -> frontend Netflix dengan filter 37 genre

Ready!
