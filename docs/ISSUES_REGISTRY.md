# Issues Registry - Alphabook Web

## Priority Levels
- **P0**: Critical - Breaks functionality or UX
- **P1**: High - Significant impact on quality
- **P2**: Medium - Improvements needed
- **P3**: Low - Nice to have

---

## P0 - Critical Issues

### ISSUE-001: Duplicate SidebarProvider Causing Style Conflicts
**File**: [`src/app/dashboard/page.tsx`](alphabook_web/src/app/dashboard/page.tsx:20)
**Severity**: P0 - CRITICAL
**Impact**: Sidebar styling breaks completely on dashboard route

**Description**:
Root [`layout.tsx`](alphabook_web/src/app/layout.tsx:35) wraps app in `SidebarProvider`, but [`dashboard/page.tsx`](alphabook_web/src/app/dashboard/page.tsx:20) creates another `SidebarProvider`, causing:
- Conflicting React contexts
- CSS variable scope issues
- Broken sidebar animations
- State synchronization failures

**Solution**:
```tsx
// ❌ CURRENT (dashboard/page.tsx)
<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    {/* content */}
  </SidebarInset>
</SidebarProvider>

// ✅ FIXED
<div className="space-y-6">
  <PageHeader title="Dashboard" />
  <Dashboard />
</div>
```

**Dependencies**: None
**Estimated Effort**: 30 minutes
**Testing**: Verify sidebar works on all routes after fix

---

### ISSUE-002: Missing TypeScript Interface for Client
**Files**: All files using Client model
**Severity**: P0 - Type safety broken
**Impact**: Runtime errors, poor IDE support

**Description**:
[`clients/page.tsx`](alphabook_web/src/app/clients/page.tsx:15) uses `ClientInput[]` but type is not properly imported or defined.

**Solution**:
Create [`types/models.ts`](alphabook_web/src/types/models.ts:1):
```typescript
export interface Client {
  id: number
  name: string
  cnpjCpf: string
  phone: string
  email: string
  address: string
}

export interface Order {
  id: number
  clientId: number
  centerId: number
  title: string
  tiragem: number
  formato: string
  // ... all fields
  client?: Client
  center?: Center
}

// etc.
```

**Dependencies**: None
**Estimated Effort**: 2 hours
**Testing**: TypeScript compilation without errors

---

## P1 - High Priority Issues

### ISSUE-003: Inconsistent Error Handling Across Pages
**Files**: All CRUD pages
**Severity**: P1
**Impact**: Poor user experience, inconsistent error messages

**Description**:
Each page implements error handling differently:
- Some show red text: `<div className="text-red-600">`
- Some use custom parsing of error objects
- No standardized error display component
- Error messages not user-friendly

**Solution**:
Create [`components/ui/error-alert.tsx`](alphabook_web/src/components/ui/error-alert.tsx:1):
```tsx
export function ErrorAlert({ error, onRetry }: Props) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erro</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
      {onRetry && <Button onClick={onRetry}>Tentar Novamente</Button>}
    </Alert>
  )
}
```

**Dependencies**: Need Alert component from shadcn/ui
**Estimated Effort**: 4 hours (create component + refactor all pages)

---

### ISSUE-004: Client-Side Data Fetching in Dashboard
**File**: [`src/components/dashboard/Dashboard.tsx`](alphabook_web/src/components/dashboard/Dashboard.tsx:53)
**Severity**: P1
**Impact**: Slower page loads, unnecessary client JavaScript

**Description**:
Dashboard fetches all data client-side using `useEffect`, causing:
- Flash of loading state on every visit
- Larger client bundle
- No SSR benefits
- Poor SEO

**Solution**:
Convert to Server Component:
```tsx
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const data = await getDashboardData() // Server-side fetch
  return <DashboardClient data={data} />
}
```

**Dependencies**: ISSUE-001 must be fixed first
**Estimated Effort**: 3 hours

---

### ISSUE-005: Form Code Duplication (90% similarity)
**Files**: All new/edit page pairs
**Severity**: P1
**Impact**: Hard to maintain, inconsistent behavior

**Description**:
- [`clients/new/page.tsx`](alphabook_web/src/app/clients/new/page.tsx:1) and `clients/[id]/edit/page.tsx` share 90% code
- Same for orders, budgets, centers
- Bug fixes must be applied 8 times

