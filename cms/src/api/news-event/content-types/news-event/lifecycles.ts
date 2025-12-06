/**
 * Lifecycle callbacks for news-event
 * Generates MDX files that match the events content format used on the site
 * Then commits and pushes to trigger Netlify preview builds
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

interface NewsEvent {
  id: number;
  title: string;
  slug: string;
  order: number;
  content: string;
  publishedAt?: string;
}

interface Event {
  result?: NewsEvent;
}

/**
 * Converts HTML content to markdown-like format
 */
function htmlToMarkdown(html: string): string {
  if (!html) return '';

  return html
    .replace(/&nbsp;/gi, ' ')
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '###### $1\n\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n')
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([\s\S]*?)"[^>]*>/gi, '![$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function escapeQuotes(value: string): string {
  return value.replace(/"/g, '\\"');
}

function generateFilename(event: NewsEvent): string {
  return `${event.slug}.mdx`;
}

function generateMDX(event: NewsEvent): string {
  const frontmatterLines = [
    `title: "${escapeQuotes(event.title)}"`,
    `order: ${event.order || 0}`,
  ].filter(Boolean) as string[];

  const frontmatter = frontmatterLines.join('\n');
  const content = event.content ? htmlToMarkdown(event.content) : '';

  return `---\n${frontmatter}\n---\n\n${content}\n`;
}

async function writeMDXFile(event: NewsEvent): Promise<void> {
  const outputPath = process.env.EVENTS_MDX_OUTPUT_PATH || '../src/content/events';
  // Resolve from dist/src/api/news-event/content-types/news-event/ up to cms root then project root
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath);

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  const filename = generateFilename(event);
  const filepath = path.join(baseDir, filename);
  const mdxContent = generateMDX(event);

  fs.writeFileSync(filepath, mdxContent, 'utf-8');
  console.log(`✅ Generated News Event MDX file: ${filepath}`);
}

async function deleteMDXFile(event: NewsEvent): Promise<void> {
  const outputPath = process.env.EVENTS_MDX_OUTPUT_PATH || '../src/content/events';
  // Resolve from dist/src/api/news-event/content-types/news-event/ up to cms root then project root
  const baseDir = path.resolve(__dirname, '../../../../../../', outputPath);
  const filename = generateFilename(event);
  const filepath = path.join(baseDir, filename);

  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    console.log(`🗑️  Deleted News Event MDX file: ${filepath}`);
  }
}

/**
 * Escapes a string for safe use in shell commands (single-quoted context)
 */
function escapeForShell(str: string): string {
  // For single-quoted strings, we only need to handle single quotes
  // Replace ' with '\'' (end quote, escaped quote, start quote)
  return str.replace(/'/g, "'\\''");
}

/**
 * Commits and pushes changes to git to trigger Netlify preview builds
 */
async function gitCommitAndPush(filepath: string, message: string): Promise<void> {
  // Skip git operations if disabled via env var
  if (process.env.STRAPI_DISABLE_GIT_SYNC === 'true') {
    console.log('⏭️  Git sync disabled via STRAPI_DISABLE_GIT_SYNC');
    return;
  }

  // Get the project root (where .git lives)
  const projectRoot = path.resolve(__dirname, '../../../../../../');

  // Escape the message for shell (handles quotes and special chars)
  const safeMessage = escapeForShell(message);
  const safeFilepath = escapeForShell(filepath);

  return new Promise((resolve, reject) => {
    // Stage the specific file, commit, and push
    // Use single quotes to avoid issues with double quotes in titles
    const commands = [
      `git add '${safeFilepath}'`,
      `git commit -m '${safeMessage}'`,
      `git push`
    ].join(' && ');

    exec(commands, { cwd: projectRoot }, (error, stdout, stderr) => {
      if (error) {
        // Don't fail the lifecycle if git operations fail
        // This allows content to still be saved even if git has issues
        console.error(`⚠️  Git sync failed: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        resolve(); // Resolve anyway to not block Strapi
        return;
      }
      console.log(`✅ Git sync complete: ${message}`);
      if (stdout) console.log(stdout);
      resolve();
    });
  });
}

export default {
  async afterCreate(event: Event) {
    const { result } = event;
    if (result && result.publishedAt) {
      await writeMDXFile(result);
      const filename = generateFilename(result);
      const outputPath = process.env.EVENTS_MDX_OUTPUT_PATH || '../src/content/events';
      const baseDir = path.resolve(__dirname, '../../../../../../', outputPath);
      const filepath = path.join(baseDir, filename);
      await gitCommitAndPush(filepath, `events: add "${result.title}"`);
    }
  },

  async afterUpdate(event: Event) {
    const { result } = event;
    if (result) {
      const filename = generateFilename(result);
      const outputPath = process.env.EVENTS_MDX_OUTPUT_PATH || '../src/content/events';
      const baseDir = path.resolve(__dirname, '../../../../../../', outputPath);
      const filepath = path.join(baseDir, filename);

      if (result.publishedAt) {
        await writeMDXFile(result);
        await gitCommitAndPush(filepath, `events: update "${result.title}"`);
      } else {
        await deleteMDXFile(result);
        await gitCommitAndPush(filepath, `events: unpublish "${result.title}"`);
      }
    }
  },

  async afterDelete(event: Event) {
    const { result } = event;
    if (result) {
      await deleteMDXFile(result);
      const filename = generateFilename(result);
      const outputPath = process.env.EVENTS_MDX_OUTPUT_PATH || '../src/content/events';
      const baseDir = path.resolve(__dirname, '../../../../../../', outputPath);
      const filepath = path.join(baseDir, filename);
      await gitCommitAndPush(filepath, `events: delete "${result.title}"`);
    }
  },
};
