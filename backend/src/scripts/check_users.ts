
import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking user statuses...");
  const users = await prisma.user.findMany({
    select: {
      userId: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lockedUntil: true,
      failedLoginAttempts: true,
    },
  });

  if (users.length === 0) {
    console.log("No users found.");
  } else {
    console.log(JSON.stringify(users, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
