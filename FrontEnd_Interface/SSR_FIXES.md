# SSR (Server-Side Rendering) Fixes

This document lists all the SSR-related fixes applied to make the Next.js application work with server-side rendering.

## Issues Fixed

### 1. `document` and `window` Access
Next.js renders components on the server where `document` and `window` are not available. All direct access to these objects has been guarded with `isServer` checks.

### 2. Files Fixed

#### Core Utilities
- **`src/utils/dom/injectStylesToHead.js`**
  - Added `isServer` checks before accessing `document`
  - Functions now return early on server-side

- **`src/utils/dom/getScrollbarWidth.js`**
  - Already had SSR guards ✓

- **`src/utils/dom/createScopedKeydownHandler.js`**
  - Fixed default parameter for `dir` to check for `document` existence

- **`src/utils/quillUtils.js`**
  - Added SSR check in `htmlToDelta()` function
  - Returns empty delta on server

- **`src/utils/jwt.js`**
  - Added SSR check in `setSession()` function
  - Only sets axios headers on server, skips localStorage

#### Context Providers
- **`src/app/contexts/locale/Provider.jsx`**
  - Fixed `localStorage` access in initial state
  - Added SSR check for `document.documentElement.dir`

- **`src/app/contexts/theme/Provider.jsx`**
  - Fixed `document.documentElement` access
  - Added lazy getter function for HTML element
  - All DOM manipulations now check for server-side

- **`src/app/contexts/auth/Provider.jsx`**
  - Added SSR check before accessing `localStorage`
  - Early return on server-side initialization

- **`src/app/contexts/breakpoint/Provider.jsx`**
  - Already had SSR guards ✓

#### Hooks
- **`src/hooks/useDocumentTitle.js`**
  - Added SSR checks before accessing `document.title`

- **`src/hooks/useLockScrollbar.js`**
  - Added SSR check before accessing `window.scrollY`
  - Added null check for `makeStyleTag()` return value

- **`src/hooks/useLocalStorage.js`**
  - Already had SSR guards ✓

- **`src/hooks/useMediaQuery.js`**
  - Added SSR check in `useIsomorphicEffect`

#### Components
- **`src/components/ui/Form/Select.jsx`**
  - Added SSR check in `findNearestBackgroundColor()` function

#### Configuration
- **`src/i18n/config.js`**
  - Fixed `localStorage` access in initialization
  - Added `getInitialLang()` helper function with SSR check

## Pattern Used

All fixes follow this pattern:

```javascript
import { isServer } from "utils/isServer";

// For functions
function myFunction() {
  if (isServer) return; // or return default value
  // ... browser-only code
}

// For hooks/effects
useIsomorphicEffect(() => {
  if (isServer) return;
  // ... browser-only code
}, [dependencies]);

// For initial values
const getInitialValue = () => {
  if (isServer) return defaultValue;
  return window.localStorage.getItem("key") || defaultValue;
};
```

## Testing

After these fixes, the application should:
1. ✅ Build successfully without SSR errors
2. ✅ Render on the server without crashing
3. ✅ Hydrate correctly on the client
4. ✅ Maintain all functionality in the browser

## Notes

- `useIsomorphicEffect` hook already handles SSR correctly (runs on mount in browser, skips on server)
- Some utilities like `useLocalStorage` already had proper SSR guards
- All DOM manipulations are now safely guarded

