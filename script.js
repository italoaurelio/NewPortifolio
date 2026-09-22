// ============================================================
// 🎧 A MÚSICA (sagrada: clicar na foto toca uma música aleatória)
// ============================================================
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

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function playMusic() {
    if (!audioPlayer) return;
    if (isPlaying) {
        // para quem estiver tocando: YouTube ou MP3 local
        if (musicSource === "yt") ytStop();
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
        musicSource = null;
    } else {
        // 1ª opção: a playlist do YouTube. Se o YouTube não carregar, MP3 local 🛟
        if (!ytFailed) {
            musicSource = "yt";
            ytPlay();
            if(musicTitle) musicTitle.textContent = i18n.t("mp.loading");
        } else {
            musicSource = "mp3";
            const randomSong = songs[Math.floor(Math.random() * songs.length)];
            if(audioSource) audioSource.src = randomSong.file;
            audioPlayer.load();
            audioPlayer.play();
            if(musicTitle) musicTitle.textContent = randomSong.name;
        }
        photo?.classList.add("clicked");
        playIcon?.classList.add("clicked");
        if(brIcon) brIcon.style.display = 'none';
        if(playIcon) playIcon.style.display = 'block';
        musicTitle?.classList.add("clicked");
        if(nameTitle) nameTitle.textContent = i18n.t("hero.nowPlaying");
        if(musicTitle) musicTitle.dataset.i18nSkip = ""; // nome de música não se traduz 🎵
        isPlaying = true;
    }
    photo?.setAttribute("aria-pressed", String(isPlaying));
    // o disco inteiro sabe que tá tocando (gira, sai da capa, liga o equalizador) 💿
    document.body.classList.toggle("is-playing", isPlaying);
    document.body.classList.toggle("eq-fallback", isPlaying && musicSource === "yt");
    if (isPlaying && musicSource === "yt") startFakeBeat();
}

// ============================================================
// 📺 Playlist do YouTube ("Rock na Estrada")
// Regras do YouTube: o player precisa ficar visível enquanto toca,
// então ele aparece como mini player no canto da tela.
// Pra trocar as músicas, é só editar a playlist lá no YouTube.
// ============================================================
const YT_PLAYLIST = "PLJyx50xU2F_o";
let musicSource = null;   // "yt" | "mp3" | null
let ytPlayer = null;
let ytReady = false;
let ytFailed = false;
let ytWantPlay = false;
let ytLoading = false;
const miniPlayer = document.getElementById("miniPlayer");
const mpTitle = document.getElementById("mpTitle");

