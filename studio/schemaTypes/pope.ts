import {defineType, defineField} from 'sanity'

export const pope = defineType({
  name: 'pope',
  title: 'Pope',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      type: 'string',
      title: 'Slug',
      description: 'Short identifier (e.g. leo13, pius11)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'regnalName',
      type: 'string',
      title: 'Regnal Name',
      description: "Pope's regnal name (e.g. Leo, Pius)",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'number',
      type: 'number',
      title: 'Number',
      description: 'Regnal number (e.g. 13 for Leo XIII)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'fullName',
      type: 'string',
      title: 'Full Name',
      description: 'Complete title (e.g. Leo XIII)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pontificateStart',
      type: 'number',
      title: 'Pontificate Start Year',
    }),
    defineField({
      name: 'pontificateEnd',
      type: 'number',
      title: 'Pontificate End Year',
    }),
  ],
  preview: {
    select: {
      title: 'fullName',
      subtitle: 'slug',
    },
  },
})