**Solution**:
Extract to shared forms:
```tsx
// components/forms/client-form.tsx
export function ClientForm({ 
  mode, 
  initialData 
}: { 
  mode: 'create' | 'edit'
  initialData?: Client 
}) {
  // Shared logic
}
```

**Dependencies**: ISSUE-002 (types)
**Estimated Effort**: 8 hours (4 forms × 2 hours each)

---

### ISSUE-006: Inline Status Badge Styling
**Files**: [`dashboard/Dashboard.tsx`](alphabook_web/src/components/dashboard/Dashboard.tsx:217), others
**Severity**: P1
**Impact**: Inconsistent styling, not maintainable

**Description**:
Status badges use inline conditional styling:
```tsx
<span className={`px-2 py-1 rounded-full text-xs font-medium ${
  order.status === 'Concluído' ? 'bg-green-100 text-green-800' :
  order.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
  // ...
}`}>
```

**Solution**:
Create `StatusBadge` component with variants:
```tsx
const statusVariants = cva("...", {
  variants: {
    status: {
      Pendente: "bg-yellow-100 text-yellow-800",
      // ...
    }
  }
})
```

**Dependencies**: None
**Estimated Effort**: 2 hours

---

### ISSUE-007: Missing Success Feedback
**Files**: All CRUD pages
**Severity**: P1
**Impact**: Users don't know if action succeeded

**Description**:
After create/update/delete, only navigation happens. No toast or confirmation message.

**Solution**:
Add Sonner toasts:
```tsx
import { toast } from "sonner"

// After success
toast.success("Cliente criado com sucesso!")
router.push('/clients')
```

**Dependencies**: Sonner already installed ✅
**Estimated Effort**: 2 hours

---

### ISSUE-008: No Empty States in Tables
**Files**: All list pages
**Severity**: P1
**Impact**: Poor UX when no data

**Description**:
When tables are empty, they show nothing or just "No data".

**Solution**:
Create `EmptyState` component:
```tsx
<EmptyState
  icon={Users}
  title="Nenhum cliente cadastrado"
  description="Comece criando seu primeiro cliente"
  action={<Button asChild><Link href="/clients/new">Novo Cliente</Link></Button>}
/>
```

**Dependencies**: None
**Estimated Effort**: 3 hours

---

## P2 - Medium Priority Issues

### ISSUE-009: Inconsistent Loading States
**Files**: [`clients/page.tsx`](alphabook_web/src/app/clients/page.tsx:139), others
**Severity**: P2
**Impact**: Inconsistent UX

**Description**:
Some pages use:
- Text: "Carregando..."
- Skeleton components
- Nothing at all

**Solution**:
Standardize on Skeleton components everywhere:
```tsx
{loading ? (
  <Skeleton className="h-8 w-full" />
) : (
  <ActualContent />
)}
```

**Dependencies**: None
**Estimated Effort**: 4 hours

---

### ISSUE-010: Using `<a>` Instead of Next.js `Link`
**Files**: [`clients/page.tsx`](alphabook_web/src/app/clients/page.tsx:101), others
**Severity**: P2
**Impact**: Full page reloads, slower navigation

**Description**:
```tsx
// ❌ CURRENT
<Button asChild>
  <a href="/clients/new">Novo Cliente</a>
</Button>

// ✅ SHOULD BE
import Link from "next/link"
<Button asChild>
  <Link href="/clients/new">Novo Cliente</Link>
</Button>
```

**Dependencies**: None
**Estimated Effort**: 1 hour (find/replace)

---

### ISSUE-011: Missing Breadcrumbs on CRUD Pages
**Files**: All CRUD pages except dashboard
**Severity**: P2
**Impact**: Users lose context of where they are

**Solution**:
Add breadcrumbs to all pages:
```tsx
<PageBreadcrumb items={[
  { label: 'Dashboard', href: '/' },
  { label: 'Clientes', href: '/clients' },
  { label: 'Novo Cliente' }
]} />
```

**Dependencies**: Create PageBreadcrumb component first
**Estimated Effort**: 3 hours

---