function loadYT() {
    if (ytLoading || ytFailed) return;
    ytLoading = true;
    window.onYouTubeIframeAPIReady = () => {
        ytPlayer = new YT.Player("ytPlayer", {
            width: 200,
            height: 200,
            playerVars: { listType: "playlist", list: YT_PLAYLIST, playsinline: 1, rel: 0 },
            events: {
                onReady: () => {
                    ytReady = true;
                    if (ytWantPlay) ytStart();
                },
                onStateChange: onYtState,
                // vídeo bloqueado pra incorporar? pula pro próximo
                onError: () => ytPlayer?.nextVideo()
            }
        });
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.onerror = ytGiveUp;
    document.head.appendChild(tag);
    // YouTube não respondeu em 10s? desiste e deixa o MP3 assumir
    setTimeout(() => { if (!ytReady) ytGiveUp(); }, 10000);
}

function ytGiveUp() {
    if (ytReady) return;
    ytFailed = true;
    if (ytWantPlay && isPlaying && musicSource === "yt") {
        // troca pro plano B sem o usuário ter que clicar de novo
        playMusic();
        playMusic();
    }
    ytWantPlay = false;
}

function ytStart() {
    ytWantPlay = false;
    try {
        ytPlayer.setShuffle(true);
        const list = ytPlayer.getPlaylist();
        if (list && list.length) ytPlayer.playVideoAt(Math.floor(Math.random() * list.length));
        else ytPlayer.playVideo();
    } catch (e) {
        ytGiveUp();
    }
}

function ytPlay() {
    miniPlayer?.classList.add("open");
    miniPlayer?.setAttribute("aria-hidden", "false");
    if (mpTitle) mpTitle.textContent = i18n.t("mp.loading");
    if (ytReady) ytStart();
    else { ytWantPlay = true; loadYT(); }
}

function ytStop() {
    ytWantPlay = false;
    try { ytPlayer?.pauseVideo(); } catch (e) { /* player ainda nem existia */ }
    miniPlayer?.classList.remove("open");
    miniPlayer?.setAttribute("aria-hidden", "true");
    stopFakeBeat();
}

function onYtState(e) {
    if (!isPlaying || musicSource !== "yt") return;
    if (e.data === YT.PlayerState.PLAYING) {
        const title = ytPlayer.getVideoData?.().title || "";
        if (title) {
            if (musicTitle) musicTitle.textContent = title;
            if (mpTitle) mpTitle.textContent = title;
        }
    }
    // acabou a playlist inteira: volta tudo pro normal
    if (e.data === YT.PlayerState.ENDED) {
        const list = ytPlayer.getPlaylist() || [];
        if (ytPlayer.getPlaylistIndex() >= list.length - 1) playMusic();
    }
}

// carrega o player só quando alguém chega perto do disco (poupa ~1 MB de quem só veio ler)
["pointerenter", "focus", "touchstart"].forEach(ev => {
    photo?.addEventListener(ev, loadYT, { once: true, passive: true });
});
document.getElementById("mpNext")?.addEventListener("click", () => ytPlayer?.nextVideo());
document.getElementById("mpStop")?.addEventListener("click", () => { if (isPlaying) playMusic(); });

// O áudio do YouTube vem de outro site: o navegador não deixa medir o grave.
// Então, só pro visual, as ondas e as letras dançam num pulso simulado (~120 bpm).
let fakeBeatFrame = null;
function startFakeBeat() {
    if (prefersReducedMotion) return;
    cancelAnimationFrame(fakeBeatFrame);
    const t0 = performance.now();
    const tick = now => {
        if (!isPlaying || musicSource !== "yt") return;
        const t = (now - t0) / 1000;
        const pulse = Math.pow(Math.max(0, Math.sin(t * Math.PI * 4)), 6);
        musicLevel = 0.45 + pulse * 0.35;
        document.documentElement.style.setProperty("--beat", (pulse * 0.5).toFixed(3));
        fakeBeatFrame = requestAnimationFrame(tick);
    };
    fakeBeatFrame = requestAnimationFrame(tick);
}
function stopFakeBeat() {
    cancelAnimationFrame(fakeBeatFrame);
    musicLevel = 0;
    document.documentElement.style.setProperty("--beat", "0");
}

// ---------- Equalizador de verdade (Web Audio) ----------
// Monta o grafo no próprio clique (gesto do usuário), ANTES do play,
// pra nunca deixar o áudio mudo num AudioContext suspenso 🔇
let audioCtx = null;
let analyser = null;
let freqData = null;
let eqFrame = null;
let musicLevel = 0;
// o fundo (bg.js) pergunta aqui o quanto a música tá batendo
window.__musicLevel = () => (isPlaying && (analyser || musicSource === "yt") ? musicLevel : 0);
const eqBars = [...document.querySelectorAll("#eq i")];

function ensureAudioGraph() {
    if (prefersReducedMotion) return; // quem pediu menos movimento não ganha barrinha dançando
    try {
        if (!audioCtx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) throw new Error("sem Web Audio");
            audioCtx = new Ctx();
            const src = audioCtx.createMediaElementSource(audioPlayer);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            src.connect(analyser);
            analyser.connect(audioCtx.destination);
            freqData = new Uint8Array(analyser.frequencyBinCount);
        }
        if (audioCtx.state === "suspended") audioCtx.resume();
    } catch (e) {
        document.body.classList.add("eq-fallback"); // plano B: animação em CSS
    }
}

function drawEq() {
    if (!analyser || !isPlaying) return;
    analyser.getByteFrequencyData(freqData);
    // grave médio vira o "pulso" do site: fundo e letras recortadas batem junto 🥁
    const bass = (freqData[0] + freqData[1] + freqData[2] + freqData[3]) / (4 * 255);
    musicLevel += (bass - musicLevel) * 0.35;
    document.documentElement.style.setProperty("--beat", Math.max(0, (musicLevel - 0.45) * 1.8).toFixed(3));

    // agudo tem menos energia que grave: cada barra ganha um empurrãozinho
    const bins = [1, 3, 6, 10, 15];
    eqBars.forEach((bar, i) => {
        const v = (freqData[bins[i]] / 255) * (1 + i * 0.35);
        bar.style.transform = `scaleY(${Math.min(1, Math.max(0.15, v))})`;
    });
    eqFrame = requestAnimationFrame(drawEq);
}

audioPlayer?.addEventListener("playing", () => {
    cancelAnimationFrame(eqFrame);
    drawEq();
});
audioPlayer?.addEventListener("pause", () => {
    cancelAnimationFrame(eqFrame);
    eqBars.forEach(bar => { bar.style.transform = ""; });
    if (musicSource === "yt") return;
    musicLevel = 0;
    document.documentElement.style.setProperty("--beat", "0");
});

// Toggle music on photo click (o grafo de áudio vem primeiro)
photo?.addEventListener("click", ensureAudioGraph);
photo?.addEventListener("click", playMusic);

// Teclado também toca música 🎹
photo?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        ensureAudioGraph();
        playMusic();
    }
});

// Quando a música acaba sozinha, volta tudo pro normal (a foto não é um beyblade ♾️)
audioPlayer?.addEventListener("ended", () => {
    if (isPlaying && musicSource === "mp3") playMusic();
});

// ============================================================
// Helpers
// ============================================================

// Mini helper pra criar elemento sem innerHTML (dado de JSON não vira HTML aqui 🔒)
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null && text !== '') node.textContent = text;
    return node;
}

