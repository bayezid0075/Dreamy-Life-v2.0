# Path Alias Configuration

The project uses path aliases for cleaner imports. These are configured in:

1. **jsconfig.json** - For IDE/editor support and TypeScript-like intellisense
2. **next.config.js** - For webpack module resolution during build

## Available Aliases

- `@/*` → `./src/*`
- `components/*` → `./src/components/*`
- `app/*` → `./src/app/*`
- `hooks` → `./src/hooks/index.js` (or `./src/hooks/`)
- `hooks/*` → `./src/hooks/*`
- `utils/*` → `./src/utils/*`
- `configs/*` → `./src/configs/*`
- `constants/*` → `./src/constants/*`
- `styles/*` → `./src/styles/*`
- `i18n/*` → `./src/i18n/*`
- `middleware/*` → `./src/middleware/*`
- `assets/*` → `./src/assets/*`

## Usage Examples

```javascript
// Import from hooks (resolves to hooks/index.js)
import { useIsomorphicEffect } from "hooks";

// Import from hooks subdirectory
import { useSomething } from "hooks/useSomething";

// Import from components
import { Button } from "components/ui";

// Import from app
import { useAuthContext } from "app/contexts/auth/context";

// Import from utils
import { isRouteActive } from "utils/isRouteActive";

// Import from configs
import { defaultTheme } from "configs/theme.config";

// Import from constants
import { NAV_TYPE_ITEM } from "constants/app.constant";
```

## Troubleshooting

If you see "Module not found" errors:

1. Check that the alias is defined in both `jsconfig.json` and `next.config.js`
2. Ensure the file path exists in the `src/` directory
3. Restart the Next.js dev server after changing `next.config.js`
4. Clear `.next` cache: `rm -rf .next` (or `rmdir /s .next` on Windows)

