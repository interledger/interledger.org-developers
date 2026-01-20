import {
  setPluginConfig,
  defaultMarkdownPreset
} from '@_sh/strapi-plugin-ckeditor'
import type { PluginConfig, Preset } from '@_sh/strapi-plugin-ckeditor'

const myCustomPreset: Preset = {
  ...defaultMarkdownPreset,
  description: 'Markdown editor without H1',
  editorConfig: {
    ...defaultMarkdownPreset.editorConfig,
    heading: {
      options: defaultMarkdownPreset.editorConfig.heading?.options?.filter(
        (option) => option.model !== 'heading1'
      )
    },
    extraPlugins: [
      function cleanGoogleDocsOnPaste(editor: any) {
        const clipboardPlugin = editor.plugins.get('ClipboardPipeline')

        clipboardPlugin.on(
          'contentInsertion',
          (evt: any, data: any) => {
            const htmlContent = data.dataTransfer.getData('text/html')

            if (
              htmlContent &&
              (htmlContent.includes('docs-internal-guid') ||
                htmlContent.includes('google-docs'))
            ) {
              const cleanedHtml = htmlContent
                // Remove only the Google Docs wrapper <b> tag with font-weight:normal - is this too fragile?
                .replace(/<b[^>]*font-weight:\s*normal[^>]*>/gi, '')
                .replace(
                  /<\/b>(?=<br class="Apple-interchange-newline">)/gi,
                  ''
                )
                // Remove meta tags
                .replace(/<meta[^>]*>/gi, '')

              // Parse the cleaned HTML and insert it
              const viewFragment = editor.data.processor.toView(cleanedHtml)
              const modelFragment = editor.data.toModel(viewFragment)

              // Replace the content that would be inserted
              data.content = modelFragment
            }
          },
          { priority: 'high' }
        )
      }
    ]
  }
}

const myPluginConfig: PluginConfig = {
  presets: [myCustomPreset]
}

export default {
  register(app: any) {
    setPluginConfig(myPluginConfig)
  },

  bootstrap(app: any) {
    // Override button labels using DOM manipulation
    const interval = setInterval(() => {
      // Find all buttons in the admin panel
      const buttons = document.querySelectorAll('button')
      buttons.forEach((button) => {
        const span = button.querySelector('span')
        if (span && span.textContent === 'Save') {
          span.textContent = 'Save as Draft'
        }
        if (span && span.textContent === 'Publish') {
          span.textContent = 'Save / Update'
        }
      })
    }, 100)

    // Store interval for cleanup if needed
    ;(window as any).__strapiButtonInterval = interval
  }
}
