export type PublishedRfc = {
  id: string
  title: string
  route: `/rfcs/${string}`
  sourceRawUrl: string
}

export const PUBLISHED_RFCS = [
  {
    id: 'interledger-protocol',
    title: 'Interledger Protocol V4 (ILPv4)',
    route: '/rfcs/interledger-protocol',
    sourceRawUrl:
      'https://raw.githubusercontent.com/interledger/rfcs/master/0027-interledger-protocol-4/0027-interledger-protocol-4.md'
  },
  {
    id: 'interledger-architecture',
    title: 'Interledger Architecture',
    route: '/rfcs/interledger-architecture',
    sourceRawUrl:
      'https://raw.githubusercontent.com/interledger/rfcs/master/0001-interledger-architecture/0001-interledger-architecture.md'
  },
  {
    id: 'ilp-addresses',
    title: 'Interledger Addresses',
    route: '/rfcs/ilp-addresses',
    sourceRawUrl:
      'https://raw.githubusercontent.com/interledger/rfcs/master/0015-ilp-addresses/0015-ilp-addresses.md'
  },
  {
    id: 'stream-protocol',
    title: 'STREAM Protocol',
    route: '/rfcs/stream-protocol',
    sourceRawUrl:
      'https://raw.githubusercontent.com/interledger/rfcs/master/0029-stream/0029-stream.md'
  },
  {
    id: 'simple-payment-setup-protocol',
    title: 'Simple Payment Setup Protocol (SPSP)',
    route: '/rfcs/simple-payment-setup-protocol',
    sourceRawUrl:
      'https://raw.githubusercontent.com/interledger/rfcs/master/0009-simple-payment-setup-protocol/0009-simple-payment-setup-protocol.md'
  },
  {
    id: 'peering-clearing-settling',
    title: 'Peering, Clearing and Settling',
    route: '/rfcs/peering-clearing-settling',
    sourceRawUrl:
      'https://raw.githubusercontent.com/interledger/rfcs/master/0032-peering-clearing-settlement/0032-peering-clearing-settlement.md'
  },
  {
    id: 'settlement-engines',
    title: 'Settlement Engines',
    route: '/rfcs/settlement-engines',
    sourceRawUrl:
      'https://raw.githubusercontent.com/interledger/rfcs/master/0038-settlement-engines/0038-settlement-engines.md'
  },
  {
    id: 'ilp-over-http',
    title: 'ILP Over HTTP',
    route: '/rfcs/ilp-over-http',
    sourceRawUrl:
      'https://raw.githubusercontent.com/interledger/rfcs/master/0035-ilp-over-http/0035-ilp-over-http.md'
  },
  {
    id: 'bilateral-transfer-protocol',
    title: 'Bilateral Transfer Protocol',
    route: '/rfcs/bilateral-transfer-protocol',
    sourceRawUrl:
      'https://raw.githubusercontent.com/interledger/rfcs/master/0023-bilateral-transfer-protocol/0023-bilateral-transfer-protocol.md'
  },
  {
    id: 'hashed-timelock-agreements',
    title: 'Hashed-Timelock Agreements',
    route: '/rfcs/hashed-timelock-agreements',
    sourceRawUrl:
      'https://raw.githubusercontent.com/interledger/rfcs/master/0022-hashed-timelock-agreements/0022-hashed-timelock-agreements.md'
  }
] as const satisfies readonly PublishedRfc[]

type RawGitHubRef = {
  branch: string
  sourcePath: string
}

const RAW_GITHUB_HOST = 'raw.githubusercontent.com'
const EXPECTED_OWNER = 'interledger'
const EXPECTED_REPO = 'rfcs'

function parseRawGitHubUrl(rawUrl: string): RawGitHubRef {
  const url = new URL(rawUrl)

  if (url.hostname !== RAW_GITHUB_HOST) {
    throw new Error(
      `Expected a raw.githubusercontent.com URL, received: ${rawUrl}`
    )
  }

  const segments = url.pathname.split('/').filter(Boolean)

  if (segments.length < 4) {
    throw new Error(`Unexpected raw GitHub URL format: ${rawUrl}`)
  }

  const [owner, repo, branch, ...pathSegments] = segments

  if (owner !== EXPECTED_OWNER || repo !== EXPECTED_REPO) {
    throw new Error(`Unexpected RFC repository URL: ${rawUrl}`)
  }

  if (!branch) {
    throw new Error(`Missing branch in RFC source URL: ${rawUrl}`)
  }

  if (pathSegments.length === 0) {
    throw new Error(`Missing source path in RFC source URL: ${rawUrl}`)
  }

  return {
    branch,
    sourcePath: pathSegments.join('/')
  }
}

export function getPublishedRfcRouteBySourcePath(): Map<string, string> {
  return new Map(
    PUBLISHED_RFCS.map((rfc) => {
      const { sourcePath } = parseRawGitHubUrl(rfc.sourceRawUrl)
      return [sourcePath, withTrailingSlash(rfc.route)]
    })
  )
}

export function getRfcById(id: PublishedRfc['id']): PublishedRfc {
  const rfc = PUBLISHED_RFCS.find((entry) => entry.id === id)

  if (!rfc) {
    throw new Error(`Unknown RFC id: ${id}`)
  }

  return rfc
}

function withTrailingSlash(route: string): string {
  return route.endsWith('/') ? route : `${route}/`
}
