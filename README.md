# Cashflow Tuesday

A fun and efficient expense management application for the Tuesday organization.

## Features

- Employee expense submission
- Manager approval workflow
- Committee review process
- Accounting dashboard
- Role-based access control

## Tech Stack

- Next.js 14
- TypeScript
- Prisma
- SQLite
- NextAuth.js
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18 or later
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cashflow-tuesday
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your configuration.

### Database Setup

1. Initialize the database:
```bash
npx prisma migrate dev
```

2. Seed the database with initial data:
```bash
npx prisma db seed
```

This will create:
- Default roles (ADMIN, MANAGER, EMPLOYEE, ACCOUNTING)
- Test users with different roles
- Sample expense categories
- Test committees

### Development

Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Test Accounts

After seeding the database, you can use these test accounts:

1. Accounting User:
   - Email: accounting@tuesday.com
   - Password: user123

2. Employee User:
   - Email: employee@tuesday.com
   - Password: user123

3. Manager User:
   - Email: manager@tuesday.com
   - Password: user123

4. Admin User:
   - Email: admin@tuesday.com
   - Password: admin123

## Database Management

### For Collaborators

When working with the project:

1. Each developer should have their own local database
2. The `dev.db` file is gitignored and should not be committed
3. To set up your database:
   ```bash
   # Generate the database and run migrations
   npx prisma migrate dev
   
   # Seed the database with test data
   npx prisma db seed
   ```

### Database Schema

The database schema is defined in `prisma/schema.prisma`. Key models include:

- User: Employees with different roles
- Expense: Submitted expenses
- Category: Expense categories
- Committee: Review committees
- Approval: Expense approval records

### Making Schema Changes

1. Modify `prisma/schema.prisma`
2. Create a migration:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```
3. Commit the migration files to git
4. Other developers should run `npx prisma migrate dev` to apply changes

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License.