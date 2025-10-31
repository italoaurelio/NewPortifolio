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
    { name: "Geruldo Valley", file: "assets/music/gereudovalley.mp3" },
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
        if(musicTitle) musicTitle.textContent = "Based in Brazil";
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
        if(nameTitle) nameTitle.textContent = "Now Playing";
        if(musicTitle) musicTitle.textContent = randomSong.name;
        isPlaying = true;
    }
}

// Toggle music on photo click
photo?.addEventListener("click", playMusic);

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
                <div id="work">
                    <img src="${item.photo}" alt="">
                    <div id="workText">
                        <div class="t2">${item.date}</div>
                        <div class="t1">${item.name}</div>
                        <div class="t2">${item.ocupation}</div>
                        ${item.description ? `<p>${item.description}</p>` : ''}
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.log('Erro ao carregar JSON:', error);
    }
}

async function loadAndRenderProjectsJSON() {
    try {
        const response = await fetch("/assets/dados/projects.json");
        const data = await response.json();

        let container = document.querySelector("#projectContainer");
        if(!container) return;
        container.innerHTML = '';

        data.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('projectBox');
            div.innerHTML = `
                <img src="${item.photo}" alt="">
                <div class="projectText">
                    <div class="t1">${item.name}</div>
                    <div class="t2">${item.date}</div>
                    <div class="t2">${item.ocupation}</div>
                    <div class="languagues">
                        ${item.descricao.map(desc => `
                                <p>${desc.text}</p>
                        `).join('')}
                    </div>
                </div>
            `;
            // Ao clicar no projeto, abre o modal com mais detalhes
            div.addEventListener('click', () => openProjectModal(item));

            container.appendChild(div);
        });
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

function openProjectModal(item){
    const modal = document.getElementById('projectModal');
    const nameEl = document.getElementById('modalProjectName');
    const techEl = document.getElementById('modalTechnologies');
    const descEl = document.getElementById('modalBigDescription');

    if(nameEl) nameEl.textContent = item.name || '';
    // tecnologias
    if(techEl) techEl.innerHTML = '';
    if(Array.isArray(item.descricao) && techEl){
        item.descricao.forEach(d => {
            const p = document.createElement('p'); p.textContent = d.text || d;
            techEl.appendChild(p);
        });
    }
    // descrição longa - tenta usar bigDescription, senão usa date como fallback
    if(descEl) descEl.textContent = item.bigDescription || item.date || '';

    // galeria - usa item.gallery (array) ou foto principal como fallback
    modalImages = (Array.isArray(item.gallery) && item.gallery.length) ? item.gallery : [item.photo];

    // main image area
    const galleryMain = document.getElementById('galleryMain');
    const imageWrap = galleryMain?.querySelector('.gallery-image-wrap');
    if(imageWrap) imageWrap.innerHTML = '';
    modalMainImg = document.createElement('img');
    modalMainImg.src = modalImages[0];
    modalMainImg.alt = item.name + ' - imagem 1';
    if(imageWrap) imageWrap.appendChild(modalMainImg);

    // dots
    const dotsContainer = document.getElementById('galleryDots');
    if(dotsContainer) dotsContainer.innerHTML = '';
    modalDots = [];
    modalImages.forEach((src, i) => {
        const dot = document.createElement('button');
        dot.className = 'dot';
        dot.setAttribute('aria-label', `Imagem ${i+1}`);
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
}

function showSlide(index){
    if(!modalImages || modalImages.length === 0) return;
    if(index < 0) index = modalImages.length - 1;
    if(index >= modalImages.length) index = 0;
    currentGalleryIndex = index;
    if(modalMainImg) modalMainImg.src = modalImages[index];
    updateSlideVisuals();
}

function updateSlideVisuals(){
    modalDots.forEach((d,i)=> d.classList.toggle('active', i === currentGalleryIndex));
}

function startAutoplay(){
    stopAutoplay();
    if(!modalImages || modalImages.length <= 1) return;
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
    // remove blur and re-enable scrolling
    document.getElementById('portifolio')?.classList.remove('blurred');
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
    });

    // arrows buttons
    const btnPrev = document.getElementById('galleryPrev');
    const btnNext = document.getElementById('galleryNext');
    if(btnPrev) btnPrev.addEventListener('click', (e)=>{ e.stopPropagation(); showSlide(currentGalleryIndex - 1); resetAutoplay(); });
    if(btnNext) btnNext.addEventListener('click', (e)=>{ e.stopPropagation(); showSlide(currentGalleryIndex + 1); resetAutoplay(); });
});

loadAndRenderJSON('assets/dados/work.json');

if(buttonWS1) buttonWS1.addEventListener('click', () =>{
    toggleClass(buttonWS1,buttonWS2)
    loadAndRenderJSON('assets/dados/work.json');
});
if(buttonWS2) buttonWS2.addEventListener('click', () =>{
    toggleClass(buttonWS2,buttonWS1)
    loadAndRenderJSON('assets/dados/studies.json');
});

loadAndRenderProjectsJSON();
