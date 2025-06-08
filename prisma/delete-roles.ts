import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteRoles() {
  try {
    // Delete roles with exact names
    const deletedRoles = await prisma.role.deleteMany({
      where: {
        name: {
          in: ['ADMIN', 'EMPLOYEE', 'ACCOUNTING', 'MANAGER']
        }
      }
    })

    console.log(`Deleted ${deletedRoles.count} roles`)
  } catch (error) {
    console.error('Error deleting roles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteRoles() 