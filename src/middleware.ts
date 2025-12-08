import type { MiddlewareHandler } from 'astro'

export const onRequest: MiddlewareHandler = async (_, next) => {
  return next()
}
