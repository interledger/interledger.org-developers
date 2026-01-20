import fs from 'fs'
import path from 'path'

function copySchemas() {
  const srcDir = path.join(__dirname, '../../src')
  const destDir = path.join(__dirname)

  function copyDir(src: string, dest: string) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }

    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        copyDir(srcPath, destPath)
      } else if (entry.name.endsWith('.json')) {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }

  try {
    copyDir(srcDir, destDir)
    console.log('✅ Schema files copied successfully')
  } catch (error) {
    console.error('❌ Error copying schema files:', error)
  }
}

/**
 * Configure pretty labels for field names in the admin panel.
 * This updates the content-manager metadata stored in the database.
 */
async function configureFieldLabels(strapi: any) {
  // Map of content type UIDs to their field label configurations
  // All fields get human-readable labels for better UX
  const labelConfigs: Record<string, Record<string, string>> = {
    'api::blog-post.blog-post': {
      title: 'Title',
      description: 'Description',
      slug: 'URL Slug',
      date: 'Publish Date',
      lang: 'Language',
      featuredImage: 'Featured Image',
      ogImageUrl: 'OG Image URL',
      content: 'Content',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      publishedAt: 'Published At'
    },
    'api::press-item.press-item': {
      title: 'Title',
      description: 'Description',
      publishDate: 'Publish Date',
      slug: 'URL Slug',
      publication: 'Publication Name',
      publicationLogo: 'Publication Logo URL',
      externalUrl: 'External URL',
      content: 'Content',
      featured: 'Featured',
      category: 'Category',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      publishedAt: 'Published At'
    },
    'api::grant-track.grant-track': {
      name: 'Grant Name',
      amount: 'Grant Amount',
      description: 'Description',
      order: 'Display Order',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      publishedAt: 'Published At'
    },
    'api::info-item.info-item': {
      title: 'Title',
      content: 'Content',
      order: 'Display Order',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      publishedAt: 'Published At'
    },
    'api::financial-services-page.financial-services-page': {
      heroTitle: 'Hero Title',
      heroDescription: 'Hero Description',
      programOverview: 'Program Overview',
      applicationNotice: 'Application Notice',
      ctaTitle: 'CTA Title',
      ctaDescription: 'CTA Description',
      ctaEmailLabel: 'Email Button Label',
      ctaSubscribeLabel: 'Subscribe Button Label',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      publishedAt: 'Published At'
    }
  }

  for (const [uid, labels] of Object.entries(labelConfigs)) {
    if (Object.keys(labels).length === 0) continue

    try {
      // Get the content-manager plugin service
      const contentManagerService = strapi
        .plugin('content-manager')
        ?.service('content-types')
      if (!contentManagerService) continue

      // Get current configuration
      const configuration = await contentManagerService.findConfiguration({
        uid
      })
      if (!configuration?.metadatas) continue

      let needsUpdate = false
      const updatedMetadatas = { ...configuration.metadatas }

      for (const [fieldName, label] of Object.entries(labels)) {
        if (updatedMetadatas[fieldName]) {
          const currentEditLabel = updatedMetadatas[fieldName]?.edit?.label

          // Update if label is default (same as field name, case-insensitive), empty, or not set
          const isDefaultLabel =
            !currentEditLabel ||
            currentEditLabel === fieldName ||
            currentEditLabel.toLowerCase() === fieldName.toLowerCase()

          if (isDefaultLabel && currentEditLabel !== label) {
            updatedMetadatas[fieldName] = {
              ...updatedMetadatas[fieldName],
              edit: {
                ...updatedMetadatas[fieldName]?.edit,
                label
              },
              list: {
                ...updatedMetadatas[fieldName]?.list,
                label
              }
            }
            needsUpdate = true
          }
        }
      }

      if (needsUpdate) {
        await contentManagerService.updateConfiguration(
          { uid },
          { metadatas: updatedMetadatas }
        )
        strapi.log.info(`✅ Updated field labels for ${uid}`)
      }
    } catch (error) {
      // Log but don't fail - configuration might not exist yet
      strapi.log.debug(`Could not update labels for ${uid}: ${error.message}`)
    }
  }
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi } */) {
    // Copy schema JSON files after TypeScript compilation
    copySchemas()
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // Ensure database directory exists with proper permissions
    // Default database path is .tmp/data.db relative to process.cwd()
    const dbDir = path.resolve(process.cwd(), '.tmp')
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true, mode: 0o775 })
    } else {
      // Ensure directory has write permissions
      try {
        fs.chmodSync(dbDir, 0o775)
      } catch (error) {
        // Ignore permission errors if we can't change them
      }
    }

    // If database file exists, ensure it has write permissions
    const dbPath = path.join(dbDir, 'data.db')
    if (fs.existsSync(dbPath)) {
      try {
        fs.chmodSync(dbPath, 0o664)
      } catch (error) {
        // Ignore permission errors if we can't change them
      }
    }

    // Configure pretty field labels for the admin panel
    await configureFieldLabels(strapi)
  }
}