### ISSUE-012: Inconsistent Form Layouts
**Files**: All form pages
**Severity**: P2
**Impact**: Inconsistent UX

**Description**:
Forms use different grid configurations:
- Some use `FormGrid columns={2}`
- Some use `FormGrid columns={3}`
- Some use `FormGrid columns={4}`
- No clear pattern

**Solution**:
Standardize form layouts:
- Basic info: 2 columns
- Detailed fields: 3 columns
- Specification fields: 4 columns on desktop, stack on mobile

**Dependencies**: None
**Estimated Effort**: 2 hours

---

### ISSUE-013: Demo DataTable Component Still Present
**File**: [`src/components/data-table.tsx`](alphabook_web/src/components/data-table.tsx:1)
**Severity**: P2
**Impact**: Confusing, unused, increases bundle

**Description**:
807-line demo component from shadcn examples not being used in production.

**Solution**:
Either:
1. Delete it completely
2. Or convert to production-ready generic table

**Dependencies**: None
**Estimated Effort**: 30 minutes (delete) or 8 hours (convert)

---

### ISSUE-014: Hardcoded Colors Instead of CSS Variables
**Files**: [`dashboard/Dashboard.tsx`](alphabook_web/src/components/dashboard/Dashboard.tsx:218)
**Severity**: P2
**Impact**: Dark mode issues, inconsistent theming

**Description**:
```tsx
// ❌ HARDCODED
className="bg-green-100 text-green-800"

// ✅ SHOULD USE
className="bg-green-500/10 text-green-600 dark:bg-green-500/20"
```

**Solution**:
Audit all components for hardcoded colors, replace with:
- CSS variables from theme
- Tailwind color classes with dark mode variants

**Dependencies**: None
**Estimated Effort**: 3 hours

---

### ISSUE-015: Missing Loading States on Buttons
**Files**: All form pages
**Severity**: P2
**Impact**: Users can double-submit

**Description**:
Submit buttons don't show loading state clearly enough.

**Solution**:
```tsx
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Salvando...
    </>
  ) : (
    'Salvar'
  )}
</Button>
```

**Dependencies**: None
**Estimated Effort**: 2 hours

---

### ISSUE-016: No Optimistic Updates
**Files**: All CRUD pages
**Severity**: P2
**Impact**: Feels slow even when fast

**Description**:
After delete/update, UI waits for server response before updating.

**Solution**:
Implement optimistic updates:
```tsx
// Immediately update UI
setClients(clients.filter(c => c.id !== id))
// Then sync with server
await deleteClient(id)
```

**Dependencies**: Custom hooks (ISSUE-005 solution)
**Estimated Effort**: 4 hours

---

## P3 - Low Priority Issues

### ISSUE-017: No Search Highlighting
**Files**: All list pages with search
**Severity**: P3
**Impact**: Harder to see search matches

**Description**:
When searching, matching text not highlighted.

**Solution**:
Add highlighting to search results:
```tsx
<HighlightedText text={client.name} query={searchQuery} />
```

**Dependencies**: None
**Estimated Effort**: 3 hours

---

### ISSUE-018: Missing Keyboard Shortcuts
**Files**: All pages
**Severity**: P3
**Impact**: Power users want faster navigation

**Description**:
Only sidebar has keyboard shortcut (Ctrl+B). Could add:
- Ctrl+N: New item (on list pages)
- Ctrl+S: Save (on forms)
- Ctrl+F: Focus search
- Escape: Close modals

**Solution**:
Implement keyboard shortcut handler:
```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault()
      router.push('/clients/new')
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [])
```

**Dependencies**: None
**Estimated Effort**: 4 hours

---

### ISSUE-019: No Data Export Functionality
**Files**: Report pages
**Severity**: P3
**Impact**: Users want to export data

**Description**:
No CSV/Excel export for reports or tables.

**Solution**:
Add export buttons:
```tsx
<Button onClick={exportToCSV}>
  <Download className="mr-2 h-4 w-4" />
  Exportar CSV
</Button>
```

**Dependencies**: Need CSV generation library
**Estimated Effort**: 6 hours

---

### ISSUE-020: No Data Caching
**Files**: All data-fetching code
**Severity**: P3
**Impact**: Unnecessary API calls

