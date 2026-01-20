export type LanguageKey = 'en' | 'es'
export type NavigationItemKey = keyof typeof navigationItems
type LanguageRoutes = Record<LanguageKey, Record<string, string>>
type LanguageUi = Record<LanguageKey, Record<string, string>>
type NavigationLink = {
  [K in LanguageKey]: {
    href: string
  }
}
type NavigationLinks = Record<string, NavigationLink>

export const languages: Record<LanguageKey, string> = {
  en: 'English',
  es: 'Español'
}

export const defaultLang: LanguageKey = 'en'

export const routes: LanguageRoutes = {
  en: {
    'interledger-universe': 'interledger-universe'
  },
  es: {
    'interledger-universe': 'el-universo-interledger'
  }
}

export const navigationItems = {
  ilf: {
    en: { href: '/' },
    es: { href: '/es' }
  },
  developers: {
    en: { href: '/developers' },
    es: { href: '/developers/es' }
  },
  about: {
    en: { href: '/about-us' },
    es: { href: '/es/sobre-nosotros' }
  },
  policy: {
    en: { href: '/policy-and-advocacy' },
    es: { href: '/es/politica-y-defensa' }
  },
  team: {
    en: { href: '/team' },
    es: { href: '/es/equipo' }
  },
  media: {
    en: { href: '/press' },
    es: { href: '/es/medios' }
  },
  overview: {
    en: { href: '/open-standards' },
    es: { href: '/es/estandares-abiertos' }
  },
  interledger: {
    en: { href: '/interledger' },
    es: { href: '/es/interledger' }
  },
  'open-payments': {
    en: { href: '/open-payments' },
    es: { href: '/es/open-payments' }
  },
  'web-monetization': {
    en: { href: '/web-monetization' },
    es: { href: '/es/web-monetization' }
  },
  join: {
    en: { href: '/join-network' },
    es: { href: '/es/unase-la-red' }
  },
  'financial-services': {
    en: { href: '/financial-services' },
    es: { href: '/es/servicios-financieros-digitales' }
  },
  education: {
    en: { href: '/education' },
    es: { href: '/es/educacion' }
  },
  ambassadors: {
    en: { href: '/ambassadors' },
    es: { href: '/es/embajadores' }
  },
  'foundation-blog': {
    en: { href: '/blog' },
    es: { href: '/es/blog' }
  },
  'tech-blog': {
    en: { href: '/developers/blog' },
    es: { href: '/developers/es/blog' }
  },
  podcast: {
    en: { href: '/podcast' },
    es: { href: '/es/podcast' }
  },
  'community-forum': {
    en: { href: 'https://community.interledger.org/' },
    es: { href: 'https://community.interledger.org/' }
  },
  'get-involved': {
    en: { href: '/get-involved' },
    es: { href: '/es/involucrese' }
  },
  events: {
    en: { href: '/events' },
    es: { href: '/es/eventos' }
  },
  guidelines: {
    en: { href: '/participation-guidelines' },
    es: { href: '/es/pautas-de-participacion' }
  },
  summit: {
    en: { href: '/summit' },
    es: { href: '/es/summit' }
  },
  subscribe: {
    en: { href: '/subscribe' },
    es: { href: '/es/suscribase' }
  },
  contact: {
    en: { href: '/contact' },
    es: { href: '/es/contacto' }
  }
} satisfies NavigationLinks

