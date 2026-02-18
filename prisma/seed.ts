import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
      school: 'ChemClass Pro Admin',
    },
  });

  console.log('Created admin user:', admin);

  // Create sample students
  const student1 = await prisma.user.upsert({
    where: { username: 'student1' },
    update: {},
    create: {
      username: 'student1',
      password: 'student123',
      name: 'Rahul Sharma',
      role: 'student',
      school: 'Delhi Public School',
    },
  });

  const student2 = await prisma.user.upsert({
    where: { username: 'student2' },
    update: {},
    create: {
      username: 'student2',
      password: 'student123',
      name: 'Priya Singh',
      role: 'student',
      school: 'Kendriya Vidyalaya',
    },
  });

  console.log('Created students:', student1, student2);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
