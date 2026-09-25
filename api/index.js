import { dramabox } from '../lib/scraper.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { type, query, bookId, episode } = req.query;

  try {
    let result;
    switch (type) {
      case 'home':
        result = await dramabox.home();
        break;
      case 'search':
        result = await dramabox.search(query);
        break;
      case 'detail':
        result = await dramabox.detail(bookId);
        break;
      case 'stream':
        result = await dramabox.stream(bookId, episode);
        break;
      default:
        return res.status(400).json({ error: 'Invalid type. Use home, search, detail, stream', source: 'dramabox.com/in' });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: error.message, source: 'dramabox.com/in - https://www.dramabox.com/in' });
  }
}

// Untuk testing lokal: node api/index.js
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  console.log('Testing local API with dramabox.com/in data...');
  const mockReq = { method: 'GET', query: { type: 'home' } };
  const mockRes = {
    setHeader: () => {},
    status: (code) => ({
      json: (data) => {
        console.log(`Status ${code}:`, JSON.stringify(data, null, 2).substring(0, 2000));
        return { end: () => {} };
      },
      end: () => {}
    })
  };
  // Uncomment untuk test
  // handler(mockReq, mockRes);
}
