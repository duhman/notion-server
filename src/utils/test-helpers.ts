import { Client } from '@notionhq/client';
import { NotionClientWrapper } from '../config/notion-client.js';

export class MockNotionClient extends NotionClientWrapper {
  protected client: Client;
  mockResponses: Map<string, any> = new Map();
  mockErrors: Map<string, Error> = new Map();
  calls: { method: string; args: any[] }[] = [];

  constructor() {
    super();
    this.client = {
      pages: this.createMockApi('pages'),
      blocks: this.createMockApi('blocks'),
      databases: this.createMockApi('databases'),
      search: this.createMockSearch(),
    } as unknown as Client;
  }

  setMockResponse(key: string, response: any) {
    this.mockResponses.set(key, response);
  }

  setMockError(key: string, error: Error) {
    this.mockErrors.set(key, error);
  }

  clearMocks() {
    this.mockResponses.clear();
    this.mockErrors.clear();
    this.calls = [];
  }

  private createMockApi(namespace: string) {
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

  private createMockSearch() {
    return this.createMockMethod('search');
  }

  private createMockMethod(key: string) {
    return async (...args: any[]) => {
      this.calls.push({ method: key, args });
      
      if (this.mockErrors.has(key)) {
        throw this.mockErrors.get(key);
      }
      
      return this.mockResponses.get(key) || {};
    };
  }
}

export const createMockPage = (id: string, title: string) => ({
  id,
  url: `https://notion.so/${id}`,
  properties: {
    title: {
      type: 'title',
      title: [{ plain_text: title }],
    },
  },
});
