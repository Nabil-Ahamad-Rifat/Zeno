import { config, fields, singleton } from '@keystatic/core'

export default config({
  storage: { kind: 'local' },
  ui: {
    brand: { name: 'ZENO CMS' },
  },
  singletons: {
    terms: singleton({
      label: 'Terms of Service',
      path: 'src/keystatic/legal/terms',
      schema: {
        title: fields.text({ label: 'Title', defaultValue: 'Terms of Service' }),
        lastUpdated: fields.date({ label: 'Last Updated' }),
        content: fields.markdoc({ label: 'Content' }),
      },
    }),
    privacy: singleton({
      label: 'Privacy Policy',
      path: 'src/keystatic/legal/privacy',
      schema: {
        title: fields.text({ label: 'Title', defaultValue: 'Privacy Policy' }),
        lastUpdated: fields.date({ label: 'Last Updated' }),
        content: fields.markdoc({ label: 'Content' }),
      },
    }),
    refund: singleton({
      label: 'Refund Policy',
      path: 'src/keystatic/legal/refund',
      schema: {
        title: fields.text({ label: 'Title', defaultValue: 'Refund Policy' }),
        lastUpdated: fields.date({ label: 'Last Updated' }),
        content: fields.markdoc({ label: 'Content' }),
      },
    }),
    about: singleton({
      label: 'About Us',
      path: 'src/keystatic/legal/about',
      schema: {
        title: fields.text({ label: 'Title', defaultValue: 'About ZENO' }),
        content: fields.markdoc({ label: 'Content' }),
      },
    }),
  },
})
