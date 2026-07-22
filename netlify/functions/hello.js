export default async () => {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Hello</title></head>
  <body><h1>Hello, World!</h1></body>
</html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } }
  )
}

export const config = {
  path: '/developers/api/hello'
}
