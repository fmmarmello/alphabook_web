# GEMINI.md

## Project Overview

This is a comprehensive Next.js project for managing clients, centers, orders, and budgets for Alphabook, a printing business. Built with modern web technologies, it provides a complete management system with CRUD operations, reporting features, dashboard analytics, and a specifications system for product configuration.

**Key Technologies:**

*   **Framework:** Next.js 15.5.3 with App Router and Turbopack
*   **Language:** TypeScript
*   **Runtime:** React 19.1.0
*   **ORM:** Prisma 6.16.2
*   **Database:** SQLite (with migration path to PostgreSQL)
*   **UI:** React with `shadcn/ui` components and Radix UI primitives
*   **Styling:** Tailwind CSS with custom animations
*   **Forms:** React Hook Form with Zod validation
*   **Charts:** Recharts for data visualization
*   **Tables:** TanStack Table for advanced data tables
*   **Drag & Drop:** @dnd-kit for interactive components
*   **Icons:** Lucide React and Tabler Icons
*   **Linting:** ESLint 9.x
*   **Testing:** Vitest, Playwright (E2E)

## Recent Updates & New Features

### Budget Management System
- **Complete CRUD Interface:** Full budget lifecycle management with create, read, update, delete operations
- **Budget Approval Workflow:** Convert approved budgets into production orders
- **Advanced Filtering:** Search by title, date range, and multiple sort options
- **Form Validation:** Comprehensive Zod schemas for data integrity

### Dashboard & Analytics
- **Executive Summary Cards:** Total clients, orders, revenue, and pending orders
- **Recent Activity Feeds:** Latest orders and clients with key information
- **Real-time Data:** Live updates from API endpoints
- **Responsive Layout:** Mobile-first design with grid layouts

### Specifications System
- **Product Configuration:** JSON-based specifications for printing options
- **Dynamic Form Population:** Auto-populate forms with specification data
- **API Integration:** RESTful endpoint for specification management

### Enhanced UI Components
- **Modern Sidebar Navigation:** Collapsible sidebar with organized menu structure
- **Interactive Tables:** Sortable, paginated tables with search functionality
- **Toast Notifications:** User feedback with Sonner toast system
- **Theme Support:** Dark/light mode with next-themes

## Project Structure

The project follows Next.js 15 App Router best practices with enhanced organization:

```
.
├── prisma/
│   ├── dev.db
│   ├── schema.prisma
│   └── migrations/
│       ├── 20250926161438_budget_and_order_update/
│       └── 20250926183855_add_status_to_order/
├── public/
│   └── (static assets)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── budgets/           # Budget management endpoints
│   │   │   ├── centers/           # Production centers
│   │   │   ├── clients/           # Client management
│   │   │   ├── dashboard/         # Analytics endpoints
│   │   │   │   ├── recent-clients/
│   │   │   │   ├── recent-orders/
│   │   │   │   └── summary/
│   │   │   ├── orders/            # Order management
│   │   │   ├── reports/           # Business reports
│   │   │   └── specifications/    # Product specifications
│   │   ├── budgets/               # Budget pages
│   │   ├── centers/               # Center management
│   │   ├── clients/               # Client pages
│   │   ├── dashboard/             # Main dashboard
│   │   ├── orders/                # Order pages
│   │   └── reports/               # Report pages
│   ├── components/
│   │   ├── dashboard/             # Dashboard-specific components
│   │   ├── ui/                    # Reusable UI components (40+)
│   │   └── layout/                # Layout components
│   ├── lib/
│   │   ├── especificacoes.json   # Product specifications data
│   │   ├── specifications.ts      # Specification utilities
│   │   ├── validation.ts          # Form validation schemas
│   │   └── utils.ts               # Utility functions
│   └── hooks/
│       └── use-mobile.ts          # Mobile detection hook
└── ...
```

## API Routes

### Core CRUD Endpoints

#### Clients
*   `GET /api/clients` - Paginated list with search and sorting
*   `POST /api/clients` - Create new client
*   `GET /api/clients/[id]` - Get specific client
*   `PUT /api/clients/[id]` - Update client
*   `DELETE /api/clients/[id]` - Delete client
*   `GET /api/clients/check-cnpj-cpf` - Validate CNPJ/CPF

