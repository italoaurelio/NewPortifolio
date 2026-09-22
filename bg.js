// ============================================================
// 〰️ Fundo "Unknown Pleasures": linhas de onda empilhadas, tipo a capa
// do Joy Division. O mouse levanta um morro onde passa, e quando a
// música toca (clicando na foto) as ondas batem junto com o grave.
// ============================================================
(() => {
    const canvas = document.getElementById("bg-waves");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");

    let W = 0, H = 0, gap = 14, step = 8;
    let colors = { bg: "#0e1315", line: "rgba(236,235,230,.16)", hot: "#ff6b3d" };
    // posição suavizada do mouse (tx/ty = alvo, x/y = onde o morro está)
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, power: 0, target: 0 };
    let running = false;
    let raf = 0;

    function readColors() {
        const cs = getComputedStyle(document.documentElement);
        colors = {
            bg: cs.getPropertyValue("--bg").trim() || colors.bg,
            line: cs.getPropertyValue("--wave").trim() || colors.line,
            hot: cs.getPropertyValue("--accent").trim() || colors.hot
        };
    }

    function resize() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // celular: menos linhas, menos pontos (a bateria agradece 🔋)
        gap = W < 700 ? 26 : 22;
        step = W < 700 ? 12 : 9;
        if (!running) draw(0);
    }

    // ruído barato: soma de senos (não precisa de Perlin pra parecer vivo)
    function wave(x, row, t) {
        // devagar: fundo é pra respirar, não pra chamar atenção
        return Math.sin(x * 0.010 + t * 0.35 + row * 0.9) * 0.6
            + Math.sin(x * 0.024 - t * 0.5 + row * 2.3) * 0.3
            + Math.sin(x * 0.05 + t * 0.8 + row * 4.1) * 0.1;
    }

    function draw(time) {
        const t = time / 1000;
        mouse.x += (mouse.tx - mouse.x) * 0.1;
        mouse.y += (mouse.ty - mouse.y) * 0.1;
        mouse.power += (mouse.target - mouse.power) * 0.06;

        const level = window.__musicLevel ? window.__musicLevel() : 0;
        const cx = W * 0.5;
        const spread = W * 0.3;
        const hillW = 2 * 120 * 120;
        const hillH = 2 * 150 * 150;

        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, W, H);
        ctx.lineWidth = 1;

        let row = 0;
        for (let y = gap * 3; y < H + gap * 2; y += gap, row++) {
            const pts = [];
            for (let x = -step; x <= W + step; x += step) {
                // o "pulso" mora no centro, como no gráfico original do pulsar
                const env = Math.exp(-((x - cx) * (x - cx)) / (2 * spread * spread));
                const dx = x - mouse.x;
                const dy = y - mouse.y;
                const hill = Math.exp(-(dx * dx) / hillW - (dy * dy) / hillH) * mouse.power;
                const amp = env * (6 + level * 34) + hill * (46 + level * 20);
                const v = Math.max(0, wave(x, row, t) * 0.65 + 0.35) * amp;
                pts.push(x, y - v);
            }

            // pinta o chão da linha com a cor do fundo: a linha da frente esconde a de trás
            ctx.beginPath();
            ctx.moveTo(pts[0], pts[1]);
            for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
            ctx.lineTo(W + step, y + gap * 1.5);
            ctx.lineTo(-step, y + gap * 1.5);
            ctx.closePath();
            ctx.fillStyle = colors.bg;
            ctx.fill();

            // e só então risca a crista
            ctx.beginPath();
            ctx.moveTo(pts[0], pts[1]);
            for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
            const near = Math.abs(y - mouse.y) < 170 && mouse.power > 0.05;
            if (near) {
                // perto do mouse a linha esquenta (laranja do adesivo)
                const g = ctx.createLinearGradient(mouse.x - 220, 0, mouse.x + 220, 0);
                g.addColorStop(0, colors.line);
                g.addColorStop(0.5, colors.hot);
                g.addColorStop(1, colors.line);
                ctx.strokeStyle = g;
                ctx.globalAlpha = 0.25 + 0.4 * mouse.power * (1 - Math.abs(y - mouse.y) / 170);
                ctx.lineWidth = 1.2;
            } else {
                ctx.strokeStyle = colors.line;
                ctx.globalAlpha = 1;
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.lineWidth = 1;
        }
    }

    function loop(time) {
        draw(time);
        raf = requestAnimationFrame(loop);
    }

    function start() {
        if (running || reduceMotion.matches || document.hidden) return;
        running = true;
        raf = requestAnimationFrame(loop);
    }

    function stop() {
        running = false;
        cancelAnimationFrame(raf);
    }

    window.addEventListener("pointermove", (e) => {
        mouse.tx = e.clientX;
        mouse.ty = e.clientY;
        if (mouse.x < -1000) { mouse.x = e.clientX; mouse.y = e.clientY; }
        mouse.target = 1;
    }, { passive: true });
    document.addEventListener("pointerleave", () => { mouse.target = 0; });
    window.addEventListener("blur", () => { mouse.target = 0; });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    darkScheme.addEventListener?.("change", () => { readColors(); if (!running) draw(0); });
    reduceMotion.addEventListener?.("change", () => { reduceMotion.matches ? (stop(), draw(0)) : start(); });

    // fora da capa, o CSS abaixa a opacidade do fundo
    const hero = document.getElementById("presentation");
    if (hero && "IntersectionObserver" in window) {
        new IntersectionObserver(([entry]) => {
            document.body.classList.toggle("past-hero", entry.intersectionRatio < 0.15);
        }, { threshold: 0.15 }).observe(hero);
    }

    readColors();
    resize();
    start();
})();
