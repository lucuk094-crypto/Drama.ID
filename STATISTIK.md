# Drama.ID - Statistik 500+ Drama

## Total: 500 Drama | 33,609 Episode

Migrasi dari dramabox.com/in dengan 500 drama Indonesia.

### Breakdown
- **Latest**: 500 drama (full library)
- **Trending**: 20 drama top playCount
- **For You**: 100 drama rekomendasi
- **Total Episode**: 33,609 (avg 67.2 eps/drama)
- **Source**: https://www.dramabox.com/in
- **API**: @zhadev/dramabox official + cached fallback

### Sample Data (Top 10 by PlayCount)
| Rank | BookId | Title | Episodes | PlayCount | Tags |
|------|--------|-------|----------|-----------|------|
| 1 | 42000029888 | CEO Dingin Tetangga Di Ujung Malam | 67 | 89.2K | Romansa, CEO |
| 2 | 42000029123 | Cinta Terlarang Sang Mafia | 78 | 88.5K | Mafia, Romansa |
| 3 | 42000029345 | Rahasia Bayi Kembar Sang CEO | 51 | 87.9K | CEO, Kehamilan |

### Cover Pattern
```
https://thwztchapter.dramaboxdb.com/cover/{bookId}/{bookId}.jpg
```

### API Endpoints (Vercel)
- `GET /api?type=home` -> { latest: 500, trending: 20, foryou: 100 }
- `GET /api?type=search&query=cinta` -> search 500 library
- `GET /api?type=detail&bookId=42000028298` -> detail + episode_list
- `GET /api?type=stream&bookId=xxx&episode=1` -> video mp4 URL

### Vercel Auto Build
Repo: https://github.com/lucuk094-crypto/Drama.ID
Push ke main -> Vercel auto deploy

### Kenapa 500+ Bisa?
Official DramaBox API di Vercel (IP fresh) bisa fetch ribuan drama real-time dari dramabox.com/in. 
Cached 500 ini adalah fallback jika WAF block, jadi di Vercel bisa lebih dari 500+ video drama asli!

Untuk 1000+ drama, tinggal jalankan scraper browse page https://www.dramabox.com/in/browse/447 dan simpan ID baru.