#### Centers
*   `GET /api/centers` - List centers with filtering by type
*   `POST /api/centers` - Create production center
*   `GET /api/centers/[id]` - Get center details
*   `PUT /api/centers/[id]` - Update center
*   `DELETE /api/centers/[id]` - Delete center

#### Orders
*   `GET /api/orders` - Advanced filtering by client, center, date range
*   `POST /api/orders` - Create production order
*   `GET /api/orders/[id]` - Get order details
*   `PUT /api/orders/[id]` - Update order
*   `DELETE /api/orders/[id]` - Delete order
*   `GET /api/orders/editorials` - Get editorial options

#### Budgets
*   `GET /api/budgets` - List budgets with advanced filtering
*   `POST /api/budgets` - Create budget proposal
*   `GET /api/budgets/[id]` - Get budget details
*   `PUT /api/budgets/[id]` - Update budget
*   `DELETE /api/budgets/[id]` - Delete budget
*   `POST /api/budgets/[id]/approve` - Approve and convert to order

### Analytics & Reporting

#### Dashboard Endpoints
*   `GET /api/dashboard/summary` - Key metrics (clients, orders, revenue, pending)
*   `GET /api/dashboard/recent-orders` - Latest 5 orders with client info
*   `GET /api/dashboard/recent-clients` - Latest 5 clients

#### Report Endpoints
*   `GET /api/reports/financial` - Revenue and financial analysis
*   `GET /api/reports/orders-by-client` - Orders grouped by client
*   `GET /api/reports/orders-summary` - Order statistics
*   `GET /api/reports/production` - Production metrics

### Specifications
*   `GET /api/specifications` - Product configuration options

## Database Schema

Updated schema with enhanced relationships and new fields:

```prisma
model Client {
  id      Int    @id @default(autoincrement())
  name    String
  cnpjCpf String @map("cnpj_cpf")
  phone   String
  email   String
  address String
  orders  Order[]
}

model Center {
  id     Int    @id @default(autoincrement())
  name   String
  type   String
  obs    String
  orders Order[]
}

model Order {
  id                  Int       @id @default(autoincrement())
  clientId            Int       @map("client_id")
  centerId            Int       @map("center_id")
  title               String
  tiragem             Int
  formato             String
  numPaginasTotal     Int       @map("num_paginas_total")
  numPaginasColoridas Int       @map("num_paginas_coloridas")
  valorUnitario       Float     @map("valor_unitario")
  valorTotal          Float     @map("valor_total")
  prazoEntrega        String    @map("prazo_entrega")
  obs                 String
  date                DateTime  @default(now())
  client              Client    @relation(fields: [clientId], references: [id])
  center              Center    @relation(fields: [centerId], references: [id])
  numero_pedido       String?
  data_pedido         DateTime?
  data_entrega        DateTime?
  solicitante         String?
  documento           String?
  editorial           String?
  tipo_produto        String?
  cor_miolo           String?
  papel_miolo         String?
  papel_capa          String?
  cor_capa            String?
  laminacao           String?
  acabamento          String?
  shrink              String?
  pagamento           String?
  frete               String?
  status              String    @default("Pendente")
  budgets             Budget[]
}

model Budget {
  id                  Int       @id @default(autoincrement())
  numero_pedido       String?
  data_pedido         DateTime  @default(now())
  data_entrega        DateTime?
  solicitante         String?
  documento           String?
  editorial           String?
  tipo_produto        String?
  titulo              String
  tiragem             Int
  formato             String
  total_pgs           Int
  pgs_colors          Int
  cor_miolo           String?
  papel_miolo         String?
  papel_capa          String?
  cor_capa            String?
  laminacao           String?
  acabamento          String?
  shrink              String?
  centro_producao     String?
  observacoes         String?
  preco_unitario      Float
  preco_total         Float
  prazo_producao      String?
  pagamento           String?
  frete               String?
  approved            Boolean   @default(false)
  orderId             Int?      @unique @map("order_id")
  order               Order?    @relation(fields: [orderId], references: [id])
}
```

### Recent Schema Changes
- **Status Field:** Added to Order model for workflow management
- **Budget-Order Relationship:** One-to-one relationship for approval workflow
- **Enhanced Field Mapping:** Proper database column naming conventions

## UI Components & Features

