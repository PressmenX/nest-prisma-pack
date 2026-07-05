import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});

async function generate() {
  const data = [];

  console.time('Seeding Database');
  console.log('Seeding begins...');
  // for (const d of data) {
  //   await prisma.data.upsert({
  //     where: {  },
  //     update: { },
  //     create: d,
  //   });
  // }
  console.log('Seeding end and successful!');
  console.timeEnd('Seeding Database');
}

generate()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
