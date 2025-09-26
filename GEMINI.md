# GEMINI.md

## Project Overview

This is a Next.js project for managing clients, centers, and orders for a printing business called "Alphabook". It uses Prisma as an ORM to interact with a SQLite database. The application provides a web interface for CRUD operations on these entities, as well as reporting features.

**Key Technologies:**

*   **Framework:** Next.js
*   **Language:** TypeScript
*   **ORM:** Prisma
*   **Database:** SQLite
*   **UI:** React with `shadcn/ui` components
*   **Styling:** Tailwind CSS
*   **Linting:** ESLint
*   **Testing:** Vitest

## Project Structure

The project follows a standard Next.js App Router structure:

```
.
├── prisma/
│   ├── dev.db
│   └── schema.prisma
├── public/
│   └── ...
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── centers/
│   │   │   ├── clients/
│   │   │   └── orders/
│   │   ├── centers/
│   │   ├── clients/
│   │   └── orders/
│   ├── components/
│   │   └── ui/
│   ├── lib/
│   └── generated/
└── ...
```

*   `prisma/`: Contains the Prisma schema and the SQLite database file.
*   `src/app/api/`: Contains the API routes for the different resources (clients, centers, orders).
*   `src/app/(pages)/`: Contains the frontend pages for the application.
*   `src/components/ui/`: Contains the reusable UI components built with `shadcn/ui`.
*   `src/lib/`: Contains utility functions, validation schemas, and the Prisma client instance.
*   `src/generated/`: Contains the generated Prisma client.

## API Routes

The application exposes the following API routes:

### Clients

*   `GET /api/clients`: Returns a paginated list of clients.
    *   Query Parameters: `page`, `pageSize`, `q`, `sortBy`, `sortOrder`
*   `POST /api/clients`: Creates a new client.
    *   Request Body: `ClientSchema`
*   `GET /api/clients/[id]`: Returns a single client by ID.
*   `PUT /api/clients/[id]`: Updates a client.
    *   Request Body: `ClientSchema`
*   `DELETE /api/clients/[id]`: Deletes a client.

### Centers

*   `GET /api/centers`: Returns a paginated list of centers.
    *   Query Parameters: `page`, `pageSize`, `q`, `type`, `sortBy`, `sortOrder`
*   `POST /api/centers`: Creates a new center.
    *   Request Body: `CenterSchema`
*   `GET /api/centers/[id]`: Returns a single center by ID.
*   `PUT /api/centers/[id]`: Updates a center.
    *   Request Body: `CenterSchema`
*   `DELETE /api/centers/[id]`: Deletes a center.

### Orders

*   `GET /api/orders`: Returns a paginated list of orders.
    *   Query Parameters: `page`, `pageSize`, `q`, `clientId`, `centerId`, `dateFrom`, `dateTo`, `sortBy`, `sortOrder`
*   `POST /api/orders`: Creates a new order.
    *   Request Body: `OrderSchema`
*   `GET /api/orders/[id]`: Returns a single order by ID.
*   `PUT /api/orders/[id]`: Updates an order.
    *   Request Body: `OrderSchema`
*   `DELETE /api/orders/[id]`: Deletes an order.

## Database Schema

The database schema is defined in `prisma/schema.prisma` and consists of three models:

*   **Client:** Represents a client of the printing business.
*   **Center:** Represents a production center.
*   **Order:** Represents a production order, with relationships to a `Client` and a `Center`.

```prisma
model Client {
  id      Int    @id @default(autoincrement())
  name    String
  cnpjCpf String
  phone   String
  email   String
  address String
  orders  Order[]
}

model Center {
  id    Int    @id @default(autoincrement())
  name  String
  type  String
  obs   String
  orders Order[]
}

model Order {
  id                 Int     @id @default(autoincrement())
  clientId           Int
  centerId           Int
  title              String
  tiragem            Int
  formato            String
  numPaginasTotal    Int
  numPaginasColoridas Int
  valorUnitario      Float
  valorTotal         Float
  prazoEntrega       String
  obs                String
  date               DateTime @default(now())
  client             Client   @relation(fields: [clientId], references: [id])
  center             Center   @relation(fields: [centerId], references: [id])
}
```

## UI Components

The application uses a set of reusable UI components from `src/components/ui`, built with `shadcn/ui`. Some of the main components are:

*   **Button:** A customizable button component.
*   **Card:** A container component for displaying content in a card format.
*   **Table:** A component for displaying data in a table.
*   **Input:** A form input component.
*   **Pagination:** A component for paginating through a list of items.
*   **ConfirmDialog:** A dialog for confirming actions.

## Validation

The application uses `zod` for schema validation. The validation schemas are defined in `src/lib/validation.ts`:

*   `ClientSchema`: Validates the data for creating and updating clients.
*   `CenterSchema`: Validates the data for creating and updating centers.
*   `OrderSchema`: Validates the data for creating and updating orders.

## Authentication and Authorization

The current implementation of the application does not include authentication or authorization. All API routes are public and can be accessed by anyone.

## Future Migration Recommendations

This section provides recommendations for a future migration of the application.

### Backend

*   **Database:** Migrate from SQLite to a more robust database like PostgreSQL or MySQL.
*   **Authentication and Authorization:** Implement authentication and authorization to protect the API routes. This can be done using a library like NextAuth.js or by implementing a custom solution with JWTs.
*   **Testing:** Write more comprehensive tests for the API routes, including integration tests that interact with the database.

### Frontend

*   **State Management:** For more complex state management, consider using a state management library like Redux Toolkit or Zustand.
*   **Component Library:** While `shadcn/ui` is a good choice, consider using a more comprehensive component library like Material-UI or Ant Design if more complex components are needed.
*   **Testing:** Write unit and integration tests for the frontend components and pages using a library like React Testing Library.

## Building and Running

**1. Install dependencies:**

```bash
pnpm install
```

**2. Run the development server:**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

**3. Run tests:**

```bash
pnpm test
```

**4. Build for production:**

```bash
pnpm build
```