**Description**:
Every navigation refetches data even if recently loaded.

**Solution**:
Implement SWR or React Query:
```tsx
const { data, error, isLoading } = useSWR('/api/clients', fetcher)
```

**Dependencies**: Install SWR or React Query
**Estimated Effort**: 8 hours

---

## Code Quality Issues

### ISSUE-021: Excessive Use of `any` Type
**Files**: Multiple
**Severity**: P2
**Impact**: No type safety

**Locations**:
- [`clients/page.tsx:154`](alphabook_web/src/app/clients/page.tsx:154): `clients.map((client: any, idx)`
- [`clients/new/page.tsx:120`](alphabook_web/src/app/clients/new/page.tsx:120): `(Object.values(fieldErrors) as any[])`
- Specification handling code

**Solution**: Add proper types everywhere

---

### ISSUE-022: Inconsistent Error Message Extraction
**Files**: All CRUD pages
**Severity**: P2
**Impact**: Code duplication

**Description**:
Every page has similar error extraction logic:
```tsx
const msg = err?.error?.message || 'Erro...';
const details = err?.error?.details;
const formErrors = Array.isArray(details?.formErrors) ? details.formErrors : [];
// ... 10 more lines
```

**Solution**:
Create utility:
```typescript
// lib/api-client.ts
export function formatApiError(error: unknown): string {
  // Centralized logic
}
```

---

### ISSUE-023: Magic Numbers in Code
**Files**: Multiple
**Severity**: P3
**Impact**: Hard to maintain

**Examples**:
- `pageSize = 20` (why 20?)
- Debounce timeout `500ms` (why 500?)
- Grid columns `columns={3}` (why 3?)

**Solution**:
Create constants file:
```typescript
// lib/constants.ts
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50],
} as const

export const DEBOUNCE = {
  SEARCH: 500,
  VALIDATION: 300,
} as const
```

---

### ISSUE-024: Unused Imports and Exports
**Files**: Multiple
**Severity**: P3
**Impact**: Larger bundle size

**Description**:
Many files import components never used. Need cleanup pass.

**Solution**: Run ESLint auto-fix + manual review

---

## shadcn/ui Compliance Issues

### ISSUE-025: Missing forwardRef on Custom Components
**Files**: Custom UI components
**Severity**: P2
**Impact**: Can't use refs, limits composability

**Description**:
Custom components should use `React.forwardRef` like shadcn components do.

**Solution**:
```tsx
const MyComponent = React.forwardRef<HTMLDivElement, Props>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("...", className)} {...props} />
  }
)
MyComponent.displayName = "MyComponent"
```

---

### ISSUE-026: Not Using CVA for Variants
**Files**: Custom components with variants
**Severity**: P2
**Impact**: Inconsistent variant API

**Description**:
Should use `class-variance-authority` for all component variants like shadcn does.

**Example**:
```tsx
import { cva, VariantProps } from "class-variance-authority"

const cardVariants = cva("base-classes", {
  variants: {
    variant: {
      default: "...",
      highlight: "...",
    }
  }
})
```

---

### ISSUE-027: Missing `data-slot` Attributes
**Files**: Some custom components
**Severity**: P3
**Impact**: Harder to debug, less consistent

**Description**:
shadcn components use `data-slot` for debugging. Custom components should too.

**Solution**: Add `data-slot="component-name"` to all components

---

## UX/UI Issues

### ISSUE-028: Inconsistent Button Variants
**Files**: Multiple
**Severity**: P2
**Impact**: Confusing UI

**Description**:
- Cancel buttons sometimes `variant="outline"`, sometimes `variant="secondary"`
- Delete buttons sometimes `variant="destructive"`, sometimes red classes
- No clear pattern

**Solution**:
Document and enforce button variant usage:
- Primary actions: `variant="default"`
- Cancel/back: `variant="outline"`
- Delete/remove: `variant="destructive"`
- Alternative actions: `variant="secondary"`

---

### ISSUE-029: No Confirmation Before Delete
**Files**: Some pages
**Severity**: P2
**Impact**: Accidental deletions

**Description**:
Some pages use `window.confirm()`, some use `ConfirmDialog`, some nothing.

**Solution**:
Always use [`ConfirmDialog`](alphabook_web/src/components/ui/confirm-dialog.tsx:1) component consistently.

