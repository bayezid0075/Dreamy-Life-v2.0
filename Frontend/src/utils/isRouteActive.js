/**
 * Checks if the given path matches the current pathname.
 * Next.js compatible version (replaces react-router's matchPath)
 *
 * @param {string} path - The path to check against the current location.
 * @param {string} pathname - The current path of the browser.
 * @returns {boolean} - Returns `true` if the path matches the current pathname, otherwise `false`.
 */
export function isRouteActive(path, pathname) {
  if (!path || !pathname) return false;
  
  // Exact match
  if (path === pathname) return true;
  
  // Remove trailing slashes for comparison
  const normalizedPath = path.replace(/\/$/, '');
  const normalizedPathname = pathname.replace(/\/$/, '');
  
  // Check if pathname starts with the path (for nested routes)
  if (normalizedPathname.startsWith(normalizedPath)) {
    // Ensure it's a proper segment match (not just a substring)
    const nextChar = normalizedPathname[normalizedPath.length];
    return !nextChar || nextChar === '/';
  }
  
  return false;
}
