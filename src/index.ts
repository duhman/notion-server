import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import * as pageTools from './tools/pages';
import * as databaseTools from './tools/databases';
import { NotionMCPError } from './utils/errors';
import { toolSchemas } from './schemas/tools';

// Tool definitions with optimized naming and descriptions
const TOOL_DEFINITIONS = [
  {
    name: 'notion_search_pages',
    description: 'Search through Notion pages with optional filters',
    inputSchema: toolSchemas.searchPages,
  },
  {
    name: 'notion_read_page',
    description: 'Read a Notion page and its content blocks',
    inputSchema: toolSchemas.readPage,
  },
  {
    name: 'notion_create_page',
    description: 'Create a new Notion page with optional content and properties',
    inputSchema: toolSchemas.createPage,
  },
  {
    name: 'notion_update_page',
    description: 'Update a Notion page\'s content with various modes (replace/append/merge)',
    inputSchema: toolSchemas.updatePage,
  },
  {
    name: 'notion_create_database',
    description: 'Create a new Notion database with custom schema',
    inputSchema: toolSchemas.createDatabase,
  },
  {
    name: 'notion_query_database',
    description: 'Query a Notion database with filters and sorting',
    inputSchema: toolSchemas.queryDatabase,
  },
];

// Tool implementation handlers with improved error handling
const toolHandlers = {
  notion_search_pages: pageTools.searchPages,
  notion_read_page: pageTools.readPage,
  notion_create_page: pageTools.createPage,
  notion_update_page: pageTools.updatePage,
  notion_create_database: databaseTools.createDatabase,
  notion_query_database: databaseTools.queryDatabase,
};

// Initialize MCP server with enhanced error handling
const server = new Server(
  {
    async listTools(request: unknown) {
      ListToolsRequestSchema.parse(request);
      return { tools: TOOL_DEFINITIONS };
    },

    async callTool(request: unknown) {
      const { tool, arguments: args } = CallToolRequestSchema.parse(request);
      
      const handler = toolHandlers[tool as keyof typeof toolHandlers];
      if (!handler) {
        throw new NotionMCPError(
          `Tool '${tool}' not found`,
          'TOOL_NOT_FOUND'
        );
      }

      try {
        const result = await handler(args);
        return { result };
      } catch (error) {
        const mcpError = NotionMCPError.fromError(error);
        throw mcpError;
      }
    },
  },
  new StdioServerTransport(),
);

// Start the server
async function main() {
  try {
    await server.start();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
