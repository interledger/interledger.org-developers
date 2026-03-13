export type RawGitHubParts = {
  branch: string
  sourcePath: string
}

const RAW_GITHUB_HOST = 'raw.githubusercontent.com'
const EXPECTED_OWNER = 'interledger'
const EXPECTED_REPO = 'rfcs'

export function parseRawGitHubPath(
  inputUrl: string,
  context: string
): RawGitHubParts {
  const url = new URL(inputUrl)

  if (url.hostname !== RAW_GITHUB_HOST) {
    throw new Error(
      `Expected ${context} to use raw.githubusercontent.com, received: ${inputUrl}`
    )
  }

  const segments = url.pathname.split('/').filter(Boolean)

  if (segments.length < 4) {
    throw new Error(`Unexpected ${context} format: ${inputUrl}`)
  }

  const [owner, repo, branch, ...pathSegments] = segments

  if (owner !== EXPECTED_OWNER || repo !== EXPECTED_REPO) {
    throw new Error(`Unexpected RFC repository in ${context}: ${inputUrl}`)
  }

  if (!branch) {
    throw new Error(`Missing branch in ${context}: ${inputUrl}`)
  }

  if (pathSegments.length === 0) {
    throw new Error(`Missing source path in ${context}: ${inputUrl}`)
  }

  return {
    branch,
    sourcePath: pathSegments.join('/')
  }
}
