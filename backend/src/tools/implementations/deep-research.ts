import { Tool } from '../core/tool';
import { z } from 'zod';
import { WebSearcher } from '../../utils/web-search';
import { getGeminiClient } from '../../llm/gemini-client';

export class DeepResearch implements Tool {
    name = 'deep_research';
    description = 'Performs deep, synthesized web research. Returns a direct answer with citations, not just links.';
    category = 'analysis' as const;
    timeoutMs = 90000; // Increased timeout for synthesis

    parameters = {
        type: 'object' as const,
        properties: {
            query: { type: 'string', description: 'The research question (e.g., "Postgres vs Mongo performance 2024")' },
        },
        required: ['query'],
    };

    schema = z.object({
        query: z.string().min(1, 'Query required'),
    });

    async validate(args: any) {
        const result = this.schema.safeParse(args);
        return {
            valid: result.success,
            error: result.success ? undefined : result.error.message,
        };
    }

    async execute(args: { query: string }) {
        const { query } = this.schema.parse(args);
        const gemini = getGeminiClient();

        // 1. Parallel Search & Scrape
        // We fetch more results initially to ensure we get good content
        const searchResults = await WebSearcher.search(query, 4);

        if (searchResults.length === 0) {
            return {
                status: 'failed',
                message: 'No search results found to synthesize an answer.'
            };
        }

        // Parallel Fetch of Page Content
        const contentPromises = searchResults.map(async (result) => {
            try {
                const text = await WebSearcher.getPageText(result.link);
                return {
                    title: result.title,
                    link: result.link,
                    content: text.slice(0, 2500) // 2.5KB limit per page to fit context
                };
            } catch (e) {
                return null; // Ignore failed pages
            }
        });

        const rawPages = await Promise.all(contentPromises);
        const validPages = rawPages.filter(p => p !== null && p.content.length > 100);

        if (validPages.length === 0) {
            return {
                status: 'failed',
                message: 'Found search results but failed to scrape content.'
            };
        }

        // 2. Synthesize with LLM (Perplexity Style)
        const contextText = validPages.map((p, i) =>
            `[Source ${i + 1}]: ${p!.title} (${p!.link})\nContent: ${p!.content}\n---`
        ).join('\n\n');

        const systemPrompt = `You are a Deep Research Assistant. 
Your goal is to answer the user's question comprehensively using ONLY the provided search results.
- Synthesize the information into a coherent summary.
- Cite sources using [Source X] notation.
- If results contradict, mention the conflict.
- Be concise but professional (Staff Engineer level).`;

        const userPrompt = `Question: ${query}\n\nSearch Results:\n${contextText}\n\nAnswer:`;

        try {
            const aiResponse = await gemini.generate(userPrompt, systemPrompt);

            return {
                question: query,
                answer: aiResponse.text,
                sources: validPages.map((p, i) => ({
                    id: `Source ${i + 1}`,
                    title: p!.title,
                    link: p!.link
                })),
                raw_context_count: validPages.length
            };

        } catch (error) {
            // Fallback if AI fails: return raw data
            return {
                question: query,
                error: 'AI Synthesis failed, returning raw findings.',
                findings: validPages.map(p => ({ title: p!.title, link: p!.link, summary: p!.content.slice(0, 500) + '...' }))
            };
        }
    }
}
