#!/usr/bin/env node

/**
 * MDX to Strapi Sync Script
 *
 * Scans MDX files in src/content and syncs them to Strapi database:
 * - Creates new entries for new MDX files
 * - Updates existing entries when MDX changes
 * - Deletes Strapi entries when MDX files are removed
 *
 * Usage:
 *   node scripts/sync-mdx.cjs --dry-run    # Preview changes
 *   node scripts/sync-mdx.cjs              # Actually sync
 */

const fs = require('fs');
const path = require('path');

// Determine project root (whether run from project root or cms directory)
const isInCmsDir = process.cwd().endsWith('/cms') || process.cwd().endsWith('\\cms');
const projectRoot = isInCmsDir ? path.join(process.cwd(), '..') : process.cwd();

// Load environment variables from cms/.env if it exists
// Clear any existing STRAPI tokens from shell environment to ensure .env takes precedence
delete process.env.STRAPI_API_TOKEN;
delete process.env.STRAPI_PREVIEW_TOKEN;

const envPath = path.join(projectRoot, 'cms', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || process.env.STRAPI_PREVIEW_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');

// Content type mappings (relative to project root)
const CONTENT_TYPES = {
  blog: {
    dir: path.join(projectRoot, 'src/content/blog'),
    apiId: 'blog-posts',
    pattern: /^(\d{4}-\d{2}-\d{2})-(.+)\.mdx$/
  },
  events: {
    dir: path.join(projectRoot, 'src/content/events'),
    apiId: 'news-events',
    pattern: /^(.+)\.mdx$/
  }
};

// Parse MDX frontmatter
function parseMDX(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) return { frontmatter: {}, content: '' };

  const frontmatter = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();

      // Remove quotes
      value = value.replace(/^["']|["']$/g, '');

      // Parse numbers
      if (/^\d+$/.test(value)) value = parseInt(value);

      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: match[2].trim() };
}

// Convert markdown to HTML (simple version)
function markdownToHTML(markdown) {
  return markdown
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<)(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

// Scan MDX files (including locale directories)
function scanMDXFiles(contentType) {
  const config = CONTENT_TYPES[contentType];
  const baseDir = config.dir; // Already absolute path from config
  const mdxFiles = [];

  // Scan base directory (English/default locale)
  if (fs.existsSync(baseDir)) {
    const files = fs.readdirSync(baseDir);
    for (const file of files) {
      if (!file.endsWith('.mdx')) continue;

      const filepath = path.join(baseDir, file);
      const { frontmatter, content } = parseMDX(filepath);

      // Generate slug from filename if not in frontmatter
      let slug = frontmatter.slug;
      if (!slug) {
        slug = file.replace(/\.mdx$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
      }

      mdxFiles.push({
        file,
        filepath,
        slug,
        locale: frontmatter.locale || 'en',
        frontmatter,
        content,
        isLocalization: false
      });
    }
  } else {
    console.log(`⚠️  Directory not found: ${baseDir}`);
  }

  // Scan locale directories (es/blog, de/blog, etc.)
  const contentDir = path.dirname(baseDir); // e.g., src/content
  if (fs.existsSync(contentDir)) {
    const localeDirs = fs.readdirSync(contentDir, { withFileTypes: true });
    
    for (const localeDir of localeDirs) {
      // Skip if not a directory or if it's the base blog/events directory
      if (!localeDir.isDirectory()) continue;
      if (localeDir.name === path.basename(baseDir)) continue;
      
      const localeBlogDir = path.join(contentDir, localeDir.name, path.basename(baseDir));
      
      // Check if this locale directory has a blog/events subdirectory
      if (fs.existsSync(localeBlogDir)) {
        const files = fs.readdirSync(localeBlogDir);
        
        for (const file of files) {
          if (!file.endsWith('.mdx')) continue;

          const filepath = path.join(localeBlogDir, file);
          const { frontmatter, content } = parseMDX(filepath);

          // Extract locale from directory name or frontmatter
          const locale = frontmatter.locale || localeDir.name;
          
          // Generate slug from filename if not in frontmatter
          let slug = frontmatter.slug;
          if (!slug) {
            slug = file.replace(/\.mdx$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
          }

          mdxFiles.push({
            file,
            filepath,
            slug,
            locale: locale,
            frontmatter,
            content,
            isLocalization: true,
            localizes: frontmatter.localizes || null // Reference to English slug
          });
        }
      }
    }
  }

  return mdxFiles;
}

// Fetch from Strapi API
async function strapiRequest(endpoint, options = {}) {
  const url = `${STRAPI_URL}/api/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${STRAPI_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Strapi API error (${response.status}): ${text}`);
  }

  // DELETE requests may return empty body (204 No Content)
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

// Get all entries from Strapi (with all locales)
async function getAllEntries(apiId, locale = 'all') {
  const allEntries = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    // Query with locale parameter - 'all' gets all locales, undefined gets default locale
    const localeParam = locale === 'all' ? 'locale=all' : locale ? `locale=${locale}` : '';
    const paginationParam = `pagination[page]=${page}&pagination[pageSize]=100`;
    const endpoint = `${apiId}?${paginationParam}${localeParam ? '&' + localeParam : ''}`;
    
    const data = await strapiRequest(endpoint);
    const entries = data.data || [];
    allEntries.push(...entries);
    
    const pagination = data.meta?.pagination;
    hasMore = pagination && page < pagination.pageCount;
    page++;
  }
  
  return allEntries;
}

// Find entry by slug
async function findBySlug(apiId, slug, locale = null) {
  let endpoint = `${apiId}?filters[slug][$eq]=${slug}`;
  if (locale) {
    endpoint += `&locale=${locale}`;
  }
  const data = await strapiRequest(endpoint);
  return data.data && data.data.length > 0 ? data.data[0] : null;
}

// Find entry by slug in default locale (en)
async function findBySlugInDefaultLocale(apiId, slug) {
  return await findBySlug(apiId, slug, 'en');
}

// Create localization for an existing entry
async function createLocalization(apiId, documentId, locale, data) {
  // In Strapi v5, localizations are created by using PUT to the existing documentId
  // with the locale parameter. This adds a new locale version to the same document.

  // First, verify the base entry exists
  let entry;
  try {
    entry = await strapiRequest(`${apiId}/${documentId}?locale=en`);
  } catch (e) {
    entry = await strapiRequest(`${apiId}/${documentId}`);
  }

  if (!entry || !entry.data) {
    throw new Error(`Base entry not found with documentId: ${documentId}`);
  }

  console.log(`      📝 Creating localization for documentId=${documentId}, locale=${locale}`);

  // Remove locale from data (should not be in body)
  const { locale: dataLocale, ...dataWithoutLocale } = data;

  // In Strapi v5, to create a localization for an existing document,
  // use PUT to the documentId with the target locale in query string
  const endpoint = `${apiId}/${documentId}?locale=${locale}`;
  console.log(`      🔗 PUT ${endpoint}`);

  const result = await strapiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify({
      data: dataWithoutLocale
    })
  });

  if (!result || !result.data) {
    throw new Error(`Failed to create localization. Response: ${JSON.stringify(result)}`);
  }

  const createdEntry = result.data;
  const actualLocale = createdEntry.locale;
  const actualDocId = createdEntry.documentId;

  console.log(`      📋 Result: documentId=${actualDocId}, locale=${actualLocale}`);

  if (actualLocale !== locale) {
    console.warn(`   ⚠️  Created entry has locale '${actualLocale}' but expected '${locale}'`);
  }

  if (actualDocId !== documentId) {
    console.warn(`   ⚠️  DocumentId mismatch: expected '${documentId}', got '${actualDocId}'`);
  }

  return result;
}

