const menu = document.querySelector("#menu");
const hoverBg = document.querySelector("#hover-bg");
const links = document.querySelectorAll("#menu a");
const buttonWS1 = document.querySelector('#buttonWS1');
const buttonWS2 = document.querySelector('#buttonWS2');

let isPlaying = false;
const audioPlayer = document.getElementById("audio-player");
const audioSource = document.getElementById("audio-source");
const photo = document.getElementById("photo");
const nameTitle = document.getElementById("name-title");
const musicTitle = document.getElementById("music-title");
const playIcon = document.getElementById("play-icon");
const brIcon = document.getElementById("br-icon");

const songs = [
    { name: "Mario Remix", file: "assets/music/marioremix.mp3" },
    { name: "Gerudo Valley", file: "assets/music/gereudovalley.mp3" },
    { name: "Plantera Remix", file: "assets/music/terraria.mp3" }
];

// Safety: ensure no leftover scroll-lock state from previous runs
function resetScrollLocks() {
    try {
        document.documentElement.classList.remove('scroll-locked');
        document.body.classList.remove('scroll-locked');
        document.body.classList.remove('no-scroll');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        // remove any inline dataset saved scroll
        if (document.body.dataset.scrollY) delete document.body.dataset.scrollY;
        // remove prevent handlers if still present
        if (window._preventScrollHandler) {
            try {
                window.removeEventListener('touchmove', window._preventScrollHandler, { passive: false });
                window.removeEventListener('wheel', window._preventScrollHandler, { passive: false });
            } catch (e) {
                // ignore
            }
            delete window._preventScrollHandler;
        }
    } catch (e) {
        console.warn('resetScrollLocks failed', e);
    }
}

// run cleanup ASAP
resetScrollLocks();

function playMusic() {
    if (!audioPlayer) return;
    if (isPlaying) {
        audioPlayer.pause();
        photo?.classList.remove("clicked");
        playIcon?.classList.remove("clicked");
        if(brIcon) brIcon.style.display = 'block';
        if(playIcon) playIcon.style.display = 'none';
        musicTitle?.classList.remove("clicked");
        if(nameTitle) nameTitle.textContent = "Ítalo Aurélio.";
        if(musicTitle) {
            musicTitle.textContent = i18n.t("hero.basedIn");
            delete musicTitle.dataset.i18nSkip; // liberou pro i18n traduzir de novo
        }
        if(audioSource) audioSource.src = "";
        isPlaying = false;
    } else {
        const randomSong = songs[Math.floor(Math.random() * songs.length)];
        if(audioSource) audioSource.src = randomSong.file;
        audioPlayer.load();
        audioPlayer.play();
        photo?.classList.add("clicked");
        playIcon?.classList.add("clicked");
        if(brIcon) brIcon.style.display = 'none';
        if(playIcon) playIcon.style.display = 'block';
        musicTitle?.classList.add("clicked");
        if(nameTitle) nameTitle.textContent = i18n.t("hero.nowPlaying");
        if(musicTitle) {
            musicTitle.textContent = randomSong.name;
            musicTitle.dataset.i18nSkip = ""; // nome de música não se traduz 🎵
        }
        isPlaying = true;
    }
    photo?.setAttribute("aria-pressed", String(isPlaying));
}

// Toggle music on photo click
photo?.addEventListener("click", playMusic);

// Teclado também toca música 🎹
photo?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        playMusic();
    }
});

// Quando a música acaba sozinha, volta tudo pro normal (a foto não é um beyblade ♾️)
audioPlayer?.addEventListener("ended", () => {
    if (isPlaying) playMusic();
});

// Menu hover background movement
links.forEach((link) => {
    link.addEventListener("mouseenter", () => {
        hoverBg?.classList.add("hover-color");

        const rect = link.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();

        const offsetX = rect.left - menuRect.left + rect.width / 2 - (hoverBg?.offsetWidth || 0)/2;

        if(hoverBg) hoverBg.style.transform = `translateX(${offsetX}px)`;
    });
});

menu?.addEventListener("mouseleave", () => {
    if(hoverBg){
        hoverBg.style.transition = "transform 0.3s ease, background 0.5s ease";
        hoverBg.style.transform = "translateX(0)";
        hoverBg.classList.remove("hover-color");
    }
});

function toggleClass(clickedButton, otherButton) {
    clickedButton.classList.add('active');
    otherButton.classList.remove('active');
}

