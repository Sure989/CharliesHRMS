# HRMS Backend API

This is the backend API for the Human Resource Management System (HRMS) built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Multi-tenancy**: Support for multiple organizations with data isolation
- **Employee Management**: CRUD operations for employees
- **Department & Branch Management**: Organizational structure management
- **Payroll System**: Kenyan payroll compliance with statutory deductions
- **Leave Management**: Multi-step approval workflow
- **Salary Advances**: Credit system with payroll integration
- **Performance & Training Management**: Employee development tracking
- **Reporting & Analytics**: Comprehensive reporting system

## Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)
- Docker and Docker Compose (optional, for containerized database)

## Setup

1. **Clone the repository**

2. **Install dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**

   - Copy `.env.example` to `.env` (if not already done)
   - Update the database connection string and other settings

4. **Start PostgreSQL with Docker** (optional)

   ```bash
   docker-compose up -d
   ```

5. **Setup the database**

   ```bash
   npm run db:setup
   ```

   This will:
   - Generate Prisma client
   - Run migrations
   - Seed the database with initial data

6. **Start the development server**

   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/logout` - Logout and invalidate refresh token
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user information

### Users

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

### Departments

- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create a new department
- `PUT /api/departments/:id` - Update a department
- `DELETE /api/departments/:id` - Delete a department

### Branches

- `GET /api/branches` - Get all branches
- `GET /api/branches/:id` - Get branch by ID
- `POST /api/branches` - Create a new branch
- `PUT /api/branches/:id` - Update a branch
- `DELETE /api/branches/:id` - Delete a branch

## Development

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm start` - Start the production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Seed the database
- `npm run db:setup` - Complete database setup (generate, migrate, seed)

### Database Management

**Prisma Studio**: A visual database browser

```bash
npm run prisma:studio
```

### Creating Migrations

```bash
npx prisma migrate dev --name migration_name
```

## Project Structure

```text
backend/
├── prisma/                 # Prisma schema and migrations
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts             # Database seeding
├── src/
│   ├── config/             # Configuration files
│   ├── controllers/        # API controllers
│   ├── middleware/         # Express middleware
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── index.ts            # Application entry point
├── .env                    # Environment variables
├── docker-compose.yml      # Docker Compose configuration
├── package.json            # Project dependencies
└── tsconfig.json           # TypeScript configuration
```

## Default Credentials

After seeding the database, you can log in with the following credentials:

- **Email**: <admin@charlieshrms.com>
- **Password**: password123

## License

ISC
