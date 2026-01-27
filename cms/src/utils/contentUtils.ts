import MarkdownIt from 'markdown-it'
import { NodeHtmlMarkdown } from 'node-html-markdown'

const md = new MarkdownIt()

export function htmlToMarkdown(html: string): string {
  if (!html) return ''
  return NodeHtmlMarkdown.translate(html)
}

export function markdownToHtml(markdown: string): string {
  if (!markdown) return ''
  return md.render(markdown)
}
