import { toolRegistry } from './src/tools/registry';
import { ComplianceChecker } from './src/tools/implementations/compliance-checker';
import { CloudPricing } from './src/tools/implementations/cloud-pricing';

async function runTests() {
    console.log('🧪 Testing Toolbox Access Control & Functionality\n');

    // Test 1: Access Control
    console.log('1️⃣  Verifying Access Control...');

    const reqAnalyzerTools = toolRegistry.getToolsForAgent('requirement_analyzer');
    const costEstTools = toolRegistry.getToolsForAgent('cost_estimation');
    const techStackTools = toolRegistry.getToolsForAgent('tech_stack');

    const check = (name: string, tools: any[], expected: string[]) => {
        const toolNames = tools.map(t => t.name);
        const hasAll = expected.every(e => toolNames.includes(e));
        const onlyAll = toolNames.length === expected.length;

        if (hasAll && onlyAll) {
            console.log(`✅ ${name}: Correct tools [${toolNames.join(', ')}]`);
        } else {
            console.error(`❌ ${name}: Expected [${expected.join(', ')}], got [${toolNames.join(', ')}]`);
        }
    };

    check('Requirement Analyzer', reqAnalyzerTools, ['compliance_checker']);
    check('Cost Estimation', costEstTools, ['cloud_pricing', 'capacity_calculator']);
    check('Tech Stack', techStackTools, ['tech_radar']);

    // Test 2: Tool Execution
    console.log('\n2️⃣  Verifying Tool Execution...');

    const compliance = new ComplianceChecker();
    const piiResult = await compliance.execute({ text: "User email and phone number are required." });

    if (piiResult.risks[0].includes('PII') && piiResult.suggestedStandards.includes('GDPR')) {
        console.log('✅ ComplianceChecker: Detected PII and suggested GDPR');
    } else {
        console.error('❌ ComplianceChecker: Failed to detect PII', piiResult);
    }

    const pricing = new CloudPricing();
    const priceResult = await pricing.execute({ service: 'database', size: 'large' });

    if (priceResult.estimatedMonthlyCost === 200) {
        console.log('✅ CloudPricing: Correct estimation ($200)');
    } else {
        console.error('❌ CloudPricing: Incorrect estimation', priceResult);
    }

    console.log('\n✨ All tests completed.');
}

runTests().catch(console.error);
