import path from 'path';

export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  // Point Strapi's public directory at the repo's Astro public folder so uploads land in /public/uploads
  dirs: {
    public: env('STRAPI_PUBLIC_DIR', path.resolve(__dirname, '../../public')),
  },
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
