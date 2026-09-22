/* ============================================================
   Cadastro de Projetos — gera o assets/dados/projects.json
   100% client-side. Rascunho salvo no localStorage.
   ============================================================ */

const STORAGE_KEY = 'portfolio_projects_draft_v2'; // v2 = schema bilíngue {en, pt}
const JSON_PATH = 'assets/dados/projects.json';
const MAX_IMPACT = 4;

let formLang = 'en'; // qual idioma o formulário está mostrando (os dois são salvos)

// Campo pode ser string (legado) ou {en, pt} — pega o idioma pedido 🤝
function pickLang(v, lang) {
    if (v == null) return '';
    if (typeof v === 'string') return lang === 'en' ? v : '';
    if (Array.isArray(v)) return lang === 'en' ? v : [];
    return v[lang] ?? (lang === 'en' ? '' : '');
}

// Texto "de vitrine" (nome, cliente): string ou {pt, en, es}
function txt(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return v.pt || v.en || v.es || '';
}

function pickLangArr(v, lang) {
    const out = pickLang(v, lang);
    return Array.isArray(out) ? out : [];
}

let projects = [];        // lista atual
let editingIndex = null;  // null = criando novo
let thumbData = '';       // data URI ou caminho do thumbnail
let shotsData = [];       // array de data URIs / caminhos

const $ = (sel) => document.querySelector(sel);
const form = $('#projectForm');

/* ---------------- Utils ---------------- */
function slugify(str) {
    return (str || '')
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function linesToArray(text) {
    return (text || '')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);
}

function csvToArray(text) {
    return (text || '')
        .split(',')
        .map(l => l.trim())
        .filter(Boolean);
}

function toast(msg, isError = false) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.toggle('error', isError);
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

function readImageFile(file) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) return reject(new Error('Arquivo inválido'));
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/* ---------------- Persistência ---------------- */
function saveDraft() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
        console.warn('Não foi possível salvar rascunho', e);
    }
}

async function loadInitial() {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) {
        try {
            projects = JSON.parse(draft);
            renderList();
            toast('Rascunho recuperado (do seu navegador)');
            return;
        } catch (e) { /* ignora e busca do arquivo */ }
    }
    await loadFromFile();
}

async function loadFromFile() {
    try {
        const res = await fetch(JSON_PATH, { cache: 'no-store' });
        projects = await res.json();
        saveDraft();
        renderList();
        toast('Projetos carregados do site');
    } catch (e) {
        projects = [];
        renderList();
        toast('Nenhum projects.json encontrado — começando do zero', true);
    }
}

/* ---------------- Lista + reordenação ---------------- */
function renderList() {
    const list = $('#projectList');
    list.innerHTML = '';
    $('#projectCount').textContent = projects.length;

    projects.forEach((p, i) => {
        const li = document.createElement('li');
        li.className = 'project-item' + (i === editingIndex ? ' active' : '');
        li.draggable = true;
        li.dataset.index = i;

        const thumb = p.thumbnail
            ? `<img src="${p.thumbnail}" alt="">`
            : `<span class="thumb-empty"><iconify-icon icon="mdi:image-off"></iconify-icon></span>`;

        li.innerHTML = `
            ${thumb}
            <div class="pi-body">
                <div class="pi-name">${escapeHtml(txt(p.name) || '(sem nome)')}</div>
                <div class="pi-meta">${escapeHtml([txt(p.client), pickLang(p.period, formLang) || pickLang(p.period, 'en')].filter(Boolean).join(' · '))}</div>
            </div>
            <iconify-icon icon="mdi:drag" class="drag-handle"></iconify-icon>
        `;

        li.addEventListener('click', () => editProject(i));
        addDragHandlers(li);
        list.appendChild(li);
    });
}

let dragIndex = null;
function addDragHandlers(li) {
    li.addEventListener('dragstart', () => {
        dragIndex = Number(li.dataset.index);
        li.classList.add('dragging');
    });
    li.addEventListener('dragend', () => li.classList.remove('dragging'));
    li.addEventListener('dragover', (e) => e.preventDefault());
    li.addEventListener('drop', (e) => {
        e.preventDefault();
        const target = Number(li.dataset.index);
        if (dragIndex === null || dragIndex === target) return;
        const [moved] = projects.splice(dragIndex, 1);
        projects.splice(target, 0, moved);
        if (editingIndex === dragIndex) editingIndex = target;
        else if (editingIndex !== null) {
            // ajusta índice em edição se a reordenação o afetou
            editProjectIndexAfterReorder(dragIndex, target);
        }
        dragIndex = null;
        saveDraft();
        renderList();
    });
}