function icon(name) {
    const i = document.createElement("iconify-icon");
    i.setAttribute("icon", name);
    i.setAttribute("aria-hidden", "true");
    return i;
}

function nameOf(item) {
    return i18n.field(item.name) || "";
}

async function getJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    return res.json();
}

let projects = [];

// ✂️ as letras recortadas moram em ransom.js (a 404 usa também)

// ============================================================
// 🟢 Sistemas ao vivo: prova de que o que tá no portfólio tá no ar
// Em produção quem mede é a função /api/status (Vercel). Rodando local,
// sem a função, o navegador mesmo faz um "toc toc" em modo no-cors.
// ============================================================
const LIVE_URLS = {
    "ingressos-fojb": "https://ingressosfojb.com.br/",
    "quando-da": "https://quando-da.vercel.app/",
    "gradment": "https://gradment.linceonline.com.br/"
};
let liveState = {};      // id -> {up, ms} | undefined (conferindo)
let livePromise = null;

function buildLive(id) {
    const pill = el("span", "live");
    pill.dataset.live = id;
    pill.title = i18n.t("live.title");
    paintLive(pill);
    return pill;
}

function paintLive(pill) {
    const st = liveState[pill.dataset.live];
    pill.classList.toggle("is-up", !!st?.up);
    pill.classList.toggle("is-down", st ? !st.up : false);
    pill.textContent = "";
    pill.appendChild(el("i", "live-dot"));
    const label = !st ? i18n.t("live.checking")
        : st.up ? `${i18n.t("live.up")} · ${st.ms} ms` : i18n.t("live.down");
    pill.appendChild(el("span", "", label));
}

async function pingFromBrowser(url) {
    const started = performance.now();
    try {
        await fetch(url, { mode: "no-cors", cache: "no-store" });
        return { up: true, ms: Math.round(performance.now() - started) };
    } catch (e) {
        return { up: false, ms: 0 };
    }
}

function checkLive() {
    if (livePromise) return livePromise;
    livePromise = (async () => {
        try {
            const r = await fetch("/api/status", { cache: "no-store" });
            if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) throw new Error("sem api");
            const data = await r.json();
            liveState = data.systems || {};
            // o servidor não alcançou (code 0)? pode ser firewall barrando fora do Brasil:
            // o navegador do visitante confere antes de acusar "fora do ar"
            const unreachable = Object.keys(LIVE_URLS).filter(id => !liveState[id] || liveState[id].code === 0);
            const retry = await Promise.all(unreachable.map(id => pingFromBrowser(LIVE_URLS[id])));
            unreachable.forEach((id, i) => { liveState[id] = retry[i]; });
        } catch (e) {
            const ids = Object.keys(LIVE_URLS);
            const res = await Promise.all(ids.map(id => pingFromBrowser(LIVE_URLS[id])));
            ids.forEach((id, i) => { liveState[id] = res[i]; });
        }
        document.querySelectorAll("[data-live]").forEach(paintLive);
    })();
    return livePromise;
}

// ============================================================
// LADO A: singles (pilha) + tracklist
// ============================================================
function buildCover(item, variant) {
    const cover = el("div", "single-cover");
    if (item.thumbnail) {
        const img = document.createElement("img");
        img.src = item.thumbnail;
        img.alt = `${nameOf(item)}, ${i18n.t("modal.image").toLowerCase()} 1`;
        img.loading = "lazy";
        img.decoding = "async";
        cover.appendChild(img);
    } else {
        // capa tipográfica enquanto os prints não chegam 🎴
        const art = el("div", "cover-art");
        art.dataset.v = String(variant);
        art.setAttribute("aria-hidden", "true");
        art.appendChild(el("span", "cover-code", item.track));
        art.appendChild(el("span", "cover-name", nameOf(item)));
        cover.appendChild(art);
    }
    return cover;
}

function buildMetric(m) {
    const box = el("div", "metric");
    box.appendChild(el("span", "metric-value", m.value));
    box.appendChild(el("span", "metric-label", i18n.field(m.label)));
    return box;
}

