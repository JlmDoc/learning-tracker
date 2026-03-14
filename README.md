# Learning Tracker

Personal learning path tracker - Record progress, resources, notes and visualize your learning journey.

## Features

- **Learning Paths**: Create structured learning paths with interconnected nodes
- **Progress Tracking**: Track your progress with status updates (Not Started, In Progress, Completed)
- **Resource Management**: Add articles, videos, books, courses to each learning node
- **Notes**: Write markdown notes for each topic
- **Statistics**: View your learning time and progress statistics
- **Authentication**: Secure user accounts with NextAuth.js

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Prisma + SQLite (dev) / Vercel Postgres (prod)
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: NextAuth.js

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/JlmDoc/learning-tracker.git
cd learning-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Initialize database
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Deploy on Vercel

1. Push your code to GitHub
2. Import the project on [Vercel](https://vercel.com/new)
3. Add environment variables:
   - `DATABASE_URL` - Vercel Postgres connection string
   - `NEXTAUTH_SECRET` - Random secret key
   - `NEXTAUTH_URL` - Your production URL
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JlmDoc/learning-tracker)

## License

MIT
