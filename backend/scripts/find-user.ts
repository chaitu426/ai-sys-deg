
import { prisma } from '../src/db/client';

async function findUser() {
    const user = await prisma.user.findFirst();
    if (user) {
        console.log(`FOUND_USER_ID:${user.id}`);
    } else {
        console.log('NO_USERS_FOUND');
    }
    await prisma.$disconnect();
}

findUser();
