// Sistemas ao vivo 🟢: a Vercel bate na porta de cada sistema público e
// devolve se respondeu e em quanto tempo. Cache de 60s pra não virar DDoS
// de portfólio.
const TARGETS = {
    "ingressos-fojb": "https://ingressosfojb.com.br/",
    "quando-da": "https://quando-da.vercel.app/",
    "gradment": "https://gradment.linceonline.com.br/"
};

async function check(url) {
    const started = Date.now();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
        const res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal });
        return { up: res.status < 500, code: res.status, ms: Date.now() - started };
    } catch (e) {
        return { up: false, code: 0, ms: Date.now() - started };
    } finally {
        clearTimeout(timer);
    }
}

export default async function handler(req, res) {
    const ids = Object.keys(TARGETS);
    const results = await Promise.all(ids.map(id => check(TARGETS[id])));
    const body = {};
    ids.forEach((id, i) => { body[id] = results[i]; });
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    res.status(200).json({ checkedAt: new Date().toISOString(), systems: body });
}
