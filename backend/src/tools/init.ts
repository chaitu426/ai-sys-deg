/**
 * Tool initialization
 * Registers all available tools with the registry
 */

import { toolRegistry } from './registry';

// Import tool implementations
import { CapacityCalculator } from './implementations/capacity-calculator';
import { CloudPricing } from './implementations/cloud-pricing';
import { ComplianceChecker } from './implementations/compliance-checker';
import { TechRadar } from './implementations/tech-radar';
import { LatencyBudgetCalculator } from './implementations/latency-budget';
import { DatabaseSelector } from './implementations/database-selector';
import { SecurityThreatModeler } from './implementations/threat-modeler';
import { DeepResearch } from './implementations/deep-research';

/**
 * Initialize and register all tools
 * This must be called at application startup
 */
export function initializeTools(): void {
    // Register all tool implementations
    toolRegistry.register(new CapacityCalculator());
    toolRegistry.register(new CloudPricing());
    toolRegistry.register(new ComplianceChecker());
    toolRegistry.register(new TechRadar());
    toolRegistry.register(new LatencyBudgetCalculator());
    toolRegistry.register(new DatabaseSelector());
    toolRegistry.register(new SecurityThreatModeler());
    toolRegistry.register(new DeepResearch());

    console.log('[Tools] Registered 8 tools:', [
        'capacity_calculator',
        'cloud_pricing',
        'compliance_checker',
        'tech_radar',
        'latency_budget_calculator',
        'database_selector',
        'threat_modeler',
        'deep_research',
    ]);
}

/**
 * Get registered tool count (for health checks)
 */
export function getRegisteredToolCount(): number {
    return toolRegistry.getToolCount();
}
