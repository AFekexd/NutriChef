
import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const email = "afeke@pollak.hu";
  console.log(`Fixing user ${email}...`);
  
  const user = await prisma.user.update({
    where: { email },
    data: {
      isActive: true,
      lockedUntil: null,
      failedLoginAttempts: 0,
    },
  });

  console.log("User updated:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
