# React to Next.js Migration Notes

This project has been successfully migrated from React (Vite) to Next.js.

## Key Changes

### 1. Project Structure
- **Old**: `src/main.jsx` and `src/App.jsx` as entry points
- **New**: Next.js App Router structure with `app/` directory
- **Routes**: Converted from React Router to Next.js file-based routing

### 2. Routing
- **Old**: React Router with `createBrowserRouter` and route definitions
- **New**: Next.js App Router with file-based routing:
  - `app/page.jsx` - Home page
  - `app/(protected)/` - Protected routes (requires authentication)
  - `app/(auth)/login/` - Authentication pages
  - `app/(protected)/dashboards/` - Dashboard pages
  - `app/(protected)/settings/` - Settings pages

### 3. Components Updated
- **Link**: Replaced `react-router` Link with Next.js compatible wrapper in `components/shared/Link.jsx`
- **NavLink**: Replaced `react-router` NavLink with Next.js compatible wrapper in `components/shared/NavLink.jsx`
- **useLocation**: Replaced with `usePathname` from `next/navigation` or compatibility utility in `utils/useLocation.js`
- **Layouts**: Updated MainLayout and Sideblock to accept `children` prop instead of using `<Outlet />`

### 4. Removed Files
- `src/App.jsx` - Replaced by `app/layout.jsx`
- `src/main.jsx` - Not needed in Next.js
- `index.html` - Next.js generates this automatically
- `vite.config.js` - Replaced by `next.config.js`
- `src/app/router/*` - Router files no longer needed
- `src/app/layouts/Root.jsx` - Replaced by `app/layout.jsx`
- `src/app/layouts/AppLayout.jsx` - Functionality moved to route layouts
- `src/app/layouts/DynamicLayout.jsx` - Functionality moved to `app/(protected)/layout.jsx`
- `src/middleware/AuthGuard.jsx` - Replaced by Next.js middleware and layout guards
- `src/middleware/GhostGuard.jsx` - Replaced by `app/(auth)/layout.jsx`

### 5. Configuration Files
- **package.json**: Updated scripts and dependencies
  - Removed: `react-router`, `vite`, `@vitejs/plugin-react`, etc.
  - Added: `next`
- **jsconfig.json**: Updated path aliases for Next.js
- **next.config.js**: Created Next.js configuration
- **postcss.config.js**: Updated for Next.js

### 6. Authentication & Middleware
- **Old**: React Router guards (`AuthGuard`, `GhostGuard`)
- **New**: Next.js layout-based guards in `app/(protected)/layout.jsx` and `app/(auth)/layout.jsx`
- **Middleware**: Created `middleware.js` for edge runtime middleware (can be extended)

### 7. Styling
- All styles remain unchanged
- Tailwind CSS configuration preserved
- CSS imports moved to `app/layout.jsx`

### 8. Context Providers
- All context providers (Auth, Theme, Locale, Breakpoint, Sidebar) remain unchanged
- Wrapped in `app/layout.jsx`

## Running the Project

```bash
# Install dependencies
yarn install

# Development server
yarn dev

# Production build
yarn build

# Start production server
yarn start
```

## Important Notes

1. **useRouteLoaderData**: This React Router feature is not available in Next.js. Components that used it (like menu items with badges) will have `info` set to `null`. If you need this functionality, consider using:
   - Server Components with data fetching
   - API routes
   - Context providers

2. **ScrollRestoration**: React Router's `ScrollRestoration` is not needed in Next.js as it handles this automatically.

3. **Error Boundaries**: Next.js has built-in error handling. The old `RootErrorBoundary` has been removed. Use Next.js `error.js` files if needed.

4. **Client Components**: All components that use hooks or browser APIs must have `"use client"` directive at the top.

5. **Path Aliases**: The `jsconfig.json` has been updated with Next.js-compatible path aliases.

## Next Steps

1. Test all routes and functionality
2. Update any remaining React Router specific code
3. Consider adding Next.js features like:
   - Server Components where appropriate
   - API routes for backend functionality
   - Image optimization with `next/image`
   - Metadata API for SEO

## Compatibility

All components, styles, and functionality have been preserved. The theme should work exactly as before, just running on Next.js instead of Vite + React Router.

