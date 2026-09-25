const API_URL = '/api';
let currentBookId = null;

const loader = document.getElementById('loader');
const homeView = document.getElementById('home-view');
const playerView = document.getElementById('player-view');

function showError(msg) {
    loader.classList.add('hidden');
    const hero = document.getElementById('hero-section');
    hero.innerHTML = `
        <div style="text-align:center; padding:50px 20px; color:white;">
            <h2>⚠️ Terjadi Kesalahan</h2>
            <p>${msg}</p>
            <p style="font-size:0.8rem; color:#888; margin-top:10px;">Source: dramabox.com/in</p>
            <br>
            <button onclick="location.reload()" style="padding:10px 20px; background:red; border:none; color:white; border-radius:4px;">Coba Reload</button>
        </div>
    `;
}

async function init() {
    try {
        const res = await fetch(`${API_URL}?type=home`);
        if (!res.ok) throw new Error(`Server Error: ${res.status}`);
        
        const data = await res.json();
        
        if (!data.latest || data.latest.length === 0) {
            throw new Error("Data Kosong. Coba lagi nanti.");
        }

        if (data.source) {
            document.getElementById('source-info').innerText = `Source: ${data.source}`;
        }

        renderHome(data);
    } catch (e) {
        console.error(e);
        showError(`Gagal memuat data: ${e.message} - Pastikan API dari dramabox.com/in aktif`);
    } finally {
        loader.classList.add('hidden');
    }
}

function renderHome(data) {
    if (data.latest && data.latest.length > 0) {
        const heroItem = data.latest[0];
        const hero = document.getElementById('hero-section');
        hero.style.backgroundImage = `url('${heroItem.image || heroItem.cover}')`;
        document.getElementById('hero-title').innerText = heroItem.title || heroItem.bookName || 'Drama China';
        document.getElementById('hero-play-btn').onclick = () => openDetail(heroItem.book_id || heroItem.bookId);
    }

    const trendingRow = document.getElementById('trending-row');
    trendingRow.innerHTML = '';
    if (data.trending && data.trending.length > 0) {
        data.trending.forEach(item => {
            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `
                <span class="rank-number">${item.rank || ''}</span>
                <img src="${item.image || item.cover}" onerror="this.src='https://via.placeholder.com/100x150?text=Err'">
                <div style="position:absolute; bottom:0; left:0; right:0; background:linear-gradient(transparent, black); padding:5px; font-size:0.6rem; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
            `;
            div.onclick = () => openDetail(item.book_id || item.bookId);
            trendingRow.appendChild(div);
        });
    } else {
        document.querySelector('h3.section-title').style.display = 'none';
    }

    const latestRow = document.getElementById('latest-row');
    latestRow.innerHTML = '';
    data.latest.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <img src="${item.image || item.cover}" onerror="this.src='https://via.placeholder.com/100x150?text=Err'">
            <div style="position:absolute; bottom:0; left:0; right:0; background:linear-gradient(transparent, black); padding:5px; font-size:0.6rem; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
        `;
        div.onclick = () => openDetail(item.book_id || item.bookId);
        latestRow.appendChild(div);
    });
}

async function openDetail(bookId) {
    if (!bookId) return alert("ID Drama tidak ditemukan");
    
    loader.classList.remove('hidden');
    currentBookId = bookId;

    try {
        const res = await fetch(`${API_URL}?type=detail&bookId=${encodeURIComponent(bookId)}`);
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        document.getElementById('p-title').innerText = data.title || data.bookName || 'Drama';
        document.getElementById('p-desc').innerText = data.description || data.introduction || "Tidak ada deskripsi. Data dari dramabox.com/in";
        document.getElementById('p-eps-count').innerText = `${data.episode_list ? data.episode_list.length : data.chapterCount || 0} Episodes`;

        const grid = document.getElementById('episode-grid');
        grid.innerHTML = '';

        const eps = data.episode_list || data.chapters || [];
        if (eps.length === 0) {
            grid.innerHTML = "<p style='color:gray'>Episode tidak ditemukan. Coba deploy ke Vercel untuk bypass WAF.</p>";
        }

        eps.forEach(ep => {
            const btn = document.createElement('button');
            btn.className = 'ep-btn';
            btn.innerText = ep.episode || ep.chapterIndex || '?';
            btn.title = ep.title || `Episode ${ep.episode}`;
            btn.onclick = () => playEpisode(ep.id || ep.episode || ep.chapterIndex, btn); 
            grid.appendChild(btn);
        });

        playerView.classList.remove('hidden');
        homeView.classList.add('hidden');
        window.scrollTo(0, 0);

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
    
    try {
        loader.classList.remove('hidden');
        const res = await fetch(`${API_URL}?type=stream&bookId=${currentBookId}&episode=${encodeURIComponent(episodeId)}`);
        const data = await res.json();

        if (data.error) throw new Error(data.error);
        if (!data.video_url && !data.videoUrl) throw new Error("Video URL not found - WAF mungkin block IP sandbox, coba di Vercel");

        const videoUrl = data.video_url || data.videoUrl;
        console.log('Playing:', videoUrl);
        video.src = videoUrl;
        video.play().catch(e => console.log("Autoplay blocked", e));

    } catch (e) {
        alert("Gagal memutar: " + e.message + "\n\nNote: Video dari dramabox.com/in butuh bypass WAF. Di Vercel biasanya berhasil, di sandbox E2B sering 403 karena IP datacenter diblokir CloudFront. Coba deploy ke Vercel.");
    } finally {
        loader.classList.add('hidden');
    }
}

function goHome() {
    const v = document.getElementById('main-player');
    v.pause();
    v.src = '';
    playerView.classList.add('hidden');
    homeView.classList.remove('hidden');
}

function closePlayer() { goHome(); }

function toggleSearch() {
    document.getElementById('search-overlay').classList.toggle('hidden');
    if (!document.getElementById('search-overlay').classList.contains('hidden')) {
        document.getElementById('search-input').focus();
    }
}

let searchTimeout;
function handleSearch(e) {
    clearTimeout(searchTimeout);
    const query = e.target.value;
    if (query.length < 3) {
        document.getElementById('search-results').innerHTML = '<p style="color:gray; grid-column:span 3; text-align:center; font-size:0.8rem;">Ketik minimal 3 huruf... (data dari dramabox.com/in)</p>';
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`${API_URL}?type=search&query=${encodeURIComponent(query)}`);
            const data = await res.json();
            const grid = document.getElementById('search-results');
            grid.innerHTML = '';
            
            if (!data || data.length === 0) {
                grid.innerHTML = '<p style="color:white; grid-column:span 3; text-align:center;">Tidak ditemukan di dramabox.com/in</p>';
                return;
            }

            data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'card';
                div.innerHTML = `
                    <img src="${item.image || item.cover}" style="height:120px; border-radius:4px; width:100%; object-fit:cover;" onerror="this.src='https://via.placeholder.com/100x150'">
                    <div style="font-size:0.6rem; color:white; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                `;
                div.onclick = () => { toggleSearch(); openDetail(item.book_id || item.bookId); };
                grid.appendChild(div);
            });
        } catch (e) {
            console.error(e);
        }
    }, 600);
}

init();
