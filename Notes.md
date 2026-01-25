## `src/components/LanguagePicker.astro`
Specify that the dropdown language selector is only for the docs
Doesn't feel right to always build both, what is the html of that looking like - are we losing any accessibility of html clarity by doing this? Is it actually needed? 
Just seems to toggle with display none
Upate this comment
  /* Dropdown select styling - hidden by default, shown between 800px-1160px */
  
  src/components/blog/CommunityLinks.astro
  
Just changes rendering entirely based on es or not...

## `src/components/pages/Footer.astro`
what is the `{t('footer.copyright')}` part that wasn't here before? - seems to be all rights reserved text

## `/src/layouts/BaseLayout.astro`
Poor naming alternate paths... Poor descriptions use of hardcoded magic numbers. what happens if we run a utm campaign or have any parameters. It's messy.
It does iterate through all languages at least (based on language list in ui.ts)

## `src/i18n/utils.ts`

Fix useTranslatedPath

## `src/layouts/BlogLayout.astro`
const translatePath = useTranslatedPath(lang, lang) is not at all obious when param,s have same name

## `src/pages/blog/tag/[tag]/[...page].astro`
const lang = defaultLang -> why the name change? defaultlang is more clear
It's used to pass to the BlogIndex compopnent just as lang
From what I see this can remain by passing default lang and being clearer

`src/pages/es/blog/tag/[tag]/[...page].astro` and `src/pages/blog/tag/[tag]/[...page].astro` need to share common functionality so it's maintained in one place
share SOLID principles with Anca

## `src/pages/blog/[...id].astro`
const defaultLang = 'en' instead of import { defaultLang } from '../../../i18n/ui'
Why not pass lang to the params? Just because it is default?

## `src/pages/es/blog/[...id].astro`
Why const defaultLanguage = defaultLang -> seems like an unneccessary name change 
Still has a comment here: // handle the case of missing data? or is that done automatically?

## ChatGPT's comment
What’s actually problematic

!path.includes('/developers') is a leaky heuristic

It’ll match things like /foo/developers-guide or miss edge cases like /developers without a leading slash in some inputs.

Much safer: treat it as a prefix check on normalized paths.

The function signature is confusing

useTranslatedPath(l, currentL) returns translatePath(path, lang=l, currentLang=currentL).

That’s two layers of defaults that can contradict each other, and it’s not obvious which values “should” be passed.

Also: useTranslatedPath sounds like a hook, but it isn’t (no React hooks inside). That naming misleads.

Hard-coded index mutation: newSegments.splice(2, 0, lang)

This assumes the segment layout is always ['', 'developers', ...].

If you ever get /developers (no trailing slash), /developers?x=y, or anything slightly different, index 2 may not be what you think.

It’s also non-obvious why 2 is correct, so it’s brittle.

Segment handling is inconsistent

path.split('/') keeps empty segments ('') from leading and trailing slashes.

Later you do join('/'), which preserves those empties in a way that’s easy to get subtly wrong (double slashes, missing trailing slash rules, etc.).

Pagination stripping is bolted on and half-implicit

It only removes a last numeric segment (optionally before a trailing slash). That’s okay if that’s your only pagination shape, but it’s embedded inside translation logic, so it’s hard to reuse/test independently.

Hidden side effects / unclear contract

translateSlug(lang, currentLang, newSegments) mutates newSegments in place (looks like it).

That means the function’s behavior depends on mutation order and the caller can’t reason about it easily without reading translateSlug.
  
  
## Don't forget to merge foundation page work to match dev portal translated pages through template file updates
  
  
  Conversations
  - when do we use hard values
  - when do we use layout tokens