async function loadAndRenderJSON(filePath) {
    try {
        const response = await fetch(filePath);
        const data = await response.json();

        let container = document.querySelector("#container");
        if(!container) return;
        container.innerHTML = '';

        data.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('card');
            div.innerHTML = `
                <div class="work">
                    <img src="${item.photo}" alt="Logo ${i18n.field(item.name)}" width="60" height="60" loading="lazy" decoding="async">
                    <div class="workText">
                        <div class="t2">${i18n.field(item.date)}</div>
                        <div class="t1">${i18n.field(item.name)}</div>
                        <div class="t2">${i18n.field(item.ocupation)}</div>
                        ${item.description ? `<p>${i18n.field(item.description)}</p>` : ''}
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.log('Erro ao carregar JSON:', error);
    }
}

// ---------- Projetos (schema novo, o mesmo que o admin gera) ----------

// Mini helper pra criar elemento sem innerHTML (dado de JSON não vira HTML aqui 🔒)
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null && text !== '') node.textContent = text;
    return node;
}

function buildProjectCard(item) {
    const card = el('article', 'projectCard');
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${item.name} — ${i18n.t('project.viewCase')}`);

    // Crop fixo 16:9 — nunca mais card gigante por causa de screenshot comprida 📐
    const media = el('div', 'card-media');
    const img = document.createElement('img');
    img.src = item.thumbnail || '';
    img.alt = `${item.name} — screenshot`;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.appendChild(img);
    card.appendChild(media);

    const body = el('div', 'card-body');

    const meta = [item.client, i18n.field(item.period)].filter(Boolean).join(' · ');
    if (meta) body.appendChild(el('p', 'card-meta', meta));

    body.appendChild(el('h3', 'card-name', item.name));

    const tagline = i18n.field(item.tagline) || i18n.field(item.shortDescription);
    if (tagline) body.appendChild(el('p', 'card-tagline', tagline));

    const stack = Array.isArray(item.stack) ? item.stack : [];
    if (stack.length) {
        const chips = el('div', 'card-stack');
        stack.slice(0, 5).forEach(t => chips.appendChild(el('p', '', t)));
        if (stack.length > 5) chips.appendChild(el('p', 'chip-more', `+${stack.length - 5}`));
        body.appendChild(chips);
    }

    // Footer do card: métrica de impacto (ou o papel no projeto) + convite pro case
    const footer = el('div', 'card-footer');
    const hero = el('div', 'card-metric');
    const impact = Array.isArray(item.impact) ? item.impact : [];
    if (impact.length && impact[0].value) {
        hero.appendChild(el('span', 'metric-value', impact[0].value));
        hero.appendChild(el('span', 'metric-label', i18n.field(impact[0].label)));
    } else {
        hero.appendChild(el('span', 'metric-role', i18n.field(item.role)));
    }
    footer.appendChild(hero);
    footer.appendChild(el('span', 'card-cta', i18n.t('project.viewCase')));
    body.appendChild(footer);

    card.appendChild(body);

    // Clique OU teclado abrem o case
    card.addEventListener('click', () => openProjectModal(item));
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openProjectModal(item);
        }
    });

    return card;
}

async function loadAndRenderProjectsJSON() {
    try {
        const response = await fetch("assets/dados/projects.json");
        const data = await response.json();

        let container = document.querySelector("#projectContainer");
        if(!container) return;
        container.innerHTML = '';

        data.forEach(item => container.appendChild(buildProjectCard(item)));
    } catch (error) {
        console.log('Erro ao carregar JSON:', error);
    }
}

// Modal logic
let currentGalleryIndex = 0;
let modalImages = [];
let modalMainImg = null;
let modalDots = [];
let autoplayInterval = null;
let currentModalItem = null;   // projeto aberto (pro re-render na troca de idioma)
let lastFocusedElement = null; // devolve o foco pra quem abriu o modal

