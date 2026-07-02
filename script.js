/* ============================================================
   Enterprise Gallery Pro — script.js
   Vanilla ES6 | No frameworks | Full premium feature suite
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ──────────────────────────────────────────────
       1. DATA LAYER — Image + EXIF virtual generation
    ────────────────────────────────────────────── */
    const CATEGORIES = ['nature', 'animals', 'city', 'technology'];

    const AUTHORS  = ['Alex Rivera', 'Sophie Chen', 'Kai Nakamura', 'Mia Andersson', 'Luca Bianchi', 'Zoe Park'];
    const CAMERAS  = ['Sony A7 IV', 'Canon EOS R5', 'Nikon Z9', 'Fujifilm X-T5', 'Leica Q3', 'Hasselblad X2D'];
    const LOCS     = ['Swiss Alps', 'Tokyo', 'New York', 'Kyoto', 'Patagonia', 'Iceland', 'Sahara', 'Norway'];
    const APERTURES  = ['f/1.4', 'f/1.8', 'f/2.0', 'f/2.8', 'f/4.0', 'f/5.6'];
    const SHUTTERS   = ['1/4000s', '1/2000s', '1/500s', '1/250s', '1/60s', '1/30s'];
    const ISOS       = ['100', '200', '400', '800', '1600', '3200'];
    const RESOLUTIONS = ['3840×2160', '5120×2880', '4096×2160', '6000×4000'];
    const TAGS_MAP = {
        nature:     ['Landscape', '4K', 'RAW'],
        animals:    ['Wildlife', 'HDR', 'Macro'],
        city:       ['Urban', 'Night', 'Street'],
        technology: ['Sci-Fi', '4K', 'Concept'],
    };

    // Unique descriptive titles — shown in card overlay & lightbox instead of "Nature 1"
    const TITLES = {
        nature: [
            'Misty Alpine Valley', 'Golden Hour Fields', 'Emerald Forest Canopy', 'Crystal Lake Reflection',
            'Wildflower Meadow', 'Autumn River Bend', 'Sunlit Waterfall', 'Snow Peak Silence',
            'Tropical Rainforest', 'Desert Dusk Bloom', 'Rocky Coastal Cliffs', 'Bamboo Whispering Grove',
            'Storm Over the Prairie', 'Frozen Tundra Calm', 'Bioluminescent Shore', 'Hidden Cave Pool',
            'Lavender Horizon', 'Mossy Ancient Path', 'Cherry Blossom Rain', 'Volcanic Sunrise',
        ],
        animals: [
            'Golden Bengal Tiger', 'Arctic Wolf Gaze', 'Hummingbird in Flight', 'Elephant Dustbath',
            'Great White Breach', 'Red Fox at Dawn', 'Monarch Butterfly Migration', 'African Lion Portrait',
            'Snowy Owl Perch', 'Dolphin Leaping Light', 'Mountain Gorilla Stare', 'Cheetah Sprint Freeze',
            'Peacock Fan Display', 'Manta Ray Glide', 'Baby Panda Nap', 'Eagle Diving Strike',
            'Flamingo Flock at Dusk', 'Polar Bear on Ice', 'Jaguar River Crossing', 'Orca Pod Surfacing',
        ],
        city: [
            'Tokyo Neon Nights', 'New York Skyline Rain', 'Paris at Blue Hour', 'Dubai Glass Towers',
            'Hong Kong Harbor Lights', 'Venice Canal at Dawn', 'Chicago Loop Rush Hour', 'Singapore Marina Glow',
            'Sydney Opera Dusk', 'Berlin Brutalist Art', 'London Fog Bridge', 'Seoul Street Market',
            'Cairo Midnight Streets', 'Istanbul Mosaic Light', 'San Francisco Mist', 'Mumbai Monsoon Rooftop',
            'Mexico City Murals', 'Amsterdam Canals Gold', 'Buenos Aires Tango Lane', 'Athens Acropolis Sunset',
        ],
        technology: [
            'Neural Chip Closeup', 'Quantum Computer Core', 'Fiber Optic Galaxy', 'Robotic Arm Precision',
            'Circuit Board Macro', 'Drone Swarm Formation', 'Augmented Reality Lab', 'Server Farm Glow',
            'Space Station Panels', 'Liquid Cooling Vortex', 'Hologram Interface', 'EV Battery Cell Array',
            'Satellite in Orbit', 'Smart City Blueprint', 'Bionic Exoskeleton', 'Data Center Corridors',
            '3D Printing Future', 'Nanobot Assembly Art', 'Deep Sea Sensor Pod', 'AI Render Landscape',
        ],
    };

    const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const randDate = () => {
        const d = new Date(2023, Math.floor(Math.random()*12), Math.floor(Math.random()*28)+1);
        return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
    };

    let galleryData = [];
    let idCounter = 1;
    CATEGORIES.forEach(cat => {
        for (let i = 1; i <= 20; i++) {
            galleryData.push({
                id:       String(idCounter),
                category: cat,
                title:    TITLES[cat][i - 1],
                src:      `https://loremflickr.com/800/600/${cat}?lock=${idCounter}`,
                thumb:    `https://loremflickr.com/400/300/${cat}?lock=${idCounter}`,
                author:   rand(AUTHORS),
                camera:   rand(CAMERAS),
                location: rand(LOCS),
                aperture: rand(APERTURES),
                shutter:  rand(SHUTTERS),
                iso:      rand(ISOS),
                res:      rand(RESOLUTIONS),
                date:     randDate(),
                tags:     TAGS_MAP[cat],
                spotlight: (idCounter % 7 === 0), // Every 7th image is a spotlight
            });
            idCounter++;
        }
    });

    /* ──────────────────────────────────────────────
       2. PERSISTENT STATE (localStorage)
    ────────────────────────────────────────────── */
    let favorites  = JSON.parse(localStorage.getItem('gp_favorites'))  || [];
    let ratings    = JSON.parse(localStorage.getItem('gp_ratings'))    || {};
    let viewCounts = JSON.parse(localStorage.getItem('gp_views'))      || {};
    const save = () => {
        localStorage.setItem('gp_favorites', JSON.stringify(favorites));
        localStorage.setItem('gp_ratings',   JSON.stringify(ratings));
        localStorage.setItem('gp_views',     JSON.stringify(viewCounts));
    };

    /* ──────────────────────────────────────────────
       3. RUNTIME STATE
    ────────────────────────────────────────────── */
    let visibleData        = [];
    let currentLightboxIdx = -1;
    let slideshowTimer     = null;
    let isPlaying          = false;
    let compareMode        = false;
    let compareSelection   = [];
    let zoomLevel          = 1;
    let isDragging         = false;
    let touchStartX        = 0;

    /* ──────────────────────────────────────────────
       4. DOM REFERENCES
    ────────────────────────────────────────────── */
    const $ = (s) => document.querySelector(s);
    const loaderEl        = $('#loader-wrapper');
    const galleryEl       = $('#gallery');
    const sentinelEl      = $('#loading-sentinel');
    const searchInput     = $('#search-input');
    const filterBtns      = document.querySelectorAll('.filter-btn');
    const shuffleBtn      = $('#shuffle-btn');
    const compareBtn      = $('#compare-mode-btn');
    const compareDock     = $('#compare-dock');
    const execCompareBtn  = $('#execute-compare');
    const cancelCompare   = $('#cancel-compare');
    const lightboxEl      = $('#lightbox');
    const lbImg           = $('#lightbox-img');
    const lbCounter       = $('#lightbox-counter');
    const lbInfoPanel     = $('#lightbox-info-panel');
    const lbFavBtn        = $('#lb-favorite');
    const lbPlayBtn       = $('#lb-play');
    const lbFullBtn       = $('#lb-fullscreen');
    const lbInfoBtn       = $('#lb-info-toggle');
    const lbCloseBtn      = $('#lb-close');
    const downloadToggle  = $('#lb-download-toggle');
    const downloadMenu    = $('#download-menu');
    const collectionsEl   = $('#collections-slider');
    const navEl           = $('#site-header');
    const darkToggle      = $('#dark-mode-toggle');
    const body            = document.body;

    /* ──────────────────────────────────────────────
       5. LOADER
    ────────────────────────────────────────────── */
    setTimeout(() => {
        loaderEl.style.opacity = '0';
        loaderEl.style.pointerEvents = 'none';
        setTimeout(() => loaderEl.classList.add('hidden'), 600);
        initGallery();
    }, 1200);

    /* ──────────────────────────────────────────────
       6. THEME SYSTEM — Dark / Light + Color Themes
    ────────────────────────────────────────────── */
    // Restore persisted theme
    const savedTheme = localStorage.getItem('gp_theme') || 'dark';
    const savedColor = localStorage.getItem('gp_color') || 'blue';
    body.setAttribute('data-theme', savedTheme);
    body.setAttribute('data-color-theme', savedColor);
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.color === savedColor));

    darkToggle.addEventListener('click', () => {
        const isDark = body.getAttribute('data-theme') === 'dark';
        body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('gp_theme', isDark ? 'light' : 'dark');
    });

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            body.setAttribute('data-color-theme', btn.dataset.color);
            localStorage.setItem('gp_color', btn.dataset.color);
        });
    });

    /* ──────────────────────────────────────────────
       7. STICKY NAVBAR — shrinks on scroll
    ────────────────────────────────────────────── */
    window.addEventListener('scroll', () => {
        if (navEl) navEl.classList.toggle('scrolled', window.scrollY > 60);
    });

    /* ──────────────────────────────────────────────
       7b. HEADER NAV BUTTONS
    ────────────────────────────────────────────── */

    // HOME — scroll to top + reset filter to 'all'
    const navHome = $('#nav-home');
    if (navHome) {
        navHome.addEventListener('click', () => {
            // Set all filter buttons, activate 'all'
            filterBtns.forEach(b => b.classList.toggle('active', b.dataset.category === 'all'));
            searchInput.value = '';
            execFilter();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Active state highlight
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            navHome.classList.add('active');
        });
    }

    // FAVORITES — filter gallery to favorites
    const navFavorites = $('#nav-favorites');
    if (navFavorites) {
        navFavorites.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.toggle('active', b.dataset.category === 'favorites'));
            searchInput.value = '';
            execFilter();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            navFavorites.classList.add('active');
        });
    }

    // LOGIN MODAL
    const loginOverlay  = $('#login-overlay');
    const loginClose    = $('#login-close');
    const navLogin      = $('#nav-login');

    function openLogin() {
        if (loginOverlay) {
            loginOverlay.classList.remove('hidden');
            body.style.overflow = 'hidden';
        }
    }
    function closeLogin() {
        if (loginOverlay) {
            loginOverlay.classList.add('hidden');
            body.style.overflow = '';
        }
    }

    if (navLogin)   navLogin.addEventListener('click', openLogin);
    if (loginClose) loginClose.addEventListener('click', closeLogin);
    if (loginOverlay) {
        loginOverlay.addEventListener('click', e => {
            if (e.target === loginOverlay) closeLogin();
        });
    }

    // LOGIN FORM submit
    const loginForm = $('#login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = $('#login-email')?.value.trim();
            if (!email) return;
            closeLogin();
            // Show brief success toast
            showToast('Logged in successfully! 🎉');
        });
    }

    // PREMIUM MODAL
    const premiumOverlay = $('#premium-overlay');
    const premiumClose   = $('#premium-close');
    const navPremium     = $('#nav-premium');
    const maybeLater     = $('#maybe-later');
    const upgradeBtn     = $('#upgrade-btn');

    function openPremium() {
        if (premiumOverlay) {
            premiumOverlay.classList.remove('hidden');
            body.style.overflow = 'hidden';
        }
    }
    function closePremium() {
        if (premiumOverlay) {
            premiumOverlay.classList.add('hidden');
            body.style.overflow = '';
        }
    }

    if (navPremium)     navPremium.addEventListener('click', openPremium);
    if (premiumClose)   premiumClose.addEventListener('click', closePremium);
    if (maybeLater)     maybeLater.addEventListener('click', closePremium);
    if (premiumOverlay) {
        premiumOverlay.addEventListener('click', e => {
            if (e.target === premiumOverlay) closePremium();
        });
    }
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            closePremium();
            showToast('Welcome to Premium! 👑 Enjoy your upgrade!');
        });
    }

    // HOME LOGO link (prevents default, behaves like Home button)
    const homeBtn = $('#home-btn');
    if (homeBtn) {
        homeBtn.addEventListener('click', e => {
            e.preventDefault();
            filterBtns.forEach(b => b.classList.toggle('active', b.dataset.category === 'all'));
            searchInput.value = '';
            execFilter();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ──────────────────────────────────────────────
       7c. SEARCH CLEAR BUTTON
    ────────────────────────────────────────────── */
    const searchClear = $('#search-clear');
    if (searchClear) {
        // Show/hide clear button based on input
        searchInput.addEventListener('input', () => {
            searchClear.classList.toggle('hidden', searchInput.value.length === 0);
        });
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.classList.add('hidden');
            execFilter();
            searchInput.focus();
        });
    }

    /* ──────────────────────────────────────────────
       7d. HAMBURGER + MOBILE MENU
    ────────────────────────────────────────────── */
    const hamburger    = $('#hamburger');
    const mobileMenu   = $('#mobile-menu');
    const mobileOverlay= $('#mobile-overlay');
    const mobileClose  = $('#mobile-close');

    function openMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('hidden');
        mobileOverlay.classList.remove('hidden');
        hamburger.classList.add('open');
        body.style.overflow = 'hidden';
    }
    function closeMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.add('hidden');
        mobileOverlay.classList.add('hidden');
        hamburger.classList.remove('open');
        body.style.overflow = '';
    }

    if (hamburger)     hamburger.addEventListener('click', openMobileMenu);
    if (mobileClose)   mobileClose.addEventListener('click', closeMobileMenu);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileMenu);

    // Mobile nav item actions
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            closeMobileMenu();
            if (action === 'home') {
                filterBtns.forEach(b => b.classList.toggle('active', b.dataset.category === 'all'));
                searchInput.value = '';
                execFilter();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (action === 'favorites') {
                filterBtns.forEach(b => b.classList.toggle('active', b.dataset.category === 'favorites'));
                searchInput.value = '';
                execFilter();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (action === 'login') {
                openLogin();
            } else if (action === 'premium') {
                openPremium();
            } else if (action === 'theme') {
                const isDark = body.getAttribute('data-theme') === 'dark';
                body.setAttribute('data-theme', isDark ? 'light' : 'dark');
                localStorage.setItem('gp_theme', isDark ? 'light' : 'dark');
            }
        });
    });

    /* ──────────────────────────────────────────────
       7e. TOAST NOTIFICATION HELPER
    ────────────────────────────────────────────── */
    function showToast(message) {
        let toast = document.getElementById('gp-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'gp-toast';
            toast.style.cssText = `
                position:fixed; bottom:32px; left:50%; transform:translateX(-50%) translateY(20px);
                background:var(--card); color:var(--text); padding:14px 24px;
                border-radius:30px; box-shadow:var(--shadow-lg); z-index:9999;
                font-family:var(--font); font-weight:600; font-size:.95rem;
                border:1px solid var(--glass-border); opacity:0;
                transition:opacity .3s ease, transform .3s ease; pointer-events:none;
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
        }, 3000);
    }

    /* ──────────────────────────────────────────────
       8. COLLECTIONS CAROUSEL — draggable horizontal slider
    ────────────────────────────────────────────── */
    const COLLECTIONS = [
        { name: 'Raw Landscapes',   cat: 'nature',     count: 20, keyword: 'mountain' },
        { name: 'Urban Nights',     cat: 'city',       count: 20, keyword: 'city'    },
        { name: 'Wild Encounters',  cat: 'animals',    count: 20, keyword: 'wildlife' },
        { name: 'Future Visions',   cat: 'technology', count: 20, keyword: 'technology'},
        { name: 'Ocean Escapes',    cat: 'nature',     count: 20, keyword: 'ocean'   },
        { name: 'Street Stories',   cat: 'city',       count: 20, keyword: 'street'  },
    ];

    COLLECTIONS.forEach((col, i) => {
        const card = document.createElement('div');
        card.className = 'collection-card';
        card.innerHTML = `
            <img src="https://loremflickr.com/560/320/${col.keyword}?lock=${i + 200}" alt="${col.name}" loading="lazy">
            <div class="collection-overlay">
                <h4>${col.name}</h4>
            </div>`;
        card.addEventListener('click', () => filterByCategory(col.cat));
        collectionsEl.appendChild(card);
    });

    // Drag-to-scroll on the carousel
    let sliderDragging = false, sliderStartX = 0, sliderScrollLeft = 0;
    collectionsEl.addEventListener('mousedown', e => {
        sliderDragging = true; sliderStartX = e.pageX - collectionsEl.offsetLeft;
        sliderScrollLeft = collectionsEl.scrollLeft; collectionsEl.style.cursor = 'grabbing';
    });
    collectionsEl.addEventListener('mouseleave', () => { sliderDragging = false; collectionsEl.style.cursor = 'grab'; });
    collectionsEl.addEventListener('mouseup',    () => { sliderDragging = false; collectionsEl.style.cursor = 'grab'; });
    collectionsEl.addEventListener('mousemove',  e => {
        if (!sliderDragging) return; e.preventDefault();
        const x = e.pageX - collectionsEl.offsetLeft;
        collectionsEl.scrollLeft = sliderScrollLeft - (x - sliderStartX) * 1.5;
    });

    /* ──────────────────────────────────────────────
       9. GALLERY RENDERING ENGINE
    ────────────────────────────────────────────── */
    const RENDER_CHUNK = 20;  // Show 20 per batch — enough to fill screen on first load
    let renderOffset = 0;

    function initGallery() {
        // Shuffle galleryData so "All" shows a balanced mix of all categories
        for (let i = galleryData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [galleryData[i], galleryData[j]] = [galleryData[j], galleryData[i]];
        }
        execFilter();
    }

    function execFilter() {
        const query  = searchInput.value.toLowerCase().trim();
        const active = document.querySelector('.filter-btn.active')?.dataset.category || 'all';

        visibleData = galleryData.filter(item => {
            const matchSearch = item.title.toLowerCase().includes(query) || item.category.includes(query);
            if (active === 'favorites') return matchSearch && favorites.includes(item.id);
            if (active === 'all')       return matchSearch;
            return matchSearch && item.category === active;
        });

        galleryEl.innerHTML = '';
        renderOffset = 0;

        // Show / hide no-results message
        const noResults = document.getElementById('no-results');
        if (noResults) {
            noResults.classList.toggle('hidden', visibleData.length > 0);
        }

        renderChunk(); // first batch
        // Auto-fill: if page height allows more images, load a second batch immediately
        setTimeout(renderChunk, 100);
    }

    // "Clear Search" button inside the no-results section
    const clearSearchBtn = document.getElementById('clear-search-btn');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            const searchClearBtn = document.getElementById('search-clear');
            if (searchClearBtn) searchClearBtn.classList.add('hidden');
            filterBtns.forEach(b => b.classList.toggle('active', b.dataset.category === 'all'));
            execFilter();
        });
    }


    function renderChunk() {
        const slice = visibleData.slice(renderOffset, renderOffset + RENDER_CHUNK);
        if (slice.length === 0) { sentinelEl.classList.remove('active'); return; }
        sentinelEl.classList.add('active');

        slice.forEach((item, i) => {
            const card = buildCard(item, renderOffset + i);
            galleryEl.appendChild(card);
            // Staggered fade-in entrance
            requestAnimationFrame(() => setTimeout(() => card.style.opacity = '1', (i % RENDER_CHUNK) * 60));
        });
        renderOffset += slice.length;
        if (renderOffset >= visibleData.length) sentinelEl.classList.remove('active');
    }

    function buildCard(item) {
        const isFav     = favorites.includes(item.id);
        const viewCount = viewCounts[item.id] || 0;
        const card      = document.createElement('div');

        card.className = 'gallery-item';
        card.style.opacity = '0';
        card.style.transition = 'opacity 0.5s ease, transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.6s';
        card.dataset.id = item.id;

        // Editorial Spotlight — every 7th image spans 2 columns & rows
        if (item.spotlight) card.classList.add('spotlight');

        card.innerHTML = `
            <img src="${item.src}" alt="${item.title}" loading="lazy">
            <div class="card-tags">
                ${item.tags.map(t => `<span>${t}</span>`).join('')}
            </div>
            <div class="card-tools">
                <button class="fav-btn ${isFav ? 'favorited' : ''}" data-id="${item.id}" title="Favorite">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>
            <div class="card-meta">
                <div>
                    <h3>${item.title}</h3>
                    <p class="author">${item.author}</p>
                </div>
                <div class="stats">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    ${viewCount}
                </div>
            </div>`;

        // 3D Tilt effect on mouse move
        card.addEventListener('mousemove', e => {
            if (compareMode) return;
            const r  = card.getBoundingClientRect();
            const tx = ((e.clientX - r.left) / r.width  - 0.5) * 18;
            const ty = ((e.clientY - r.top)  / r.height - 0.5) * -18;
            card.style.transform = `perspective(1000px) rotateX(${ty}deg) rotateY(${tx}deg) scale(1.04) translateY(-6px)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });

        // Water Ripple on click
        card.addEventListener('click', e => {
            if (e.target.closest('.fav-btn')) return;
            createRipple(e, card);
            if (compareMode) { toggleCompareSelect(item.id, card); return; }
            const idx = visibleData.findIndex(d => d.id === item.id);
            openLightbox(idx);
        });

        // Favorite btn
        card.querySelector('.fav-btn').addEventListener('click', e => {
            e.stopPropagation();
            toggleFavorite(item.id, card.querySelector('.fav-btn'));
        });

        return card;
    }

    /* Water Ripple */
    function createRipple(e, el) {
        const ripple = document.createElement('span');
        const rect   = el.getBoundingClientRect();
        const size   = Math.max(rect.width, rect.height) * 1.5;
        ripple.style.cssText = `
            position:absolute; border-radius:50%; pointer-events:none; z-index:20;
            width:${size}px; height:${size}px;
            left:${e.clientX - rect.left - size/2}px;
            top:${e.clientY - rect.top - size/2}px;
            background:rgba(255,255,255,0.25);
            transform:scale(0); animation:ripple-anim 0.7s linear forwards;`;
        el.appendChild(ripple);

        if (!document.getElementById('ripple-style')) {
            const s = document.createElement('style');
            s.id = 'ripple-style';
            s.textContent = '@keyframes ripple-anim{to{transform:scale(1);opacity:0;}}';
            document.head.appendChild(s);
        }
        setTimeout(() => ripple.remove(), 700);
    }

    /* ──────────────────────────────────────────────
       10. INFINITE SCROLL (IntersectionObserver)
    ────────────────────────────────────────────── */
    const scrollObserver = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) setTimeout(renderChunk, 500);
    }, { rootMargin: '0px 0px 600px 0px' });
    scrollObserver.observe(sentinelEl);

    /* ──────────────────────────────────────────────
       11. FILTER & SEARCH
    ────────────────────────────────────────────── */
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            execFilter();
        });
    });

    function filterByCategory(cat) {
        filterBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.category === cat);
        });
        execFilter();
    }

    let searchDebounce;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(execFilter, 280);
    });

    /* ──────────────────────────────────────────────
       12. SHUFFLE
    ────────────────────────────────────────────── */
    shuffleBtn.addEventListener('click', () => {
        for (let i = galleryData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [galleryData[i], galleryData[j]] = [galleryData[j], galleryData[i]];
        }
        execFilter();
    });

    /* ──────────────────────────────────────────────
       13. VOICE SEARCH (Web Speech API)
    ────────────────────────────────────────────── */
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micBtn    = $('#voice-search-btn');

    if (SpeechAPI) {
        const recog = new SpeechAPI();
        recog.continuous = false; recog.lang = 'en-US';

        micBtn.addEventListener('click', () => {
            micBtn.classList.add('listening');
            recog.start();
        });
        recog.onresult = e => {
            const t = e.results[0][0].transcript.toLowerCase();
            searchInput.value = t;
            execFilter();
        };
        recog.onend = recog.onerror = () => micBtn.classList.remove('listening');
    } else {
        micBtn.style.opacity = '0.4';
        micBtn.title = 'Voice search not supported in this browser';
    }

    /* ──────────────────────────────────────────────
       14. FAVORITES SYSTEM
    ────────────────────────────────────────────── */
    function toggleFavorite(id, btn) {
        const isFav = favorites.includes(id);
        if (isFav) {
            favorites = favorites.filter(f => f !== id);
        } else {
            favorites.push(id);
        }
        save();
        const nowFav = favorites.includes(id);
        if (btn) {
            btn.classList.toggle('favorited', nowFav);
            btn.querySelector('svg').setAttribute('fill', nowFav ? 'currentColor' : 'none');
        }
        // Sync lightbox heart
        if (lbFavBtn && currentLightboxIdx >= 0 && visibleData[currentLightboxIdx]?.id === id) {
            lbFavBtn.classList.toggle('favorited', nowFav);
        }
    }

    /* ──────────────────────────────────────────────
       15. COMPARE MODE
    ────────────────────────────────────────────── */
    compareBtn.addEventListener('click', () => {
        compareMode = !compareMode;
        compareBtn.classList.toggle('outline', !compareMode);
        if (compareMode) {
            compareDock.classList.remove('hidden');
            document.querySelectorAll('.gallery-item').forEach(n => n.classList.add('compare-selectable'));
        } else {
            resetCompare();
        }
    });

    function toggleCompareSelect(id, node) {
        if (compareSelection.includes(id)) {
            compareSelection = compareSelection.filter(x => x !== id);
            node.classList.remove('selected');
        } else if (compareSelection.length < 2) {
            compareSelection.push(id); node.classList.add('selected');
        }
        execCompareBtn.disabled = compareSelection.length !== 2;
    }

    function resetCompare() {
        compareMode = false; compareSelection = [];
        compareBtn.classList.add('outline');
        compareDock.classList.add('hidden');
        document.querySelectorAll('.gallery-item').forEach(n => n.classList.remove('compare-selectable','selected'));
        execCompareBtn.disabled = true;
    }

    cancelCompare.addEventListener('click', resetCompare);

    execCompareBtn.addEventListener('click', () => {
        if (compareSelection.length !== 2) return;
        const [a, b] = compareSelection.map(id => galleryData.find(d => d.id === id));
        $('#compare-img-1').src   = a.src;   $('#compare-title-1').textContent = a.title;
        $('#compare-img-2').src   = b.src;   $('#compare-title-2').textContent = b.title;
        const modal = $('#compare-modal');
        modal.classList.remove('hidden'); setTimeout(() => modal.classList.add('active'), 10);
        body.style.overflow = 'hidden';
    });

    $('#close-compare-modal').addEventListener('click', () => {
        const modal = $('#compare-modal');
        modal.classList.remove('active'); setTimeout(() => modal.classList.add('hidden'), 400);
        body.style.overflow = '';
        resetCompare();
    });

    /* ──────────────────────────────────────────────
       16. LIGHTBOX — Full premium implementation
    ────────────────────────────────────────────── */
    function openLightbox(index) {
        currentLightboxIdx = index;
        runtimeUpdateLightbox();
        lightboxEl.classList.add('active');
        body.style.overflow = 'hidden';
    }

    function runtimeUpdateLightbox() {
        if (currentLightboxIdx < 0 || currentLightboxIdx >= visibleData.length) return;
        const item = visibleData[currentLightboxIdx];

        // View counter
        viewCounts[item.id] = (viewCounts[item.id] || 0) + 1;
        save();
        const countNode = document.querySelector(`.gallery-item[data-id="${item.id}"] .stats`);
        if (countNode) countNode.innerHTML = `
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            ${viewCounts[item.id]}`;

        // Image swap with fade
        lbImg.classList.add('fade');
        setTimeout(() => {
            lbImg.src = item.src;
            lbImg.onload = () => lbImg.classList.remove('fade');
            zoomLevel = 1; lbImg.style.transform = `scale(1)`;
        }, 200);

        // Counter
        lbCounter.textContent = `${currentLightboxIdx + 1} / ${visibleData.length}`;

        // EXIF Panel Data
        $('#panel-title').textContent    = item.title;
        $('#panel-author').textContent   = `@${item.author.replace(' ', '')}`;
        $('#exif-aperture').textContent  = item.aperture;
        $('#exif-shutter').textContent   = item.shutter;
        $('#exif-iso').textContent       = `ISO ${item.iso}`;
        $('#panel-res').textContent      = item.res;
        $('#panel-loc').textContent      = item.location;
        $('#panel-date').textContent     = item.date;

        // Multi-res download links (all point to same src for placeholder, sized labeled)
        ['#dl-small','#dl-med','#dl-orig'].forEach(sel => {
            const a = $(sel); a.href = item.src; a.setAttribute('download', `${item.title}.jpg`);
        });

        // Favorite state in lightbox
        const isFav = favorites.includes(item.id);
        lbFavBtn.classList.toggle('favorited', isFav);

        // Star ratings
        const rating = ratings[item.id] || 0;
        document.querySelectorAll('#lb-rating span').forEach(star => {
            const val = parseInt(star.dataset.val);
            star.classList.toggle('rated', val <= rating);
        });
    }

    function closeLightbox() {
        lightboxEl.classList.remove('active');
        lbInfoPanel.classList.remove('active');
        body.style.overflow = '';
        stopSlideshow();
        downloadMenu.classList.add('hidden');
    }

    function prevImg() {
        currentLightboxIdx = (currentLightboxIdx - 1 + visibleData.length) % visibleData.length;
        runtimeUpdateLightbox();
    }

    function nextImg() {
        currentLightboxIdx = (currentLightboxIdx + 1) % visibleData.length;
        runtimeUpdateLightbox();
    }

    // Close button & overlay click
    lbCloseBtn.addEventListener('click', closeLightbox);
    lightboxEl.addEventListener('click', e => {
        if (e.target === lightboxEl) closeLightbox();
    });

    // Prev / Next
    $('.lb-prev').addEventListener('click', e => { e.stopPropagation(); prevImg(); });
    $('.lb-next').addEventListener('click', e => { e.stopPropagation(); nextImg(); });

    // Info panel toggle
    lbInfoBtn.addEventListener('click', e => { e.stopPropagation(); lbInfoPanel.classList.toggle('active'); });

    // Keyboard
    document.addEventListener('keydown', e => {
        if (!lightboxEl.classList.contains('active')) return;
        if (e.key === 'Escape')      closeLightbox();
        if (e.key === 'ArrowLeft')   prevImg();
        if (e.key === 'ArrowRight')  nextImg();
    });

    // Mouse-wheel zoom
    lbImg.addEventListener('wheel', e => {
        e.preventDefault();
        zoomLevel = Math.min(Math.max(0.5, zoomLevel - e.deltaY * 0.001), 4);
        lbImg.style.transform = `scale(${zoomLevel})`;
        lbImg.style.cursor = zoomLevel > 1 ? 'zoom-out' : 'zoom-in';
    }, { passive: false });

    // Touch swipe
    lightboxEl.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    lightboxEl.addEventListener('touchend',   e => {
        const dx = e.changedTouches[0].screenX - touchStartX;
        if (dx < -60) nextImg();
        else if (dx > 60) prevImg();
    });

    /* Slideshow */
    function stopSlideshow() {
        if (slideshowTimer) { clearInterval(slideshowTimer); slideshowTimer = null; }
        isPlaying = false;
        lbPlayBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>`;
    }

    lbPlayBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (isPlaying) {
            stopSlideshow();
        } else {
            isPlaying = true;
            slideshowTimer = setInterval(nextImg, 2500);
            lbPlayBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line></svg>`;
        }
    });

    /* Fullscreen */
    lbFullBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (!document.fullscreenElement) lightboxEl.requestFullscreen().catch(() => {});
        else document.exitFullscreen();
    });

    /* Multi-Res Download Dropdown */
    downloadToggle.addEventListener('click', e => {
        e.stopPropagation();
        downloadMenu.classList.toggle('hidden');
        downloadMenu.classList.toggle('active');
    });
    document.addEventListener('click', () => {
        downloadMenu.classList.add('hidden');
        downloadMenu.classList.remove('active');
    });

    /* Favorites — Lightbox heart */
    lbFavBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (currentLightboxIdx < 0) return;
        const id  = visibleData[currentLightboxIdx].id;
        const btn = document.querySelector(`.gallery-item[data-id="${id}"] .fav-btn`);
        toggleFavorite(id, btn);
        const isFav = favorites.includes(id);
        lbFavBtn.classList.toggle('favorited', isFav);
    });

    /* Rating Stars */
    document.querySelectorAll('#lb-rating span').forEach(star => {
        star.addEventListener('click', () => {
            if (currentLightboxIdx < 0) return;
            const id  = visibleData[currentLightboxIdx].id;
            ratings[id] = parseInt(star.dataset.val);
            save();
            document.querySelectorAll('#lb-rating span').forEach(s => {
                s.classList.toggle('rated', parseInt(s.dataset.val) <= ratings[id]);
            });
        });
    });

}); // end DOMContentLoaded
