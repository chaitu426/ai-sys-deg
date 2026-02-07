import axios from 'axios';
import * as cheerio from 'cheerio';
import UserAgent from 'user-agents';

/**
 * Utility to perform web searches and fetch page content.
 * Uses DuckDuckGo HTML version for search results.
 */
export class WebSearcher {
  private static readonly SEARCH_URL = 'https://html.duckduckgo.com/html/';

  /**
   * Searches the web for the given query.
   * @param query The search query.
   * @param limit Max number of results to return.
   * @returns Array of search results (title, link, snippet).
   */
  static async search(
    query: string,
    limit = 5
  ): Promise<{ title: string; link: string; snippet: string }[]> {
    const userAgent = new UserAgent().toString();
    try {
      const response = await axios.post(this.SEARCH_URL, `q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': userAgent,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const $ = cheerio.load(response.data);
      const results: { title: string; link: string; snippet: string }[] = [];

      $('.result').each((_i, element) => {
        if (results.length >= limit) return false;

        const title = $(element).find('.result__a').text().trim();
        const link = $(element).find('.result__a').attr('href');
        const snippet = $(element).find('.result__snippet').text().trim();

        if (title && link && snippet) {
          results.push({ title, link, snippet });
        }

        return true;
      });

      return results;
    } catch (error) {
      console.error('Web search failed:', error);
      return [];
    }
  }

  /**
   * Fetches the text content of a generic web page.
   * @param url The URL to fetch.
   * @returns The text content of the page.
   */
  static async getPageText(url: string): Promise<string> {
    const userAgent = new UserAgent().toString();
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': userAgent,
        },
        timeout: 5000,
      });
      const $ = cheerio.load(response.data);

      // Remove scripts, styles, and other non-content elements
      $('script, style, nav, footer, header, aside, .ad, .advertisement').remove();

      // Get text and clean up whitespace
      return $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000); // Limit to 5000 chars
    } catch (error) {
      console.error(`Failed to fetch page text for ${url}:`, error);
      return '';
    }
  }
}
