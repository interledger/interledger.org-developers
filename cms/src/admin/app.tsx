import { setPluginConfig, defaultMarkdownPreset } from '@_sh/strapi-plugin-ckeditor';
import type { PluginConfig, Preset } from '@_sh/strapi-plugin-ckeditor';

const myCustomPreset: Preset = {
  ...defaultMarkdownPreset,
  description: 'Markdown editor without H1',
  editorConfig: {
    ...defaultMarkdownPreset.editorConfig,
    heading: {
      options: defaultMarkdownPreset.editorConfig.heading?.options?.filter(
        (option) => option.model !== 'heading1'
      ),
    },
  },
};

const myPluginConfig: PluginConfig = {
  presets: [myCustomPreset],
};

export default {
  register(app: any) {
    setPluginConfig(myPluginConfig);
  },

  bootstrap(app: any) {
    // Override button labels using DOM manipulation
    const interval = setInterval(() => {
      // Find all buttons in the admin panel
      const buttons = document.querySelectorAll('button');
      buttons.forEach((button) => {
        const span = button.querySelector('span');
        if (span && span.textContent === 'Save') {
          span.textContent = 'Save as Draft';
        }
        if (span && span.textContent === 'Publish') {
          span.textContent = 'Publish to Netlify';
        }
      });
    }, 100);

    // Store interval for cleanup if needed
    (window as any).__strapiButtonInterval = interval;
  },
};