// Preenche o case study — seção sem conteúdo é omitida (case vazio não vira esqueleto 👻)
function renderProjectModal(item){
    const nameEl = document.getElementById('modalProjectName');
    if(nameEl) nameEl.textContent = item.name || '';

    const metaEl = document.getElementById('modalMeta');
    if(metaEl) metaEl.textContent = [item.client, i18n.field(item.period), i18n.field(item.role)]
        .filter(Boolean).join(' · ');

    const taglineEl = document.getElementById('modalTagline');
    if(taglineEl) taglineEl.textContent = i18n.field(item.tagline) || '';

    // Números primeiro 📊
    const impactEl = document.getElementById('modalImpact');
    if(impactEl){
        impactEl.innerHTML = '';
        const impact = (Array.isArray(item.impact) ? item.impact : []).filter(m => m && m.value);
        impact.slice(0, 4).forEach(m => {
            const tile = el('div', 'impact-tile');
            tile.appendChild(el('span', 'impact-value', m.value));
            tile.appendChild(el('span', 'impact-label', i18n.field(m.label)));
            impactEl.appendChild(tile);
        });
        impactEl.style.display = impact.length ? '' : 'none';
    }

    const overview = document.getElementById('modalOverview');
    if(overview){
        const text = i18n.field(item.longDescription) || i18n.field(item.shortDescription);
        overview.querySelector('h5').textContent = i18n.t('modal.overview');
        overview.querySelector('p').textContent = text;
        overview.style.display = text ? '' : 'none';
    }

    const highlights = document.getElementById('modalHighlights');
    if(highlights){
        const list = i18n.field(item.highlights);
        const items = Array.isArray(list) ? list.filter(Boolean) : [];
        highlights.querySelector('h5').textContent = i18n.t('modal.highlights');
        const ul = highlights.querySelector('ul');
        ul.innerHTML = '';
        items.forEach(h => ul.appendChild(el('li', '', h)));
        highlights.style.display = items.length ? '' : 'none';
    }

    const stackSection = document.getElementById('modalStack');
    if(stackSection){
        const stack = Array.isArray(item.stack) ? item.stack : [];
        stackSection.querySelector('h5').textContent = i18n.t('modal.stack');
        const wrap = stackSection.querySelector('.modal-tech');
        wrap.innerHTML = '';
        stack.forEach(t => wrap.appendChild(el('p', '', t)));
        stackSection.style.display = stack.length ? '' : 'none';
    }

    // Arquitetura (frontend/backend/server + fontes de dados)
    const infraEl = document.getElementById('modalInfra');
    if(infraEl){
        infraEl.innerHTML = '';
        const infra = item.infraInfo || {};
        const blocks = ['frontend', 'backend', 'server']
            .map(k => infra[k])
            .filter(b => b && i18n.field(b.desc));
        const sources = Array.isArray(infra.dataSources) ? infra.dataSources.filter(Boolean) : [];
        if(blocks.length || sources.length){
            infraEl.appendChild(el('h5', '', i18n.t('modal.architecture')));
            if(blocks.length){
                const grid = el('div', 'infra-grid');
                blocks.forEach(b => {
                    const box = el('div', 'infra-card');
                    box.appendChild(el('strong', '', b.title || ''));
                    box.appendChild(el('p', '', i18n.field(b.desc)));
                    grid.appendChild(box);
                });
                infraEl.appendChild(grid);
            }
            if(sources.length){
                const src = el('div', 'infra-sources');
                src.appendChild(el('span', 'infra-sources-label', i18n.t('modal.dataSources')));
                const chips = el('div', 'modal-tech');
                sources.forEach(s => chips.appendChild(el('p', '', s)));
                src.appendChild(chips);
                infraEl.appendChild(src);
            }
            infraEl.style.display = '';
        } else {
            infraEl.style.display = 'none';
        }
    }

    // Como funciona (passos numerados)
    const usageEl = document.getElementById('modalUsage');
    if(usageEl){
        usageEl.innerHTML = '';
        const steps = i18n.field(item.usageExample);
        const list = Array.isArray(steps) ? steps.filter(Boolean) : [];
        if(list.length){
            usageEl.appendChild(el('h5', '', i18n.t('modal.usage')));
            const ol = el('ol', 'usage-steps');
            list.forEach(s => ol.appendChild(el('li', '', s)));
            usageEl.appendChild(ol);
            usageEl.style.display = '';
        } else {
            usageEl.style.display = 'none';
        }
    }

    // CTAs: só os links preenchidos
    const linksEl = document.getElementById('modalLinks');
    if(linksEl){
        linksEl.innerHTML = '';
        const links = item.links || {};
        const defs = [
            { href: links.demo, label: i18n.t('modal.demo'), cls: 'modal-link primary' },
            { href: links.repo, label: i18n.t('modal.code'), cls: 'modal-link ghost' },
            { href: links.case, label: i18n.t('modal.case'), cls: 'modal-link ghost' }
        ].filter(d => d.href);
        defs.forEach(d => {
            const a = el('a', d.cls, d.label);
            a.href = d.href;
            a.target = '_blank';
            a.rel = 'noopener';
            linksEl.appendChild(a);
        });
        linksEl.style.display = defs.length ? '' : 'none';
    }

    // Galeria — screenshots do próprio projeto (thumbnail de fallback)
    modalImages = (Array.isArray(item.screenshots) && item.screenshots.length)
        ? item.screenshots : [item.thumbnail];

    const galleryMain = document.getElementById('galleryMain');
    const imageWrap = galleryMain?.querySelector('.gallery-image-wrap');
    if(imageWrap) imageWrap.innerHTML = '';
    modalMainImg = document.createElement('img');
    modalMainImg.src = modalImages[0];
    modalMainImg.alt = `${item.name} — ${i18n.t('modal.image')} 1`;
    if(imageWrap) imageWrap.appendChild(modalMainImg);

    // Setas e dots só quando tem mais de uma imagem
    const multi = modalImages.length > 1;
    const btnPrev = document.getElementById('galleryPrev');
    const btnNext = document.getElementById('galleryNext');
    if(btnPrev) btnPrev.style.display = multi ? '' : 'none';
    if(btnNext) btnNext.style.display = multi ? '' : 'none';

    const dotsContainer = document.getElementById('galleryDots');
    if(dotsContainer) dotsContainer.innerHTML = '';
    modalDots = [];
    if(multi) modalImages.forEach((src, i) => {
        const dot = document.createElement('button');
        dot.className = 'dot';
        dot.setAttribute('aria-label', `${i18n.t('modal.image')} ${i+1}`);
        dot.addEventListener('click', ()=>{
            showSlide(i);
            resetAutoplay();
        });
        dotsContainer?.appendChild(dot);
        modalDots.push(dot);
    });

    currentGalleryIndex = 0;
    updateSlideVisuals();

    // autoplay: pausa ao hover, retoma ao sair (use element properties to avoid duplicate listeners)
    if(galleryMain){
        galleryMain.onmouseenter = stopAutoplay;
        galleryMain.onmouseleave = startAutoplay;
    }
}

