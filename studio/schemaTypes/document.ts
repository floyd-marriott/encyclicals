import {defineType, defineField} from 'sanity'

export const documentType = defineType({
  name: 'encyclical',
  title: 'Document',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      type: 'string',
      title: 'Slug',
      description: 'URL-friendly identifier (e.g. rerum-novarum)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'incipit',
      type: 'string',
      title: 'Incipit',
      description: 'Latin opening words of the document',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'englishTitle',
      type: 'string',
      title: 'English Title',
      description: 'Common English title, if one exists',
    }),
    defineField({
      name: 'pope',
      type: 'reference',
      title: 'Pope',
      to: [{type: 'pope'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'type',
      type: 'string',
      title: 'Document Type',
      description: 'Canonical classification (encyclical, bull, brief, etc.)',
    }),
    defineField({
      name: 'year',
      type: 'number',
      title: 'Year',
      description: 'Publication year',
    }),
    defineField({
      name: 'date',
      type: 'string',
      title: 'Date',
      description: 'ISO date string (YYYY-MM-DD or YYYY)',
    }),
    defineField({
      name: 'dateApproximate',
      type: 'boolean',
      title: 'Date Approximate',
      description: 'True if the date is uncertain',
    }),
    defineField({
      name: 'addressee',
      type: 'text',
      title: 'Addressee',
      description: 'Original addressee line from the document',
      rows: 3,
    }),
    defineField({
      name: 'addresseeScope',
      type: 'string',
      title: 'Addressee Scope',
      description: 'Scope of the intended audience',
    }),
    defineField({
      name: 'language',
      type: 'string',
      title: 'Language',
      description: 'ISO code of the document text (en, la, it, fr, de, es)',
    }),
    defineField({
      name: 'translated',
      type: 'boolean',
      title: 'Translated',
      description: 'True if the text is a translation from the original',
    }),
    defineField({
      name: 'translationSource',
      type: 'string',
      title: 'Translation Source',
      description: 'Source of the translation (e.g. vatican.va, DeepL)',
    }),
    defineField({
      name: 'tags',
      type: 'array',
      title: 'Tags',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'wordCount',
      type: 'number',
      title: 'Word Count',
    }),
    defineField({
      name: 'fileSize',
      type: 'number',
      title: 'File Size (bytes)',
    }),
    defineField({
      name: 'body',
      type: 'array',
      title: 'Body',
      of: [
        {type: 'block', styles: [{title: 'Normal', value: 'normal'}, {title: 'Heading 2', value: 'h2'}], marks: {annotations: [], decorators: []}},
      ],
      description: 'Full document text as Portable Text',
    }),
    defineField({
      name: 'summary',
      type: 'array',
      title: 'Summary',
      of: [
        {type: 'block', styles: [{title: 'Normal', value: 'normal'}, {title: 'Heading 2', value: 'h2'}], marks: {annotations: [], decorators: []}},
      ],
      description: 'AI-generated summary',
    }),
    defineField({
      name: 'rawClosingDate',
      type: 'text',
      title: 'Raw Closing Date',
      description: 'Original closing formula verbatim',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: 'incipit',
      subtitle: 'pope.fullName',
    },
  },
})
