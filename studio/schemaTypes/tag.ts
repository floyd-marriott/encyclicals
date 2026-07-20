import {defineType, defineField} from 'sanity'

export const tag = defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      type: 'string',
      title: 'Slug',
      description: 'URL-friendly identifier (e.g. social-doctrine)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'label',
      type: 'string',
      title: 'Label',
      description: 'Human-readable tag name',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Description',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: 'label',
      subtitle: 'slug',
    },
  },
})