export const ui: LanguageUi = {
  en: {
    'nav.foundation': 'Foundation',
    'nav.about': 'About Us',
    'nav.policy': 'Policy & Advocacy',
    'nav.team': 'Team',
    'nav.media': 'Media',
    'nav.technology': 'Technology',
    'nav.overview': 'Overview',
    'nav.interledger': 'Interledger',
    'nav.open-payments': 'Open Payments',
    'nav.web-monetization': 'Web Monetization',
    'nav.join': 'Join The Network',
    'nav.developers': 'Developers Portal',
    'nav.grants': 'Grants',
    'nav.financial-services': 'Financial Services',
    'nav.education': 'Education',
    'nav.ambassadors': 'Ambassadors',
    'nav.content-hub': 'Content Hub',
    'nav.foundation-blog': 'Foundation Blog',
    'nav.tech-blog': 'Tech Blog',
    'nav.tech-blog-description':
      'Hear stories and experiences from the team who is working on making Interledger, the interoperable global payments network, a reality.',
    'nav.podcast': 'Podcast',
    'nav.community-forum': 'Community Forum',
    'nav.participate': 'Participate',
    'nav.get-involved': 'Get Involved',
    'nav.events': 'Events',
    'nav.guidelines': 'Guidelines',
    'nav.summit': 'Interledger Summit',
    'footer.mailing-list': 'Join our mailing list',
    'footer.subscribe': 'Subscribe',
    'footer.connect': 'Connect with us',
    'footer.copyright': 'All rights reserved.',
    'footer.terms': 'Terms of Service',
    'footer.privacy': 'Privacy Policy',
    'footer.contact': 'Contact Us',
    'blog.tech-blog-title': 'Engineering Blog',
    'blog.check-updates': 'Check out Foundation updates',
    'blog.filter': 'Filter by tag',
    'blog.written-by': 'Written by',
    'tag.all': 'All',
    'tag.interledger-protocol': 'Interledger Protocol',
    'tag.open-payments': 'Open Payments',
    'tag.rafiki': 'Rafiki',
    'tag.releases': 'Releases',
    'tag.updates': 'Updates',
    'tag.web-monetization': 'Web Monetization'
  },
  es: {
    'nav.foundation': 'Fundación',
    'nav.about': 'Sobre Nosotros',
    'nav.policy': 'Políticas y defensa pública',
    'nav.team': 'Equipo',
    'nav.media': 'Medios',
    'nav.technology': 'Tecnología',
    'nav.overview': 'Estándares abiertos',
    'nav.interledger': 'Interledger',
    'nav.open-payments': 'Open Payments',
    'nav.web-monetization': 'Web Monetization',
    'nav.join': 'Únete a la Red',
    'nav.developers': 'Portal de Desarrolladores',
    'nav.grants': 'Subvenciones',
    'nav.financial-services': 'Servicios Financieros',
    'nav.education': 'Educación',
    'nav.ambassadors': 'Embajadores',
    'nav.content-hub': 'Centro de Contenido',
    'nav.foundation-blog': 'Blog de la Fundación',
    'nav.tech-blog': 'Blog Tecnológico',
    'nav.tech-blog-description':
      'Escucha historias y experiencias del equipo que está trabajando en hacer de Interledger, la red de pagos interoperable global, una realidad.',
    'nav.podcast': 'Podcast',
    'nav.community-forum': 'Community Forum',
    'nav.participate': 'Participa',
    'nav.get-involved': 'Involúcrate',
    'nav.events': 'Eventos',
    'nav.guidelines': 'Guías',
    'nav.summit': 'Cumbre Interledger',
    'footer.mailing-list': 'Únete a nuestra lista de correo',
    'footer.subscribe': 'Suscribirse',
    'footer.connect': 'Conéctate con nosotros',
    'footer.copyright': 'Todos los derechos reservados.',
    'footer.terms': 'Condiciones del servicio',
    'footer.privacy': 'Política de privacidad',
    'footer.contact': 'Contáctanos',
    'blog.tech-blog-title': 'Blog de Ingeniería',
    'blog.check-updates': 'Actualizaciones de la Fundación',
    'blog.filter': 'Filtre por etiquetas',
    'blog.written-by': 'Escrito por',
    'tag.all': 'Todas',
    'tag.interledger-protocol': 'Interledger Protocol',
    'tag.open-payments': 'Open Payments',
    'tag.rafiki': 'Rafiki',
    'tag.releases': 'Lanzamientos',
    'tag.updates': 'Actualizaciones',
    'tag.web-monetization': 'Web Monetization'
  }
} as const
