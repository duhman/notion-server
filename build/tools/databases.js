import { notionClient } from '../config/notion-client.js';
import { NotionMCPError, errorCodes } from '../utils/errors.js';
import { toolSchemas } from '../schemas/tools.js';
export async function createDatabase(args) {
    const input = toolSchemas.createDatabase.parse(args);
    try {
        const database = await notionClient.raw.databases.create({
            parent: { page_id: input.parentPageId },
            title: [{ type: 'text', text: { content: input.title } }],
            properties: input.properties,
        });
        return { database };
    }
    catch (error) {
        if (error.code === 'unauthorized') {
            throw new NotionMCPError('Unauthorized access', errorCodes.UNAUTHORIZED);
        }
        throw error;
    }
}
export async function queryDatabase(args) {
    const input = toolSchemas.queryDatabase.parse(args);
    return notionClient.request(`database:${input.databaseId}:${JSON.stringify(input.filter)}:${JSON.stringify(input.sorts)}`, async () => {
        try {
            const response = await notionClient.raw.databases.query({
                database_id: input.databaseId,
                filter: input.filter,
                sorts: input.sorts,
            });
            return {
                results: response.results,
                has_more: response.has_more,
                next_cursor: response.next_cursor,
            };
        }
        catch (error) {
            if (error.code === 'notFound') {
                throw new NotionMCPError('Database not found', errorCodes.NOT_FOUND);
            }
            throw error;
        }
    });
}
export async function retrieveDatabase(args) {
    try {
        const database = await notionClient.raw.databases.retrieve({
            database_id: args.databaseId,
        });
        return { database };
    }
    catch (error) {
        if (error.code === 'notFound') {
            throw new NotionMCPError('Database not found', errorCodes.NOT_FOUND);
        }
        throw error;
    }
}
export async function updateDatabase(args) {
    try {
        const updateParams = { database_id: args.databaseId };
        if (args.title) {
            updateParams.title = [{ type: 'text', text: { content: args.title } }];
        }
        if (args.properties) {
            updateParams.properties = args.properties;
        }
        const database = await notionClient.raw.databases.update(updateParams);
        return { database };
    }
    catch (error) {
        if (error.code === 'notFound') {
            throw new NotionMCPError('Database not found', errorCodes.NOT_FOUND);
        }
        throw error;
    }
}
