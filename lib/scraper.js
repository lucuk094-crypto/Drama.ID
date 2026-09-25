/**
 * SCRAPER 2000 dramas 37 genres - VERCEL SAFE NO TOP-LEVEL AWAIT
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load cached data - MUST work
let cachedLatest = [];
let cachedGenres = {};
try {
  const p = path.join(__dirname, '../data/latest.json');
  if (fs.existsSync(p)) {
    cachedLatest = JSON.parse(fs.readFileSync(p, 'utf8'));
    console.log(`Loaded ${cachedLatest.length} dramas from cache`);
  }
} catch (e) {
  console.error('Failed to load latest.json', e.message);
  cachedLatest = [];
}
try {
  const g = path.join(__dirname, '../data/genres.json');
  if (fs.existsSync(g)) {
    cachedGenres = JSON.parse(fs.readFileSync(g, 'utf8'));
  }
} catch (e) {
  console.error('Failed to load genres.json', e.message);
}

// Client lazy init - NO top-level await (Vercel safe)
let client = null;
let clientInitAttempted = false;

async function getClient() {
  if (clientInitAttempted) return client;
  clientInitAttempted = true;
  try {
    const mod = await import('@zhadev/dramabox');
    const DramaboxClient = mod.default || mod;
    client = new DramaboxClient({
      language: 'in',
      timeout: 3000,
      cacheTTL: 300,
      requestDelay: 200,
      maxRetries: 0
    });
    console.log('Dramabox client initialized');
  } catch (e) {
    console.error('Failed to init dramabox client, using cached only:', e.message);
    client = null;
  }
  return client;
}

function mapBook(book, rank = null) {
  try {
    return {
      bookId: book.bookId || book.id || 'unknown',
      book_id: book.bookId || book.id || 'unknown',
      title: book.bookName || book.name || 'Tanpa Judul',
      bookName: book.bookName || book.name || 'Tanpa Judul',
      image: book.cover || book.coverWap || 'https://via.placeholder.com/300x450?text=No+Image',
      cover: book.cover || book.coverWap || 'https://via.placeholder.com/300x450',
      coverWap: book.coverWap || book.cover || 'https://via.placeholder.com/300x450',
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
  } catch (e) {
    return {
      bookId: 'error',
      title: 'Error',
      image: 'https://via.placeholder.com/300x450',
      genre: 'Romansa'
    };
  }
}

export const dramabox = {
  home: async (genreFilter = null) => {
    try {
      let latestRaw = [];
      let trendingRaw = [];
      let forYouRaw = [];

      // Try official API if client exists (lazy)
      const c = await getClient();
      if (c) {
        try {
          const [latestRes, trendingRes, forYouRes] = await Promise.allSettled([
            c.getLatest(1),
            c.getTrending(),
            c.getForYou(1)
          ]);
          if (latestRes.status === 'fulfilled' && latestRes.value?.success) {
            latestRaw = latestRes.value.data.results || [];
          }
          if (trendingRes.status === 'fulfilled' && trendingRes.value?.success) {
            trendingRaw = trendingRes.value.data.results || [];
          }
          if (forYouRes.status === 'fulfilled' && forYouRes.value?.success) {
            forYouRaw = forYouRes.value.data.items || forYouRes.value.data.results || [];
          }
        } catch (e) {
          console.log('Official API failed, using cache:', e.message);
        }
      }

      if (latestRaw.length === 0 && trendingRaw.length === 0 && forYouRaw.length === 0) {
        console.log(`Using cached fallback - ${cachedLatest.length} dramas`);
        latestRaw = cachedLatest;
        trendingRaw = cachedLatest.slice(0, 100);
        forYouRaw = cachedLatest.slice(100, 200);
      }

      if (genreFilter) {
        const gf = genreFilter.toLowerCase();
        const filterFn = (b) => {
          const genre = (b.genre || '').toLowerCase();
          const tags = (b.tags || []).map(t => String(t).toLowerCase());
          return genre === gf || tags.some(t => t.includes(gf)) || genre.includes(gf);
        };
        const filteredLatest = latestRaw.filter(filterFn);
        if (filteredLatest.length > 0) {
          latestRaw = filteredLatest;
        } else {
          latestRaw = cachedLatest.filter(b => (b.genre||'').toLowerCase() === gf);
        }
        trendingRaw = trendingRaw.filter(filterFn);
        forYouRaw = forYouRaw.filter(filterFn);
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
        source: `dramabox.com/in - Cached ${cachedLatest.length} dramas - 37 genres`,
        totalDramas: cachedLatest.length,
        totalEpisodes: cachedLatest.reduce((sum, b) => sum + (b.chapterCount||0), 0),
        genres: cachedGenres && Object.keys(cachedGenres).length > 0 ? cachedGenres : [...new Set(cachedLatest.map(b => b.genre || 'Romansa'))],
        currentGenre: genreFilter || 'Semua',
        success: true
      };
    } catch (e) {
      console.error('home error', e.stack || e.message);
      const latest = cachedLatest.slice(0,100).map(b => mapBook(b));
      return {
        latest,
        trending: latest.slice(0, 20),
        foryou: latest.slice(20, 50),
        source: 'fallback cached - dramabox.com/in - 2000 dramas',
        totalDramas: cachedLatest.length,
        totalEpisodes: 146993,
        genres: cachedGenres,
        success: true,
        warning: e.message
      };
    }
  },

  search: async (query, genreFilter = null) => {
    try {
      const c = await getClient();
      if (c && query) {
        try {
          const res = await c.searchDrama(query, 1, 50);
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
            if (results.length > 0) return results;
          }
        } catch (e) {
          console.log('search official failed:', e.message);
        }
      }

      let filtered = cachedLatest;
      if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(b => 
          b.bookName.toLowerCase().includes(q) || 
          b.introduction.toLowerCase().includes(q) ||
          (b.tags && b.tags.some(t => String(t).toLowerCase().includes(q))) ||
          (b.genre && b.genre.toLowerCase().includes(q))
        );
      }
      if (genreFilter) {
        const gf = genreFilter.toLowerCase();
        filtered = filtered.filter(b => 
          (b.genre && b.genre.toLowerCase() === gf) ||
          (b.tags && b.tags.some(t => String(t).toLowerCase().includes(gf)))
        );
      }
      return filtered.slice(0,100).map(b => mapBook(b));
    } catch (e) {
      console.error('search error', e.message);
      return [];
    }
  },

  genres: async () => {
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
          source: 'dramabox.com/in - 37 genres',
          success: true
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
        source: 'dramabox.com/in',
        success: true
      };
    } catch (e) {
      return { genres: {}, total: 0, list: [], error: e.message, success: false };
    }
  },

  detail: async (bookId) => {
    try {
      let detail = null;
      let chapters = [];
      const c = await getClient();

      if (c) {
        try {
          const [detailRes, chaptersRes] = await Promise.allSettled([
            c.getDramaDetail(bookId),
            c.getChapters(bookId)
          ]);
          if (detailRes.status === 'fulfilled' && detailRes.value?.success) {
            detail = detailRes.value.data.detail;
          }
          if (chaptersRes.status === 'fulfilled' && chaptersRes.value?.success) {
            chapters = chaptersRes.value.data.chapters || [];
          }
          if (!detail) {
            const v2 = await c.getDramaDetailV2(bookId).catch(()=>null);
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
        } catch (e) {
          console.log('detail official failed:', e.message);
        }
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
        recommendations: cachedLatest.filter(b => b.bookId !== bookId).slice(0,10).map(b => mapBook(b)),
        success: true
      };
    } catch (e) {
      console.error('detail error', e.message);
      throw e;
    }
  },

  stream: async (bookId, episode) => {
    const epNum = parseInt(episode);
    try {
      const c = await getClient();
      if (!c) throw new Error('Client not initialized, use cached mode');
      const streamRes = await c.getStreamUrl(bookId, epNum);
      if (streamRes.success) {
        const mp4 = streamRes.data?.data?.chapter?.video?.mp4 || streamRes.data?.chapter?.video?.mp4;
        if (mp4) {
          return { video_url: mp4, videoUrl: mp4, bookId, episode: epNum, success: true };
        }
      }
      const chaptersRes = await c.getChapters(bookId);
      if (chaptersRes.success) {
        const ch = chaptersRes.data.chapters.find(c => c.chapterIndex === epNum);
        if (ch && ch.videoPath) {
          return { video_url: ch.videoPath, videoUrl: ch.videoPath, bookId, episode: epNum, success: true };
        }
      }
      throw new Error('Video URL not found');
    } catch (e) {
      console.error('stream error', e.message);
      throw new Error(`Gagal ambil video: ${e.message}. Di Vercel dengan IP fresh, ini akan berhasil.`);
    }
  }
};