function buildSingle(item, index) {
    const card = el("article", "single");
    card.appendChild(buildCover(item, (index % 3) + 1));

    const body = el("div", "single-body");

    const meta = el("p", "single-meta");
    meta.appendChild(el("span", "track-code", item.track));
    meta.appendChild(el("span", "", [i18n.field(item.client), i18n.field(item.period)].filter(Boolean).join(", ")));
    if (item.live) meta.appendChild(buildLive(item.id));
    body.appendChild(meta);

    body.appendChild(el("h3", "single-name", nameOf(item)));
    body.appendChild(el("p", "single-tagline", i18n.field(item.tagline)));

    const impact = (item.impact || []).filter(m => m && m.value);
    if (impact.length) {
        const metrics = el("div", "single-metrics");
        impact.slice(0, 3).forEach(m => metrics.appendChild(buildMetric(m)));
        body.appendChild(metrics);
    }

    const story = el("div", "single-story");
    [["case.problem", item.problem], ["case.did", item.longDescription]].forEach(([k, v]) => {
        const text = i18n.field(v);
        if (!text) return;
        const block = el("div");
        block.appendChild(el("h4", "", i18n.t(k)));
        block.appendChild(el("p", "", text));
        story.appendChild(block);
    });
    body.appendChild(story);

    const foot = el("div", "single-foot");
    foot.appendChild(el("span", "single-stack", (item.stack || []).slice(0, 4).join("  /  ")));
    body.appendChild(foot);

    // "Ler o case" mora no canto de cima (lá embaixo o mini player tampava)
    const btn = el("button", "btn btn-ghost btn-sm single-open");
    btn.type = "button";
    btn.appendChild(el("span", "", i18n.t("case.open")));
    btn.appendChild(icon("ph:arrow-up-right-bold"));
    btn.addEventListener("click", () => openProjectModal(item));
    card.appendChild(btn);

    card.appendChild(body);

    // o card inteiro abre o case; o botão continua sendo o caminho pro teclado ⌨️
    card.addEventListener("click", (e) => {
        if (e.target.closest("a, button")) return;
        if (window.getSelection && String(window.getSelection()).length) return; // tava só selecionando texto
        openProjectModal(item);
    });
    return card;
}

function buildTrack(item) {
    const li = el("li");
    const btn = el("button", "track reveal");
    btn.type = "button";
    btn.appendChild(el("span", "track-code", item.track));

    const main = el("span", "track-main");
    main.appendChild(el("span", "track-name", nameOf(item)));
    main.appendChild(el("span", "track-tag", i18n.field(item.tagline)));
    btn.appendChild(main);

    const client = el("span", "track-client", i18n.field(item.client));
    if (item.live) client.appendChild(buildLive(item.id));
    btn.appendChild(client);
    const first = (item.impact || []).find(m => m && m.value);
    btn.appendChild(el("span", "track-metric", first ? `${first.value} ${i18n.field(first.label)}` : ""));
    const arrow = icon("ph:arrow-up-right-bold");
    arrow.classList.add("track-arrow");
    btn.appendChild(arrow);

    btn.setAttribute("aria-label", `${item.track}, ${nameOf(item)}. ${i18n.t("case.open")}`);
    btn.addEventListener("click", () => openProjectModal(item));
    li.appendChild(btn);
    return li;
}

// ============================================================
// LADO B: bento
// ============================================================
const TONES = { "casa-inteligente": "tone-accent", "design": "tone-sleeve" };

function buildCell(item) {
    const cell = el("article", "cell reveal");
    const tone = TONES[item.id];

    if (item.thumbnail) {
        cell.classList.add("has-media");
        const media = el("div", "cell-media");
        const img = document.createElement("img");
        img.src = item.thumbnail;
        img.alt = `${nameOf(item)}, ${i18n.t("modal.image").toLowerCase()} 1`;
        img.loading = "lazy";
        img.decoding = "async";
        media.appendChild(img);
        cell.appendChild(media);
    } else {
        cell.classList.add(tone || "tone-sleeve");
        cell.appendChild(el("span", "cell-big", item.track)).setAttribute("aria-hidden", "true");
    }

    const meta = el("p", "cell-meta");
    meta.appendChild(el("span", "track-code", item.track));
    meta.appendChild(el("span", "", i18n.field(item.client)));
    if (item.live) meta.appendChild(buildLive(item.id));
    cell.appendChild(meta);
    cell.appendChild(el("h3", "cell-name", nameOf(item)));
    cell.appendChild(el("p", "cell-tag", i18n.field(item.tagline)));

    const actions = el("div", "cell-actions");
    const links = item.links || {};
    if (item.id === "reino-infinito" && links.demo) {
        const play = el("button", "chip-btn solid");
        play.type = "button";
        play.appendChild(icon("ph:game-controller-fill"));
        play.appendChild(el("span", "", i18n.t("b.play")));
        play.addEventListener("click", () => openGame(links.demo));
        actions.appendChild(play);
    } else if (links.demo) {
        const a = el("a", "chip-btn solid");
        a.href = links.demo;
        a.target = "_blank";
        a.rel = "noopener";
        a.appendChild(icon("ph:arrow-up-right-bold"));
        a.appendChild(el("span", "", i18n.t("b.visit")));
        actions.appendChild(a);
    }
    if (links.repo) {
        const a = el("a", "chip-btn solid");
        a.href = links.repo;
        a.target = "_blank";
        a.rel = "noopener";
        a.appendChild(icon("ph:github-logo"));
        a.appendChild(el("span", "", i18n.t("b.code")));
        actions.appendChild(a);
    }
    const more = el("button", "chip-btn");
    more.type = "button";
    more.appendChild(el("span", "", i18n.t("b.more")));
    more.addEventListener("click", () => openProjectModal(item));
    actions.appendChild(more);
    cell.appendChild(actions);

    return cell;
}

