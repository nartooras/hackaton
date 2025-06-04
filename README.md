# hackaton

A modern AI-powered Todo application built with Next.js, TypeScript, Tailwind CSS, and SQLite.

Repository: [https://github.com/nartooras/hackaton](https://github.com/nartooras/hackaton)

## Features

- Create, read, update, and delete todos
- Mark todos as complete/incomplete
- Add descriptions to todos
- Persistent storage with SQLite
- Modern UI with Tailwind CSS
- Full-stack TypeScript support
- Light/Dark mode toggle with theme persistence
- Smooth UI animations
- AI-ready architecture for future enhancements

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS (with custom dark mode and animations)
- Prisma ORM
- SQLite Database
- pnpm (fast, modern package manager)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/nartooras/hackaton.git
cd hackaton
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up the database:
```bash
npx prisma db push
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- Add todos with a title and optional description
- Mark todos as complete/incomplete
- Delete todos
- Toggle between light and dark mode (theme is remembered)
- Enjoy smooth UI transitions and a modern, accessible interface

## Development

- The application uses Next.js App Router for routing
- API routes are located in `src/app/api`
- Database schema is defined in `prisma/schema.prisma`
- Main UI components are in `src/app`
- Tailwind CSS is configured in `tailwind.config.js` and custom styles/animations in `src/app/globals.css`
- Theme toggle logic is in `src/app/page.tsx`

## Database

The application uses SQLite with Prisma ORM. The database file is located at `prisma/dev.db`. Note that this file is included in `.gitignore` as it's a local development database. Each developer will need to run `npx prisma db push` to create their own local database.

## Collaboration

- Repository: [https://github.com/nartooras/hackaton](https://github.com/nartooras/hackaton)
- Use feature branches for new work (e.g., `git checkout -b feature/your-feature`)
- Open Pull Requests for review
- Follow conventional commit messages
- Keep the codebase clean and well-documented

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).
