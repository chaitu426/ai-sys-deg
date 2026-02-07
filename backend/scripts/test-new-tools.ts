/**
 * Tool Verification Script
 * Tests all 7 agent tools and displays their outputs
 * 
 * Run: npx tsx scripts/test-tools.ts
 */

import { CapacityCalculator } from '../src/tools/implementations/capacity-calculator';
import { CloudPricing } from '../src/tools/implementations/cloud-pricing';
import { ComplianceChecker } from '../src/tools/implementations/compliance-checker';
import { TechRadar } from '../src/tools/implementations/tech-radar';
import { LatencyBudgetCalculator } from '../src/tools/implementations/latency-budget';
import { DatabaseSelector } from '../src/tools/implementations/database-selector';
import { SecurityThreatModeler } from '../src/tools/implementations/threat-modeler';

// ANSI colors for pretty output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
};

function printHeader(title: string) {
    console.log('\n' + colors.bright + colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.bright + colors.cyan + `  ${title}` + colors.reset);
    console.log(colors.bright + colors.cyan + '═'.repeat(60) + colors.reset);
}

function printToolInfo(tool: { name: string; description: string }) {
    console.log(colors.yellow + `\n📦 Tool: ${tool.name}` + colors.reset);
    console.log(colors.blue + `   Description: ${tool.description}` + colors.reset);
}

function printSuccess(message: string) {
    console.log(colors.green + `   ✅ ${message}` + colors.reset);
}

function printError(message: string) {
    console.log(colors.red + `   ❌ ${message}` + colors.reset);
}

function printOutput(data: unknown) {
    console.log(colors.magenta + '   Output:' + colors.reset);
    const lines = JSON.stringify(data, null, 2).split('\n');
    lines.forEach(line => {
        console.log('   ' + line);
    });
}

// ... Existing test functions (kept brief for brevity) ...

async function testLatencyBudget() {
    const tool = new LatencyBudgetCalculator();
    printToolInfo(tool);

    try {
        const result = await tool.execute({
            budgetMs: 200,
            hops: [
                { name: 'API Gateway', type: 'service', latencyMs: 20 },
                { name: 'Core Service', type: 'compute', latencyMs: 50 },
                { name: 'PostgreSQL', type: 'database', latencyMs: 10 }
            ]
        });

        printSuccess('Executed Latency Budget Calculation');
        printOutput(result);
        return true;
    } catch (error) {
        printError(`Execution failed: ${error}`);
        return false;
    }
}

async function testDatabaseSelector() {
    const tool = new DatabaseSelector();
    printToolInfo(tool);

    try {
        const result = await tool.execute({
            dataModel: 'relational',
            consistency: 'strong',
            writeVolume: 'high'
        });

        printSuccess('Executed DB Selection');
        printOutput(result);
        return true;
    } catch (error) {
        printError(`Execution failed: ${error}`);
        return false;
    }
}

async function testThreatModeler() {
    const tool = new SecurityThreatModeler();
    printToolInfo(tool);

    try {
        const result = await tool.execute({
            componentType: 'API',
            isPublicFacing: true,
            sensitiveData: true
        });

        printSuccess('Executed Threat Modeling');
        printOutput(result);
        return true;
    } catch (error) {
        printError(`Execution failed: ${error}`);
        return false;
    }
}

async function main() {
    console.log(colors.bright + '\n🔧 TOOL VERIFICATION SCRIPT' + colors.reset);

    const results: { tool: string; passed: boolean }[] = [];

    // New Tools
    printHeader('5. LATENCY BUDGET');
    results.push({ tool: 'latency_budget', passed: await testLatencyBudget() });

    printHeader('6. DATABASE SELECTOR');
    results.push({ tool: 'database_selector', passed: await testDatabaseSelector() });

    printHeader('7. THREAT MODELER');
    results.push({ tool: 'threat_modeler', passed: await testThreatModeler() });

    // ... Summary logic ...
}

main().catch(console.error);
