/**
 * Tool Verification Script
 * Tests all 4 agent tools and displays their outputs
 * 
 * Run: npx tsx scripts/test-tools.ts
 */

import { CapacityCalculator } from '../src/tools/implementations/capacity-calculator';
import { CloudPricing } from '../src/tools/implementations/cloud-pricing';
import { ComplianceChecker } from '../src/tools/implementations/compliance-checker';
import { TechRadar } from '../src/tools/implementations/tech-radar';

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

async function testCapacityCalculator() {
    const tool = new CapacityCalculator();
    printToolInfo(tool);

    try {
        console.log(colors.blue + '   Test Case: 100,000 DAU, 50 req/user, 1MB storage/user' + colors.reset);

        const result = await tool.execute({
            dailyActiveUsers: 100000,
            avgRequestsPerUser: 50,
            avgStoragePerUserMB: 1,
        });

        printSuccess('Execution successful');
        printOutput(result);

        // Validate output
        if (result.requests?.averageRPS && result.storage?.dailyNewStorageGB) {
            printSuccess(`Calculated ${result.requests.averageRPS} avg RPS, ${result.requests.peakRPS} peak RPS`);
            printSuccess(`Storage: ${result.storage.dailyNewStorageGB.toFixed(2)} GB/day`);
            return true;
        }
        return false;
    } catch (error) {
        printError(`Execution failed: ${error}`);
        return false;
    }
}

async function testCloudPricing() {
    const tool = new CloudPricing();
    printToolInfo(tool);

    try {
        const testCases = [
            { service: 'compute', size: 'medium' },
            { service: 'database', size: 'large' },
            { service: 'cache', size: 'small' },
        ];

        let allPassed = true;

        for (const testCase of testCases) {
            console.log(colors.blue + `   Test Case: ${testCase.service} - ${testCase.size}` + colors.reset);

            const result = await tool.execute(testCase);

            if (result.estimatedMonthlyCost >= 0) {
                printSuccess(`${testCase.service}/${testCase.size}: $${result.estimatedMonthlyCost}/month`);
            } else {
                printError(`No pricing data for ${testCase.service}/${testCase.size}`);
                allPassed = false;
            }
        }

        // Show full output for last test
        const fullResult = await tool.execute({ service: 'database', size: 'xlarge' });
        printOutput(fullResult);

        return allPassed;
    } catch (error) {
        printError(`Execution failed: ${error}`);
        return false;
    }
}

async function testComplianceChecker() {
    const tool = new ComplianceChecker();
    printToolInfo(tool);

    try {
        const testCases = [
            {
                text: 'Store user email addresses and phone numbers for contact purposes',
                region: 'EU',
                expectedStandards: ['GDPR', 'CCPA']
            },
            {
                text: 'Process patient medical records and diagnosis information',
                region: 'US',
                expectedStandards: ['HIPAA', 'HITECH']
            },
            {
                text: 'Handle credit card payments and bank transactions',
                region: 'Global',
                expectedStandards: ['PCI-DSS']
            },
        ];

        let allPassed = true;

        for (const testCase of testCases) {
            console.log(colors.blue + `   Test Case: "${testCase.text.substring(0, 40)}..." (${testCase.region})` + colors.reset);

            const result = await tool.execute({ text: testCase.text, region: testCase.region });

            if (result.risks && result.risks.length > 0) {
                printSuccess(`Detected ${result.risks.length} risk(s)`);
                printSuccess(`Standards: ${result.suggestedStandards.join(', ')}`);

                // Check if expected standards are present
                const foundExpected = testCase.expectedStandards.every(s =>
                    result.suggestedStandards.includes(s)
                );
                if (!foundExpected) {
                    printError(`Expected standards ${testCase.expectedStandards.join(', ')} not all found`);
                    allPassed = false;
                }
            } else {
                printError('No risks detected when expected');
                allPassed = false;
            }
        }

        // Show full output for one test
        const fullResult = await tool.execute({
            text: 'User profile with email, phone, and payment card information',
            region: 'EU'
        });
        printOutput(fullResult);

        return allPassed;
    } catch (error) {
        printError(`Execution failed: ${error}`);
        return false;
    }
}

async function testTechRadar() {
    const tool = new TechRadar();
    printToolInfo(tool);

    try {
        const technologies = [
            { name: 'react', expectedStatus: 'Adopt' },
            { name: 'postgresql', expectedStatus: 'Adopt' },
            { name: 'kubernetes', expectedStatus: 'Adopt' },
            { name: 'mongodb', expectedStatus: 'Trial' },
            { name: 'rust', expectedStatus: 'Trial' },
        ];

        let allPassed = true;

        for (const tech of technologies) {
            console.log(colors.blue + `   Test Case: ${tech.name}` + colors.reset);

            const result = await tool.execute({ technology: tech.name });

            if (result.status) {
                const statusMatch = result.status === tech.expectedStatus;
                if (statusMatch) {
                    printSuccess(`${tech.name}: ${result.status} (${result.category})`);
                } else {
                    printError(`${tech.name}: Got ${result.status}, expected ${tech.expectedStatus}`);
                    allPassed = false;
                }
            } else {
                printError(`No status for ${tech.name}`);
                allPassed = false;
            }
        }

        // Show full output for one technology
        const fullResult = await tool.execute({ technology: 'next.js' });
        printOutput(fullResult);

        return allPassed;
    } catch (error) {
        printError(`Execution failed: ${error}`);
        return false;
    }
}

async function main() {
    console.log(colors.bright + '\n🔧 TOOL VERIFICATION SCRIPT' + colors.reset);
    console.log('Testing all 4 agent tools...\n');

    const results: { tool: string; passed: boolean }[] = [];

    // Test all tools
    printHeader('1. CAPACITY CALCULATOR');
    results.push({ tool: 'capacity_calculator', passed: await testCapacityCalculator() });

    printHeader('2. CLOUD PRICING');
    results.push({ tool: 'cloud_pricing', passed: await testCloudPricing() });

    printHeader('3. COMPLIANCE CHECKER');
    results.push({ tool: 'compliance_checker', passed: await testComplianceChecker() });

    printHeader('4. TECH RADAR');
    results.push({ tool: 'tech_radar', passed: await testTechRadar() });

    // Summary
    printHeader('TEST SUMMARY');

    let allPassed = true;
    results.forEach(r => {
        if (r.passed) {
            console.log(colors.green + `   ✅ ${r.tool}: PASSED` + colors.reset);
        } else {
            console.log(colors.red + `   ❌ ${r.tool}: FAILED` + colors.reset);
            allPassed = false;
        }
    });

    console.log();
    if (allPassed) {
        console.log(colors.bright + colors.green + '🎉 ALL TOOLS PASSED!' + colors.reset);
        process.exit(0);
    } else {
        console.log(colors.bright + colors.red + '⚠️  SOME TOOLS FAILED!' + colors.reset);
        process.exit(1);
    }
}

// Run the tests
main().catch(error => {
    console.error('Script error:', error);
    process.exit(1);
});
