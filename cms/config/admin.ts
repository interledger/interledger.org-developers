
const getPreviewPathname = (uid: string, { document }): string => {
  // Handle blog posts
  if (uid === "api::blog-post.blog-post") {
    if (!document?.id) {
      return "/blog";
    }

    return `/blog/preview?slug=${document.documentId}`;
  }
  return null;
};

export default ({ env }) => {
  const clientUrl = env("CLIENT_URL");

  return {
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
  preview: {
    enabled: true,
    config: {
      allowedOrigins: clientUrl,
      async handler(uid, { documentId }) {
        // Fetch the complete document from Strapi
        const document = await strapi.documents(uid).findOne({ documentId });
        
        // Generate the preview pathname based on content type and document
        const pathname = getPreviewPathname(uid, { document });

        // Disable preview if the pathname is not found
        if (!pathname) {
          return null;
        }

        // Use Next.js draft mode passing it a secret key and the content-type status - do we want to use secret key?
        // const urlSearchParams = new URLSearchParams({
        //   url: pathname,
        //   status 
        // });
        // return `${clientUrl}/${urlSearchParams}`;
        return `${clientUrl}${pathname}`;
      },
    }
  }
}};