// Update localization
async function updateLocalization(apiId, documentId, locale, data) {
  // Find the localization entry
  const localization = await findBySlug(apiId, data.slug, locale);

  // Remove locale from data body (Strapi v5 uses query string for locale)
  const { locale: dataLocale, ...dataWithoutLocale } = data;

  if (localization) {
    // Update existing localization - use the found entry's documentId with locale in query string
    console.log(`      📝 Updating existing localization: documentId=${localization.documentId}, locale=${locale}`);
    const result = await updateEntry(apiId, localization.documentId, dataWithoutLocale, locale);
    console.log(`      📋 Update result: documentId=${result?.data?.documentId}, locale=${result?.data?.locale}`);
    return result;
  }
  // If localization doesn't exist, create it
  console.log(`      📝 No existing localization found, creating new one`);
  return await createLocalization(apiId, documentId, locale, data);
}

// Create entry
async function createEntry(apiId, data, locale = null) {
  const endpoint = locale ? `${apiId}?locale=${locale}` : apiId;
  return await strapiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify({ data })
  });
}

// Update entry
async function updateEntry(apiId, documentId, data, locale = null) {
  // In Strapi v5, locale must be in query string, not in body
  const endpoint = locale ? `${apiId}/${documentId}?locale=${locale}` : `${apiId}/${documentId}`;
  return await strapiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify({ data })
  });
}