function editProjectIndexAfterReorder(from, to) {
    if (editingIndex === null) return;
    if (from < editingIndex && to >= editingIndex) editingIndex--;
    else if (from > editingIndex && to <= editingIndex) editingIndex++;
}

/* ---------------- Impact rows ---------------- */
function addImpactRow(label = '', value = '') {
    const wrap = $('#impactRows');
    if (wrap.children.length >= MAX_IMPACT) {
        toast(`Máximo de ${MAX_IMPACT} métricas`, true);
        return;
    }
    const row = document.createElement('div');
    row.className = 'impact-row';
    row.innerHTML = `
        <input type="text" class="impact-label lang-en" placeholder="Label EN (ex.: Users)" value="${escapeAttr(pickLang(label, 'en'))}">
        <input type="text" class="impact-label-pt lang-pt" placeholder="Rótulo PT (ex.: Usuários)" value="${escapeAttr(pickLang(label, 'pt'))}">
        <input type="text" class="impact-value" placeholder="Valor (ex.: ~5.770)" value="${escapeAttr(value)}">
        <button type="button" title="Remover"><iconify-icon icon="mdi:close"></iconify-icon></button>
    `;
    row.querySelector('button').addEventListener('click', () => { row.remove(); updatePreview(); });
    row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updatePreview));
    wrap.appendChild(row);
}

function getImpactRows() {
    return Array.from(document.querySelectorAll('.impact-row')).map(r => ({
        label: {
            en: r.querySelector('.impact-label').value.trim(),
            pt: r.querySelector('.impact-label-pt').value.trim()
        },
        value: r.querySelector('.impact-value').value.trim()
    })).filter(m => m.label.en || m.label.pt || m.value);
}

