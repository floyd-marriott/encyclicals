import {defineType, defineField} from 'sanity'

export const documentSummary = defineType({
  name: 'documentSummary',
  title: 'Document Summary',
  type: 'document',
  fields: [
    defineField({
      name: 'document',
      type: 'reference',
      title: 'Document',
      to: [{type: 'encyclical'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      type: 'text',
      title: 'Summary',
      description: 'AI-generated summary as markdown',
    }),
    defineField({
      name: 'excerpt',
      type: 'text',
      title: 'Excerpt',
      description: 'Short preview text for cards and listings',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: 'document.incipit',
      subtitle: 'document.pope.fullName',
    },
  },
})
