import { notionClient } from '../config/notion-client';
import { NotionMCPError, errorCodes } from '../utils/errors';
import { toolSchemas } from '../schemas/tools';
import type { ToolInputs } from '../schemas/tools';

export async function searchPages(args: unknown) {
  const { query } = toolSchemas.searchPages.parse(args);
  
  return notionClient.request(`search:${query}`, async () => {
    const response = await notionClient.raw.search({
      query,
      filter: { property: 'object', value: 'page' },
    });
    
    return {
      pages: response.results.map(page => ({
        id: page.id,
        url: page.url,
        title: page.properties?.title?.title?.[0]?.plain_text || 'Untitled',
      })),
    };
  });
}

export async function readPage(args: unknown) {
  const { pageId } = toolSchemas.readPage.parse(args);
  
  return notionClient.request(`page:${pageId}`, async () => {
    try {
      const page = await notionClient.raw.pages.retrieve({ page_id: pageId });
      const blocks = await notionClient.raw.blocks.children.list({ block_id: pageId });
      
      return {
        page,
        blocks: blocks.results,
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
    const block = {
      object: 'block',
      type: input.type,
      [input.type]: {
        rich_text: [{ type: 'text', text: { content: input.content } }],
      },
    };

    if (input.mode === 'replace') {
      await notionClient.raw.blocks.children.list({ block_id: input.pageId })
        .then(blocks => {
          return Promise.all(
            blocks.results.map(block => 
              notionClient.raw.blocks.delete({ block_id: block.id })
            )
          );
        });
    }

    const response = await notionClient.raw.blocks.children.append({
      block_id: input.pageId,
      children: [block],
    });

    return { blocks: response.results };
  } catch (error: any) {
    if (error.code === 'notFound') {
      throw new NotionMCPError('Page not found', errorCodes.NOT_FOUND);
    }
    throw error;
  }
}