function openProjectModal(item){
    const modal = document.getElementById('projectModal');
    currentModalItem = item;
    lastFocusedElement = document.activeElement;

    renderProjectModal(item);

    // trava teclado e leitor de tela no fundo enquanto o case tá aberto
    const portifolio = document.getElementById('portifolio');
    if(portifolio) portifolio.inert = true;
    const menuEl = document.getElementById('menu');
    if(menuEl) menuEl.inert = true;

    modal?.classList.add('open');
    modal?.setAttribute('aria-hidden','false');
    // blur background
    document.getElementById('portifolio')?.classList.add('blurred');
    // save current scroll position
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.dataset.scrollY = String(scrollY);
    // Add strong scroll-lock: classes + non-passive listeners to prevent touchmove/wheel
    try {
        document.documentElement.classList.add('scroll-locked');
        document.body.classList.add('scroll-locked');
        document.body.classList.add('no-scroll');

        // ensure we don't create multiple handlers
        if (!window._preventScrollHandler) {
            window._preventScrollHandler = function (e) { e.preventDefault(); };
        }
        // non-passive to allow preventDefault
        window.addEventListener('touchmove', window._preventScrollHandler, { passive: false });
        window.addEventListener('wheel', window._preventScrollHandler, { passive: false });
    } catch (e) {
        document.body.classList.add('no-scroll');
    }
    startAutoplay();
    document.getElementById('closeModal')?.focus();
}

function showSlide(index){
    if(!modalImages || modalImages.length === 0) return;
    if(index < 0) index = modalImages.length - 1;
    if(index >= modalImages.length) index = 0;
    currentGalleryIndex = index;
    if(modalMainImg){
        modalMainImg.src = modalImages[index];
        if(currentModalItem) modalMainImg.alt = `${currentModalItem.name} — ${i18n.t('modal.image')} ${index+1}`;
    }
    updateSlideVisuals();
}

function updateSlideVisuals(){
    modalDots.forEach((d,i)=> d.classList.toggle('active', i === currentGalleryIndex));
}

function startAutoplay(){
    stopAutoplay();
    if(!modalImages || modalImages.length <= 1) return;
    // Quem pediu menos movimento não ganha carrossel automático 🫠
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    autoplayInterval = setInterval(()=>{
        showSlide((currentGalleryIndex + 1) % modalImages.length);
    }, 3500);
}

function stopAutoplay(){
    if(autoplayInterval){ clearInterval(autoplayInterval); autoplayInterval = null; }
}

function resetAutoplay(){ stopAutoplay(); startAutoplay(); }

