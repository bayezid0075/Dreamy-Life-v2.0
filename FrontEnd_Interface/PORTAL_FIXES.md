# Portal Fixes for Next.js

## Issue
The `nextjs-portal` element error occurs when portal-based components (modals, tooltips, popovers) try to render during SSR or before the DOM is ready.

## Root Causes

1. **Tooltip Component**: Styles were being injected on module load (before client-side)
2. **Toaster Component**: Sonner toaster uses portals and was rendering during SSR
3. **Portal Components**: Headless UI Portal components need SSR guards
4. **Dialog Components**: Some dialogs were rendering even when closed

## Fixes Applied

### 1. Tooltip Component (`src/components/template/Tooltip.jsx`)
- Added `"use client"` directive
- Added `isMounted` state to ensure it only renders on client
- Returns `null` during SSR

### 2. Toaster Component (`src/components/template/Toaster.jsx`)
- Added `"use client"` directive
- Added `isMounted` state to ensure it only renders on client
- Returns `null` during SSR

### 3. Tooltip Styles (`src/components/shared/Tooltip.jsx`)
- Added SSR check before injecting styles
- Only injects styles on client-side

### 4. Portal Usage (`src/app/layouts/Sideblock/Sidebar/index.jsx`)
- Added `typeof window !== "undefined"` check before rendering Portal
- Ensures Portal only renders on client

### 5. Dialog Components
- Fixed `RightSidebar` to check `isOpen` before rendering
- Fixed `Search` dialog to use `open` prop correctly

## Pattern Used

All portal-based components now follow this pattern:

```javascript
"use client";

import { useEffect, useState } from "react";
import { isServer } from "utils/isServer";

export default function PortalComponent() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isServer || !isMounted) {
    return null;
  }

  return (
    // Portal component here
  );
}
```

## Components Fixed

- ✅ `src/components/template/Tooltip.jsx`
- ✅ `src/components/template/Toaster.jsx`
- ✅ `src/components/shared/Tooltip.jsx`
- ✅ `src/app/layouts/Sideblock/Sidebar/index.jsx`
- ✅ `src/components/template/RightSidebar/index.jsx`
- ✅ `src/components/template/Search/index.jsx`

## Testing

After these fixes:
1. No `nextjs-portal` errors should appear
2. Tooltips should work correctly
3. Toasts should render properly
4. Modals and dialogs should open/close correctly
5. Portal components should only render on client-side

## Next Steps

1. Clear Next.js cache: `rm -rf .next`
2. Restart dev server: `yarn dev`
3. Test all portal-based components (tooltips, modals, toasts)

