// Usage: npx tsx scripts/create-user.ts <email> <password> [name]
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

async function main() {
  const [, , emailArg, passwordArg, nameArg] = process.argv;
  if (!emailArg || !passwordArg) {
    console.error("Usage: npx tsx scripts/create-user.ts <email> <password> [name]");
    process.exit(1);
  }
  const email = emailArg.toLowerCase();
  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(passwordArg, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: nameArg ?? undefined },
    create: { email, passwordHash, name: nameArg ?? null },
  });
  console.log(`User ready: ${user.email} (id ${user.id})`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