### Enhanced Component Library (40+ components)
- **Navigation:** Sidebar, Breadcrumbs, Navigation menus
- **Data Display:** Tables, Cards, Charts, Badges, Avatars
- **Forms:** Inputs, Selects, Checkboxes, Textareas, Date pickers
- **Feedback:** Dialogs, Toasts, Skeletons, Progress indicators
- **Layout:** Tabs, Separators, Collapsible sections, Toolbars
- **Interactive:** Drag & Drop, Sortable lists, Pagination

### Dashboard Features
- **Summary Cards:** Key performance indicators with loading states
- **Recent Activity:** Tables showing latest orders and clients
- **Responsive Design:** Mobile-first approach with breakpoint optimization
- **Loading States:** Skeleton components for better UX

### Form Features
- **Advanced Validation:** Zod schemas with custom error messages
- **Dynamic Fields:** Specification-driven form population
- **Currency Formatting:** Brazilian Real (BRL) formatting
- **Date Handling:** Proper date picker integration

## Technical Improvements

### Updated Dependencies
- **Next.js 15.5.3:** Latest App Router with Turbopack support
- **React 19.1.0:** Latest React with concurrent features
- **Prisma 6.16.2:** Enhanced ORM with better performance
- **TypeScript 5.x:** Latest type checking and features

### New Libraries Added
- **@dnd-kit:** Drag and drop functionality
- **@tanstack/react-table:** Advanced table management
- **recharts:** Data visualization and charts
- **react-day-picker:** Enhanced date selection
- **sonner:** Toast notification system
- **vaul:** Drawer component library
- **next-themes:** Theme switching support

### Performance Enhancements
- **Turbopack:** Faster development builds
- **React 19:** Concurrent rendering and improved performance
- **Optimized Queries:** Efficient database queries with Prisma
- **Code Splitting:** Automatic route-based code splitting

### Development Experience
- **ESLint 9.x:** Enhanced linting and code quality
- **Playwright:** End-to-end testing framework
- **Vitest:** Fast unit testing
- **Hot Reload:** Instant updates during development

## Current Features & Functionality

### Complete CRUD Operations
- **Clients:** Full lifecycle management with CNPJ/CPF validation
- **Centers:** Production center management with type classification
- **Orders:** Comprehensive order management with status tracking
- **Budgets:** Budget proposal system with approval workflow

### Advanced Reporting
- **Financial Reports:** Revenue analysis and profit tracking
- **Client Analysis:** Orders by client with detailed breakdowns
- **Production Reports:** Center utilization and capacity planning
- **Order Summaries:** Statistical analysis and trends

### Dashboard Analytics
- **Real-time Metrics:** Live data updates
- **Visual Indicators:** Color-coded status and priority
- **Recent Activity:** Latest transactions and client interactions
- **Performance Overview:** Key business metrics at a glance

### Specifications System
- **Product Configuration:** Comprehensive printing options
- **Dynamic Forms:** Auto-populated form fields
- **Validation Rules:** Specification-driven validation
- **API Integration:** RESTful specification management

## Ongoing Tasks & Future Plans

### Immediate Enhancements
- **Authentication System:** Implement user authentication and authorization
- **Role-based Access:** Different permission levels for users
- **Audit Trail:** Track changes and user actions
- **File Upload:** Support for document attachments

### Medium-term Goals
- **Database Migration:** Move from SQLite to PostgreSQL for production
- **API Rate Limiting:** Implement request throttling and protection
- **Caching Strategy:** Redis integration for performance optimization
- **Mobile App:** React Native companion application

### Long-term Vision
- **Multi-tenancy:** Support multiple business units
- **Advanced Analytics:** Machine learning insights and predictions
- **Integration APIs:** Third-party system integrations
- **Real-time Updates:** WebSocket implementation for live data

## Building and Running

**1. Install dependencies:**
```bash
pnpm install
```

**2. Set up database:**
```bash
npx prisma generate
npx prisma db push
```

**3. Run development server:**
```bash
pnpm dev
```

**4. Run tests:**
```bash
pnpm test        # Unit tests
pnpm e2e         # End-to-end tests
```

**5. Build for production:**
```bash
pnpm build
pnpm start
```

**6. Database management:**
```bash
npx prisma studio    # Database GUI
npx prisma migrate   # Production migrations
```

The application will be available at [http://localhost:3000](http://localhost:3000) with hot reload enabled for development.