// ============================================================
// Faixa bônus: discografia e formação
// ============================================================
function buildTimeline(list, containerId) {
    const ul = document.getElementById(containerId);
    if (!ul) return;
    ul.innerHTML = "";
    list.forEach(item => {
        const li = el("li", "reveal");
        const img = document.createElement("img");
        img.src = item.photo;
        img.alt = "";
        img.width = 40;
        img.height = 40;
        img.loading = "lazy";
        li.appendChild(img);
        const text = el("div");
        text.appendChild(el("p", "tl-date", i18n.field(item.date)));
        text.appendChild(el("p", "tl-name", i18n.field(item.name)));
        text.appendChild(el("p", "tl-role", i18n.field(item.ocupation)));
        if (item.description) text.appendChild(el("p", "tl-desc", i18n.field(item.description)));
        li.appendChild(text);
        ul.appendChild(li);
    });
}

let career = [];
let studies = [];

function renderAll() {
    const singles = document.getElementById("singles");
    const tracklist = document.getElementById("tracklist");
    const bento = document.getElementById("bento");

    const sideA = projects.filter(p => p.side === "A");
    if (singles) {
        singles.innerHTML = "";
        sideA.filter(p => p.featured).forEach((p, i) => singles.appendChild(buildSingle(p, i)));
    }
    if (tracklist) {
        tracklist.innerHTML = "";
        sideA.filter(p => !p.featured).forEach(p => tracklist.appendChild(buildTrack(p)));
    }
    if (bento) {
        bento.innerHTML = "";
        projects.filter(p => p.side === "B").forEach(p => bento.appendChild(buildCell(p)));
    }
    buildTimeline(career, "career");
    buildTimeline(studies, "studies");
}

async function loadData() {
    try {
        [projects, career, studies] = await Promise.all([
            getJSON("assets/dados/projects.json"),
            getJSON("assets/dados/work.json"),
            getJSON("assets/dados/studies.json")
        ]);
    } catch (error) {
        console.log('Erro ao carregar JSON:', error);
    }
    renderAll();
    initMotion();
    checkLive();
}

// ============================================================
// 🎛️ Menu que vira player: "faixa 02/06, Projetos" + barrinha de progresso
// ============================================================
const PLAYER_SECTIONS = ["presentation", "lado-a", "lado-b", "como-trabalho", "sobre", "contato"];
let currentSection = "presentation";

function paintPlayer() {
    const idx = PLAYER_SECTIONS.indexOf(currentSection);
    const pad = n => String(n).padStart(2, "0");
    const track = document.getElementById("navTrack");
    const title = document.getElementById("navTitle");
    if (track) track.textContent = `${pad(idx + 1)}/${pad(PLAYER_SECTIONS.length)}`;
    if (title) title.textContent = i18n.t(`sec.${currentSection}`);
    document.body.classList.toggle("nav-playing", idx > 0);
    document.querySelectorAll(".nav-links a").forEach(a => {
        a.classList.toggle("active", a.getAttribute("href") === `#${currentSection}`);
    });
}

function initPlayer() {
    if (!("IntersectionObserver" in window)) return;
    // a seção "da vez" é a que cruza a faixa do meio da tela
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { currentSection = e.target.id; paintPlayer(); }
        });
    }, { rootMargin: "-45% 0px -50% 0px" });
    PLAYER_SECTIONS.forEach(id => { const n = document.getElementById(id); if (n) io.observe(n); });

    // progresso do "disco" = progresso da página (ScrollTrigger, nada de scroll listener)
    const bar = document.getElementById("navProgress");
    if (bar && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: self => { bar.style.transform = `scaleX(${self.progress.toFixed(4)})`; }
        });
    }
    paintPlayer();
}

// ============================================================
// 🧲 Letras-ímã: dá pra arrastar o recorte, e ele volta sozinho pro lugar
// (só com mouse/caneta: no celular o dedo continua rolando a página)
// ============================================================
function initMagnets() {
    let drag = null;

    document.addEventListener("pointerdown", e => {
        const l = e.target.closest?.(".rl");
        if (!l || e.pointerType === "touch" || e.button !== 0) return;
        e.preventDefault();
        if (window.gsap) gsap.killTweensOf(l);
        const dx = parseFloat(l.style.getPropertyValue("--dx")) || 0;
        const dy = parseFloat(l.style.getPropertyValue("--dy")) || 0;
        drag = { l, x: e.clientX - dx, y: e.clientY - dy };
        l.classList.add("is-dragging");
        l.setPointerCapture?.(e.pointerId);
    });

    document.addEventListener("pointermove", e => {
        if (!drag) return;
        drag.l.style.setProperty("--dx", `${e.clientX - drag.x}px`);
        drag.l.style.setProperty("--dy", `${e.clientY - drag.y}px`);
    });

    const release = () => {
        if (!drag) return;
        const l = drag.l;
        drag = null;
        l.classList.remove("is-dragging");
        // um respiro e... tchum, volta pro lugar com mola 🪀
        if (window.gsap && !prefersReducedMotion) {
            const state = {
                x: parseFloat(l.style.getPropertyValue("--dx")) || 0,
                y: parseFloat(l.style.getPropertyValue("--dy")) || 0
            };
            gsap.to(state, {
                x: 0, y: 0, delay: 1.2, duration: 1.1, ease: "elastic.out(1, 0.45)",
                onUpdate: () => {
                    l.style.setProperty("--dx", `${state.x}px`);
                    l.style.setProperty("--dy", `${state.y}px`);
                }
            });
        } else {
            l.style.setProperty("--dx", "0px");
            l.style.setProperty("--dy", "0px");
        }
    };
    document.addEventListener("pointerup", release);
    document.addEventListener("pointercancel", release);
}

