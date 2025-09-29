# Brain Dump - Collaborative Todo Lists

A modern, collaborative todo list application with priority voting built with Next.js, PostgreSQL, and Drizzle ORM.

## Features

- **Brain Dumps**: Create organized todo lists for different projects or topics
- **Collaboration**: Share brain dumps with team members
- **Priority Voting**: Let team members vote on task priorities
- **Authentication**: Secure user registration and login
- **Responsive Design**: Works great on desktop and mobile
- **Modern UI**: Built with shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: JWT with HTTP-only cookies
- **UI**: shadcn/ui, Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database (we recommend [Neon](https://neon.tech))

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd brain-dump
```

2. Install dependencies:
```bash
bun install
# or npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
DATABASE_URL=postgresql://neondb_owner:npg_bvHaVTdZc35D@ep-plain-salad-a71bjnac-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your-super-secret-jwt-key-here
```

4. Set up the database:
```bash
# Generate migration files
bun run db:generate

# Push schema to database
bun run db:push
```

5. Start the development server:
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Scripts

- `bun run db:generate` - Generate migration files from schema
- `bun run db:push` - Push schema changes to database
- `bun run db:migrate` - Run migrations
- `bun run db:studio` - Open Drizzle Studio for database management

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── brain-dumps/   # Brain dump CRUD operations
│   │   └── items/         # Item voting endpoints
│   ├── brain-dump/        # Individual brain dump pages
│   ├── dashboard/         # User dashboard
│   ├── login/            # Login page
│   └── register/         # Registration page
├── components/ui/         # shadcn/ui components
├── contexts/             # React contexts
├── lib/                  # Utility functions
│   ├── auth.ts          # Authentication utilities
│   └── db/              # Database configuration and schema
└── middleware.ts         # Next.js middleware for auth
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Brain Dumps
- `GET /api/brain-dumps` - Get user's brain dumps
- `POST /api/brain-dumps` - Create new brain dump
- `GET /api/brain-dumps/[id]` - Get specific brain dump
- `PUT /api/brain-dumps/[id]` - Update brain dump
- `DELETE /api/brain-dumps/[id]` - Delete brain dump
- `POST /api/brain-dumps/[id]/share` - Share brain dump
- `GET /api/brain-dumps/[id]/share` - Get collaborators

### Items
- `GET /api/brain-dumps/[id]/items` - Get brain dump items
- `POST /api/brain-dumps/[id]/items` - Create new item
- `POST /api/items/[id]/vote` - Vote on item priority

## Features in Detail

### Brain Dumps
- Create named collections of todo items
- Add descriptions and set public/private visibility
- Edit and delete your own brain dumps

### Collaboration
- Share brain dumps with other users via email
- Set permissions: view-only, edit, or voting rights
- See who created each item and when

### Priority Voting
- Vote on item priorities (low, Medium, High)
- See average priority scores from all voters
- Items automatically sorted by collective priority

### Authentication
- Secure JWT-based authentication
- Password hashing with bcrypt
- HTTP-only cookies for security

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
