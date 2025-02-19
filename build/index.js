import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import * as pageTools from './tools/pages.js';
import * as databaseTools from './tools/databases.js';
import { NotionMCPError } from './utils/errors.js';
import { toolSchemas } from './schemas/tools.js';
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
// Server configuration schema
const ServerConfigSchema = z.object({
    name: z.string(),
    version: z.string(),
});
// Initialize MCP server with enhanced error handling
const config = ServerConfigSchema.parse({
    name: 'notion-mcp-server',
    version: '1.0.0',
});
const options = {
    capabilities: {
        experimental: {},
        logging: { level: 'info' },
        prompts: {},
        resources: {},
        tools: { allowList: [] },
    },
    async listTools(request) {
        ListToolsRequestSchema.parse(request);
        return { tools: TOOL_DEFINITIONS };
    },
    async callTool(request) {
        const parsed = CallToolRequestSchema.parse(request);
        const toolName = parsed.params.name;
        const args = parsed.params.arguments;
        const handler = toolHandlers[toolName];
        if (!handler) {
            throw new NotionMCPError(`Tool '${toolName}' not found`, 'TOOL_NOT_FOUND');
        }
        try {
            const result = await handler(args);
            return { result };
        }
        catch (error) {
            const mcpError = NotionMCPError.fromError(error);
            throw mcpError;
        }
    },
};
const transport = new StdioServerTransport();
const server = new Server({
    name: 'notion-mcp-server',
    version: '1.0.0',
    async listTools(request) {
        ListToolsRequestSchema.parse(request);
        return { tools: TOOL_DEFINITIONS };
    },
    async callTool(request) {
        const parsed = CallToolRequestSchema.parse(request);
        const toolName = parsed.params.name;
        const args = parsed.params.arguments;
        const handler = toolHandlers[toolName];
        if (!handler) {
            throw new NotionMCPError(`Tool '${toolName}' not found`, 'TOOL_NOT_FOUND');
        }
        try {
            const result = await handler(args);
            return { result };
        }
        catch (error) {
            const mcpError = NotionMCPError.fromError(error);
            throw mcpError;
        }
    },
}, {
    capabilities: {
        experimental: {},
        logging: { level: 'info' },
        prompts: {},
        resources: {},
        tools: { allowList: [] },
    },
});
// Start the server
transport.start();
