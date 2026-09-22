// 🎧 O que o Ítalo está ouvindo, via Last.fm (o YouTube Music não tem API
// de "tocando agora"; um scrobbler manda as músicas pro Last.fm e a gente lê daqui).
// Precisa de LASTFM_API_KEY e LASTFM_USER nas variáveis de ambiente da Vercel.
// Sem elas, responde 204 e o site simplesmente não mostra o widget.
export default async function handler(req, res) {
    const key = process.env.LASTFM_API_KEY;
    const user = process.env.LASTFM_USER;
    if (!key || !user) {
        res.status(204).end();
        return;
    }

    const url = "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks"
        + `&user=${encodeURIComponent(user)}&api_key=${encodeURIComponent(key)}&format=json&limit=1`;

    try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`last.fm ${r.status}`);
        const data = await r.json();
        const track = data?.recenttracks?.track?.[0];
        if (!track) {
            res.status(204).end();
            return;
        }
        const image = (track.image || []).find(i => i.size === "medium")?.["#text"] || "";
        res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
        res.status(200).json({
            playing: track["@attr"]?.nowplaying === "true",
            title: track.name || "",
            artist: track.artist?.["#text"] || "",
            image,
            url: track.url || ""
        });
    } catch (e) {
        res.status(204).end();
    }
}