// Delete entry
async function deleteEntry(apiId, documentId) {
  return await strapiRequest(`${apiId}/${documentId}`, {
    method: 'DELETE'
  });
}

// Sync content type
async function syncContentType(contentType) {
  const config = CONTENT_TYPES[contentType];
  console.log(`\n📁 Syncing ${contentType}...`);

  // Scan MDX files
  const mdxFiles = scanMDXFiles(contentType);
  console.log(`   Found ${mdxFiles.length} MDX files`);

  // Get all Strapi entries
  const strapiEntries = await getAllEntries(config.apiId);
  console.log(`   Found ${strapiEntries.length} Strapi entries`);

  const results = {
    created: 0,
    updated: 0,
    deleted: 0,
    errors: 0
  };

  // Track processed slugs (by locale)
  const processedSlugs = new Map(); // locale -> Set of slugs

  // Separate English and locale files
  const englishFiles = mdxFiles.filter(mdx => !mdx.isLocalization);
  const localeFiles = mdxFiles.filter(mdx => mdx.isLocalization);

  // Process English files first, and for each one, find and link its localizations
  for (const englishMdx of englishFiles) {
    const locale = englishMdx.locale || 'en';
    if (!processedSlugs.has(locale)) {
      processedSlugs.set(locale, new Set());
    }
    processedSlugs.get(locale).add(englishMdx.slug);

    try {
      // Prepare English post data
      let englishData;
      if (contentType === 'blog') {
        englishData = {
          title: englishMdx.frontmatter.title,
          description: englishMdx.frontmatter.description,
          slug: englishMdx.slug,
          date: englishMdx.frontmatter.date,
          content: markdownToHTML(englishMdx.content),
          publishedAt: new Date().toISOString()
        };
      } else if (contentType === 'events') {
        englishData = {
          title: englishMdx.frontmatter.title,
          slug: englishMdx.slug,
          order: englishMdx.frontmatter.order || 0,
          content: markdownToHTML(englishMdx.content),
          publishedAt: new Date().toISOString()
        };
      }

      // Create or update English post
      let englishEntry;
      const existing = await findBySlug(config.apiId, englishMdx.slug, 'en');

      if (existing) {
        if (DRY_RUN) {
          console.log(`   🔄 [DRY-RUN] Would update: ${englishMdx.slug} (en)`);
        } else {
          const result = await updateEntry(config.apiId, existing.documentId, englishData);
          englishEntry = result.data || existing;
          console.log(`   🔄 Updated: ${englishMdx.slug} (en)`);
        }
        results.updated++;
      } else {
        if (DRY_RUN) {
          console.log(`   ✅ [DRY-RUN] Would create: ${englishMdx.slug} (en)`);
          englishEntry = { documentId: 'dry-run-id', slug: englishMdx.slug };
        } else {
          const result = await createEntry(config.apiId, englishData);
          englishEntry = result.data;
          console.log(`   ✅ Created: ${englishMdx.slug} (en)`);
        }
        results.created++;
      }

      // Now find matching locale versions for this English post
      if (!DRY_RUN && englishEntry && englishEntry.documentId) {
        const englishDate = englishMdx.frontmatter.date ? new Date(englishMdx.frontmatter.date) : null;
        
        // Find locale files that might be translations of this English post
        // Use contentId or localizes as foreign keys
        // English contentId can be: frontmatter.contentId OR slug (since English posts use slug as contentId)
        const englishContentId = englishMdx.frontmatter.contentId || englishMdx.frontmatter.postId || englishMdx.slug;
        
        const candidateLocales = localeFiles
          .filter(localeMdx => {
            // Skip if already processed
            const localeCode = localeMdx.locale || 'en';
            const localeForPath = localeCode.split('-')[0];
            if (processedSlugs.has(localeForPath) && processedSlugs.get(localeForPath).has(localeMdx.slug)) {
              return false;
            }
            return true;
          })
          .map(localeMdx => {
            let matchScore = 0;
            let matchReason = '';
            
            const localeContentId = localeMdx.frontmatter.contentId || localeMdx.frontmatter.postId;
            
            // Strategy 1: Check if contentId/postId matches (highest priority - acts as foreign key)
            // Match locale contentId to English contentId OR English slug
            if (localeContentId) {
              if (englishContentId && localeContentId === englishContentId) {
                matchScore = 1000;
                matchReason = `contentId: ${englishContentId}`;
              } else if (localeContentId === englishMdx.slug) {
                // Also match if locale contentId equals English slug (common pattern)
                matchScore = 1000;
                matchReason = `contentId matches slug: ${englishMdx.slug}`;
              }
            }
            // Strategy 2: Check if localizes field matches (explicit link to English slug)
            // Check both the stored property and frontmatter
            const localeLocalizes = localeMdx.localizes || localeMdx.frontmatter.localizes;
            if (localeLocalizes === englishMdx.slug) {
              matchScore = Math.max(matchScore, 900);
              matchReason = matchReason || `localizes: ${englishMdx.slug}`;
            }
            
            return { localeMdx, matchScore, matchReason };
          })
          .filter(candidate => candidate.matchScore > 0)
          .sort((a, b) => b.matchScore - a.matchScore); // Highest score first
        
        // Take the best match(es) - one per locale
        const localeMatches = new Map(); // locale -> best match
        for (const candidate of candidateLocales) {
          const localeCode = candidate.localeMdx.locale || 'en';
          const localeForPath = localeCode.split('-')[0];
          
          // Only keep the best match per locale
          if (!localeMatches.has(localeForPath)) {
            localeMatches.set(localeForPath, candidate);
          }
        }
        
        const matchingLocales = Array.from(localeMatches.values()).map(c => c.localeMdx);

        // Process each matching locale (already filtered to best matches)
        for (const localeMdx of matchingLocales) {
          const localeCode = localeMdx.locale || 'en';
          const localeForPath = localeCode.split('-')[0];
          // Use full locale code for Strapi API (e.g., 'es-ES' not 'es')
          // Must match exactly what's configured in Strapi's i18n settings
          const strapiLocale = localeCode;
          
          // Find the match reason for logging
          const candidate = candidateLocales.find(c => c.localeMdx === localeMdx);
          const matchReason = candidate ? candidate.matchReason : 'unknown';
          
          if (!processedSlugs.has(localeForPath)) {
            processedSlugs.set(localeForPath, new Set());
          }
          processedSlugs.get(localeForPath).add(localeMdx.slug);

          console.log(`      📌 Matched via ${matchReason}: ${localeMdx.slug} (${localeCode} -> ${strapiLocale})`);

          try {
            // Prepare locale data
            let localeData;
            if (contentType === 'blog') {
              localeData = {
                title: localeMdx.frontmatter.title,
                description: localeMdx.frontmatter.description,
                slug: localeMdx.slug,
                date: localeMdx.frontmatter.date,
                content: markdownToHTML(localeMdx.content),
                publishedAt: new Date().toISOString()
              };
            } else if (contentType === 'events') {
              localeData = {
                title: localeMdx.frontmatter.title,
                slug: localeMdx.slug,
                order: localeMdx.frontmatter.order || 0,
                content: markdownToHTML(localeMdx.content),
                publishedAt: new Date().toISOString()
              };
            }

            // Check if localization already exists (try both normalized and full locale)
            let existingLocale = await findBySlug(config.apiId, localeMdx.slug, strapiLocale);
            if (!existingLocale && strapiLocale !== localeCode) {
              existingLocale = await findBySlug(config.apiId, localeMdx.slug, localeCode);
            }

            if (existingLocale) {
              if (DRY_RUN) {
                console.log(`      🌍 [DRY-RUN] Would update localization: ${localeMdx.slug} (${strapiLocale})`);
              } else {
                await updateLocalization(config.apiId, englishEntry.documentId, strapiLocale, localeData);
                console.log(`      🌍 Updated localization: ${localeMdx.slug} (${strapiLocale})`);
              }
              results.updated++;
            } else {
              if (DRY_RUN) {
                console.log(`      🌍 [DRY-RUN] Would create localization: ${localeMdx.slug} (${strapiLocale})`);
              } else {
                await createLocalization(config.apiId, englishEntry.documentId, strapiLocale, localeData);
                console.log(`      🌍 Created localization: ${localeMdx.slug} (${strapiLocale})`);
              }
              results.created++;
            }
          } catch (error) {
            console.error(`      ❌ Error processing localization ${localeMdx.slug} (${localeCode}): ${error.message}`);
            results.errors++;
          }
        }
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${englishMdx.slug} (${locale}): ${error.message}`);
      results.errors++;
    }
  }

  // Check for any locale files that weren't matched
  const unmatchedLocales = localeFiles.filter(localeMdx => {
    const localeCode = localeMdx.locale || 'en';
    const localeForPath = localeCode.split('-')[0];
    return !processedSlugs.has(localeForPath) || !processedSlugs.get(localeForPath).has(localeMdx.slug);
  });

  if (unmatchedLocales.length > 0) {
    console.log(`   🔍 Trying to match ${unmatchedLocales.length} unmatched locale file(s) with Strapi entries...`);
    
    // Get all English entries from Strapi (they might exist even if MDX doesn't)
    const allStrapiEntries = await getAllEntries(config.apiId, 'en');
    
    for (const localeMdx of unmatchedLocales) {
      const localeCode = localeMdx.locale || 'en';
      const localeForPath = localeCode.split('-')[0];
      // Use full locale code for Strapi API (must match Strapi's i18n config)
      const strapiLocale = localeCode;
      const localeContentId = localeMdx.frontmatter.contentId || localeMdx.frontmatter.postId;
      
      // Try to find English entry in Strapi where slug matches the locale's contentId
      // (English posts use slug as contentId)
      let matchedEnglishEntry = null;
      
      if (localeContentId) {
        // Find English entry where slug matches the locale's contentId
        matchedEnglishEntry = allStrapiEntries.find(entry => {
          return entry.slug === localeContentId;
        });
      }
      
      if (matchedEnglishEntry) {
        console.log(`   ✅ Found match in Strapi: ${localeMdx.slug} (${localeCode} -> ${strapiLocale}) -> ${matchedEnglishEntry.slug} (via contentId)`);
        
        // Process this localization
        if (!processedSlugs.has(localeForPath)) {
          processedSlugs.set(localeForPath, new Set());
        }
        processedSlugs.get(localeForPath).add(localeMdx.slug);
        
        try {
          // Prepare locale data
          let localeData;
          if (contentType === 'blog') {
            localeData = {
              title: localeMdx.frontmatter.title,
              description: localeMdx.frontmatter.description,
              slug: localeMdx.slug,
              date: localeMdx.frontmatter.date,
              content: markdownToHTML(localeMdx.content),
              publishedAt: new Date().toISOString()
            };
          } else if (contentType === 'events') {
            localeData = {
              title: localeMdx.frontmatter.title,
              slug: localeMdx.slug,
              order: localeMdx.frontmatter.order || 0,
              content: markdownToHTML(localeMdx.content),
              publishedAt: new Date().toISOString()
            };
          }

          // Check if localization already exists (try both normalized and full locale)
          let existingLocale = await findBySlug(config.apiId, localeMdx.slug, strapiLocale);
          if (!existingLocale && strapiLocale !== localeCode) {
            existingLocale = await findBySlug(config.apiId, localeMdx.slug, localeCode);
          }

          if (existingLocale) {
            if (DRY_RUN) {
              console.log(`      🌍 [DRY-RUN] Would update localization: ${localeMdx.slug} (${strapiLocale})`);
            } else {
              await updateLocalization(config.apiId, matchedEnglishEntry.documentId, strapiLocale, localeData);
              console.log(`      🌍 Updated localization: ${localeMdx.slug} (${strapiLocale})`);
            }
            results.updated++;
          } else {
            if (DRY_RUN) {
              console.log(`      🌍 [DRY-RUN] Would create localization: ${localeMdx.slug} (${strapiLocale})`);
            } else {
              await createLocalization(config.apiId, matchedEnglishEntry.documentId, strapiLocale, localeData);
              console.log(`      🌍 Created localization: ${localeMdx.slug} (${strapiLocale})`);
            }
            results.created++;
          }
        } catch (error) {
          console.error(`      ❌ Error processing localization ${localeMdx.slug} (${localeCode}): ${error.message}`);
          results.errors++;
        }
      } else {
        // Still no match found
        console.log(`   ⚠️  Could not match: ${localeMdx.slug} (${localeCode})`);
        console.log(`      📋 Locale contentId: ${localeContentId || 'N/A'}`);
        if (localeContentId) {
          console.log(`      💡 Looking for English post in Strapi with slug: "${localeContentId}"`);
          console.log(`      💡 If it doesn't exist, create the English post first, then re-run sync`);
        } else {
          console.log(`      💡 Add 'contentId: "english-slug"' to frontmatter to link to English post`);
        }
      }
    }
  }

  // Find orphaned entries (in Strapi but not in MDX)
  // Only delete ENGLISH entries - locale entries are managed via their English counterpart
  // This prevents accidentally deleting locale entries that couldn't be matched
  for (const entry of strapiEntries) {
    const entryLocale = entry.locale || 'en';
    const localeForPath = entryLocale.split('-')[0];

    // Only delete English entries - locale entries should not be auto-deleted
    // They can be manually deleted if needed
    if (localeForPath !== 'en') {
      continue;
    }

    const processedSlugsForLocale = processedSlugs.get(localeForPath) || new Set();

    if (!processedSlugsForLocale.has(entry.slug)) {
      try {
        if (DRY_RUN) {
          console.log(`   🗑️  [DRY-RUN] Would delete: ${entry.slug} (${entryLocale})`);
        } else {
          await deleteEntry(config.apiId, entry.documentId);
          console.log(`   🗑️  Deleted: ${entry.slug} (${entryLocale})`);
        }
        results.deleted++;
      } catch (error) {
        console.error(`   ❌ Error deleting ${entry.slug} (${entryLocale}): ${error.message}`);
        results.errors++;
      }
    }
  }

  return results;
}

