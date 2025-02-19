import { z } from 'zod';
export const richTextSchema = z.object({
    type: z.literal('text'),
    text: z.object({
        content: z.string(),
        link: z.object({ url: z.string() }).nullable(),
    }),
    annotations: z.object({
        bold: z.boolean(),
        italic: z.boolean(),
        strikethrough: z.boolean(),
        underline: z.boolean(),
        code: z.boolean(),
        color: z.string(),
    }),
    plain_text: z.string(),
    href: z.string().nullable(),
});
export const titlePropertySchema = z.object({
    type: z.literal('title'),
    title: z.array(richTextSchema),
});
export const pageSchema = z.object({
    id: z.string(),
    url: z.string(),
    properties: z.record(z.union([
        titlePropertySchema,
        z.any(),
    ])),
});
