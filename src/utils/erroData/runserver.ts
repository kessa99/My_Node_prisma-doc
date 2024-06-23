import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function connectToDatabase() {
    try {
        await prisma.$connect();
        console.log('Base de donnee connecte avec succes');
    } catch (error) {
        console.error('Oups probleme de connexion a la database');
        console.error(error);
        process.exit(1);
    }
}

export { connectToDatabase, prisma};