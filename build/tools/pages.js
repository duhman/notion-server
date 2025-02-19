import { notionClient } from '../config/notion-client.js';
import { NotionMCPError, errorCodes } from '../utils/errors.js';
import { toolSchemas } from '../schemas/tools.js';
export async function searchPages(args) {
    const { query } = toolSchemas.searchPages.parse(args);
    return notionClient.request(`search:${query}`, async () => {
        const response = await notionClient.raw.search({
            query,
            filter: { property: 'object', value: 'page' },
        });
        return {
            pages: response.results
                .filter((result) => result.object === 'page')
                .map(page => ({
                id: page.id,
                url: page.url,
                title: page.properties?.title && 'title' in page.properties.title ?
                    page.properties.title.title?.[0]?.plain_text || 'Untitled' : 'Untitled',
            })),
        };
    });
}
export async function readPage(args) {
    const { pageId } = toolSchemas.readPage.parse(args);
    return notionClient.request(`page:${pageId}`, async () => {
        try {
            const page = await notionClient.raw.pages.retrieve({ page_id: pageId });
            const blocks = await notionClient.raw.blocks.children.list({ block_id: pageId });
            return {
                page,
                blocks: blocks.results.filter((block) => block.object === 'block'),
            };
        }
        catch (error) {
            if (error.code === 'notFound') {
                throw new NotionMCPError('Page not found', errorCodes.NOT_FOUND);
            }
            throw error;
        }
    });
}
export async function createPage(args) {
    const input = toolSchemas.createPage.parse(args);
    const properties = {
        ...input.properties,
    };
    if (input.title) {
        properties.title = {
            title: [{ text: { content: input.title } }],
        };
    }
    const children = input.content ? [{
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [{ type: 'text', text: { content: input.content } }],
            },
        }] : undefined;
    try {
        const page = await notionClient.raw.pages.create({
            parent: { page_id: input.parentPageId },
            properties,
            children,
        });
        return { page };
    }
    catch (error) {
        if (error.code === 'unauthorized') {
            throw new NotionMCPError('Unauthorized access', errorCodes.UNAUTHORIZED);
        }
        throw error;
    }
}
export async function updatePage(args) {
    const input = toolSchemas.updatePage.parse(args);
    try {
        const block = {
            object: 'block',
            type: input.type,
            [input.type]: {
                rich_text: [{ type: 'text', text: { content: input.content } }],
                color: 'default',
            },
        };
        if (input.mode === 'replace') {
            const blocks = await notionClient.raw.blocks.children.list({ block_id: input.pageId });
            await Promise.all(blocks.results
                .filter((block) => block.object === 'block')
                .map(block => notionClient.raw.blocks.delete({ block_id: block.id })));
        }
        const response = await notionClient.raw.blocks.children.append({
            block_id: input.pageId,
            children: [block],
        });
        return { blocks: response.results.filter((block) => block.object === 'block') };
    }
    catch (error) {
        if (error.code === 'notFound') {
            throw new NotionMCPError('Page not found', errorCodes.NOT_FOUND);
        }
        throw error;
    }
}
