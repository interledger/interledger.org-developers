import { LinearClient } from '@linear/sdk'

if (!process.env.LINEAR_API_KEY) {
  throw new Error('LINEAR_API_KEY is not set in environment variables')
}

export const linear = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY,
})
