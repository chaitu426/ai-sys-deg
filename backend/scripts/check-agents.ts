
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const failedAgents = await prisma.agentOutput.findMany({
        where: {
            status: 'failed'
        },
        include: {
            designVersion: {
                include: {
                    project: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 5
    });

    console.log('Failed Agents:', JSON.stringify(failedAgents, null, 2));

    const totalPending = await prisma.agentOutput.count({ where: { status: 'pending' } });
    const totalProcessing = await prisma.agentOutput.count({ where: { status: 'processing' } });
    const totalCompleted = await prisma.agentOutput.count({ where: { status: 'completed' } });
    const totalFailed = await prisma.agentOutput.count({ where: { status: 'failed' } });

    console.log('Stats:', { totalPending, totalProcessing, totalCompleted, totalFailed });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
