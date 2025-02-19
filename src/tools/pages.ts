import { notionClient } from '../config/notion-client.js';
import { NotionMCPError, errorCodes } from '../utils/errors.js';
import { toolSchemas } from '../schemas/tools.js';
import type { ToolInputs } from '../schemas/tools.js';
import type { PageObjectResponse, BlockObjectResponse, SearchResponse, CreatePageResponse, AppendBlockChildrenResponse, BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints.js';

export async function searchPages(args: unknown) {
  const { query } = toolSchemas.searchPages.parse(args);
  
  return notionClient.request(`search:${query}`, async () => {
    const response = await notionClient.raw.search({
      query,
      filter: { property: 'object', value: 'page' },
    }) as SearchResponse;
    
    return {
      pages: response.results
        .filter((result): result is PageObjectResponse => result.object === 'page')
        .map(page => ({
          id: page.id,
          url: page.url,
          title: page.properties?.title && 'title' in page.properties.title ? 
            page.properties.title.title?.[0]?.plain_text || 'Untitled' : 'Untitled',
        })),
    };
  });
}

export async function readPage(args: unknown) {
  const { pageId } = toolSchemas.readPage.parse(args);
  
  return notionClient.request(`page:${pageId}`, async () => {
    try {
      const page = await notionClient.raw.pages.retrieve({ page_id: pageId }) as PageObjectResponse;
      const blocks = await notionClient.raw.blocks.children.list({ block_id: pageId });
      
      return {
        page,
        blocks: blocks.results.filter((block): block is BlockObjectResponse => block.object === 'block'),
      };
    } catch (error: any) {
      if (error.code === 'notFound') {
        throw new NotionMCPError('Page not found', errorCodes.NOT_FOUND);
      }
      throw error;
    }
  });
}

export async function createPage(args: unknown) {
  const input = toolSchemas.createPage.parse(args);
  
  const properties: Record<string, any> = {
    ...input.properties,
  };

  if (input.title) {
    properties.title = {
      title: [{ text: { content: input.title } }],
    };
  }

  const children = input.content ? [{
    object: 'block' as const,
    type: 'paragraph' as const,
    paragraph: {
      rich_text: [{ type: 'text' as const, text: { content: input.content } }],
    },
  }] : undefined;

  try {
    const page = await notionClient.raw.pages.create({
      parent: { page_id: input.parentPageId },
      properties,
      children,
    }) as CreatePageResponse;

    return { page };
  } catch (error: any) {
    if (error.code === 'unauthorized') {
      throw new NotionMCPError('Unauthorized access', errorCodes.UNAUTHORIZED);
    }
    throw error;
  }
}

export async function updatePage(args: unknown) {
  const input = toolSchemas.updatePage.parse(args);
  
  try {
    const block: BlockObjectRequest = {
      object: 'block',
      type: input.type,
      [input.type]: {
        rich_text: [{ type: 'text', text: { content: input.content } }],
        color: 'default',
      },
    } as BlockObjectRequest;

    if (input.mode === 'replace') {
      const blocks = await notionClient.raw.blocks.children.list({ block_id: input.pageId });
      await Promise.all(
        blocks.results
          .filter((block): block is BlockObjectResponse => block.object === 'block')
          .map(block => notionClient.raw.blocks.delete({ block_id: block.id }))
      );
    }

    const response = await notionClient.raw.blocks.children.append({
      block_id: input.pageId,
      children: [block],
    }) as AppendBlockChildrenResponse;

    return { blocks: response.results.filter((block): block is BlockObjectResponse => block.object === 'block') };
  } catch (error: any) {
    if (error.code === 'notFound') {
      throw new NotionMCPError('Page not found', errorCodes.NOT_FOUND);
    }
    throw error;
  }
}