---

### ISSUE-030: Mobile Responsiveness Issues
**Files**: Multiple
**Severity**: P2
**Impact**: Poor mobile UX

**Issues**:
- Tables don't scroll horizontally on mobile (some do, some don't)
- Form grids don't stack properly
- Buttons too small for touch
- Modals don't convert to drawers

**Solution**: Comprehensive mobile testing + fixes

---

### ISSUE-031: No Skeleton Loaders in Tables
**Files**: Some list pages
**Severity**: P2
**Impact**: Layout shift during loading

**Description**:
Some tables show empty during load, causing layout shift when data arrives.

**Solution**:
Show skeleton rows:
```tsx
{loading ? (
  Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      {/* ... */}
    </TableRow>
  ))
) : (
  data.map(/* ... */)
)}
```

---

## Performance Issues

### ISSUE-032: No Code Splitting for Heavy Components
**Files**: Charts, tables
**Severity**: P2
**Impact**: Larger initial bundle

**Description**:
Heavy components loaded on every page even if not needed.

**Solution**:
Dynamic imports:
```tsx
const RevenueChart = dynamic(() => import('./revenue-chart'), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false
})
```

---

### ISSUE-033: No Memoization of Expensive Calculations
**Files**: Multiple
**Severity**: P3
**Impact**: Unnecessary re-renders

**Description**:
Components recalculate values on every render.

**Solution**:
```tsx
const totalValue = useMemo(
  () => orders.reduce((sum, o) => sum + o.valorTotal, 0),
  [orders]
)
```

---

### ISSUE-034: useEffect Dependency Arrays Issues
**Files**: Multiple
**Severity**: P2
**Impact**: Infinite loops or stale closures

**Description**:
Some `useEffect` hooks missing dependencies, others have unnecessary deps.

**Solution**: Enable ESLint rule and fix all warnings

---

## Accessibility Issues

### ISSUE-035: Missing ARIA Labels
**Files**: Multiple forms
**Severity**: P1
**Impact**: Screen reader users can't use forms

**Solution**: Add proper ARIA labels to all interactive elements

---

### ISSUE-036: Focus Management in Dialogs
**Files**: Dialog/modal components
**Severity**: P1
**Impact**: Keyboard users trapped

**Description**:
When dialogs open, focus doesn't move to dialog. When closed, focus lost.

**Solution**: Radix UI handles this automatically, verify implementation

---

### ISSUE-037: Color Contrast Ratios
**Files**: Theme colors
**Severity**: P2
**Impact**: WCAG compliance

**Description**:
Need to verify all color combinations meet WCAG AA standard (4.5:1 contrast).

**Solution**: Run automated contrast checker, fix failing combinations

---

## Documentation Issues

### ISSUE-038: Missing Component Documentation
**Files**: All components
**Severity**: P3
**Impact**: Hard for new developers

**Solution**: Add JSDoc comments to all components

---

### ISSUE-039: No API Documentation
**Files**: API routes
**Severity**: P3
**Impact**: Frontend developers don't know API contracts

**Solution**: Generate OpenAPI spec or add detailed comments

---

## Issue Summary by Category

| Category | P0 | P1 | P2 | P3 | Total |
|----------|----|----|----|----|-------|
| Architecture | 2 | 3 | 1 | 0 | 6 |
| Code Quality | 0 | 1 | 4 | 2 | 7 |
| UX/UI | 0 | 3 | 4 | 0 | 7 |
| Performance | 0 | 0 | 2 | 1 | 3 |
| Accessibility | 0 | 2 | 1 | 0 | 3 |
| Documentation | 0 | 0 | 0 | 2 | 2 |
| **TOTAL** | **2** | **9** | **12** | **5** | **28** |

---

## Resolution Timeline

### Sprint 1 (Week 1): Critical Fixes
**Focus**: P0 issues + foundation for P1
- ISSUE-001: Fix duplicate SidebarProvider ✅ Unblocks everything
- ISSUE-002: Create type definitions ✅ Needed for all refactoring
- ISSUE-003: Standardize error handling
- ISSUE-035: Add ARIA labels
- ISSUE-036: Fix focus management

