# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AlphaBook Web is a Next.js 15 application for managing print production orders, clients, budgets, and production centers. It's a business management system for a printing company with role-based access control and comprehensive order tracking.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Testing
- `npm run test` - Run unit tests with Vitest
- `npm run e2e` - Run end-to-end tests with Playwright

### Database
- `npm run prisma:generate` - Generate Prisma client
- `npm run postinstall` - Automatically runs Prisma generation (runs after install)

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT-based with role-based access control (RBAC)
- **UI**: React 19, TypeScript, Tailwind CSS, Radix UI components
- **State Management**: React hooks and context
- **Charts**: Recharts
- **Testing**: Vitest (unit), Playwright (e2e)

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components (UI components in `ui/` subdirectory)
- `src/lib/` - Utility functions, auth logic, and type definitions
- `prisma/` - Database schema and migrations

### Database Schema
The application manages four main entities:
- **Client**: Customer information with orders relationship
- **Center**: Production centers with orders relationship
- **Order**: Print production orders with comprehensive specifications
- **Budget**: Budget proposals that can be approved and converted to orders
- **User**: System users with role-based permissions (USER, MODERATOR, ADMIN)

### Authentication & Authorization
- JWT-based authentication with access tokens stored in cookies
- Role-based access control (RBAC) system with three roles
- Auth middleware and utilities in `src/lib/auth.ts`
- Token validation and permission checking functions
- API routes protected by auth requirements

### API Structure
All API routes follow RESTful patterns in `src/app/api/`:
- Authentication endpoints: `/api/auth/*`
- CRUD operations for entities: `/api/clients/*`, `/api/orders/*`, `/api/budgets/*`, `/api/centers/*`
- Dashboard data: `/api/dashboard/*`
- Reports: `/api/reports/*`
- User management: `/api/users/*`

### UI Components
- Built on Radix UI primitives with custom styling
- Comprehensive form components with React Hook Form and Zod validation
- Data tables with sorting and pagination
- Chart components for dashboard analytics
- Responsive sidebar navigation

### Form Validation
- Zod schemas for client-side and server-side validation
- React Hook Form integration
- Custom validators in `src/lib/validators.ts`

## Deployment Configuration
- Configured for Netlify deployment with serverless functions
- Images optimized for static deployment (unoptimized: true)
- ESLint errors block production builds
- Prisma client configured for serverless environments
- **Important**: Current netlify.toml uses pnpm but package.json scripts use npm - needs alignment

## Development Notes
- Uses Turbopack for faster development builds
- Prisma client generated to `src/generated/prisma/`
- Environment variables required: `DATABASE_URL`, `JWT_SECRET` (minimum 32 characters)
- TypeScript strict mode enabled