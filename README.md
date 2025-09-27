# FinTrak - Family Finance Tracker

A modern web application for tracking family finances built with Next.js 14, Auth.js, Drizzle ORM, and PostgreSQL.

## Features

- **Authentication**: Secure email/password authentication with NextAuth.js
- **Family Groups**: Create or join family groups to track finances together
- **Transaction Management**: Add, view, and categorize financial transactions
- **Real-time Updates**: Server-side rendering with Next.js App Router
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Credentials provider
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Docker and Docker Compose
- **Validation**: Zod for input validation

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd fin-trak
```

2. Copy environment variables:
```bash
cp env.example .env
```

3. Update the `.env` file with your configuration:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/fin_trak
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
NODE_ENV=development
```

4. Start the application:
```bash
docker-compose up --build
```

5. Run database migrations:
```bash
docker-compose exec app npm run db:migrate
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start PostgreSQL (using Docker):
```bash
docker-compose up postgres -d
```

3. Run database migrations:
```bash
npm run db:migrate
```

4. Start the development server:
```bash
npm run dev
```

## Database Schema

The application uses the following main tables:

- **users**: User accounts with email/password authentication
- **groups**: Family groups with unique group codes
- **group_members**: Many-to-many relationship between users and groups
- **transactions**: Financial transactions linked to users and groups

## API Routes

- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication endpoints

## Server Actions

- `createTransaction` - Add a new transaction
- `createGroup` - Create a new family group
- `joinGroup` - Join an existing group using group code

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Input validation with Zod
- Group membership verification
- Protected routes with server-side authentication

## Deployment

The application is configured for deployment with Docker. Update the environment variables in `docker-compose.yml` for production:

- Change `NEXTAUTH_SECRET` to a secure random string
- Update `NEXTAUTH_URL` to your production domain
- Configure PostgreSQL credentials

## Development

### Database Management

Generate migrations:
```bash
npm run db:generate
```

Run migrations:
```bash
npm run db:migrate
```

Open Drizzle Studio:
```bash
npm run db:studio
```

### Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard
│   └── transactions/      # Transaction management
├── actions/               # Server actions
├── components/            # React components
├── lib/                   # Utilities and configurations
│   ├── auth.ts           # NextAuth.js configuration
│   ├── db.ts             # Database connection
│   └── schema.ts         # Database schema
└── drizzle/              # Database migrations
```

## License

MIT License - see LICENSE file for details.