// ============================================================
// 🎧 Ouvindo agora (Last.fm via /api/now-playing). Sem config, some.
// ============================================================
let nowPlaying = null;

function paintNowPlaying() {
    const box = document.getElementById("nowPlaying");
    if (!box || !nowPlaying) return;
    box.href = nowPlaying.url || "#";
    document.getElementById("npLabel").textContent = i18n.t(nowPlaying.playing ? "np.playing" : "np.last");
    document.getElementById("npSong").textContent = [nowPlaying.title, nowPlaying.artist].filter(Boolean).join(" · ");
    const img = document.getElementById("npCover");
    if (nowPlaying.image) { img.src = nowPlaying.image; img.hidden = false; } else { img.hidden = true; }
    box.classList.toggle("is-live", !!nowPlaying.playing);
    box.hidden = false;
}

async function loadNowPlaying() {
    try {
        const r = await fetch("/api/now-playing", { cache: "no-store" });
        if (r.status !== 200 || !(r.headers.get("content-type") || "").includes("json")) return;
        const data = await r.json();
        if (!data.title) return;
        nowPlaying = data;
        paintNowPlaying();
    } catch (e) { /* sem Last.fm configurado, sem widget */ }
}

// ============================================================
// ENCARTE: o case completo (modal)
// ============================================================
let currentGalleryIndex = 0;
let modalImages = [];
let modalMainImg = null;
let modalDots = [];
let currentModalItem = null;   // projeto aberto (pro re-render na troca de idioma)
let lastFocusedElement = null; // devolve o foco pra quem abriu o modal

function fillSection(id, title, text) {
    const sec = document.getElementById(id);
    if (!sec) return;
    sec.querySelector("h3").textContent = title;
    sec.querySelector("p").textContent = text || "";
    sec.style.display = text ? "" : "none";
}

function renderProjectModal(item) {
    document.getElementById("modalProjectName").textContent = nameOf(item);

    const metaEl = document.getElementById("modalMeta");
    metaEl.innerHTML = "";
    metaEl.appendChild(el("span", "track-code", item.track));
    metaEl.appendChild(document.createTextNode(
        [i18n.field(item.client), i18n.field(item.period), i18n.field(item.role)].filter(Boolean).join(", ")
    ));

    if (item.live) metaEl.appendChild(buildLive(item.id));

    document.getElementById("modalTagline").textContent = i18n.field(item.tagline);

    // Números primeiro 📊
    const impactEl = document.getElementById("modalImpact");
    impactEl.innerHTML = "";
    const impact = (item.impact || []).filter(m => m && m.value);
    impact.slice(0, 4).forEach(m => impactEl.appendChild(buildMetric(m)));
    impactEl.style.display = impact.length ? "" : "none";

    fillSection("modalProblem", i18n.t("case.problem"), i18n.field(item.problem));
    fillSection("modalOverview", i18n.t("case.did"), i18n.field(item.longDescription));

    const highlights = document.getElementById("modalHighlights");
    const hl = i18n.field(item.highlights);
    const hlItems = Array.isArray(hl) ? hl.filter(Boolean) : [];
    highlights.querySelector("h3").textContent = i18n.t("modal.highlights");
    const ul = highlights.querySelector("ul");
    ul.innerHTML = "";
    hlItems.forEach(h => ul.appendChild(el("li", "", h)));
    highlights.style.display = hlItems.length ? "" : "none";

    const back = document.getElementById("modalBackstage");
    const bs = item.backstage;
    if (bs && i18n.field(bs.text)) {
        back.querySelector("h3").textContent = i18n.t("case.backstage");
        back.querySelector("h4").textContent = i18n.field(bs.title);
        back.querySelector("p").textContent = i18n.field(bs.text);
        back.style.display = "";
    } else {
        back.style.display = "none";
    }

    const stackSec = document.getElementById("modalStack");
    const stack = Array.isArray(item.stack) ? item.stack : [];
    stackSec.querySelector("h3").textContent = i18n.t("modal.stack");
    const chips = stackSec.querySelector(".chips");
    chips.innerHTML = "";
    stack.forEach(t => chips.appendChild(el("span", "", t)));
    stackSec.style.display = stack.length ? "" : "none";

    // CTAs: só os links preenchidos
    const linksEl = document.getElementById("modalLinks");
    linksEl.innerHTML = "";
    const links = item.links || {};
    if (links.demo) {
        if (item.id === "reino-infinito") {
            const b = el("button", "btn btn-accent btn-sm");
            b.type = "button";
            b.appendChild(icon("ph:game-controller-fill"));
            b.appendChild(el("span", "", i18n.t("modal.play")));
            b.addEventListener("click", () => { closeProjectModal(); openGame(links.demo); });
            linksEl.appendChild(b);
        } else {
            const a = el("a", "btn btn-accent btn-sm");
            a.href = links.demo;
            a.target = "_blank";
            a.rel = "noopener";
            a.appendChild(icon("ph:arrow-up-right-bold"));
            a.appendChild(el("span", "", i18n.t("modal.demo")));
            linksEl.appendChild(a);
        }
    }
    if (links.repo) {
        const a = el("a", "btn btn-ghost btn-sm");
        a.href = links.repo;
        a.target = "_blank";
        a.rel = "noopener";
        a.appendChild(icon("ph:github-logo"));
        a.appendChild(el("span", "", i18n.t("modal.code")));
        linksEl.appendChild(a);
    }
    linksEl.style.display = linksEl.children.length ? "" : "none";

    // Galeria: sem imagem nenhuma, ela nem aparece 🫥
    modalImages = (Array.isArray(item.screenshots) && item.screenshots.length)
        ? item.screenshots
        : (item.thumbnail ? [item.thumbnail] : []);
    document.getElementById("modalGalleryArea").style.display = modalImages.length ? "" : "none";

    const imageWrap = document.querySelector("#galleryMain .gallery-image-wrap");
    imageWrap.innerHTML = "";
    modalMainImg = null;
    if (modalImages.length) {
        modalMainImg = document.createElement("img");
        imageWrap.appendChild(modalMainImg);
    }

    const multi = modalImages.length > 1;
    document.getElementById("galleryPrev").style.display = multi ? "" : "none";
    document.getElementById("galleryNext").style.display = multi ? "" : "none";

    const dots = document.getElementById("galleryDots");
    dots.innerHTML = "";
    modalDots = [];
    if (multi) modalImages.forEach((src, i) => {
        const dot = el("button", "dot");
        dot.type = "button";
        dot.setAttribute("aria-label", `${i18n.t("modal.image")} ${i + 1}`);
        dot.addEventListener("click", () => showSlide(i));
        dots.appendChild(dot);
        modalDots.push(dot);
    });

    showSlide(0);
}

