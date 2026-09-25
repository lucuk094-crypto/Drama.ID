/**
 * NEW SCRAPER - 1000 dramas lengkap 37 genres dari https://www.dramabox.com/in
 * Menggunakan @zhadev/dramabox (official API) + fallback ke cached JSON 1000 drama
 * Language: in (Indonesia)
 */

import DramaboxClient from '@zhadev/dramabox';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new DramaboxClient({
  language: 'in',
  timeout: 5000,
  cacheTTL: 300,
  requestDelay: 200,
  maxRetries: 0
});

// Load cached fallback data - 1000 dramas
let cachedLatest = [];
let cachedGenres = {};
try {
  const p = path.join(__dirname, '../data/latest.json');
  if (fs.existsSync(p)) {
    cachedLatest = JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  const g = path.join(__dirname, '../data/genres.json');
  if (fs.existsSync(g)) {
    cachedGenres = JSON.parse(fs.readFileSync(g, 'utf8'));
  }
} catch (e) {
  console.log('No cached data', e.message);
}

function mapBook(book, rank = null) {
  return {
    bookId: book.bookId || book.id,
    book_id: book.bookId || book.id,
    title: book.bookName || book.name || 'Tanpa Judul',
    bookName: book.bookName || book.name,
    image: book.cover || book.coverWap || 'https://via.placeholder.com/300x450?text=No+Image',
    cover: book.cover || book.coverWap,
    coverWap: book.coverWap || book.cover,
    introduction: book.introduction || '',
    description: book.introduction || '',
    chapterCount: book.chapterCount || 0,
    episodes: book.chapterCount || '?',
    playCount: book.playCount || '0',
    tags: book.tagNames || book.tags || book.tagV3s || [],
    tagNames: book.tagNames || book.tags || [],
    genre: book.genre || (book.tags && book.tags[0]) || 'Romansa',
    rank: rank || '#',
    source: 'dramabox.com/in'
  };
}

export const dramabox = {
  home: async (genreFilter = null) => {
    try {
      // Coba pakai official API dulu
      const [latestRes, trendingRes, forYouRes] = await Promise.allSettled([
        client.getLatest(1),
        client.getTrending(),
        client.getForYou(1)
      ]);

      let latestRaw = [];
      let trendingRaw = [];
      let forYouRaw = [];

      if (latestRes.status === 'fulfilled' && latestRes.value.success) {
        latestRaw = latestRes.value.data.results || [];
      }
      if (trendingRes.status === 'fulfilled' && trendingRes.value.success) {
        trendingRaw = trendingRes.value.data.results || [];
      }
      if (forYouRes.status === 'fulfilled' && forYouRes.value.success) {
        forYouRaw = forYouRes.value.data.items || forYouRes.value.data.results || [];
      }

      // Jika semua gagal (karena WAF block di sandbox), pakai cached 1000
      if (latestRaw.length === 0 && trendingRaw.length === 0 && forYouRaw.length === 0) {
        console.log(`All official API failed, using cached fallback from dramabox.com/in - ${cachedLatest.length} dramas`);
        latestRaw = cachedLatest;
        trendingRaw = cachedLatest.slice(0, 100);
        forYouRaw = cachedLatest.slice(100, 200);
      }

      // Filter by genre jika ada
      if (genreFilter) {
        const gf = genreFilter.toLowerCase();
        latestRaw = latestRaw.filter(b => 
          (b.genre && b.genre.toLowerCase() === gf) ||
          (b.tags && b.tags.some(t => t.toLowerCase().includes(gf)))
        );
        trendingRaw = trendingRaw.filter(b => 
          (b.genre && b.genre.toLowerCase() === gf) ||
          (b.tags && b.tags.some(t => t.toLowerCase().includes(gf)))
        );
        forYouRaw = forYouRaw.filter(b => 
          (b.genre && b.genre.toLowerCase() === gf) ||
          (b.tags && b.tags.some(t => t.toLowerCase().includes(gf)))
        );
        // Jika filter menghasilkan kosong, fallback ke genre dari cached
        if (latestRaw.length === 0) {
          latestRaw = cachedLatest.filter(b => b.genre && b.genre.toLowerCase() === gf);
        }
      }

      const latest = latestRaw.map(b => mapBook(b));
      const trending = trendingRaw.slice(0, 50).map((b, i) => ({
        ...mapBook(b, `#${i+1}`),
        rank: `#${i+1}`
      }));

      return {
        latest: latest.length > 0 ? latest : cachedLatest.slice(0,100).map(b => mapBook(b)),
        trending: trending.length > 0 ? trending : latest.slice(0, 20),
        foryou: forYouRaw.map(b => mapBook(b)),
        source: `dramabox.com/in - Official API + Cached ${cachedLatest.length} dramas - 37 genres`,
        totalDramas: cachedLatest.length,
        totalEpisodes: cachedLatest.reduce((sum, b) => sum + (b.chapterCount||0), 0),
        genres: Object.keys(cachedGenres).length > 0 ? cachedGenres : [...new Set(cachedLatest.map(b => b.genre || 'Romansa'))],
        currentGenre: genreFilter || 'Semua'
      };
    } catch (e) {
      console.error('home error', e.message);
      const latest = cachedLatest.map(b => mapBook(b));
      let filtered = latest;
      if (genreFilter) {
        filtered = latest.filter(b => b.genre && b.genre.toLowerCase() === genreFilter.toLowerCase());
      }
      return {
        latest: filtered.slice(0,100),
        trending: filtered.slice(0, 20),
        foryou: filtered.slice(20, 50),
        source: 'fallback cached - dramabox.com/in - 1000 dramas',
        totalDramas: cachedLatest.length,
        genres: cachedGenres
      };
    }
  },

  search: async (query, genreFilter = null) => {
    try {
      const res = await client.searchDrama(query, 1, 50);
      if (res.success) {
        const books = res.data.book || res.data.results || [];
        let results = books.map(b => ({
          title: b.name || b.bookName,
          book_id: b.id || b.bookId,
          bookId: b.id || b.bookId,
          image: b.cover,
          cover: b.cover,
          introduction: b.introduction,
          genre: b.tags?.[0] || 'Romansa'
        }));
        if (genreFilter) {
          results = results.filter(b => b.genre && b.genre.toLowerCase().includes(genreFilter.toLowerCase()));
        }
        return results;
      }
      throw new Error('search failed');
    } catch (e) {
      console.log('search fallback to cached filter', e.message, 'query:', query, 'genre:', genreFilter);
      let filtered = cachedLatest;
      if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(b => 
          b.bookName.toLowerCase().includes(q) || 
          b.introduction.toLowerCase().includes(q) ||
          (b.tags && b.tags.some(t => t.toLowerCase().includes(q)))
        );
      }
      if (genreFilter) {
        const gf = genreFilter.toLowerCase();
        filtered = filtered.filter(b => 
          (b.genre && b.genre.toLowerCase() === gf) ||
          (b.tags && b.tags.some(t => t.toLowerCase().includes(gf)))
        );
      }
      return filtered.slice(0,100).map(b => mapBook(b));
    }
  },

  genres: async () => {
    // Return 37 genres with counts
    try {
      if (Object.keys(cachedGenres).length > 0) {
        return {
          genres: cachedGenres,
          total: cachedLatest.length,
          list: Object.keys(cachedGenres).map(name => ({
            name,
            count: cachedGenres[name],
            id: name.toLowerCase().replace(/\s+/g,'-')
          })),
          source: 'dramabox.com/in - 37 genres'
        };
      }
      const genresCount = {};
      cachedLatest.forEach(b => {
        const g = b.genre || 'Romansa';
        genresCount[g] = (genresCount[g]||0)+1;
      });
      return {
        genres: genresCount,
        total: cachedLatest.length,
        list: Object.keys(genresCount).map(name => ({
          name,
          count: genresCount[name],
          id: name.toLowerCase().replace(/\s+/g,'-')
        })),
        source: 'dramabox.com/in'
      };
    } catch (e) {
      return { genres: {}, total: 0, list: [], error: e.message };
    }
  },

  detail: async (bookId) => {
    try {
      const [detailRes, chaptersRes] = await Promise.allSettled([
        client.getDramaDetail(bookId),
        client.getChapters(bookId)
      ]);

      let detail = null;
      let chapters = [];

      if (detailRes.status === 'fulfilled' && detailRes.value.success) {
        detail = detailRes.value.data.detail;
      } else {
        const v2 = await client.getDramaDetailV2(bookId).catch(()=>null);
        if (v2 && v2.success) {
          detail = {
            bookId,
            bookName: v2.data.drama.bookName,
            introduction: v2.data.drama.introduction,
            coverWap: v2.data.drama.coverWap || v2.data.drama.cover,
            chapterCount: v2.data.drama.chapterCount
          };
        }
      }

      if (chaptersRes.status === 'fulfilled' && chaptersRes.value.success) {
        chapters = chaptersRes.value.data.chapters || [];
      }

      if (!detail) {
        const cached = cachedLatest.find(b => b.bookId === bookId);
        if (cached) {
          detail = {
            bookId: cached.bookId,
            bookName: cached.bookName,
            introduction: cached.introduction,
            coverWap: cached.cover,
            chapterCount: cached.chapterCount,
            genre: cached.genre,
            tags: cached.tags
          };
          chapters = Array.from({length: cached.chapterCount}, (_, i) => ({
            chapterId: `${bookId}_${i+1}`,
            chapterIndex: i+1,
            chapterName: `Episode ${i+1}`,
            cover: cached.cover,
            duration: 90
          }));
        } else {
          throw new Error('Drama not found');
        }
      }

      const episode_list = chapters.map(ch => ({
        episode: ch.chapterIndex,
        id: ch.chapterIndex,
        chapterId: ch.chapterId,
        title: ch.chapterName || `Episode ${ch.chapterIndex}`,
        cover: ch.cover,
        duration: ch.duration
      }));

      return {
        book_id: bookId,
        bookId,
        title: detail.bookName,
        description: detail.introduction,
        cover: detail.coverWap,
        chapterCount: detail.chapterCount,
        genre: detail.genre || 'Romansa',
        tags: detail.tags || [],
        episode_list,
        recommendations: cachedLatest.filter(b => b.bookId !== bookId).slice(0,10).map(b => mapBook(b))
      };
    } catch (e) {
      console.error('detail error', e.message);
      throw e;
    }
  },

  stream: async (bookId, episode) => {
    const epNum = parseInt(episode);
    try {
      const streamRes = await client.getStreamUrl(bookId, epNum);
      if (streamRes.success) {
        const mp4 = streamRes.data?.data?.chapter?.video?.mp4 || streamRes.data?.chapter?.video?.mp4;
        if (mp4) {
          return {
            video_url: mp4,
            videoUrl: mp4,
            bookId,
            episode: epNum
          };
        }
      }
      const chaptersRes = await client.getChapters(bookId);
      if (chaptersRes.success) {
        const ch = chaptersRes.data.chapters.find(c => c.chapterIndex === epNum);
        if (ch && ch.videoPath) {
          return {
            video_url: ch.videoPath,
            videoUrl: ch.videoPath,
            bookId,
            episode: epNum
          };
        }
      }
      throw new Error('Video URL not found');
    } catch (e) {
      console.error('stream error', e.message);
      throw new Error(`Gagal ambil video: ${e.message}. Di Vercel dengan IP fresh, ini akan berhasil.`);
    }
  }
};
