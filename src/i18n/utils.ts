import { ui, navigationItems, defaultLang, routes } from './ui'
import type { LanguageKey, NavigationItemKey } from './ui'

// Isn't there an astro native way to do this? Or does ourb developers mess it up, or it doesn't exist?
export function getLangFromUrl(url: URL) {
  const [, , lang] = url.pathname.split('/') // do the twon commas assume the position? Or whjat do they do? Must be since the next line is a statement not an interation.
  if (lang in ui) return lang as LanguageKey // is this strict enough? Will it match /developers/estranged? 
  return defaultLang
}

export function useTranslations(lang: LanguageKey) { // is a verb best here for the func name, maybe findTranslkation? lang should also be clear, targetLang
  return function t(key: keyof (typeof ui)[typeof defaultLang]) { // why reference ui instead of the languages object? Because we are using ui for translations. 
    const defaultStrings = ui[defaultLang]
    const currentStrings = ui[lang] as Partial<typeof defaultStrings> // currentStrings is confusing, translatedString maybe or targetString

    return currentStrings[key] ?? defaultStrings[key]
  }
}

export function useFoundationTranslatedPath( // I don't understand the n ormnal naming conventions for funcs that return funs. I'm still figuring out why that is a good thing to start off with.
  lang: LanguageKey // targetLanguage
): (item: NavigationItemKey) => string {
  return function translateFoundationPath(item = 'ilf') {
    return navigationItems[item][lang].href // are we catching errors here?
  }
}

export function useTranslatedPath(l: LanguageKey, currentL: LanguageKey) { // destinationL or targetL
  return function translatePath( // why are taking two lang params and jkust passing them on, what is the win?
    path: string, // current path
    lang: LanguageKey = l, // Is this the destination language?
    currentLang: LanguageKey = currentL
  ) {
    if (!path.includes('/developers')) { // this is assuming that the path is already stripped. How does this work for /es/getting-started when destination lang is EN
      // Maybe break out into its own function?
      if (lang !== defaultLang) { // docs page path translations
        return `/${lang}${path}`
      }
      return path
    } // either the path is stripped when it comes in or this must be broken...

    // for paths inside dev portal: the translated path is /developers/es/blog, not /es/developers/blog
    let pathSegments = path.split('/')

    // Why are we going for last segrment here, shouldn't we be extracting lnaguage codes bfrom directly after develoeprs
    // Remove pagination page numbers (e.g., "2" from /developers/blog/2/) -> we need separate blog handling function to strip out page numbers and ensure to keep tags
    // Keep only the last segment if it's numeric (page number), otherwise keep all
    if (pathSegments.length > 0) {
      const lastSegment = pathSegments[pathSegments.length - 1]
      // If the last segment is empty (trailing slash), check the one before it
      const checkSegment = // what is a checksegment? Name is confusing
        lastSegment === '' ? pathSegments[pathSegments.length - 2] : lastSegment // no check that -2 isn't breaking the number of elements available, e.g. what if the path was just /. It won't becaise we checked for developers earlier but this can cause bugs, it's all clumped together and if someone takes it apart they could lose that detail since they're not obviously tied together

      if (checkSegment && /^\d+$/.test(checkSegment)) { // what are we testing here and when would we get a false?
        // Remove the page number segment
        if (lastSegment === '') {
          pathSegments = pathSegments.slice(0, -2) // feels like repeating what we just did above almost. Can't we group that?
        } else {
          pathSegments = pathSegments.slice(0, -1)
        }
      }
    } // I want to be clear what is happening to the else here, if this is just a snaity check it should error on a fail

    let newSegments: string[]

    if (lang !== defaultLang) {
      newSegments = [...pathSegments]
      newSegments.splice(2, 0, lang)
    } else {
      newSegments = pathSegments.filter((segment) => segment !== currentLang) // do we want to filter on currentlang or any lang?
    }

    translateSlug(lang, currentLang, newSegments) // what is this doing here? we did a whole bunch of shit that we're just opverriding now right? 

    const translatedPath = newSegments.join('/')
    return translatedPath
  }
}

function translateSlug(
  translationLang: LanguageKey,
  currentLang: LanguageKey,
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
