
import { getOrchestrator } from '../src/core/orchestrator';
import { projectRepository } from '../src/db/repositories/project-repository';
import { prisma } from '../src/db/client';

async function testPartialUpdate() {
    console.log('--- Testing Partial Update ---');

    // 1. Setup Mock Data (Simulate a completed workflow)
    const userId = 'cmkphcae300003z8wapze1ecr';
    const project = await projectRepository.createProject({
        userId,
        title: 'Test Partial Update',
        description: 'Testing partial update logic'
    });

    console.log('Created project:', project.id);

    const version1 = await projectRepository.createDesignVersion({
        projectId: project.id,
        prompt: 'Initial prompt'
    });

    // Create mock outputs for v1
    await projectRepository.createAgentOutput({
        designVersionId: version1.id,
        agentType: 'requirement_analyzer',
        status: 'completed',
        output: { functionalRequirements: ['req1'] }
    });

    await projectRepository.createAgentOutput({
        designVersionId: version1.id,
        agentType: 'system_design',
        status: 'completed',
        output: { highLevelComponents: ['comp1'] }
    });

    console.log('Created v1 with mock outputs');

    // 2. Trigger Partial Update targeting 'tech_stack'
    // This should copy requirement_analyzer and system_design outputs to v2
    console.log('Triggering update targeting tech_stack...');
    const v2Id = await getOrchestrator().updateDesign(
        project.id,
        'Change request',
        'tech_stack'
    );
    console.log('Created v2:', v2Id);

    // 3. Verify Outputs in v2
    const v2 = await projectRepository.getDesignVersionById(v2Id);
    if (!v2) throw new Error('v2 not found');

    const reqOutput = v2.agentOutputs.find(o => o.agentType === 'requirement_analyzer');
    const sysOutput = v2.agentOutputs.find(o => o.agentType === 'system_design');
    const techOutput = v2.agentOutputs.find(o => o.agentType === 'tech_stack');

    console.log('v2 Requirement Output Status:', reqOutput?.status);
    console.log('v2 System Design Output Status:', sysOutput?.status);
    console.log('v2 Tech Stack Output Status:', techOutput?.status);

    if (reqOutput?.status !== 'completed') console.error('FAIL: requirement_analyzer should be completed (copied)');
    if (sysOutput?.status !== 'completed') console.error('FAIL: system_design should be completed (copied)');
    if (techOutput?.status !== 'pending') console.error('FAIL: tech_stack should be pending (enqueued)');

    if (reqOutput?.status === 'completed' && sysOutput?.status === 'completed' && techOutput?.status === 'pending') {
        console.log('SUCCESS: Partial update logic verified.');
    }

    await prisma.$disconnect();
}

testPartialUpdate().catch(console.error);