function closeProjectModal(){
    const modal = document.getElementById('projectModal');
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden','true');
    stopAutoplay();
    modalImages = [];
    modalMainImg = null;
    modalDots = [];
    currentModalItem = null;
    // remove blur and re-enable scrolling
    const portifolio = document.getElementById('portifolio');
    portifolio?.classList.remove('blurred');
    if(portifolio) portifolio.inert = false;
    const menuEl = document.getElementById('menu');
    if(menuEl) menuEl.inert = false;
    // remove strong scroll-lock: listeners + classes, then restore scroll position
    try {
        // remove handlers
        if (window._preventScrollHandler) {
            window.removeEventListener('touchmove', window._preventScrollHandler, { passive: false });
            window.removeEventListener('wheel', window._preventScrollHandler, { passive: false });
        }
        document.documentElement.classList.remove('scroll-locked');
        document.body.classList.remove('scroll-locked');
        document.body.classList.remove('no-scroll');

        const saved = document.body.dataset.scrollY;
        if (saved !== undefined) {
            const y = parseInt(saved) || 0;
            window.scrollTo(0, y);
            delete document.body.dataset.scrollY;
        }
    } catch (e) {
        document.body.classList.remove('no-scroll');
    }
    // devolve o foco pro card que abriu o case
    lastFocusedElement?.focus?.();
    lastFocusedElement = null;
}

document.addEventListener('DOMContentLoaded', ()=>{
    // close button
    const closeBtn = document.getElementById('closeModal');
    if(closeBtn) closeBtn.addEventListener('click', closeProjectModal);

    // overlay click (fechar ao clicar fora do conteúdo)
    const modal = document.getElementById('projectModal');
    if(modal) modal.addEventListener('click', (e)=>{
        if(e.target === modal) closeProjectModal();
    });

    // keyboard close and arrows (troca imagem principal)
    document.addEventListener('keydown', (e)=>{
        const modalOpen = document.getElementById('projectModal')?.classList.contains('open');
        if(!modalOpen) return;
        if(e.key === 'Escape') closeProjectModal();
        if(e.key === 'ArrowRight') showSlide(currentGalleryIndex + 1);
        if(e.key === 'ArrowLeft') showSlide(currentGalleryIndex - 1);
        // Tab fica preso dentro do case (focus trap ⌨️)
        if(e.key === 'Tab'){
            const content = document.querySelector('#projectModal .modal-content');
            if(!content) return;
            const focusables = [...content.querySelectorAll('button, a[href]')]
                .filter(f => f.offsetParent !== null);
            if(!focusables.length) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
            else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
        }
    });

    // arrows buttons
    const btnPrev = document.getElementById('galleryPrev');
    const btnNext = document.getElementById('galleryNext');
    if(btnPrev) btnPrev.addEventListener('click', (e)=>{ e.stopPropagation(); showSlide(currentGalleryIndex - 1); resetAutoplay(); });
    if(btnNext) btnNext.addEventListener('click', (e)=>{ e.stopPropagation(); showSlide(currentGalleryIndex + 1); resetAutoplay(); });
});

// Guarda qual aba (Work/Studies) está aberta pro i18n saber o que re-renderizar
let currentExperienceFile = 'assets/dados/work.json';

loadAndRenderJSON(currentExperienceFile);

if(buttonWS1) buttonWS1.addEventListener('click', () =>{
    toggleClass(buttonWS1,buttonWS2)
    currentExperienceFile = 'assets/dados/work.json';
    loadAndRenderJSON(currentExperienceFile);
});
if(buttonWS2) buttonWS2.addEventListener('click', () =>{
    toggleClass(buttonWS2,buttonWS1)
    currentExperienceFile = 'assets/dados/studies.json';
    loadAndRenderJSON(currentExperienceFile);
});

// Alterna EN/PT 🔁
document.getElementById("lang-toggle")?.addEventListener("click", () => {
    i18n.setLang(i18n.lang === "en" ? "pt" : "en");
});

// Se trocar de língua, re-renderiza o que estiver na tela 🔄
document.addEventListener("langchange", () => {
    loadAndRenderJSON(currentExperienceFile);
    loadAndRenderProjectsJSON();
    if (isPlaying && nameTitle) nameTitle.textContent = i18n.t("hero.nowPlaying");
    // case aberto também troca de língua na hora
    if (currentModalItem && document.getElementById('projectModal')?.classList.contains('open')) {
        renderProjectModal(currentModalItem);
    }
});

loadAndRenderProjectsJSON();
