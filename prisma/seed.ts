import { hash } from 'bcryptjs';
import prisma from '../lib/prisma';

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';

  const passwordHash = await hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: 'ADMIN'
    },
    create: {
      email: adminEmail,
      name: '管理者ユーザー',
      passwordHash,
      role: 'ADMIN',
      monthlyLimit: 50
    }
  });

  console.log(`Seed completed. Admin user: ${adminEmail} / ${adminPassword}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
