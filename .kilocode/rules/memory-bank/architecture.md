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
3. **Budget Management** - Pricing and approval workflows with state machine validation
4. **Center Management** - Production facility management
5. **Reporting** - Financial and operational analytics

### Architectural Layers
```
Presentation Layer (Next.js App Router)
├── Authentication Layer (JWT + RBAC)
├── Business Logic Layer (API Routes + State Machines)
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
- **Performance Optimization**: Eliminated double token validation for improved API performance
- **Server-Side Auth Helpers**: Enhanced server-side authentication utilities for consistent token handling

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
- **Column Visibility Controls**: Advanced data table features with reusable visibility management
- **Shared Logic Extraction**: Modularized common UI patterns for better maintainability

### Database Design
- **SQLite for Development**: Simple setup and file-based database
- **PostgreSQL for Production**: Robust, scalable relational database
- **Prisma ORM**: Type-safe database access with schema migrations
- **Audit Trail**: Automatic tracking of creation and modification timestamps
- **Enhanced Enum System**: BudgetStatus, OrderStatus, and OrderType enums for state management

### API Design
- **RESTful Endpoints**: Standard HTTP methods with resource-based URLs
- **Standardized Response Format**: Consistent `{data, error}` structure
- **Role-Based Filtering**: Automatic data filtering based on user permissions
- **Error Handling**: Centralized error processing with user-friendly messages
- **State Machine APIs**: Budget workflow endpoints with transition validation

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
- **State Machine Pattern**: Budget workflow with DRAFT → SUBMITTED → APPROVED → CONVERTED transitions

### Workflow Patterns
- **Budget State Machine**: DRAFT → SUBMITTED → APPROVED → CONVERTED with validation at each step
- **Order Status Management**: PENDING → IN_PRODUCTION → COMPLETED → DELIVERED with business logic validation
- **Audit Trail Pattern**: Automatic timestamp and user tracking for all state changes

## Component Relationships

### Authentication Flow
```
LoginForm → API (/auth/login) → JWT Generation → Cookie Storage
                                    ↓
Middleware Validation → User Context → RBAC Checks → Protected Routes
```

### Budget Workflow System
```
Budget Creation (DRAFT) → Submit API (/submit) → Budget (SUBMITTED)
                                    ↓
Moderator Review → Approve API (/approve) → Budget (APPROVED)
                                    ↓
Order Conversion → Convert API (/convert-to-order) → Budget (CONVERTED) + Order (PENDING)
                                    ↓
Order Status Management → Status API (/status) → Order Status Updates
```

### Form Component Relationships
```
Form Components (budget-form, client-form, etc.)
├── React Hook Form (state management)
├── Zod Schema (validation)
├── API Integration (data submission)
├── Workflow Management (state transitions)
└── UI Components (inputs, buttons, alerts, dialogs)
```

### Layout Hierarchy
```
RootLayout
├── ThemeProvider
└── RootLayoutClient
    ├── AuthProvider
    └── AuthenticatedLayout
        ├── AppSidebar (navigation + real-time counts)
        └── Page Content (routes)
```

### Database Model Relationships
```
User (1) ────→ (many) Order
User (1) ────→ (many) Budget (approved/rejected by)
User (1) ────→ (many) Client
Client (1) ────→ (many) Order
Client (1) ────→ (many) Budget
Center (1) ────→ (many) Order
Center (1) ────→ (many) Budget
Budget (1) ────→ (1) Order (unique constraint on budgetId)
```

### API Layer Relationships
```
API Routes
├── Authentication Layer (getAuthenticatedUser)
├── Authorization Layer (RBAC checks)
├── Business Logic Layer (Prisma queries + State Machine validation)
├── Audit Trail Layer (timestamp + user tracking)
└── Response Layer (standardized formatting)
```

### Navigation System
```
Navigation Counts API (/api/navigation/counts)
├── Pending Budgets Count (SUBMITTED status)
├── Active Orders Count (PENDING + IN_PRODUCTION)
├── Role-based Visibility (USER sees 0 pending budgets)
└── Real-time Updates (sidebar badges)
```

## Critical Implementation Paths

### Authentication Flow
1. **Login Request** → Credential validation → Token pair generation
2. **API Request** → Optimized token validation → User context extraction
3. **Token Expiry** → Refresh token validation → New access token generation
4. **Logout** → Token invalidation → Cookie clearing

### Budget-to-Order Workflow
1. **Budget Creation** → Form validation → Database insert (DRAFT status)
2. **Budget Submission** → State validation → Status update (DRAFT → SUBMITTED)
3. **Budget Approval** → Role check (MODERATOR/ADMIN) → Status update (SUBMITTED → APPROVED)
4. **Order Conversion** → Approved budget validation → Database transaction (Budget → CONVERTED + Order → PENDING)
5. **Order Management** → Status transitions → Audit trail updates

### Order Status Management
1. **Status Change Request** → Role validation → Business logic validation
2. **State Transition Check** → Valid transition validation → Database update
3. **Audit Trail** → Timestamp recording → User tracking
4. **UI Update** → Real-time count updates → Navigation badge refresh

### Budget Rejection Process
1. **Rejection Request** → Role check (MODERATOR/ADMIN) → Status validation
2. **Status Update** → SUBMITTED → REJECTED → Audit trail
3. **Notification** → User notification → Reason recording
4. **Prevention Logic** → Block conversion attempts → Error handling

### Dashboard Data Loading
1. **Page Load** → Authentication check → Role-based access
2. **Parallel API Calls** → Summary metrics + Recent data + Charts + Navigation counts
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
4. **Environment Setup** → Variable configuration → Health checks

### Testing and Validation Pipeline
1. **Comprehensive Test Suite** → 36 tests across 5 scenarios
2. **Database Integrity** → Foreign key validation → Relationship testing
3. **API Endpoint Testing** → Authentication + Authorization + Business logic
4. **Performance Validation** → Sub-20ms database operations → Concurrent access testing
5. **Security Testing** → Role-based access controls → State machine validation