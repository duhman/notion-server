import { NotionClientWrapper } from '../config/notion-client.js';
export class MockNotionClient extends NotionClientWrapper {
    client;
    mockResponses = new Map();
    mockErrors = new Map();
    calls = [];
    constructor() {
        super();
        this.client = {
            pages: this.createMockApi('pages'),
            blocks: this.createMockApi('blocks'),
            databases: this.createMockApi('databases'),
            search: this.createMockSearch(),
        };
    }
    setMockResponse(key, response) {
        this.mockResponses.set(key, response);
    }
    setMockError(key, error) {
        this.mockErrors.set(key, error);
    }
    clearMocks() {
        this.mockResponses.clear();
        this.mockErrors.clear();
        this.calls = [];
    }
    createMockApi(namespace) {
        return {
            retrieve: this.createMockMethod(`${namespace}.retrieve`),
            create: this.createMockMethod(`${namespace}.create`),
            update: this.createMockMethod(`${namespace}.update`),
            delete: this.createMockMethod(`${namespace}.delete`),
            list: this.createMockMethod(`${namespace}.list`),
            children: {
                append: this.createMockMethod(`${namespace}.children.append`),
                list: this.createMockMethod(`${namespace}.children.list`),
            },
        };
    }
    createMockSearch() {
        return this.createMockMethod('search');
    }
    createMockMethod(key) {
        return async (...args) => {
            this.calls.push({ method: key, args });
            if (this.mockErrors.has(key)) {
                throw this.mockErrors.get(key);
            }
            return this.mockResponses.get(key) || {};
        };
    }
}
export const createMockPage = (id, title) => ({
    id,
    url: `https://notion.so/${id}`,
    properties: {
        title: {
            type: 'title',
            title: [{ plain_text: title }],
        },
    },
});
