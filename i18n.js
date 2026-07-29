// Central de traduções 🌎 (o site fala duas línguas agora)
const I18N = {
    en: {
        "menu.home": "Home",
        "menu.experience": "Experience",
        "menu.techstack": "TechStack",
        "menu.projects": "Projects",
        "hero.basedIn": "Based in Brazil",
        "hero.nowPlaying": "Now Playing",
        "hero.contact": "Contact me",
        "hero.photoLabel": "Photo of Ítalo Aurélio. Click to play a random song",
        "hero.clickHint": "Click here",
        "experience.title": "Experience",
        "experience.work": "Work",
        "experience.studies": "Studies",
        "techstack.title": "Tech Stack",
        "projects.title": "Projects",
        "projects.hint": "Click a project to expand",
        "project.viewCase": "View case ↗",
        "footer.explore": "Explore",
        "footer.connect": "Let's Connect",
        "footer.email": "Email",
        "footer.phone": "Phone",
        "modal.close": "Close",
        "modal.prev": "Previous",
        "modal.next": "Next",
        "modal.image": "Image",
        "modal.overview": "Overview",
        "modal.highlights": "What I built",
        "modal.impact": "Impact",
        "modal.stack": "Stack",
        "modal.architecture": "Architecture",
        "modal.dataSources": "Data sources",
        "modal.usage": "How it works",
        "modal.code": "View code",
        "modal.demo": "Live demo",
        "modal.case": "Read case"
    },
    pt: {
        "menu.home": "Início",
        "menu.experience": "Experiência",
        "menu.techstack": "TechStack",
        "menu.projects": "Projetos",
        "hero.basedIn": "Direto do Brasil",
        "hero.nowPlaying": "Tocando Agora",
        "hero.contact": "Fale comigo",
        "hero.photoLabel": "Foto do Ítalo Aurélio. Clique para tocar uma música aleatória",
        "hero.clickHint": "Clique aqui",
        "experience.title": "Experiência",
        "experience.work": "Trabalho",
        "experience.studies": "Estudos",
        "techstack.title": "Tech Stack",
        "projects.title": "Projetos",
        "projects.hint": "Clique em um projeto para expandir",
        "project.viewCase": "Ver case ↗",
        "footer.explore": "Explorar",
        "footer.connect": "Vamos Conversar",
        "footer.email": "E-mail",
        "footer.phone": "Telefone",
        "modal.close": "Fechar",
        "modal.prev": "Anterior",
        "modal.next": "Próximo",
        "modal.image": "Imagem",
        "modal.overview": "Visão geral",
        "modal.highlights": "O que eu construí",
        "modal.impact": "Impacto",
        "modal.stack": "Stack",
        "modal.architecture": "Arquitetura",
        "modal.dataSources": "Fontes de dados",
        "modal.usage": "Como funciona",
        "modal.code": "Ver código",
        "modal.demo": "Ver ao vivo",
        "modal.case": "Ler o case"
    }
};

const i18n = {
    lang: localStorage.getItem("lang")
        || (navigator.language?.toLowerCase().startsWith("pt") ? "pt" : "en"),

    t(key) {
        return I18N[this.lang]?.[key] ?? I18N.en[key] ?? key;
    },

    // Campo de JSON pode ser string OU {en, pt} — resolve com fallback 🤝
    field(v) {
        if (v == null) return "";
        if (typeof v === "string" || Array.isArray(v)) return v;
        return v[this.lang] ?? v.en ?? v.pt ?? "";
    },

    setLang(lang) {
        this.lang = lang;
        localStorage.setItem("lang", lang);
        document.documentElement.lang = (lang === "pt") ? "pt-BR" : "en";
        this.apply();
        document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
    },

    apply() {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            if (el.dataset.i18nSkip !== undefined) return; // elemento "ocupado" (ex: música tocando)
            el.textContent = this.t(el.dataset.i18n);
        });
        document.querySelectorAll("[data-i18n-aria]").forEach(el => {
            el.setAttribute("aria-label", this.t(el.dataset.i18nAria));
        });
        document.querySelectorAll("[data-lang-opt]").forEach(el => {
            el.classList.toggle("active", el.dataset.langOpt === this.lang);
        });
    }
};

window.i18n = i18n;
document.addEventListener("DOMContentLoaded", () => i18n.setLang(i18n.lang));
