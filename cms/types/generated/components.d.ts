import type { Schema, Struct } from '@strapi/strapi'

export interface SharedAuthorLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_author_links'
  info: {
    description: 'Name and optional profile URL for blog authors'
    displayName: 'Author link'
  }
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required
    url: Schema.Attribute.String
  }
}

export interface SharedBenefitItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_benefit_items'
  info: {
    description: 'A simple text item for lists of benefits or features'
    displayName: 'Benefit Item'
  }
  attributes: {
    text: Schema.Attribute.Text & Schema.Attribute.Required
  }
}

export interface SharedFeatureCard extends Struct.ComponentSchema {
  collectionName: 'components_shared_feature_cards'
  info: {
    description: 'A card component with title, description, icon and optional link'
    displayName: 'Feature Card'
  }
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required
    icon: Schema.Attribute.Enumeration<
      ['open-payments', 'rafiki', 'interledger', 'custom']
    > &
      Schema.Attribute.DefaultTo<'interledger'>
    isExternal: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    linkLabel: Schema.Attribute.String
    linkUrl: Schema.Attribute.String
    title: Schema.Attribute.String & Schema.Attribute.Required
  }
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.author-link': SharedAuthorLink
      'shared.benefit-item': SharedBenefitItem
      'shared.feature-card': SharedFeatureCard
    }
  }
}
