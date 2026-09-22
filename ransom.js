// Recorte de revista reutilizável (index e 404) ✂️
function mk(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null && text !== "") node.textContent = text;
    return node;
}

// ============================================================
// ✂️ Letras recortadas de revista (bilhete de resgate, versão punk-zine)
// Cada letra ganha fonte, papel e inclinação próprios. É pseudoaleatório
// com semente no texto: a mesma palavra sai sempre igual.
// ============================================================
const RANSOM_FONTS = 7;
const RANSOM_TONES = ["paper", "news", "ink", "accent", "teal", "bare"];
const RANSOM_CLIPS = 4;

function seeded(str) {
    let h = 2166136261;
    for (const c of str) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
    return () => {
        h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
        return ((h >>> 0) % 10000) / 10000;
    };
}

function ransomize(node) {
    // já recortado e o i18n não mexeu? deixa quieto
    if (node.querySelector(".sr-only")) return;
    const text = node.textContent.replace(/\s+/g, " ").trim();
    if (!text) return;
    const skip = (node.dataset.ransomSkip || "").split(",");
    const tones = RANSOM_TONES.filter(t => !skip.includes(t));
    const rnd = seeded(text);
    node.textContent = "";

    // leitor de tela lê a palavra inteira, não letra por letra
    node.appendChild(mk("span", "sr-only", text));

    let lastTone = "";
    let lastFont = -1;
    text.split(" ").forEach((word, wi) => {
        if (wi > 0) node.appendChild(document.createTextNode(" "));
        const w = mk("span", "rw");
        w.setAttribute("aria-hidden", "true");
        [...word].forEach(ch => {
            let tone, font;
            do { tone = tones[Math.floor(rnd() * tones.length)]; } while (tone === lastTone && tones.length > 1);
            do { font = Math.floor(rnd() * RANSOM_FONTS); } while (font === lastFont);
            lastTone = tone;
            lastFont = font;
            const l = mk("span", "rl", rnd() < 0.28 ? (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()) : ch);
            l.dataset.t = tone;
            l.dataset.f = String(font);
            l.style.setProperty("--r", `${((rnd() - 0.5) * 12).toFixed(1)}deg`);
            l.style.setProperty("--y", `${((rnd() - 0.5) * 0.12).toFixed(3)}em`);
            l.style.setProperty("--s", (0.86 + rnd() * 0.26).toFixed(2));
            l.style.setProperty("--k", (0.04 + rnd() * 0.1).toFixed(3));
            l.dataset.c = String(Math.floor(rnd() * RANSOM_CLIPS));
            w.appendChild(l);
        });
        node.appendChild(w);
    });
}

function ransomizeAll() {
    document.querySelectorAll(".ransom").forEach(ransomize);
}
