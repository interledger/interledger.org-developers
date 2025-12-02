export default ({ env }) => {
  const frontendOrigins = env.array('FRONTEND_ORIGINS', ['http://localhost:1103']);

  return [
    'strapi::logger',
    'strapi::errors',
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'connect-src': ["'self'", ...frontendOrigins],
            'img-src': ["'self'", 'data:', 'blob:', ...frontendOrigins],
            'media-src': ["'self'", 'data:', 'blob:', ...frontendOrigins],
            'script-src': ["'self'", "'unsafe-inline'", ...frontendOrigins],
            'style-src': ["'self'", "'unsafe-inline'", ...frontendOrigins],
          },
        },
        crossOriginEmbedderPolicy: false,
      },
    },
    {
      name: 'strapi::cors',
      config: {
        enabled: true,
        origin: frontendOrigins,
        headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
        keepHeadersOnError: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      },
    },
    'strapi::poweredBy',
    'strapi::query',
    'strapi::body',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};
