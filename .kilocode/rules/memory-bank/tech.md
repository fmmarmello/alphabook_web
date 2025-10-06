# Technologies Used

## Core Technology Stack

### Frontend Framework
- **Next.js 15** - React framework with App Router for server-side rendering and API routes
- **React 19** - Latest React version with concurrent features and improved performance
- **TypeScript 5** - Type-safe JavaScript with strict configuration enabled

### UI Framework & Styling
- **shadcn/ui** - Modern UI component library built on Radix UI primitives
- **Tailwind CSS 3.4** - Utility-first CSS framework for responsive design
- **next-themes** - Theme switching support (light/dark mode)
- **lucide-react** - Icon library for consistent UI elements

### Database & ORM
- **SQLite** - File-based database for development environment
- **PostgreSQL** - Production database for scalability and robustness
- **Prisma 6.16** - Type-safe ORM with schema migrations and query building

### Authentication & Security
- **JWT (jsonwebtoken + jose)** - Token-based authentication with refresh rotation
- **bcryptjs** - Password hashing for secure credential storage
- **HttpOnly Cookies** - XSS-resistant token storage with SameSite protection

### Form Management & Validation
- **React Hook Form 7.63** - Performant form state management
- **Zod 4.1** - TypeScript-first schema validation
- **@hookform/resolvers** - Integration between React Hook Form and Zod

