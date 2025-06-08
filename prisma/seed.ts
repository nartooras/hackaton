import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'Administrator with full access',
      },
    }),
    prisma.role.upsert({
      where: { name: 'MANAGER' },
      update: {},
      create: {
        name: 'MANAGER',
        description: 'Manager who can review team expenses',
      },
    }),
    prisma.role.upsert({
      where: { name: 'EMPLOYEE' },
      update: {},
      create: {
        name: 'EMPLOYEE',
        description: 'Regular employee who can submit expenses',
      },
    }),
    prisma.role.upsert({
      where: { name: 'ACCOUNTING' },
      update: {},
      create: {
        name: 'ACCOUNTING',
        description: 'Accounting department member',
      },
    }),
  ])

  // Create users
  const adminPassword = await hash('admin123', 12)
  const userPassword = await hash('user123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tuesday.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@tuesday.com',
      password: adminPassword,
      roles: {
        create: {
          roleId: roles[0].id, // ADMIN role
        },
      },
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@tuesday.com' },
    update: {},
    create: {
      name: 'Manager User',
      email: 'manager@tuesday.com',
      password: userPassword,
      roles: {
        create: {
          roleId: roles[1].id, // MANAGER role
        },
      },
    },
  })

  const employee = await prisma.user.upsert({
    where: { email: 'employee@tuesday.com' },
    update: {},
    create: {
      name: 'Employee User',
      email: 'employee@tuesday.com',
      password: userPassword,
      roles: {
        create: {
          roleId: roles[2].id, // EMPLOYEE role
        },
      },
      manager: {
        connect: {
          id: manager.id,
        },
      },
    },
  })

  const accounting = await prisma.user.upsert({
    where: { email: 'accounting@tuesday.com' },
    update: {},
    create: {
      name: 'Accounting User',
      email: 'accounting@tuesday.com',
      password: userPassword,
      roles: {
        create: {
          roleId: roles[3].id, // ACCOUNTING role
        },
      },
    },
  })

  // Create expense categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Travel' },
      update: {},
      create: {
        name: 'Travel',
        description: 'Business travel expenses',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Office Supplies' },
      update: {},
      create: {
        name: 'Office Supplies',
        description: 'Office equipment and supplies',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Software' },
      update: {},
      create: {
        name: 'Software',
        description: 'Software licenses and subscriptions',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Training' },
      update: {},
      create: {
        name: 'Training',
        description: 'Professional development and training',
      },
    }),
  ])

  // Create committees
  const committees = await Promise.all([
    prisma.committee.upsert({
      where: { name: 'Travel Committee' },
      update: {},
      create: {
        name: 'Travel Committee',
        description: 'Reviews travel-related expenses',
        category: {
          connect: {
            id: categories[0].id,
          },
        },
        members: {
          create: {
            userId: manager.id,
          },
        },
      },
    }),
    prisma.committee.upsert({
      where: { name: 'IT Committee' },
      update: {},
      create: {
        name: 'IT Committee',
        description: 'Reviews software and IT-related expenses',
        category: {
          connect: {
            id: categories[2].id,
          },
        },
        members: {
          create: {
            userId: admin.id,
          },
        },
      },
    }),
  ])

  // Create sample expenses
  const expense1 = await prisma.expense.findFirst({ where: { title: 'Business Trip to Berlin' } });
  if (!expense1) {
    await prisma.expense.create({
      data: {
        title: 'Business Trip to Berlin',
        description: 'Attending Tech Conference',
        amount: 850.00,
        currency: 'EUR',
        category: {
          connect: {
            id: categories[0].id,
          },
        },
        billingType: 'PROJECT',
        submittedBy: {
          connect: {
            id: employee.id,
          },
        },
        status: 'PENDING',
        attachments: {
          create: {
            filename: 'receipt.pdf',
            fileType: 'application/pdf',
            fileSize: 1024,
            url: 'https://example.com/receipt.pdf',
          },
        },
      },
    });
  }

  const expense2 = await prisma.expense.findFirst({ where: { title: 'Office Supplies' } });
  if (!expense2) {
    await prisma.expense.create({
      data: {
        title: 'Office Supplies',
        description: 'Monthly office supplies',
        amount: 150.00,
        currency: 'EUR',
        category: {
          connect: {
            id: categories[1].id,
          },
        },
        billingType: 'INTERNAL',
        submittedBy: {
          connect: {
            id: employee.id,
          },
        },
        status: 'APPROVED',
        approvals: {
          create: {
            approverId: manager.id,
            status: 'APPROVED',
            comment: 'Approved as per policy',
          },
        },
      },
    });
  }

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 