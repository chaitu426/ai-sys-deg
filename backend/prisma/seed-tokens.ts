
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding token usage data...');

    const users = await prisma.user.findMany({ take: 5 });

    if (users.length === 0) {
        console.log('No users found. Skipping token usage seed.');
        return;
    }

    const providers = ['gemini', 'groq'];
    const models = {
        'gemini': ['gemini-1.5-flash', 'gemini-1.5-pro'],
        'groq': ['llama-3.1-70b', 'mixtral-8x7b']
    };

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Generate random usage for the last 30 days
    for (let i = 0; i < 100; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const provider = providers[Math.floor(Math.random() * providers.length)];
        const model = models[provider][Math.floor(Math.random() * models[provider].length)];

        // Random date within last 30 days
        const date = new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);

        const inputTokens = Math.floor(Math.random() * 5000) + 100;
        const outputTokens = Math.floor(Math.random() * 2000) + 50;
        const totalTokens = inputTokens + outputTokens;

        // Rough cost estimation
        let costPerMel = 0;
        if (provider === 'gemini') costPerMel = 0.5;
        if (provider === 'groq') costPerMel = 0.7;

        const estimatedCost = (totalTokens / 1000000) * costPerMel;

        await prisma.tokenUsage.create({
            data: {
                userId: user.id,
                provider,
                model,
                inputTokens,
                outputTokens,
                totalTokens,
                estimatedCost,
                createdAt: date
            }
        });
    }

    console.log('✅ Seeded 100 token usage records.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
