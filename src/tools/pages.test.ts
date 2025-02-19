import { MockNotionClient, createMockPage } from '../utils/test-helpers';
import { searchPages, readPage, createPage } from './pages';
import { NotionMCPError } from '../utils/errors';

// Mock the notion client
jest.mock('../config/notion-client', () => ({
  notionClient: new MockNotionClient(),
}));

describe('Page Tools', () => {
  let mockClient: MockNotionClient;

  beforeEach(() => {
    mockClient = new MockNotionClient();
    jest.resetModules();
  });

  afterEach(() => {
    mockClient.clearMocks();
  });

  describe('searchPages', () => {
    it('should search pages successfully', async () => {
      const mockResults = {
        results: [
          createMockPage('page1', 'Test Page 1'),
          createMockPage('page2', 'Test Page 2'),
        ],
      };

      mockClient.setMockResponse('search', mockResults);

      const result = await searchPages({ query: 'test' });

      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].id).toBe('page1');
      expect(result.pages[0].title).toBe('Test Page 1');
    });

    it('should handle empty search results', async () => {
      mockClient.setMockResponse('search', { results: [] });

      const result = await searchPages({ query: 'nonexistent' });

      expect(result.pages).toHaveLength(0);
    });

    it('should throw error for invalid input', async () => {
      await expect(searchPages({})).rejects.toThrow();
    });
  });

  describe('readPage', () => {
    it('should read page successfully', async () => {
      const mockPage = createMockPage('page1', 'Test Page');
      const mockBlocks = {
        results: [
          { type: 'paragraph', paragraph: { text: [{ plain_text: 'Test content' }] } },
        ],
      };

      mockClient.setMockResponse('pages.retrieve', mockPage);
      mockClient.setMockResponse('blocks.children.list', mockBlocks);

      const result = await readPage({ pageId: 'page1' });

      expect(result.page).toBeDefined();
      expect(result.blocks).toBeDefined();
      expect(result.blocks.results).toHaveLength(1);
    });

    it('should handle page not found', async () => {
      mockClient.setMockError('pages.retrieve', new Error('notFound'));

      await expect(readPage({ pageId: 'nonexistent' }))
        .rejects
        .toThrow(NotionMCPError);
    });
  });

  describe('createPage', () => {
    it('should create page successfully', async () => {
      const mockPage = createMockPage('new-page', 'New Test Page');
      mockClient.setMockResponse('pages.create', mockPage);

      const result = await createPage({
        parentPageId: 'parent-page',
        title: 'New Test Page',
        content: 'Test content',
      });

      expect(result.page).toBeDefined();
      expect(result.page.id).toBe('new-page');
    });

    it('should handle unauthorized error', async () => {
      mockClient.setMockError('pages.create', new Error('unauthorized'));

      await expect(createPage({
        parentPageId: 'parent-page',
        title: 'Test',
      }))
        .rejects
        .toThrow(NotionMCPError);
    });
  });
});
