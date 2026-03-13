import path from 'node:path'
import { parse } from 'node-html-parser'
import { getPublishedRfcRouteBySourcePath } from '../data/rfcs'

const { posix } = path

const RFC_GITHUB_BLOB_BASE_URL = 'https://github.com/interledger/rfcs/blob'
const PUBLISHED_RFC_ROUTE_BY_SOURCE_PATH = getPublishedRfcRouteBySourcePath()

type RewriteRfcLinksOptions = {
  sourceUrl: string
  docsBasePath?: string
}

type RawGitHubSource = {
  branch: string
  sourcePath: string
}

const RAW_GITHUB_HOST = 'raw.githubusercontent.com'
const EXPECTED_OWNER = 'interledger'
const EXPECTED_REPO = 'rfcs'

function parseRawGitHubSourceUrl(sourceUrl: string): RawGitHubSource {
  const url = new URL(sourceUrl)

  if (url.hostname !== RAW_GITHUB_HOST) {
    throw new Error(
      `Expected RFC source URL to use raw.githubusercontent.com, received: ${sourceUrl}`
    )
  }

  const segments = url.pathname.split('/').filter(Boolean)

  if (segments.length < 4) {
    throw new Error(`Unexpected RFC source URL format: ${sourceUrl}`)
  }

  const [owner, repo, branch, ...pathSegments] = segments

  if (owner !== EXPECTED_OWNER || repo !== EXPECTED_REPO) {
    throw new Error(`Unexpected RFC repository in source URL: ${sourceUrl}`)
  }

  if (!branch) {
    throw new Error(`Missing branch in RFC source URL: ${sourceUrl}`)
  }

  if (pathSegments.length === 0) {
    throw new Error(`Missing source path in RFC source URL: ${sourceUrl}`)
  }

  return {
    branch,
    sourcePath: pathSegments.join('/')
  }
}

function splitHref(href: string): { path: string; hash: string } {
  const hashIndex = href.indexOf('#')

  if (hashIndex === -1) {
    return { path: href, hash: '' }
  }

  return {
    path: href.slice(0, hashIndex),
    hash: href.slice(hashIndex)
  }
}

function isRelativeLink(linkPath: string): boolean {
  if (!linkPath) {
    return false
  }

  if (
    linkPath.startsWith('//') ||
    linkPath.startsWith('/') ||
    linkPath.startsWith('?') ||
    linkPath.startsWith('#')
  ) {
    return false
  }

  return !/^[a-z]+:/i.test(linkPath)
}

function isRelativeMarkdownLink(linkPath: string): boolean {
  return isRelativeLink(linkPath) && posix.extname(linkPath) === '.md'
}

function resolveSourcePath(
  linkPath: string,
  currentSourcePath: string
): string {
  const currentDirectory = posix.dirname(currentSourcePath)
  return posix.normalize(posix.join(currentDirectory, linkPath))
}

function toGitHubBlobUrl(
  branch: string,
  resolvedSourcePath: string,
  hash: string
): string {
  return `${RFC_GITHUB_BLOB_BASE_URL}/${branch}/${resolvedSourcePath}${hash}`
}

function normalizeDocsBasePath(docsBasePath?: string): string {
  if (!docsBasePath || docsBasePath === '/') {
    return ''
  }

  const trimmed = docsBasePath.replace(/\/+$/g, '')
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function joinBaseAndRoute(basePath: string, route: string): string {
  return `${normalizeDocsBasePath(basePath)}${route}`
}

function rewriteHref(
  href: string,
  currentSourcePath: string,
  sourceBranch: string,
  docsBasePath: string
): string {
  const { path: linkPath, hash } = splitHref(href)

  if (!isRelativeLink(linkPath)) {
    return href
  }

  const resolvedSourcePath = resolveSourcePath(linkPath, currentSourcePath)

  if (!isRelativeMarkdownLink(linkPath)) {
    return toGitHubBlobUrl(sourceBranch, resolvedSourcePath, hash)
  }

  const localRoute = PUBLISHED_RFC_ROUTE_BY_SOURCE_PATH.get(resolvedSourcePath)

  if (!localRoute) {
    return toGitHubBlobUrl(sourceBranch, resolvedSourcePath, hash)
  }

  return `${joinBaseAndRoute(docsBasePath, localRoute)}${hash}`
}

export function rewriteRfcLinks(
  html: string,
  { sourceUrl, docsBasePath = '' }: RewriteRfcLinksOptions
): string {
  const { sourcePath: currentSourcePath, branch: sourceBranch } =
    parseRawGitHubSourceUrl(sourceUrl)

  const document = parse(html)
  const links = document.querySelectorAll('a[href]')

  for (const link of links) {
    const href = link.getAttribute('href')

    if (!href) {
      continue
    }

    link.setAttribute(
      'href',
      rewriteHref(href, currentSourcePath, sourceBranch, docsBasePath)
    )
  }

  return document.toString()
}