// Main
async function main() {
  console.log('🚀 MDX → Strapi Sync');
  console.log('='.repeat(50));

  if (!STRAPI_TOKEN) {
    console.error('❌ Error: STRAPI_API_TOKEN or STRAPI_PREVIEW_TOKEN not set');
    console.error('   STRAPI_API_TOKEN:', process.env.STRAPI_API_TOKEN ? 'SET' : 'NOT SET');
    console.error('   STRAPI_PREVIEW_TOKEN:', process.env.STRAPI_PREVIEW_TOKEN ? 'SET' : 'NOT SET');
    process.exit(1);
  }

  console.log(`🔗 Connecting to: ${STRAPI_URL}`);
  console.log(`🔑 Token: ${STRAPI_TOKEN.substring(0, 10)}...`);

  if (DRY_RUN) {
    console.log('🔍 DRY-RUN MODE - No changes will be made\n');
  }

  const allResults = {
    created: 0,
    updated: 0,
    deleted: 0,
    errors: 0
  };

  // Sync each content type
  for (const contentType of Object.keys(CONTENT_TYPES)) {
    try {
      const results = await syncContentType(contentType);
      allResults.created += results.created;
      allResults.updated += results.updated;
      allResults.deleted += results.deleted;
      allResults.errors += results.errors;
    } catch (error) {
      console.error(`\n❌ Error syncing ${contentType}: ${error.message}`);
      allResults.errors++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary');
  console.log('='.repeat(50));
  console.log(`   ✅ Created: ${allResults.created}`);
  console.log(`   🔄 Updated: ${allResults.updated}`);
  console.log(`   🗑️  Deleted: ${allResults.deleted}`);
  console.log(`   ❌ Errors:  ${allResults.errors}`);

  if (DRY_RUN) {
    console.log('\n💡 This was a dry-run. Run without --dry-run to apply changes.');
  }

  process.exit(allResults.errors > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
