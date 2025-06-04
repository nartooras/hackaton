# Todo Application

A modern Todo application built with Next.js, TypeScript, Tailwind CSS, and SQLite.

## Features

- Create, read, update, and delete todos
- Mark todos as complete/incomplete
- Add descriptions to todos
- Persistent storage with SQLite
- Modern UI with Tailwind CSS
- Full-stack TypeScript support

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite Database

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

- The application uses Next.js App Router for routing
- API routes are located in `src/app/api`
- Database schema is defined in `prisma/schema.prisma`
- Main UI components are in `src/app`

## Database

The application uses SQLite with Prisma ORM. The database file is located at `prisma/dev.db`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
