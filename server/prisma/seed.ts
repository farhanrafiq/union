import { prisma } from '../src/db';
import bcrypt from 'bcryptjs';

async function main() {
  const username = 'dealer1';
  const email = 'dealer1@example.com';
  const pwd = 'Union@2025';
  const passwordHash = await bcrypt.hash(pwd, 10);

  const existing = await prisma.dealer.findUnique({ where: { username } });
  if (existing) return;

  await prisma.dealer.create({
    data: {
      username,
      email,
      passwordHash,
      companyName: 'ABC Agency',
      primaryContactName: 'John Smith',
      primaryContactPhone: '+911234567890',
      address: 'Main Street, Mumbai',
      status: 'ACTIVE'
    }
  });
  console.log('Seeded dealer:', username, 'password:', pwd);
}

main().finally(() => prisma.$disconnect());
