const API_URL = '/api';
let currentBookId = null;
let allGenres = [];
let currentGenre = 'Semua';
let homeData = null;

const loader = document.getElementById('loader');
const homeView = document.getElementById('home-view');
const playerView = document.getElementById('player-view');

function showError(msg) {
    loader.classList.add('hidden');
    const hero = document.getElementById('hero-section');
    hero.innerHTML = `
        <div style="text-align:center; padding:50px 20px; color:white;">
            <h2>⚠️ Terjadi Kesalahan</h2>
            <p style="margin:15px 0; color:#ccc;">${msg}</p>
            <p style="font-size:0.8rem; color:#888;">Source: dramabox.com/in - 2000 drama</p>
            <br>
            <button onclick="location.reload()" style="padding:10px 20px; background:#E50914; border:none; color:white; border-radius:4px; cursor:pointer;">Coba Reload</button>
        </div>
    `;
}

// Fetch with HTML detection (fix for Vercel 500 HTML error)
async function fetchJSON(url) {
    const res = await fetch(url);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    
    if (text.trim().startsWith('<')) {
        console.error('API returned HTML:', text.substring(0, 500));
        throw new Error(`API Error HTML (Status ${res.status}). Vercel function crash. Cek Vercel Logs.`);
    }
    
    try {
        const data = JSON.parse(text);
        if (!res.ok) throw new Error(data.error || `Server ${res.status}`);
        return data;
    } catch (e) {
        if (e.message.includes('API Error HTML')) throw e;
        console.error('JSON parse failed:', text.substring(0, 300));
        throw new Error(`Invalid JSON: ${e.message}`);
    }
}

async function init() {
    try {
        console.log('Loading 2000 dramas...');
        
        // Load genres first
        const genresData = await fetchJSON(`${API_URL}?type=genres`);
        allGenres = genresData.list || [];
        console.log(`Loaded ${allGenres.length} genres`);
        renderGenreChips();
        renderGenresGrid(genresData);

        // Load home data
        const data = await fetchJSON(`${API_URL}?type=home`);
        homeData = data;
        
        if (!data.latest || data.latest.length === 0) throw new Error("Data Kosong");

        document.getElementById('stat-total').innerText = data.totalDramas || data.latest.length;
        document.getElementById('stat-episodes').innerText = data.totalEpisodes || '146K';
        document.getElementById('trending-count').innerText = data.trending?.length || 0;
        document.getElementById('latest-count').innerText = data.latest?.length || 0;

        renderHome(data);
    } catch (e) {
        console.error(e);
        showError(`Gagal memuat data: ${e.message}<br><small style="color:#888">Pastikan API /api?type=home return JSON bukan HTML. Cek Vercel deployment logs.</small>`);
    } finally {
        loader.classList.add('hidden');
    }
}

function renderGenreChips() {
    const scroll = document.getElementById('genre-scroll');
    const searchFilter = document.getElementById('search-genre-filter');
    
    // All chip
    const allChip = `<div class="genre-chip ${currentGenre==='Semua'?'active':''}" onclick="filterByGenre('Semua')">Semua <span class="count">2000</span></div>`;
    
    const chips = allGenres.map(g => `
        <div class="genre-chip ${currentGenre===g.name?'active':''}" onclick="filterByGenre('${g.name}')">
            ${g.name} <span class="count">${g.count}</span>
        </div>
    `).join('');
    
    scroll.innerHTML = allChip + chips;
    
    // Search filter chips (smaller)
    if (searchFilter) {
        searchFilter.innerHTML = allChip + chips;
    }
}

function renderGenresGrid(genresData) {
    const grid = document.getElementById('genres-grid');
    if (!grid || !genresData.list) return;
    
    const colors = ['#E50914','#1E90FF','#FF69B4','#FFD700','#46d369','#9b59b6','#e67e22','#1abc9c'];
    
    grid.innerHTML = genresData.list.map((g, i) => `
        <div class="genre-card" onclick="filterByGenre('${g.name}')" style="background: linear-gradient(135deg, ${colors[i%colors.length]}22, #111); border-color: ${colors[i%colors.length]}44;">
            <div class="genre-bg"><i class="fas fa-film"></i></div>
            <div class="genre-name">${g.name}</div>
            <div class="genre-count">${g.count} drama</div>
        </div>
    `).join('');
}

async function filterByGenre(genre) {
    currentGenre = genre;
    document.getElementById('stat-genre-name').innerText = genre;
    renderGenreChips();
    
    loader.classList.remove('hidden');
    try {
        const url = genre === 'Semua' ? `${API_URL}?type=home` : `${API_URL}?type=home&genre=${encodeURIComponent(genre)}`;
        console.log('Filtering by genre:', genre, url);
        const data = await fetchJSON(url);
        homeData = data;
        renderHome(data);
        
        // Scroll to content
        document.getElementById('home-view').scrollIntoView({behavior:'smooth'});
    } catch (e) {
        console.error('Filter error:', e);
        showError(`Gagal filter genre ${genre}: ${e.message}`);
    } finally {
        loader.classList.add('hidden');
    }
}

