# System Architecture

## Overall Structure and Organization

AlphaBook Web is a modern Next.js 15 application built with the App Router for managing printing production workflows. The system follows a modular, component-based architecture with clear separation of concerns across frontend, backend, and data layers.

### Technology Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Deployment**: Netlify with serverless functions

### Core Business Domains
1. **Client Management** - Customer data and relationship management with CNPJ/CPF validation
2. **Order Management** - Production order lifecycle with financial tracking
3. **Budget Management** - Pricing and approval workflows
4. **Center Management** - Production facility management
5. **Reporting** - Financial and operational analytics

### Architectural Layers
```
Presentation Layer (Next.js App Router)
├── Authentication Layer (JWT + RBAC)
├── Business Logic Layer (API Routes)
├── Data Access Layer (Prisma ORM)
└── Database Layer (SQLite)
```

## Source Code Paths

### Key Directories and File Locations

#### Application Structure
- **`src/app/`** - Next.js App Router pages and API endpoints
  - `layout.tsx` - Root layout with theme and auth providers
  - `page.tsx` - Dashboard/home page
  - `api/` - Serverless API routes
  - `(routes)/` - Authenticated application pages

#### Component Architecture
- **`src/components/`** - React components organized by functionality
  - `ui/` - shadcn/ui base components (button, card, table, etc.)
  - `forms/` - Business form components (budget-form, client-form, etc.)
  - `auth/` - Authentication-related components
  - `layout/` - Layout and navigation components
  - `dashboard/` - Dashboard-specific components

#### Core Libraries
- **`src/lib/`** - Utilities and business logic
  - `auth.ts` - JWT token management and authentication
  - `rbac.ts` - Role-based access control implementation
  - `prisma.ts` - Database client configuration
  - `server-auth.ts` - Server-side authentication helpers
  - `validation.ts` - Zod schema validation
  - `utils.ts` - Shared utility functions

#### Type Definitions
- **`src/types/`** - TypeScript type definitions
  - `models.ts` - Database model types
  - `api.ts` - API response and request types

#### Configuration Files
- **`prisma/schema.prisma`** - Database schema definition
- **`middleware.ts`** - Route protection and security headers
- **`next.config.ts`** - Next.js configuration
- **`netlify.toml`** - Deployment configuration

## Key Technical Decisions

### Authentication Architecture
- **JWT with Refresh Tokens**: Stateless authentication supporting mobile clients and horizontal scaling
- **Token Rotation**: Refresh tokens rotate on use for enhanced security
- **HttpOnly Cookies**: XSS-resistant token storage
- **15-minute Access Tokens**: Balances security with user experience
- **7-day Refresh Tokens**: Provides persistent sessions without frequent logins

### Authorization System
- **Three-Tier Role Hierarchy**: ADMIN → MODERATOR → USER with escalating permissions
- **Hybrid RBAC**: Role-based access combined with granular permissions
- **Field-Level Security**: Role-based data filtering prevents information leakage
- **Resource Ownership**: Users can only access resources they own or have permission for

### Component Architecture
- **Server Components by Default**: Maximizes performance and SEO benefits
- **Client Components for Interactivity**: Forms, real-time updates, and complex interactions
- **shadcn/ui Integration**: Consistent, accessible UI components with Tailwind CSS
- **Theme System**: Light/dark mode support with CSS custom properties

### Database Design
- **SQLite for Development**: Simple setup and file-based database
- **PostgreSQL for Production**: Robust, scalable relational database
- **Prisma ORM**: Type-safe database access with schema migrations
- **Audit Trail**: Automatic tracking of creation and modification timestamps

### API Design
- **RESTful Endpoints**: Standard HTTP methods with resource-based URLs
- **Standardized Response Format**: Consistent `{data, error}` structure
- **Role-Based Filtering**: Automatic data filtering based on user permissions
- **Error Handling**: Centralized error processing with user-friendly messages

## Design Patterns

