import { ui, defaultLang } from "./ui";

export function getLangFromUrl(url: URL) {
  const [, , lang] = url.pathname.split("/");
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    const defaultStrings = ui[defaultLang];
    const currentStrings = ui[lang] as Partial<typeof defaultStrings>;

    return currentStrings[key] ?? defaultStrings[key];
  };
}

export function useTranslatedPath(lang: keyof typeof ui) {
  return function translatePath(path: string, l: keyof typeof ui = lang) {
    if (!path.includes("/developers") && l !== defaultLang) {
      return `/${l}${path}`;
    }
    // the translated path is /developers/es/blog, not /es/developers/blog
    if (l !== defaultLang) {
      const pathSegments = path.split("/");
      pathSegments.splice(2, 0, l);
      const translatedPath = pathSegments.join("/");
      return translatedPath;
    }
    return path;
  };
}

export function getEnglishPathFromUrl(url: URL) {
  const pathSegments = url.pathname.split("/");
  const filteredSegments = pathSegments.filter((segment) => segment !== "es");
  const englishPath = filteredSegments.join("/");
  return englishPath;
}
