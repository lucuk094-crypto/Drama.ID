import { dramabox } from '../lib/scraper.js';

export default async function handler(req, res) {
  // Always set CORS and JSON headers FIRST
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).json({ success: true });
    return;
  }

  const { type, query, bookId, episode, genre } = req.query || {};

  try {
    let result;
    switch (type) {
      case 'home':
        result = await dramabox.home(genre);
        break;
      case 'search':
        result = await dramabox.search(query, genre);
        break;
      case 'detail':
        if (!bookId) throw new Error('bookId required');
        result = await dramabox.detail(bookId);
        break;
      case 'stream':
        if (!bookId || !episode) throw new Error('bookId and episode required');
        result = await dramabox.stream(bookId, episode);
        break;
      case 'genres':
        result = await dramabox.genres();
        break;
      default:
        // Default to home if no type
        if (!type) {
          result = await dramabox.home(genre);
        } else {
          return res.status(400).json({ 
            success: false,
            error: 'Invalid type. Use home, search, detail, stream, genres', 
            source: 'dramabox.com/in',
            receivedType: type
          });
        }
    }
    
    // Ensure result is always JSON serializable
    res.status(200).json(result);
    
  } catch (error) {
    console.error('API Error:', error.stack || error.message);
    // ALWAYS return JSON, never HTML
    res.status(500).json({ 
      success: false,
      error: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      source: 'dramabox.com/in - https://www.dramabox.com/in',
      type: type || 'unknown'
    });
  }
}
