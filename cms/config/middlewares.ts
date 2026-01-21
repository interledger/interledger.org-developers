export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io'],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: ['http://localhost:1103', 'http://127.0.0.1:1103', 'https://deploy-preview-175--developers-preview.netlify.app'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      formLimit: '5mb',
      jsonLimit: '5mb',
      textLimit: '5mb',
      formidable: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  // Custom middleware for automatic WebP conversion on image upload
  'global::image-optimizer',
];