function showSlide(index) {
    if (!modalImages.length) return;
    if (index < 0) index = modalImages.length - 1;
    if (index >= modalImages.length) index = 0;
    currentGalleryIndex = index;
    if (modalMainImg) {
        modalMainImg.src = modalImages[index];
        modalMainImg.alt = `${currentModalItem ? nameOf(currentModalItem) : ""}, ${i18n.t("modal.image").toLowerCase()} ${index + 1}`;
    }
    modalDots.forEach((d, i) => d.classList.toggle("active", i === index));
}

function lockBackground(on) {
    document.documentElement.classList.toggle("scroll-locked", on);
    const main = document.getElementById("portifolio");
    const nav = document.getElementById("menu");
    if (main) main.inert = on;
    if (nav) nav.inert = on;
}

function openProjectModal(item) {
    const modal = document.getElementById("projectModal");
    currentModalItem = item;
    lastFocusedElement = document.activeElement;
    renderProjectModal(item);
    modal.querySelector(".modal-content").scrollTop = 0;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    lockBackground(true);
    document.getElementById("closeModal")?.focus();
}

function closeProjectModal() {
    const modal = document.getElementById("projectModal");
    if (!modal.classList.contains("open")) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    currentModalItem = null;
    lockBackground(false);
    lastFocusedElement?.focus?.();
    lastFocusedElement = null;
}

// ---------- Fliperama 🕹️ ----------
function openGame(src) {
    const gm = document.getElementById("gameModal");
    const frame = document.getElementById("gameIframe");
    if (isPlaying) playMusic(); // dois sons ao mesmo tempo não dá
    lastFocusedElement = lastFocusedElement || document.activeElement;
    frame.src = src;
    gm.classList.add("open");
    gm.setAttribute("aria-hidden", "false");
    lockBackground(true);
    document.getElementById("closeGame")?.focus();
}

function closeGame() {
    const gm = document.getElementById("gameModal");
    if (!gm.classList.contains("open")) return;
    gm.classList.remove("open");
    gm.setAttribute("aria-hidden", "true");
    document.getElementById("gameIframe").src = "about:blank"; // desliga o som do jogo
    lockBackground(false);
    lastFocusedElement?.focus?.();
    lastFocusedElement = null;
}

document.getElementById("closeModal")?.addEventListener("click", closeProjectModal);
document.getElementById("closeGame")?.addEventListener("click", closeGame);
document.getElementById("projectModal")?.addEventListener("click", (e) => {
    if (e.target.id === "projectModal") closeProjectModal();
});
document.getElementById("gameModal")?.addEventListener("click", (e) => {
    if (e.target.id === "gameModal") closeGame();
});
document.getElementById("galleryPrev")?.addEventListener("click", () => showSlide(currentGalleryIndex - 1));
document.getElementById("galleryNext")?.addEventListener("click", () => showSlide(currentGalleryIndex + 1));

