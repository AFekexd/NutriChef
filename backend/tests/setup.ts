process.env.NODE_ENV = 'test';

import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to database
  await prisma.$connect();
});

afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();
});