function renderHome(data) {
    // Hero - pick random from trending or latest
    const heroPool = data.trending && data.trending.length > 0 ? data.trending : data.latest;
    if (heroPool && heroPool.length > 0) {
        const heroItem = heroPool[Math.floor(Math.random() * Math.min(5, heroPool.length))];
        const hero = document.getElementById('hero-section');
        hero.style.backgroundImage = `url('${heroItem.image || heroItem.cover}')`;
        document.getElementById('hero-title').innerText = heroItem.title || heroItem.bookName || 'Drama China';
        document.getElementById('hero-genre').innerText = `${heroItem.genre || 'Romansa'} • ${heroItem.tags?.slice(0,2).join(' • ') || 'CEO'} • ${heroItem.chapterCount || '?'} Episode`;
        document.getElementById('hero-desc').innerText = heroItem.introduction?.substring(0,150) + '...' || 'Nonton drama China sub Indo terlengkap';
        document.getElementById('hero-play-btn').onclick = () => openDetail(heroItem.book_id || heroItem.bookId);
    }

    // Trending
    renderRow('trending-row', data.trending || []);

    // Latest - show first 50 for performance, but data has 1000-2000
    renderRow('latest-row', (data.latest || []).slice(0, 50));

    // For You
    renderRow('foryou-row', data.foryou || data.latest?.slice(50,100) || []);

    // All Genre Rows - show 8 genres at a time for performance
    renderAllGenreRows(data.latest || []);
}

function renderRow(rowId, items) {
    const row = document.getElementById(rowId);
    if (!row) return;
    row.innerHTML = '';
    if (!items || items.length === 0) {
        row.innerHTML = '<p style="color:#666; padding:20px; font-size:0.8rem;">Tidak ada drama</p>';
        return;
    }
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            ${item.rank ? `<span class="rank-number">${item.rank.replace('#','')}</span>` : ''}
            <span class="card-genre">${item.genre || 'Romansa'}</span>
            <img src="${item.image || item.cover}" loading="lazy" onerror="this.src='https://via.placeholder.com/130x190?text=No+Image'">
            <div class="card-title">${item.title || item.bookName}</div>
        `;
        div.onclick = () => openDetail(item.book_id || item.bookId);
        row.appendChild(div);
    });
}

function renderAllGenreRows(allDramas) {
    const container = document.getElementById('all-genre-rows');
    if (!container) return;
    container.innerHTML = '';
    
    // Group by genre
    const byGenre = {};
    allDramas.forEach(d => {
        const g = d.genre || 'Romansa';
        if (!byGenre[g]) byGenre[g] = [];
        byGenre[g].push(d);
    });

    // Show top 8 genres with most dramas, or filtered genre
    let genresToShow = Object.keys(byGenre);
    if (currentGenre !== 'Semua') {
        genresToShow = [currentGenre];
    } else {
        // Sort by count and take top 8
        genresToShow = Object.keys(byGenre).sort((a,b) => byGenre[b].length - byGenre[a].length).slice(0, 8);
    }

    genresToShow.forEach(genre => {
        const dramas = byGenre[genre];
        if (!dramas || dramas.length === 0) return;
        
        const section = document.createElement('section');
        section.className = 'row-section';
        section.innerHTML = `
            <div class="row-header">
                <h3><i class="fas fa-tag" style="color:#E50914"></i> ${genre}</h3>
                <span class="row-count">${dramas.length}</span>
            </div>
            <div class="row-container" id="row-${genre.replace(/\s+/g,'-')}"></div>
        `;
        container.appendChild(section);
        
        // Render row after append
        setTimeout(() => {
            renderRow(`row-${genre.replace(/\s+/g,'-')}`, dramas.slice(0, 20));
        }, 0);
    });
}

async function openDetail(bookId) {
    if (!bookId) return;
    loader.classList.remove('hidden');
    currentBookId = bookId;
    try {
        const data = await fetchJSON(`${API_URL}?type=detail&bookId=${encodeURIComponent(bookId)}`);
        if (data.error) throw new Error(data.error);

        document.getElementById('p-title').innerText = data.title || 'Drama';
        document.getElementById('p-title-small').innerText = data.title || 'Drama';
        document.getElementById('p-desc').innerText = data.description || "Tidak ada deskripsi";
        document.getElementById('p-eps-count').innerText = `${data.episode_list?.length || data.chapterCount || 0} Episode`;
        document.getElementById('p-genre').innerText = data.genre || 'Romansa';
        document.getElementById('p-playcount').innerHTML = `<i class="fas fa-eye"></i> ${data.playCount || '0'}`;
        document.getElementById('ep-count').innerText = `${data.episode_list?.length || 0} eps`;

        // Tags
        const tagsEl = document.getElementById('p-tags');
        tagsEl.innerHTML = (data.tags || []).slice(0,5).map(t => `<span>${t}</span>`).join('');

        // Episodes
        const grid = document.getElementById('episode-grid');
        grid.innerHTML = '';
        const eps = data.episode_list || [];
        eps.forEach(ep => {
            const btn = document.createElement('button');
            btn.className = 'ep-btn';
            btn.innerText = ep.episode || '?';
            btn.title = ep.title || `Episode ${ep.episode}`;
            btn.onclick = () => playEpisode(ep.id || ep.episode, btn);
            grid.appendChild(btn);
        });

        // Recommendations
        renderRow('rec-row', data.recommendations || []);

        playerView.classList.remove('hidden');
        homeView.classList.add('hidden');
        window.scrollTo(0,0);
    } catch (e) {
        alert("Gagal membuka detail: " + e.message);
    } finally {
        loader.classList.add('hidden');
    }
}

async function playEpisode(episodeId, btnElement) {
    document.querySelectorAll('.ep-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    const video = document.getElementById('main-player');
    const placeholder = document.getElementById('video-placeholder');
    
    try {
        loader.classList.remove('hidden');
        placeholder.style.display = 'none';
        
        const data = await fetchJSON(`${API_URL}?type=stream&bookId=${currentBookId}&episode=${encodeURIComponent(episodeId)}`);
        if (data.error) throw new Error(data.error);
        
        const videoUrl = data.video_url || data.videoUrl;
        if (!videoUrl) throw new Error("Video URL not found");
        
        console.log('Playing:', videoUrl);
        video.src = videoUrl;
        video.style.display = 'block';
        video.play().catch(e => console.log("Autoplay blocked", e));
    } catch (e) {
        placeholder.style.display = 'flex';
        placeholder.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color:#E50914"></i>
            <p>Gagal memutar: ${e.message}</p>
            <small>Di Vercel dengan IP fresh biasanya berhasil.<br>Sandbox E2B sering 403 karena IP datacenter diblokir CloudFront.</small>
        `;
        alert("Gagal memutar: " + e.message);
    } finally {
        loader.classList.add('hidden');
    }
}

