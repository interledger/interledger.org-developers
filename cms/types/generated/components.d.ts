import type { Schema, Struct } from '@strapi/strapi'

export interface SharedCtaLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_cta_links'
  info: {
    displayName: 'Call-to-action Link'
  }
  attributes: {
    analytics_event_label: Schema.Attribute.String
    external: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    link: Schema.Attribute.String & Schema.Attribute.Required
    style: Schema.Attribute.Enumeration<['primary', 'secondary']> &
      Schema.Attribute.DefaultTo<'primary'>
    text: Schema.Attribute.String & Schema.Attribute.Required
  }
}

export interface SharedHeroSection extends Struct.ComponentSchema {
  collectionName: 'components_shared_hero_sections'
  info: {
    displayName: 'hero section'
  }
  attributes: {
    hero_call_to_action: Schema.Attribute.Component<'shared.cta-link', true>
    hero_content: Schema.Attribute.Text
    hero_title: Schema.Attribute.Text
  }
}

export interface SharedSection extends Struct.ComponentSchema {
  collectionName: 'components_shared_sections'
  info: {
    displayName: 'Text Block'
  }
  attributes: {
    content: Schema.Attribute.Blocks
    name: Schema.Attribute.String
    title: Schema.Attribute.String
  }
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.cta-link': SharedCtaLink
      'shared.hero-section': SharedHeroSection
      'shared.section': SharedSection
    }
  }
}
