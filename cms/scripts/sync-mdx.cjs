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

// Scan MDX files
function scanMDXFiles(contentType) {
  const config = CONTENT_TYPES[contentType];
  const dirPath = config.dir; // Already absolute path from config

  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Directory not found: ${dirPath}`);
    return [];
  }

  const files = fs.readdirSync(dirPath);
  const mdxFiles = [];

  for (const file of files) {
    if (!file.endsWith('.mdx')) continue;

    const filepath = path.join(dirPath, file);
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
      frontmatter,
      content
    });
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

// Get all entries from Strapi
async function getAllEntries(apiId) {
  const data = await strapiRequest(`${apiId}?pagination[pageSize]=100`);
  return data.data || [];
}

// Find entry by slug
async function findBySlug(apiId, slug) {
  const data = await strapiRequest(`${apiId}?filters[slug][$eq]=${slug}`);
  return data.data && data.data.length > 0 ? data.data[0] : null;
}

// Create entry
async function createEntry(apiId, data) {
  return await strapiRequest(apiId, {
    method: 'POST',
    body: JSON.stringify({ data })
  });
}

// Update entry
async function updateEntry(apiId, documentId, data) {
  return await strapiRequest(`${apiId}/${documentId}`, {
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

  // Track processed slugs
  const processedSlugs = new Set();

  // Process each MDX file
  for (const mdx of mdxFiles) {
    processedSlugs.add(mdx.slug);

    try {
      // Prepare data based on content type
      let data;
      if (contentType === 'blog') {
        data = {
          title: mdx.frontmatter.title,
          description: mdx.frontmatter.description,
          slug: mdx.slug,
          date: mdx.frontmatter.date,
          content: markdownToHTML(mdx.content),
          publishedAt: new Date().toISOString()
        };
      } else if (contentType === 'events') {
        data = {
          title: mdx.frontmatter.title,
          slug: mdx.slug,
          order: mdx.frontmatter.order || 0,
          content: markdownToHTML(mdx.content),
          publishedAt: new Date().toISOString()
        };
      }

      // Check if exists
      const existing = await findBySlug(config.apiId, mdx.slug);

      if (existing) {
        if (DRY_RUN) {
          console.log(`   🔄 [DRY-RUN] Would update: ${mdx.slug}`);
        } else {
          await updateEntry(config.apiId, existing.documentId, data);
          console.log(`   🔄 Updated: ${mdx.slug}`);
        }
        results.updated++;
      } else {
        if (DRY_RUN) {
          console.log(`   ✅ [DRY-RUN] Would create: ${mdx.slug}`);
        } else {
          await createEntry(config.apiId, data);
          console.log(`   ✅ Created: ${mdx.slug}`);
        }
        results.created++;
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${mdx.slug}: ${error.message}`);
      results.errors++;
    }
  }

  // Find orphaned entries (in Strapi but not in MDX)
  for (const entry of strapiEntries) {
    if (!processedSlugs.has(entry.slug)) {
      try {
        if (DRY_RUN) {
          console.log(`   🗑️  [DRY-RUN] Would delete: ${entry.slug}`);
        } else {
          await deleteEntry(config.apiId, entry.documentId);
          console.log(`   🗑️  Deleted: ${entry.slug}`);
        }
        results.deleted++;
      } catch (error) {
        console.error(`   ❌ Error deleting ${entry.slug}: ${error.message}`);
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
