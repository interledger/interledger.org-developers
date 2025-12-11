import type { Schema, Struct } from '@strapi/strapi'

export interface SharedCtaLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_cta_links'
  info: {
    displayName: 'Cta Link'
  }
  attributes: {
    external: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    href: Schema.Attribute.String
    style: Schema.Attribute.Enumeration<['primary', 'secondary']>
    text: Schema.Attribute.String
    umami: Schema.Attribute.String
  }
}

export interface SharedHeroSection extends Struct.ComponentSchema {
  collectionName: 'components_shared_hero_sections'
  info: {
    displayName: 'hero section'
  }
  attributes: {
    hero_content: Schema.Attribute.Text
    hero_cta: Schema.Attribute.Component<'shared.cta-link', true>
    hero_title: Schema.Attribute.Text
  }
}

export interface SharedSection extends Struct.ComponentSchema {
  collectionName: 'components_shared_sections'
  info: {
    displayName: 'section'
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
