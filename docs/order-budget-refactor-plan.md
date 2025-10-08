# Order & Budget Refactor – Remediation Plan

This plan tracks the concrete steps we will execute to address the audit findings around the recent order/budget refactor.

## Phase 1 – Stabilise API Surface
- **Align status workflow endpoint**  
  - Update `src/app/api/orders/[id]/status/route.ts` to read/write production notes on `obs_producao`.  
  - Fetch related `budget.client/center` data through the 1:1 relation instead of using legacy `order.client` fields.  
  - Normalise the response payload and role-based filtering against the new structure.
- **Fix dashboard data provider**  
  - Refactor `src/app/api/dashboard/recent-orders/route.ts` to source presentation fields from `order.budget` and expose a consistent DTO.
- **Restore shared error handling**  
  - Import and invoke `handleApiError` within `src/app/api/orders/route.ts` so the standard error contract is honoured.

## Phase 2 – Update Shared Types & Consumers
- **Adopt Prisma-generated types**  
  - Replace custom `Order`/`Budget`/`Client` interfaces in `src/types/models.ts` with re-exports based on Prisma’s generated types (good practice for keeping the contract in sync with the schema).  
  - Provide helper DTO aliases (e.g. `OrderWithBudget`) for API responses that include relations.  
  - Update UI and server modules (dashboard, order pages, dialogs) to rely on the new shapes.
- **Synchronise dashboard & form consumers**  
  - Adjust `src/components/dashboard/Dashboard.tsx` to read order details from `order.budget`.  
  - Ensure `src/components/forms/order-form.tsx` consumes the enriched `Budget` payload returned by `/api/budgets/[id]`.

## Phase 3 – Validation, RBAC & Data Enrichment
- **Harden validation to accept date-only inputs**  
  - Relax the Zod schemas in `src/app/api/orders/[id]/route.ts` to accept `YYYY-MM-DD` date strings coming from forms.
- **Reinstate role guard for order creation**  
  - Enforce `Role.MODERATOR`+ in `POST /api/orders`, matching documented policy.
- **Expand budget lookup includes**  
  - Update `src/app/api/budgets/[id]/route.ts` to include `client`/`center` so the order form can render read-only details.

## Phase 4 – Verification & Follow-up
- **Manual regression**  
  - Create order from approved budget, change statuses along the workflow, and confirm audit notes accumulate in `obs_producao`.
- **Automated checks**  
  - Run existing lint/test scripts (if applicable) to catch type or regression issues.
- **Documentation touch-up**  
  - Review project docs to ensure examples now reflect the budget-centric order data model.

> Using Prisma-generated types for shared models is considered good practice: it keeps TypeScript definitions aligned with the schema and prevents silent drift during future migrations.