document.addEventListener("keydown", (e) => {
    const modalOpen = document.getElementById("projectModal")?.classList.contains("open");
    const gameOpen = document.getElementById("gameModal")?.classList.contains("open");
    if (e.key === "Escape") {
        if (gameOpen) closeGame();
        if (modalOpen) closeProjectModal();
        return;
    }
    if (!modalOpen) return;
    if (e.key === "ArrowRight") showSlide(currentGalleryIndex + 1);
    if (e.key === "ArrowLeft") showSlide(currentGalleryIndex - 1);
    // Tab fica preso dentro do case (focus trap ⌨️)
    if (e.key === "Tab") {
        const content = document.querySelector("#projectModal .modal-content");
        const focusables = [...content.querySelectorAll("button, a[href]")].filter(f => f.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
});

// ============================================================
// Números que sobem quando aparecem 📈
// ============================================================
function formatCount(n, el) {
    const locale = document.documentElement.lang || "pt-BR";
    return new Intl.NumberFormat(locale).format(n) + (el.dataset.suffix || "");
}

function initStats() {
    const stats = [...document.querySelectorAll("[data-count]")];
    const setFinal = s => { s.textContent = formatCount(Number(s.dataset.count), s); s.dataset.done = "1"; };
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        stats.forEach(setFinal);
        return;
    }
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const s = entry.target;
            io.unobserve(s);
            const target = Number(s.dataset.count);
            const start = performance.now();
            const dur = 1400;
            const tick = now => {
                const t = Math.min(1, (now - start) / dur);
                const eased = 1 - Math.pow(1 - t, 4);
                s.textContent = formatCount(Math.round(target * eased), s);
                if (t < 1) requestAnimationFrame(tick); else setFinal(s);
            };
            requestAnimationFrame(tick);
        });
    }, { threshold: 0.6 });
    stats.forEach(s => io.observe(s));
}

// ============================================================
// Movimento (GSAP): cada animação tem um motivo
// ============================================================
let motionReady = false;

// Abertura: o disco desliza pra fora da capa, como quem tira o LP da embalagem.
// Roda na hora, sem esperar o JSON chegar.
function initIntro() {
    if (prefersReducedMotion || !window.gsap) return;
    gsap.timeline({ defaults: { ease: "expo.out" } })
        .from(".sleeve", { y: 40, opacity: 0, duration: 1 })
        .from(".vinyl", { xPercent: -38, rotate: -120, duration: 1.4 }, "-=0.7")
        .from(".hero-title, .hero-sub, .hero-ctas", { y: 24, opacity: 0, stagger: 0.08, duration: 0.9 }, "-=1.2");
}

function initMotion() {
    if (motionReady || prefersReducedMotion || !window.gsap || !window.ScrollTrigger) return;
    motionReady = true;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("js-motion");

    // Revelação no scroll: guia o olho pro que acabou de entrar
    ScrollTrigger.batch(".reveal", {
        start: "top 88%",
        once: true,
        onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.06, duration: 0.8, ease: "expo.out", overwrite: true })
    });

    // Pilha de singles: o disco de cima empurra o de baixo pro fundo
    gsap.matchMedia().add("(min-width: 961px)", () => {
        const cards = gsap.utils.toArray(".single");
        cards.forEach((card, i) => {
            const next = cards[i + 1];
            if (!next) return;
            // só recua um pouquinho: o de cima cobre o de baixo, sem transparência
            gsap.to(card, {
                scale: 0.96,
                ease: "none",
                scrollTrigger: { trigger: next, start: "top bottom", end: "top 140px", scrub: true }
            });
        });
    });
}

// ============================================================
// Idioma 🔁
// ============================================================
document.querySelectorAll("[data-lang-opt]").forEach(btn => {
    btn.addEventListener("click", () => i18n.setLang(btn.dataset.langOpt));
});

document.addEventListener("langchange", () => {
    ransomizeAll();
    paintPlayer();
    paintNowPlaying();
    if (projects.length) {
        renderAll();
        document.querySelectorAll("[data-live]").forEach(paintLive);
        // conteúdo novo entra já visível (a revelação é só na primeira passada)
        document.querySelectorAll(".reveal").forEach(n => { n.style.opacity = 1; n.style.transform = "none"; });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
    }
    document.querySelectorAll("[data-count][data-done]").forEach(s => {
        s.textContent = formatCount(Number(s.dataset.count), s);
    });
    if (isPlaying && nameTitle) nameTitle.textContent = i18n.t("hero.nowPlaying");
    // case aberto também troca de língua na hora
    if (currentModalItem && document.getElementById('projectModal')?.classList.contains('open')) {
        renderProjectModal(currentModalItem);
    }
});

ransomizeAll();
initIntro();
initStats();
initPlayer();
initMagnets();
loadData();
loadNowPlaying();
