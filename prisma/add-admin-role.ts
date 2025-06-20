import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: "cmbnehp2l0000emfor50ihzu3" },
  });
  const role = await prisma.role.findUnique({ where: { name: "Admin" } });
  if (user && role) {
    await prisma.userRole.create({
      data: { userId: user.id, roleId: role.id },
    });
  }
  await prisma.$disconnect();
}

main();
