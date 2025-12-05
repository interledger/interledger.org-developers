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
  register() {
    setPluginConfig(myPluginConfig);
  },
};