### UI Components & Interactions
- **@radix-ui/* components** - Accessible, unstyled UI primitives
- **@tanstack/react-table 8.21** - Advanced table component with sorting/filtering
- **recharts 2.15** - Declarative charting library for data visualization
- **react-day-picker 8.10** - Date picker component
- **@dnd-kit** - Drag and drop functionality for interactive interfaces
- **vaul** - Drawer component for mobile-friendly navigation
- **sonner** - Toast notification system

### Development & Build Tools
- **Turbopack** - Fast bundler for Next.js development and builds
- **ESLint 9** - Code linting with Next.js configuration
- **Vitest 2.1** - Fast unit testing framework
- **Playwright 1.55** - End-to-end testing for web applications
- **PostCSS + Autoprefixer** - CSS processing and vendor prefixing

### Utility Libraries
- **clsx + tailwind-merge** - Conditional CSS class management
- **class-variance-authority** - Component variant styling
- **tailwindcss-animate** - Animation utilities for Tailwind

## Development Setup

### Prerequisites
- **Node.js 20** - JavaScript runtime environment
- **pnpm** - Package manager (preferred, but npm/yarn compatible)
- **Git** - Version control system

### Installation Steps
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd alphabook_web
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   # or npm install
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma client
   pnpm run prisma:generate
   
   # Run database migrations (if any)
   npx prisma migrate dev
   ```

4. **Environment Configuration**
   Create `.env.local` file with required variables:
   ```bash
   # Database
   DATABASE_URL="file:./dev.db"
   
   # JWT Security (generate secure secrets)
   JWT_SECRET="<32-character-secret>"
   JWT_REFRESH_SECRET="<32-character-refresh-secret>"
   
   # Application
   NEXT_PUBLIC_API_URL="http://localhost:3000"
   ```

5. **Start Development Server**
   ```bash
   pnpm run dev
   # Server starts at http://localhost:3000
   ```

### Available Scripts
- `pnpm run dev` - Start development server with Turbopack
- `pnpm run build` - Build production bundle with Turbopack
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint code analysis
- `pnpm run test` - Run unit tests with Vitest
- `pnpm run e2e` - Run end-to-end tests with Playwright
- `pnpm run prisma:generate` - Generate Prisma client

### Development Environment
- **Hot Reload** - Automatic code reloading during development
- **TypeScript Checking** - Real-time type validation
- **ESLint Integration** - Code quality enforcement in IDE
- **Prisma Studio** - Database GUI for development (`npx prisma studio`)

## Technical Constraints

### Database Constraints
- **SQLite Development** - Single-file database, no concurrent write access
- **PostgreSQL Production** - Required for multi-user production deployments
- **Schema Migrations** - Must be applied in order, no rollbacks in SQLite

### Authentication Constraints
- **JWT Token Expiry** - Access tokens: 15 minutes, Refresh tokens: 7 days
- **Token Rotation** - Refresh tokens rotate on use for enhanced security
- **HttpOnly Cookies** - Cannot be accessed via JavaScript (XSS protection)
- **SameSite Cookies** - CSRF protection with strict origin validation

### Authorization Constraints
- **Three-Tier Role System** - ADMIN → MODERATOR → USER hierarchy
- **Resource Ownership** - Users can only access resources they own or have permission for
- **Field-Level Filtering** - Role-based data field restrictions
- **API Route Protection** - All `/api/*` routes require authentication except `/api/auth/*`

### Performance Constraints
- **Server Components Default** - Must use client components only when interactivity required
- **Bundle Size Limits** - Monitor and optimize JavaScript bundle size
- **Database Query Limits** - Efficient queries required for good performance
- **Image Optimization** - Next.js image optimization disabled for Netlify deployment

### Security Constraints
- **HTTPS Required** - Secure cookies only work over HTTPS in production
- **CORS Policy** - Strict origin validation for API requests
- **Input Validation** - All user inputs validated with Zod schemas
- **SQL Injection Prevention** - Prisma parameterized queries only

## Dependencies

### Core Runtime Dependencies
- `next@15.5.3` - React framework and build system
- `react@19.1.0` - UI library core
- `react-dom@19.1.0` - React DOM rendering
- `@prisma/client@6.16.2` - Database client and query builder
- `prisma@6.16.2` - Database toolkit and migrations

### Authentication & Security
- `jsonwebtoken@9.0.2` - JWT token creation and verification
- `jose@6.1.0` - Modern JWT library with better TypeScript support
- `bcryptjs@3.0.2` - Password hashing algorithm
- `@types/bcryptjs@3.0.0` - TypeScript definitions for bcryptjs
- `@types/jsonwebtoken@9.0.10` - TypeScript definitions for jsonwebtoken

### UI & Styling
- `@radix-ui/react-*` (multiple) - Accessible UI component primitives
- `tailwindcss@3.4.0` - CSS utility framework
- `lucide-react@0.544.0` - Icon component library
- `next-themes@0.4.6` - Theme switching for Next.js
- `sonner@2.0.7` - Toast notification component

### Form Management
- `react-hook-form@7.63.0` - Form state management
- `@hookform/resolvers@5.2.2` - Schema validation integration
- `zod@4.1.11` - TypeScript schema validation

### Data Visualization & Tables
- `@tanstack/react-table@8.21.3` - Advanced table component
- `recharts@2.15.4` - Charting library for React
- `react-day-picker@8.10.1` - Date picker component

### Drag & Drop
- `@dnd-kit/core@6.3.1` - Drag and drop core functionality
- `@dnd-kit/modifiers@9.0.0` - Drag and drop behavior modifiers
- `@dnd-kit/sortable@10.0.0` - Sortable list functionality
- `@dnd-kit/utilities@3.2.2` - Utility functions for drag and drop

### Utility Libraries
- `clsx@2.1.1` - Conditional CSS class utility
- `tailwind-merge@3.3.1` - Tailwind CSS class merging
- `class-variance-authority@0.7.1` - Component variant management
- `tailwindcss-animate@1.0.7` - Animation utilities
- `vaul@1.1.2` - Drawer component

## Tool Usage Patterns

### Development Workflow
1. **Feature Development**
   - Create feature branch: `git checkout -b feature/feature-name`
   - Implement changes with TypeScript strict mode
   - Run tests: `pnpm run test`
   - Lint code: `pnpm run lint`
   - Commit with conventional format: `git commit -m "feat(scope): description"`

2. **Code Quality Assurance**
   - **TypeScript**: Zero tolerance for `any` types, strict null checks enabled
   - **ESLint**: Automatic linting with Next.js rules, errors block commits
   - **Testing**: Unit tests for business logic, E2E tests for user flows
   - **Security**: Regular dependency audits and vulnerability scanning

### Database Development
- **Schema Changes**: Modify `prisma/schema.prisma`, run `npx prisma migrate dev`
- **Data Inspection**: Use `npx prisma studio` for GUI database browser
- **Query Optimization**: Monitor query performance, use select/include appropriately
- **Migration Management**: Version control migrations, test on staging before production

### Authentication Development
- **Token Testing**: Use jwt.io for token inspection and debugging
- **Cookie Debugging**: Browser dev tools for HttpOnly cookie verification
- **Security Testing**: Regular penetration testing and security audits
- **Key Rotation**: Manual JWT secret rotation procedures documented
- **Performance Optimization**: Eliminated double token validation in API routes for improved performance
- **Server-Side Authentication Helpers**: Enhanced server-side auth utilities for consistent token handling

### UI/UX Development
- **Component Library**: Use shadcn/ui components for consistency
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Accessibility**: WCAG compliance with Radix UI primitives
- **Theme Support**: Light/dark mode with CSS custom properties
- **Column Visibility Controls**: Advanced data table controls with reusable visibility management components
- **Shared Logic Extraction**: Modularized common UI logic for better maintainability and code reuse

### API Development
- **Route Protection**: Authentication → Authorization → Filtering pattern
- **Error Handling**: Standardized error responses with user-friendly messages
- **Validation**: Zod schemas for all input validation
- **Documentation**: API endpoints documented with request/response examples

### State Machine Development
- **Workflow APIs**: Budget workflow endpoints with state transition validation
- **Enum-based Status Management**: BudgetStatus, OrderStatus, OrderType for type safety
- **Business Logic Validation**: State machine constraints prevent invalid transitions
- **Audit Trail Implementation**: Automatic tracking of state changes with timestamps and user IDs

### Testing Infrastructure
- **Comprehensive Test Suite**: 36 tests across 5 scenarios
- **Scenario Coverage**: Happy path, rejection workflow, permissions, error handling, database integrity
- **Performance Testing**: Sub-20ms database operations, concurrent access validation
- **Database Fallback Testing**: Automated fallback when API authentication fails
- **Business Rules Testing**: State machine validation, role-based access controls
- **API Endpoint Testing**: Authentication + Authorization + Business logic validation

### Enhanced Validation Patterns
- **Prisma Schema Enhancements**: Foreign key relationships, enum constraints, audit trail fields
- **API-Level Validation**: State transition checks, role-based permission validation
- **Frontend Validation**: React Hook Form + Zod integration with real-time feedback
- **Database Constraints**: Unique constraints on budget-to-order relationships

### Deployment Workflow
- **Build Process**: Turbopack for fast builds, Netlify for hosting
- **Environment Variables**: Secure secret management via Netlify dashboard
- **Database Migration**: Automated Prisma migrations on deploy
- **Performance Monitoring**: Bundle size analysis and optimization

### Debugging Patterns
- **React DevTools**: Component inspection and performance profiling
- **Network Tab**: API request/response debugging
- **Console Logs**: Structured logging with auth-logger utility
- **Database Queries**: Prisma Studio for query debugging
- **E2E Testing**: Playwright for user flow validation
- **State Machine Debugging**: Workflow transition logging and validation

### Performance Optimization
- **Server Components**: Default choice for better performance and SEO
- **Code Splitting**: Dynamic imports for heavy components
- **Image Optimization**: Next.js Image component (when enabled)
- **Bundle Analysis**: Regular monitoring of JavaScript bundle size
- **Caching Strategy**: Appropriate cache headers for API responses
- **Database Query Optimization**: Efficient joins and indexing for workflow queries

### Production Readiness Validation
- **Migration Safety**: Safe data migration scripts with rollback capabilities
- **Performance Benchmarking**: Sub-20ms database operations confirmed
- **Security Validation**: Role-based access controls thoroughly tested
- **Workflow Integrity**: State machine transitions validated across all scenarios
- **Error Handling**: Comprehensive error scenarios tested and handled gracefully