# Current Context

## Work Focus
- Validate the new Budget <-> Order 1:1 architecture and ensure order creation flows require approved budgets
- Stabilize the global `QueryProvider`/React Query setup so specification and order forms stay hydrated
- Finalize UX refinements on reorganized budget and order forms while instrumenting analytics safely

## Recent Changes (Latest Updates)
- **React Query Integration**: Added `QueryProvider` to `src/app/layout.tsx`, fixing `useSpecifications` runtime errors and centralizing cache settings
- **Analytics Hardening**: `analytics.ts` now imports React hooks directly, adds stronger typing, and extends error tracking
- **Order Model Refactor**: Prisma schema enforces a unique `budgetId`, trims duplicated fields, and introduces production-only metadata columns
- **API & Form Updates**: `POST /api/orders` mandates `budgetId`, updates status handling, and the new `OrderForm` surfaces production schedules, costs, and role-aware controls
- **Order Numbering**: `generateNumeroPedido` differentiates `ORD-0001/YYYYMM` order codes from budget numbering
- **Budget Form UX**: Sections reorganized for logical flow, paper spec dropdowns normalized, and select placeholders fixed for Radix compatibility
- **Testing Coverage**: Cypress end-to-end suite (`cypress/e2e/budget-form.cy.ts`) validates full budget flows with fixtures, auth, and feature flags

## Next Steps
- Implement status-change notifications and production KPIs on the dashboard
- Ship conversion reports that reconcile budgets and orders under the new data model
- Firm up external production system integration and webhook strategy
- Explore multi-level approvals and detailed change history once the refactor is stable
