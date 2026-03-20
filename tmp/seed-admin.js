const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    try {
        const adminExists = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const user = await prisma.user.create({
                data: {
                    username: 'admin',
                    password: hashedPassword,
                    name: 'Administrator',
                    role: 'ADMIN'
                }
            });
            console.log('Created default admin user: admin / admin123');
        } else {
            console.log('Admin user already exists:', adminExists.username);
        }
    } catch (err) {
        console.error('Error seeding admin:', err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
