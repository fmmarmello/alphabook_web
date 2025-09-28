
# Style Guide

This document outlines the styling patterns used across the Alphabook project.

## Pages

### General Layout

- Most pages use a flexbox layout with `flex flex-col items-center min-h-screen`.
- The background color is inconsistent. Some pages use `bg-gray-50` and others use `bg-gray-900`. **Decision:** Standardize on `bg-gray-900` for a consistent dark theme.
- The main content is usually wrapped in a `<main>` tag.

### Card Usage

- The main content of most pages is wrapped in a `Card` component from `shadcn/ui`.
- The card usually has a `max-w-4xl` or `max-w-6xl`, `w-full`, and `mt-8`.

### Forms (`new` and `edit` pages)

- Forms are built using `react-hook-form` and `zod` for validation.
- They are wrapped in a `Card` component.
- Labels (`<Label>`) are used for form fields.
- Inputs (`<Input>`) are used for text, number, and email fields.
- Selects (`<select>`) are used for dropdowns. These should be replaced with the `Select` component from `shadcn/ui`.
- Buttons (`<Button>`) are used for submitting and canceling. `variant="outline"` is used for the cancel button.

### Tables (List pages)

- Tables are built using the `Table` component from `shadcn/ui`.
- A `Toolbar` component is used for actions like "New", "Search", and filtering.
- The `Pagination` component is used for table pagination.
- The "Ações" (Actions) column had a `sticky` class that was causing issues. This has been removed.

### Navbar

- Some `new` and `edit` pages have a `Navbar` component. This seems to be a custom component.
- The `Navbar` has a `bg-white` and `shadow`. This is inconsistent with the dark theme. **Decision:** The navbar should be removed from the `new` and `edit` pages and the layout should be handled by the main `layout.tsx` file.

## Component-specific Styles

### `select` element

- The `select` elements are using default browser styles with some basic tailwind classes (`border rounded px-2 py-1`).
- **Decision:** Replace all `select` elements with the `Select` component from `shadcn/ui` for a consistent look and feel.

### `main` element

- The `main` element has `flex flex-col items-center min-h-screen` and either `bg-gray-50` or `bg-gray-900`.
- **Decision:** Standardize on `bg-gray-900`.

## Unification Plan

1.  **Background Color:** Change all page backgrounds to `bg-gray-900`. (Partially done)
2.  **Navbar:** Remove the custom `Navbar` from all `new` and `edit` pages. The main navigation is handled by the `app-sidebar.tsx` and `site-header.tsx` components.
3.  **`select` elements:** Replace all `<select>` elements with the `Select` component from `shadcn/ui`.
4.  **Layout:** Ensure all pages follow the standard layout of having the content inside a `<main>` tag with a `Card` component.
5.  **Buttons:** Ensure all buttons follow the `shadcn/ui` `Button` component's variants.