function escapeAttr(s) { return String(s).replace(/"/g, '&quot;'); }

/* ---------------- Imagens ---------------- */
function renderThumbPreview() {
    const wrap = $('#thumbPreviewWrap');
    if (thumbData) {
        wrap.innerHTML = `<img src="${thumbData}" alt="thumbnail">`;
    } else {
        wrap.innerHTML = `<iconify-icon icon="mdi:image-plus" class="drop-icon"></iconify-icon><span>Clique ou arraste uma imagem</span>`;
    }
}

function renderShots() {
    const grid = $('#shotsGrid');
    grid.innerHTML = '';
    shotsData.forEach((src, i) => {
        const div = document.createElement('div');
        div.className = 'shot-thumb';
        div.innerHTML = `<img src="${src}" alt=""><button type="button" title="Remover">&times;</button>`;
        div.querySelector('button').addEventListener('click', () => {
            shotsData.splice(i, 1);
            renderShots();
        });
        grid.appendChild(div);
    });
}

/* ---------------- Form <-> objeto ---------------- */
function collectProject() {
    const fd = new FormData(form);
    const get = (k) => (fd.get(k) || '').toString().trim();

    // Projeto que já existia: o que o form não edita (espanhol, lado A/B,
    // faixa, bastidores...) sobrevive intacto no merge 🧷
    const prev = editingIndex != null ? (projects[editingIndex] || {}) : {};
    const keep = (v) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};

    // Campos de texto viram {en, pt} (e o "es" antigo, se tiver, fica)
    const bi = (k, old = prev[k]) => ({ ...keep(old), en: get(`${k}_en`), pt: get(`${k}_pt`) });
    const biLines = (k, old = prev[k]) => ({ ...keep(old), en: linesToArray(get(`${k}_en`)), pt: linesToArray(get(`${k}_pt`)) });
    const nameVal = get('name');
    const name = (prev.name && typeof prev.name === 'object') ? { ...prev.name, pt: nameVal } : nameVal;
    const client = (prev.client && typeof prev.client === 'object') ? { ...prev.client, pt: get('client') } : get('client');

    return {
        ...prev,
        id: get('id') || slugify(nameVal),
        name,
        tagline: bi('tagline'),
        client,
        period: bi('period'),
        role: bi('role'),
        thumbnail: thumbData || '',
        shortDescription: bi('shortDescription'),
        longDescription: bi('longDescription'),
        stack: csvToArray(get('stack')),
        highlights: biLines('highlights'),
        infraInfo: {
            frontend: { title: 'Frontend', desc: bi('infra_frontend', prev.infraInfo?.frontend?.desc) },
            backend: { title: 'Backend', desc: bi('infra_backend', prev.infraInfo?.backend?.desc) },
            server: { title: 'Server', desc: bi('infra_server', prev.infraInfo?.server?.desc) },
            dataSources: linesToArray(get('infra_sources'))
        },
        impact: getImpactRows(),
        usageExample: biLines('usageExample'),
        screenshots: shotsData.slice(),
        links: {
            ...keep(prev.links),
            repo: get('link_repo'),
            demo: get('link_demo'),
            case: get('link_case')
        }
    };
}

function fillForm(p) {
    // nome/cliente podem ser {pt, en, es}: o form edita a versão em PT
    form.name.value = (p.name && typeof p.name === 'object') ? (p.name.pt || p.name.en || '') : (p.name || '');
    form.id.value = p.id || '';
    // aceita string legada OU {en, pt} — retrocompat com JSON velho importado
    for (const lang of ['en', 'pt']) {
        form[`tagline_${lang}`].value = pickLang(p.tagline, lang);
        form[`period_${lang}`].value = pickLang(p.period, lang);
        form[`role_${lang}`].value = pickLang(p.role, lang);
        form[`shortDescription_${lang}`].value = pickLang(p.shortDescription, lang);
        form[`longDescription_${lang}`].value = pickLang(p.longDescription, lang);
        form[`highlights_${lang}`].value = pickLangArr(p.highlights, lang).join('\n');
        form[`usageExample_${lang}`].value = pickLangArr(p.usageExample, lang).join('\n');
        form[`infra_frontend_${lang}`].value = pickLang(p.infraInfo?.frontend?.desc, lang);
        form[`infra_backend_${lang}`].value = pickLang(p.infraInfo?.backend?.desc, lang);
        form[`infra_server_${lang}`].value = pickLang(p.infraInfo?.server?.desc, lang);
    }
    form.client.value = (p.client && typeof p.client === 'object') ? (p.client.pt || p.client.en || '') : (p.client || '');
    form.stack.value = (p.stack || []).join(', ');
    form.infra_sources.value = (p.infraInfo?.dataSources || []).join('\n');
    form.link_repo.value = p.links?.repo || '';
    form.link_demo.value = p.links?.demo || '';
    form.link_case.value = p.links?.case || '';

    $('#impactRows').innerHTML = '';
    (p.impact || []).forEach(m => addImpactRow(m.label, m.value));

    thumbData = p.thumbnail || '';
    shotsData = (p.screenshots || []).slice();
    renderThumbPreview();
    renderShots();
}

function resetForm() {
    form.reset();
    editingIndex = null;
    thumbData = '';
    shotsData = [];
    $('#impactRows').innerHTML = '';
    renderThumbPreview();
    renderShots();
    $('#formTitle').textContent = 'Novo projeto';
    $('#saveLabel').textContent = 'Adicionar projeto';
    $('#deleteBtn').hidden = true;
    renderList();
    updatePreview();
}

function editProject(i) {
    editingIndex = i;
    fillForm(projects[i]);
    $('#formTitle').textContent = 'Editando projeto';
    $('#saveLabel').textContent = 'Salvar alterações';
    $('#deleteBtn').hidden = false;
    renderList();
    updatePreview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------------- Preview do card (espelha o card real do site) ---------------- */
function updatePreview() {
    const p = collectProject();
    const L = (v) => pickLang(v, formLang) || pickLang(v, formLang === 'en' ? 'pt' : 'en');
    const media = p.thumbnail
        ? `<img src="${p.thumbnail}" alt="">`
        : `<div class="pv-empty">Sem thumbnail</div>`;
    const chips = (p.stack || []).slice(0, 5).map(t => `<span class="pv-chip">${escapeHtml(t)}</span>`).join('')
        + ((p.stack || []).length > 5 ? `<span class="pv-chip pv-chip-more">+${p.stack.length - 5}</span>` : '');

    const firstImpact = (p.impact || [])[0];
    const metric = firstImpact && firstImpact.value
        ? `<div class="pv-metric"><strong>${escapeHtml(firstImpact.value)}</strong><small>${escapeHtml(L(firstImpact.label))}</small></div>`
        : `<div class="pv-metric"><small>${escapeHtml(L(p.role))}</small></div>`;

    $('#cardPreview').innerHTML = `
        <div class="pv-card">
            <div class="pv-media">${media}</div>
            <div class="pv-body">
                <p class="pv-meta">${escapeHtml([txt(p.client), L(p.period)].filter(Boolean).join(' · '))}</p>
                <h5>${escapeHtml(txt(p.name) || 'Nome do projeto')}</h5>
                <p class="pv-tagline">${escapeHtml(L(p.tagline) || L(p.shortDescription))}</p>
                <div class="pv-chips">${chips}</div>
                <div class="pv-footer">
                    ${metric}
                    <span class="pv-cta">${formLang === 'en' ? 'View case ↗' : 'Ver case ↗'}</span>
                </div>
            </div>
        </div>
    `;
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ---------------- Export ---------------- */
function buildJSON() {
    return JSON.stringify(projects, null, 2) + '\n';
}

function download() {
    if (!projects.length) return toast('Nenhum projeto para exportar', true);
    const blob = new Blob([buildJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.json';
    a.click();
    URL.revokeObjectURL(url);
    $('#saveStatus').textContent = 'Arquivo baixado — substitua assets/dados/projects.json e faça o deploy.';
    toast('projects.json baixado');
}

async function copyJSON() {
    try {
        await navigator.clipboard.writeText(buildJSON());
        toast('JSON copiado para a área de transferência');
    } catch (e) {
        toast('Não foi possível copiar', true);
    }
}

/* ---------------- Eventos ---------------- */
function initEvents() {
    // auto-slug enquanto cria (não sobrescreve id editado manualmente)
    let idTouched = false;
    form.id.addEventListener('input', () => { idTouched = true; });
    form.name.addEventListener('input', () => {
        if (editingIndex === null && !idTouched) form.id.value = slugify(form.name.value);
    });

    // preview ao vivo
    form.addEventListener('input', updatePreview);

    // submit (adiciona ou salva)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const p = collectProject();
        if (!txt(p.name)) return toast('Informe o nome do projeto', true);
        if (!p.id) return toast('Informe um ID/slug', true);
        // thumbnail é opcional agora — o site mostra um placeholder bonito 🎴

        if (editingIndex === null) {
            projects.push(p);
            toast('Projeto adicionado');
        } else {
            projects[editingIndex] = p;
            toast('Projeto atualizado');
        }
        saveDraft();
        idTouched = false;
        resetForm();
    });

    $('#deleteBtn').addEventListener('click', () => {
        if (editingIndex === null) return;
        if (!confirm('Excluir este projeto do rascunho?')) return;
        projects.splice(editingIndex, 1);
        saveDraft();
        resetForm();
        toast('Projeto excluído');
    });

    $('#newProjectBtn').addEventListener('click', () => { idTouched = false; resetForm(); });
    $('#cancelBtn').addEventListener('click', () => { idTouched = false; resetForm(); });
    $('#addImpact').addEventListener('click', () => addImpactRow());

    // thumbnail
    const thumbDrop = $('#thumbDrop');
    const thumbInput = $('#thumbInput');
    thumbDrop.addEventListener('click', () => thumbInput.click());
    thumbInput.addEventListener('change', async () => {
        if (thumbInput.files[0]) {
            try { thumbData = await readImageFile(thumbInput.files[0]); renderThumbPreview(); updatePreview(); }
            catch { toast('Falha ao ler imagem', true); }
        }
    });
    setupDrop(thumbDrop, async (files) => {
        if (files[0]) { thumbData = await readImageFile(files[0]); renderThumbPreview(); updatePreview(); }
    });

    // screenshots
    const shotsDrop = $('#shotsDrop');
    const shotsInput = $('#shotsInput');
    shotsDrop.addEventListener('click', () => shotsInput.click());
    shotsInput.addEventListener('change', async () => {
        for (const f of shotsInput.files) {
            try { shotsData.push(await readImageFile(f)); } catch { /* ignora */ }
        }
        renderShots();
        shotsInput.value = '';
    });
    setupDrop(shotsDrop, async (files) => {
        for (const f of files) { try { shotsData.push(await readImageFile(f)); } catch {} }
        renderShots();
    });

    // import / reload / export
    $('#importJson').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (!Array.isArray(data)) throw new Error('Formato inválido');
                projects = data;
                saveDraft();
                resetForm();
                toast('projects.json importado');
            } catch { toast('JSON inválido', true); }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    $('#reloadBtn').addEventListener('click', () => {
        if (confirm('Recarregar do arquivo do site? Isso descarta o rascunho atual.')) {
            localStorage.removeItem(STORAGE_KEY);
            loadFromFile();
            resetForm();
        }
    });

    $('#downloadBtn').addEventListener('click', download);
    $('#copyBtn').addEventListener('click', copyJSON);

    // toggle EN/PT do formulário (só muda o que está visível; tudo é salvo) 🌎
    document.querySelectorAll('#langSwitch button').forEach(btn => {
        btn.addEventListener('click', () => {
            formLang = btn.dataset.formLang;
            document.querySelectorAll('#langSwitch button').forEach(b =>
                b.classList.toggle('active', b === btn));
            document.body.classList.toggle('form-lang-pt', formLang === 'pt');
            renderList();
            updatePreview();
        });
    });
}

function setupDrop(el, onFiles) {
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('dragover'); });
    el.addEventListener('dragleave', () => el.classList.remove('dragover'));
    el.addEventListener('drop', (e) => {
        e.preventDefault();
        el.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length) onFiles(files);
    });
}

/* ---------------- Boot ---------------- */
initEvents();
resetForm();
loadInitial();
