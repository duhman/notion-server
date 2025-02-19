import { z } from 'zod';
// Base schemas for common parameters
const pageIdSchema = z.object({
    pageId: z.string().min(1),
});
// Tool-specific schemas
export const toolSchemas = {
    searchPages: z.object({
        query: z.string().min(1),
    }),
    readPage: pageIdSchema,
    createPage: z.object({
        parentPageId: z.string().min(1),
        title: z.string().optional(),
        content: z.string().optional(),
        properties: z.record(z.any()).optional(),
    }),
    updatePage: pageIdSchema.extend({
        content: z.string(),
        mode: z.enum(['replace', 'append', 'merge']).default('append'),
        position: z.enum(['start', 'end']).default('end'),
        type: z.enum(['paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item']).default('paragraph'),
    }),
    addComment: pageIdSchema.extend({
        content: z.string().min(1),
    }),
    retrieveComments: pageIdSchema.extend({
        pageSize: z.number().min(1).max(100).default(50),
        startCursor: z.string().optional(),
    }),
    createDatabase: z.object({
        parentPageId: z.string().min(1),
        title: z.string().min(1),
        properties: z.record(z.any()),
    }),
    queryDatabase: z.object({
        databaseId: z.string().min(1),
        filter: z.record(z.any()).optional(),
        sorts: z.array(z.any()).optional(),
    }),
    updateBlock: z.object({
        blockId: z.string().min(1),
        content: z.string().min(1),
        type: z.enum(['paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item']),
    }),
    deleteBlock: z.object({
        blockId: z.string().min(1),
    }),
};
