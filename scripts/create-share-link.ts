// Usage: npx tsx scripts/create-share-link.ts <creatorEmail> <albumName> <password>
// Creates the album if it doesn't exist, then mints a share token.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";

async function main() {
  const [, , creatorEmail, albumName, password] = process.argv;
  if (!creatorEmail || !albumName || !password) {
    console.error("Usage: npx tsx scripts/create-share-link.ts <creatorEmail> <albumName> <password>");
    process.exit(1);
  }
  const prisma = new PrismaClient();
  const creator = await prisma.user.findUnique({ where: { email: creatorEmail.toLowerCase() } });
  if (!creator) {
    console.error(`No user with email ${creatorEmail}. Create one first with scripts/create-user.ts`);
    process.exit(1);
  }
  const album = await prisma.album.upsert({
    where: { id: `seed-${albumName}` },
    update: {},
    create: { id: `seed-${albumName}`, name: albumName },
  });
  const token = randomBytes(16).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.shareLink.create({
    data: { token, passwordHash, albumId: album.id, createdById: creator.id },
  });
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  console.log(`Share link: ${base}/share/${token}`);
  console.log(`Password:   ${password}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