**Deliverables**: 
- Working sidebar everywhere
- Type-safe codebase
- Accessible forms

### Sprint 2 (Week 2): Architecture Refactor  
**Focus**: P1 issues - component architecture
- ISSUE-004: Convert Dashboard to Server Component
- ISSUE-005: Extract shared forms
- ISSUE-006: Create StatusBadge component
- ISSUE-007: Add success toasts
- ISSUE-008: Create EmptyState component

**Deliverables**:
- Reusable form components
- Consistent feedback system
- Better component architecture

### Sprint 3 (Week 3): UX/UI Polish
**Focus**: P2 issues - user experience
- ISSUE-009: Standardize loading states
- ISSUE-010: Replace `<a>` with `Link`
- ISSUE-011: Add breadcrumbs
- ISSUE-012: Standardize form layouts
- ISSUE-014: Fix hardcoded colors
- ISSUE-015: Add button loading states
- ISSUE-028: Document button variants
- ISSUE-029: Consistent delete confirmations
- ISSUE-030: Mobile responsiveness
- ISSUE-031: Table skeleton loaders

**Deliverables**:
- Polished, consistent UI
- Mobile-optimized
- Professional look and feel

### Sprint 4 (Week 4): Optimization & Polish
**Focus**: P2/P3 performance and nice-to-haves
- ISSUE-013: Handle demo DataTable
- ISSUE-016: Optimistic updates
- ISSUE-032: Code splitting
- ISSUE-033: Add memoization
- ISSUE-034: Fix useEffect deps
- ISSUE-037: Verify color contrast
- Plus any P3 issues with time remaining

**Deliverables**:
- Optimized performance
- Production-ready codebase
- Documentation complete

---

## Testing Checklist

After each sprint, verify:

### Functional Testing
- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] Search/filter/sort functions correctly
- [ ] Pagination works
- [ ] Form validation works
- [ ] Error messages display correctly
- [ ] Success toasts appear
- [ ] Navigation works (all routes)

### Visual Testing
- [ ] Light mode renders correctly
- [ ] Dark mode renders correctly
- [ ] Sidebar expand/collapse works
- [ ] Mobile drawer works
- [ ] All responsive breakpoints
- [ ] No layout shifts
- [ ] Consistent spacing

### Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Focus indicators visible
- [ ] Color contrast passes WCAG AA
- [ ] Forms have proper labels

### Performance Testing
- [ ] Lighthouse score > 90
- [ ] Bundle size acceptable
- [ ] No memory leaks
- [ ] Fast page transitions
- [ ] Smooth animations

---

## Change Management

### Before Starting Implementation
1. **Backup Database**: `cp prisma/dev.db prisma/dev.db.backup`
2. **Create Feature Branch**: `git checkout -b refactor/comprehensive-revision`
3. **Document Current State**: Screenshots of all pages
4. **Setup Testing Environment**: Local test database

### During Implementation
1. **Small Commits**: Each issue = 1-3 commits
2. **Test After Each Change**: Don't accumulate broken code
3. **Update Documentation**: Keep docs in sync
4. **PR Reviews**: Get feedback on major changes

### After Completion
1. **QA Pass**: Full regression testing
2. **Performance Audit**: Verify improvements
3. **User Acceptance Testing**: Get stakeholder approval
4. **Deploy**: Staged rollout (dev → staging → production)

---

## Rollback Plan

If critical issues found post-deployment:

### Immediate Rollback
```bash
git revert <commit-range>
git push
```

### Partial Rollback
Identify specific issue, revert only that change.

### Database Rollback
If schema changes made (unlikely, this is UI-only):
```bash
npx prisma migrate reset
cp prisma/dev.db.backup prisma/dev.db
```

---

## Support Resources

### Documentation
- shadcn/ui: https://ui.shadcn.com
- Next.js 15: https://nextjs.org/docs
- Radix UI: https://www.radix-ui.com
- Tailwind CSS: https://tailwindcss.com

### Tools
- Lighthouse: Performance/accessibility auditing
- axe DevTools: Accessibility testing
- React DevTools: Component debugging
- TypeScript: Type checking

---

**Document Version**: 1.0  
**Last Updated**: 2025-09-29  
**Next Review**: After Sprint 1  
**Owner**: Development Team