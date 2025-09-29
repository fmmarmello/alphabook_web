# Layout Recovery Plan

This document tracks the cleanup and stabilization of the app layout after a failed attempt to migrate to the shadcn/ui Sidebar across the whole app.

## Current Decisions
- Keep existing app-level layout with `components/dashboard/sidebar` for now.
- Keep theme provider defaults: `defaultTheme="light"`, `enableSystem={false}`.
- Avoid mixing the shadcn `ui/sidebar` provider at the root. Pages may not rely on its context.
- Page headers should be top bars (outside forms), but without `SidebarTrigger` until/if we adopt the provider consistently.
- Tables should occupy full width with responsive overflow wrappers.

## What Was Reverted
- `src/app/layout.tsx` reverted to:
  - `<ThemeProvider>` wrapping a simple `<div className="flex">`
  - `<Sidebar />` from `components/dashboard/sidebar`
  - `<main className="flex-1 p-8">{children}</main>`
- Removed usage of `<AppSidebar/>` and shadcn `SidebarProvider` from root.

## What Remains (Safe Enhancements)
- Top page header bars for Orders and Clients (outside Cards), without sidebar triggers.
- Full width tables with an overflow wrapper.
- Amber theme tokens remain applied.

## Next Steps (Safe, Incremental)
1. Normalize corrupted strings across pages (centers/budgets/orders).
2. Apply the same header+table pattern to Budgets and Centers.
3. Decide on sidebar strategy:
   - Option A: Keep custom `components/dashboard/sidebar` and add a simple collapse mechanism.
   - Option B: Adopt shadcn `ui/sidebar` across the entire app (requires a dedicated pass and replacing the custom sidebar and header structures consistently).
4. Only after the global decision, reintroduce `SidebarTrigger`/`SidebarRail` and remove the custom sidebar to avoid duplication.

## Notes
- The earlier prototype added shadcn Sidebar globally, which conflicted with the custom sidebar and caused duplicate/placeholder nav. This plan avoids that by restoring the working baseline and moving in small, verifiable steps.
