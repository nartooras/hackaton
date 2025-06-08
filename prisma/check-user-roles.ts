import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: "cmbnehp2l0000emfor50ihzu3" },
    include: { roles: { include: { role: true } } },
  });
  await prisma.$disconnect();
}

main();