### Security Patterns
- **API Route Protection Pattern**: Authentication → Authorization → Resource Filtering → Data Access
- **Middleware Security**: Comprehensive security headers applied to all routes
- **Token Validation Flow**: Access token → Refresh token → Login redirect

### Component Patterns
- **Form Architecture**: React Hook Form + Zod validation + auto-calculation
- **Layout Composition**: RootLayout → AuthProvider → SidebarProvider → Content
- **Error Boundary Pattern**: Standardized error display with ErrorAlert components

### Data Access Patterns
- **Repository Pattern**: Prisma client provides consistent data access interface
- **User Context Filtering**: All queries include user-based filtering
- **Field Selection**: Role-based field filtering prevents data exposure

### State Management Patterns
- **Server State Priority**: Database as single source of truth
- **Client State for UI**: Local component state for form interactions
- **URL State**: Search parameters for filters and pagination
- **Auth Context**: Global authentication state management

## Component Relationships

### Authentication Flow
```
LoginForm → API (/auth/login) → JWT Generation → Cookie Storage
                                    ↓
Middleware Validation → User Context → RBAC Checks → Protected Routes
```

### Form Component Relationships
```
Form Components (budget-form, client-form, etc.)
├── React Hook Form (state management)
├── Zod Schema (validation)
├── API Integration (data submission)
└── UI Components (inputs, buttons, alerts)
```

### Layout Hierarchy
```
RootLayout
├── ThemeProvider
└── RootLayoutClient
    ├── AuthProvider
    └── AuthenticatedLayout
        ├── AppSidebar (navigation)
        └── Page Content (routes)
```

### Database Model Relationships
```
User (1) ────→ (many) Order
User (1) ────→ (many) Budget  
User (1) ────→ (many) Client
Client (1) ────→ (many) Order
Center (1) ────→ (many) Order
Budget (1) ────→ (1) Order (conversion)
```

### API Layer Relationships
```
API Routes
├── Authentication Layer (getAuthenticatedUser)
├── Authorization Layer (RBAC checks)
├── Business Logic Layer (Prisma queries)
└── Response Layer (standardized formatting)
```

## Critical Implementation Paths

### Authentication Flow
1. **Login Request** → Credential validation → Token pair generation
2. **API Request** → Token validation → User context extraction
3. **Token Expiry** → Refresh token validation → New access token generation
4. **Logout** → Token invalidation → Cookie clearing

### Order Creation Workflow
1. **Form Submission** → Client validation → Budget conversion check
2. **Data Validation** → Auto-calculation → Database transaction
3. **Status Assignment** → Audit logging → Success response
4. **UI Update** → Toast notification → Navigation redirect

### Budget Approval Process
1. **Budget Submission** → Moderator notification → Status: PENDING
2. **Review Process** → Field validation → Approval decision
3. **Status Update** → Order creation trigger → Audit trail
4. **Stakeholder Notification** → Email alerts → Dashboard refresh

### Dashboard Data Loading
1. **Page Load** → Authentication check → Role-based access
2. **Parallel API Calls** → Summary metrics + Recent data + Charts
3. **Data Aggregation** → Client-side processing → UI rendering
4. **Real-time Updates** → Polling/WebSocket → State synchronization

### Report Generation
1. **Report Request** → Date range validation → Permission check
2. **Data Query** → Role-based filtering → Aggregation logic
3. **Export Processing** → Format conversion → File generation
4. **Download Delivery** → Secure headers → Client download

### Deployment Pipeline
1. **Code Push** → Build process → Static generation
2. **Serverless Functions** → API compilation → Netlify deployment
3. **Database Migration** → Schema updates → Data integrity checks
4. **Environment Setup** → Variable configuration → Health checks</target_file>
</instructions>
</attempt_completion>
<result>I've created the architecture.md file in the memory bank directory, organizing the content from PROJECT_ARCHITECTURE.md into the required sections. The file captures the system's overall structure, key technical decisions, design patterns, component relationships, and critical implementation paths while maintaining the technical essence of how AlphaBook Web is built and organized.</result>
</attempt_completion>