type LanguageRoutes = Record<keyof typeof languages, Record<string, string>>;
type LanguageUi = Record<keyof typeof languages, Record<string, string>>;

export const languages = {
  en: "English",
  es: "Español",
};

export const defaultLang = "en";

export const routes: LanguageRoutes = {
  en: {
    "first-week": "breakpoint-it-work-week",
  },
  es: {
    "first-week": "primera-semana-breakpoint",
  },
};

export const ui: LanguageUi = {
  en: {
    "nav.foundation": "Foundation",
    "nav.about": "About Us",
    "nav.policy": "Policy & Advocacy",
    "nav.team": "Team",
    "nav.media": "Media",
    "nav.technology": "Technology",
    "nav.overview": "Overview",
    "nav.interledger": "Interledger",
    "nav.open-payments": "Open Payments",
    "nav.web-monetization": "Web Monetization",
    "nav.join": "Join The Network",
    "nav.developers": "Developers Portal",
    "nav.grants": "Grants",
    "nav.financial-services": "Financial Services",
    "nav.education": "Education",
    "nav.ambassadors": "Ambassadors",
    "nav.content-hub": "Content Hub",
    "nav.foundation-blog": "Foundation Blog",
    "nav.tech-blog": "Tech Blog",
    "nav.podcast": "Podcast",
    "nav.art": "Art",
    "nav.community-forem": "Community Forem",
    "nav.participate": "Participate",
    "nav.get-involved": "Get Involved",
    "nav.events": "Events",
    "nav.guidelines": "Guidelines",
    "nav.summit": "Interledger Summit",
  },
  es: {
    "nav.foundation": "Fundación",
    "nav.about": "Sobre Nosotros",
    "nav.policy": "Políticas y defensa pública",
    "nav.team": "Equipo",
    "nav.media": "Medios",
    "nav.technology": "Tecnología",
    "nav.overview": "Visión general",
    "nav.interledger": "Interledger",
    "nav.open-payments": "Open Payments",
    "nav.web-monetization": "Web Monetization",
    "nav.join": "Únete a la Red",
    "nav.developers": "Portal para desarrolladores",
    "nav.grants": "Subvenciones",
    "nav.financial-services": "Servicios financieros",
    "nav.education": "Educación",
    "nav.ambassadors": "Embajadores",
    "nav.content-hub": "Centro de contenido",
    "nav.foundation-blog": "Blog de la Fundación",
    "nav.tech-blog": "Blog Técnico",
    "nav.podcast": "Podcast",
    "nav.art": "Arte",
    "nav.community-forem": "Foro de la Comunidad",
    "nav.participate": "Participa",
    "nav.get-involved": "Involúcrate",
    "nav.events": "Eventos",
    "nav.guidelines": "Guías",
    "nav.summit": "Cumbre Interledger",
  },
} as const;
