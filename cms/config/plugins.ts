export default () => ({
  ckeditor: {
    enabled: true,
  },
  upload: {
    config: {
      // File size limit: 5MB
      sizeLimit: 5 * 1024 * 1024, // 5MB in bytes

      // Responsive breakpoints for auto-generated image variants
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64,
      },

      // Image optimization settings (using Sharp - built into Strapi)
      sharp: {
        jpeg: {
          quality: 80,
          progressive: true,
          mozjpeg: true,
        },
        png: {
          quality: 80,
          compressionLevel: 9,
        },
        webp: {
          quality: 80,
          effort: 6, // 0-6, higher = better compression but slower
        },
        avif: {
          quality: 80,
          effort: 6,
        },
      },

      // Allowed file types (security)
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/avif',
        'image/svg+xml',
      ],
    },
  },
});
