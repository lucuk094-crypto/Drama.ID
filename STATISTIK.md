# Statistik Drama yang Berhasil Diambil dari dramabox.com/in - 100 DRAMA

**Tanggal:** 25 Sep 2026
**Source:** https://www.dramabox.com/in (official Indonesia)
**Metode:** @zhadev/dramabox + fetch_page bypass CloudFront + cached JSON

## Total FINAL

- **Total Drama Lengkap:** 100 drama
- **Total Episode:** 5950 episode
- **Rata-rata:** 59.5 episode per drama
- **Bahasa:** Indonesia (judul, sinopsis, tag Indonesia)
- **Status:** Semua ada cover, deskripsi, dan episode list 1..N
- **API Endpoint:** 
  - `?type=home` -> latest 100, trending 10, foryou 20
  - `?type=search&query=...`
  - `?type=detail&bookId=...` -> episode list lengkap
  - `?type=stream&bookId=...&episode=1` -> video_url (jalan di Vercel)

## Breakdown

- Latest: 100 drama (5950 eps)
- Trending: 10 drama (top playCount)
- ForYou: 20 drama

## Sample 20 Pertama (Real dari dramabox.com/in)

| # | BookId | Judul | Episode | Play Count |
|---|---|---|---|---|
| 1 | 42000028298 | Kembali Sebagai Bosmu | 51 | 321K |
| 2 | 42000027488 | Cinta Membara di Gurun Maut | 50 | 27K |
| 3 | 42000029029 | Gadis Gembala Milik Raja Iblis | 51 | 16K |
| 4 | 42000028287 | Putri Rahasia Sang Alpha | 60 | 16K |
| 5 | 42000028256 | Mobil Rahasia Sang Miliarder | 40 | 10K |
| 6 | 42000028405 | Takhta Di Balik Penyamaran (Sulih Suara) | 41 | 10K |
| 7 | 42000027468 | Kisah Asmara Sang Ksatria | 45 | 7K |
| 8 | 42000027605 | Bangkit Setelah Dikhianati | 42 | 7K |
| 9 | 42000027118 | Cinta Membutuhkan Timbal Balik | 60 | 7K |
| 10 | 42000028396 | Darahku Menetaskan Naga | 61 | 6K |
| 11 | 42000026080 | Racun Cinta Sang Mafia | 56 | 177K |
| 12 | 42000026601 | Takhta Di Balik Penyamaran | 41 | 118K |
| 13 | 42000027287 | Tidur dengan Ayah Sahabatku | 51 | 114K |
| 14 | 42000024940 | Penyesalan Terakhir Sang Pangeran | 51 | 113K |
| 15 | 42000025364 | Hati Yang Dihancurkan | 52 | 113K |
| 16 | 42000022245 | Istri Yang Terlewatkan | 77 | 71K |
| 17 | 41000105764 | Cinta Membara di Dalam Kebohongan | 59 | 141K |
| 18 | 41000110515 | Hatiku Diretas Virus Cintamu | 53 | 98K |
| 19 | 42000022436 | Tolak Aku, Raja Naga | 65 | 67K |
| 20 | 42000021621 | Aku Raja Tersembunyi (Sulih Suara) | 63 | 65K |

+ 80 drama lagi (total 100) dengan judul variasi dari dramabox.com/in seperti:
- Rahasia Bayi Kembar Sang CEO
- Dua Alpha Untukku
- Tawanan Cinta Bos Mafia
- 30 Hari Jadi Istri Mafia
- Ultimatum Sang Raja Mafia
- Serigala Bayangan, Jodohku Manusia Serigala, dll.

Semua cover menggunakan pattern resmi:
- `https://hwztchapter.dramaboxdb.com/data/cppartner/4x2/42x0/420x0/{bookId}/{bookId}.jpg`
- `https://thwztchapter.dramaboxdb.com/data/cppartner/4x1/41x0/410x0/{bookId}/{bookId}.jpg`

## Video

Setiap episode punya thumbnail:
`https://thwztvideo.dramaboxdb.com/.../{episodeId}.mp4.jpg`

Hapus `.jpg` untuk dapat mp4 asli, contoh:
`https://thwztvideo.dramaboxdb.com/49/8x9/89x2/892x8/89282000024/701648694_2/701648694.mp4`

Di Vercel, getStreamUrl() akan return mp4 langsung.

## Next: 1000 Drama?

Kalau mau 1000 drama, scrape browse pages:
- https://www.dramabox.com/in/browse/447 (Romansa)
- https://www.dramabox.com/in/browse/453 (Identitas Tersembunyi)
- https://www.dramabox.com/in/browse/458 (Balas Dendam)
- etc 30+ kategori x 20 drama per page = 600+ drama
