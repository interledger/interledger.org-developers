import { ui, languages, defaultLang, routes } from './ui'

export function getLangFromUrl(url: URL) {
  const [, , lang] = url.pathname.split('/')
  if (lang in ui) return lang as keyof typeof languages
  return defaultLang
}

export function useTranslations(lang: keyof typeof languages) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    const defaultStrings = ui[defaultLang]
    const currentStrings = ui[lang] as Partial<typeof defaultStrings>

    return currentStrings[key] ?? defaultStrings[key]
  }
}

export function useTranslatedPath(
  l: keyof typeof languages,
  currentL: keyof typeof languages
) {
  return function translatePath(
    path: string,
    lang: keyof typeof languages = l,
    currentLang: keyof typeof languages = currentL
  ) {
    if (!path.includes('/developers')) {
      if (lang !== defaultLang) {
        return `/${lang}${path}`
      }
      return path
    }

    // for paths inside dev portal: the translated path is /developers/es/blog, not /es/developers/blog
    let pathSegments = path.split('/')
    
    // Remove pagination page numbers (e.g., "2" from /developers/blog/2/)
    // Keep only the last segment if it's numeric (page number), otherwise keep all
    if (pathSegments.length > 0) {
      const lastSegment = pathSegments[pathSegments.length - 1]
      // If the last segment is empty (trailing slash), check the one before it
      const checkSegment = lastSegment === '' ? pathSegments[pathSegments.length - 2] : lastSegment
      
      if (checkSegment && /^\d+$/.test(checkSegment)) {
        // Remove the page number segment
        if (lastSegment === '') {
          pathSegments = pathSegments.slice(0, -2)
        } else {
          pathSegments = pathSegments.slice(0, -1)
        }
      }
    }
    
    let newSegments: string[]

    if (lang !== defaultLang) {
      newSegments = [...pathSegments]
      newSegments.splice(2, 0, lang)
    } else {
      newSegments = pathSegments.filter((segment) => segment !== currentLang)
    }

    translateSlug(lang, currentLang, newSegments)

    const translatedPath = newSegments.join('/')
    return translatedPath
  }
}

function translateSlug(
  translationLang: keyof typeof languages,
  currentLang: keyof typeof languages,
  newSegments: string[]
) {
  const slug = newSegments.at(-1)
  const isBlogPostPath =
    slug !== undefined && Object.values(routes[currentLang]).includes(slug)
  const key = Object.keys(routes[currentLang]).find(
    (key) => routes[currentLang][key] === slug
  )

  if (isBlogPostPath && key) {
    const translatedSlug =
      routes[translationLang][key] ?? routes[defaultLang][key] ?? ''

    newSegments.splice(-1, 1, translatedSlug)
  }
}
