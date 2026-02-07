
import { WebSearcher } from './src/utils/web-search';

async function test() {
    const results = await WebSearcher.search('python features');
    console.log(JSON.stringify(results, null, 2));
}

test();
