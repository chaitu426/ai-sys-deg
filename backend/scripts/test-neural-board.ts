
import { projectRepository } from '../src/db/repositories/project-repository';
import { prisma } from '../src/db/client';
import { SharedMemory } from '../src/core/contracts';

async function testNeuralBoard() {
    console.log('🧪 Testing Neural Board (Shared Memory)...');

    // 1. Create a dummy project and design version
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log('Skipping test: No user found in DB');
        return;
    }

    const project = await projectRepository.createProject({
        userId: user.id,
        title: 'Neural Board Test',
        description: 'Testing shared memory',
    });

    const version = await projectRepository.createDesignVersion({
        projectId: project.id,
        prompt: 'Test prompt',
    });

    console.log(`✅ Created Design Version: ${version.id}`);

    // 2. Verify initial state (should be null or empty)
    // fetch fresh
    let freshVersion = await projectRepository.getDesignVersionById(version.id);
    console.log('Initial Shared Memory:', freshVersion?.sharedMemory);

    // 3. Simulate Agent A writing "Decisions"
    const updatesA: Partial<SharedMemory> = {
        decisions: ['Use Microservices', 'Use PostgreSQL'],
        insights: { 'latency': 'critical' }
    };

    await projectRepository.updateSharedMemory(version.id, updatesA);
    console.log('✅ Agent A updated memory');

    // 4. Simulate Agent B writing "Risks" and reading "Decisions"
    freshVersion = await projectRepository.getDesignVersionById(version.id);
    const currentMemory = freshVersion?.sharedMemory as unknown as SharedMemory;

    if (!currentMemory.decisions.includes('Use Microservices')) {
        throw new Error('❌ Failed: Agent B cannot see Agent A\'s decisions');
    }

    const updatesB: Partial<SharedMemory> = {
        risks: ['Complexity overhead'],
        decisions: ['Use Redis'] // Should append, not overwrite (if logic is correct)
    };

    await projectRepository.updateSharedMemory(version.id, updatesB);
    console.log('✅ Agent B updated memory');

    // 5. Verify Final State
    freshVersion = await projectRepository.getDesignVersionById(version.id);
    const finalMemory = freshVersion?.sharedMemory as unknown as SharedMemory;

    console.log('Final Shared Memory:', JSON.stringify(finalMemory, null, 2));

    if (finalMemory.decisions.length !== 3) {
        console.error('❌ Expected 3 decisions, got ' + finalMemory.decisions.length);
    }

    if (finalMemory.risks[0] !== 'Complexity overhead') {
        console.error('❌ Risk missing');
    }

    // Cleanup
    await prisma.project.delete({ where: { id: project.id } });
    console.log('🧹 Cleanup done');
}

testNeuralBoard()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