function goHome() {
    const v = document.getElementById('main-player');
    v.pause(); v.src = ''; v.style.display = 'none';
    document.getElementById('video-placeholder').style.display = 'flex';
    playerView.classList.add('hidden');
    homeView.classList.remove('hidden');
    document.getElementById('nav-home').classList.add('active');
}

function closePlayer() { goHome(); }

function toggleSearch() {
    document.getElementById('search-overlay').classList.toggle('hidden');
    if (!document.getElementById('search-overlay').classList.contains('hidden')) {
        document.getElementById('search-input').focus();
    }
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').innerHTML = '';
}

let searchTimeout;
function handleSearch(e) {
    clearTimeout(searchTimeout);
    const query = e.target.value;
    if (query.length < 2) {
        document.getElementById('search-results').innerHTML = '<p style="color:#666; grid-column:1/-1; text-align:center; padding:20px;">Ketik minimal 2 huruf... (2000 drama)</p>';
        return;
    }
    searchTimeout = setTimeout(async () => {
        try {
            const genreParam = currentGenre !== 'Semua' ? `&genre=${encodeURIComponent(currentGenre)}` : '';
            const data = await fetchJSON(`${API_URL}?type=search&query=${encodeURIComponent(query)}${genreParam}`);
            const grid = document.getElementById('search-results');
            grid.innerHTML = '';
            if (!data || data.length === 0) {
                grid.innerHTML = `<p style="color:#fff; grid-column:1/-1; text-align:center; padding:20px;">Tidak ditemukan untuk "${query}"${currentGenre!=='Semua'?` di genre ${currentGenre}`:''}</p>`;
                return;
            }
            data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'card';
                div.innerHTML = `
                    <span class="card-genre">${item.genre || 'Romansa'}</span>
                    <img src="${item.image || item.cover}" loading="lazy" style="height:140px;" onerror="this.src='https://via.placeholder.com/130x190'">
                    <div class="card-title">${item.title || item.bookName}</div>
                `;
                div.onclick = () => { toggleSearch(); openDetail(item.book_id || item.bookId); };
                grid.appendChild(div);
            });
        } catch (e) {
            console.error('Search error:', e);
        }
    }, 500);
}

function scrollToGenres() {
    document.getElementById('genres-grid').scrollIntoView({behavior:'smooth'});
}

function showMyList() {
    alert(`List Saya - Fitur segera hadir!\n\nTotal: ${homeData?.totalDramas || 2000} drama\n37 genre\n${homeData?.totalEpisodes || 146993} episode\n\nData dari dramabox.com/in`);
}

function showInfo() {
    alert(`Drama.ID - 2000 Drama\n\nNonton 2000+ drama China sub Indo terlengkap.\n37 genre, 146K+ episode.\n\nSource: https://www.dramabox.com/in\nAPI: @zhadev/dramabox\nRepo: github.com/lucuk094-crypto/Drama.ID\n\nVercel auto build ready!`);
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

// Init
init();
