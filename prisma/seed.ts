import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create initial roles
  const roles = [
    { name: 'Admin', description: 'Administrator with full access' },
    { name: 'Accountant', description: 'Can manage financial records' },
    { name: 'Employee', description: 'Regular employee access' },
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    })
  }

  // Get all existing users
  const users = await prisma.user.findMany()
  
  // Get the Admin role
  const adminRole = await prisma.role.findUnique({
    where: { name: 'Admin' },
  })

  if (!adminRole) {
    throw new Error('Admin role not found')
  }

  // Assign Admin role to all existing users
  for (const user of users) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: adminRole.id,
      },
    })
  }

  console.log('Database has been seeded. 🌱')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 