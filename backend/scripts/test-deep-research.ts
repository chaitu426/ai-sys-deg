
import { DeepResearch } from '../src/tools/implementations/deep-research';
//import { getLogger } from '../utils/logger';

// Mock logger to avoid noise
// const logger = getLogger();

async function main() {
    console.log('--- Starting Deep Research Verification ---');

    const tool = new DeepResearch();
    const query = 'Postgres vs MongoDB for financial transaction ledger 2024';

    console.log(`\nQuery: "${query}"`);
    console.log('Executing tool (this may take 15-30s)...');

    try {
        const start = Date.now();
        const result = await tool.execute({ query });
        const duration = Date.now() - start;

        console.log('\n--- Tool Execution Complete ---');
        console.log(`Duration: ${duration}ms`);

        // Check structure
        if ('answer' in result) {
            console.log('\n[SUCCESS] Synthesized Answer:');
            console.log('---------------------------------------------------');
            console.log(result.answer);
            console.log('---------------------------------------------------');
            console.log('\nSources:');
            result?.sources?.forEach((s: any) => console.log(`- ${s.id}: ${s.title} (${s.link})`));
            console.log(`\nRaw Context Count: ${result.raw_context_count}`);
        } else {
            console.log('\n[FALLBACK] Raw Findings (AI Synthesis Failed):');
            console.log(JSON.stringify(result, null, 2));
        }

    } catch (error) {
        console.error('\n[ERROR] Tool failed:', error);
    }
}

main().catch(console.error);
