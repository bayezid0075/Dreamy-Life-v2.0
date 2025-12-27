// Import Dependencies
import PropTypes from "prop-types";
import clsx from "clsx";
import { NavLink } from "components/shared/NavLink";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

// Local Imports
import { Badge } from "components/ui";
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useSidebarContext } from "app/contexts/sidebar/context";

// ----------------------------------------------------------------------

export function MenuItem({ data }) {
  const { id, transKey, path } = data;
  const { t } = useTranslation();
  const { lgAndDown } = useBreakpointsContext();
  const { close } = useSidebarContext();

  // Prioritize title, then try translation, fallback to transKey
  let title = data.title || "";
  if (transKey) {
    const translated = t(transKey);
    // Only use translation if it's different from the key (meaning translation exists)
    if (translated && translated !== transKey) {
      title = translated;
    } else if (!title) {
      // If no title and no valid translation, use transKey as last resort
      title = transKey;
    }
  }
  const pathname = usePathname();
  const info = null; // useRouteLoaderData not available in Next.js

  const handleMenuItemClick = () => lgAndDown && close();
  const isActive = pathname === path || pathname.startsWith(path + "/");

  return (
    <div className="relative flex">
      <NavLink
        to={path}
        onClick={handleMenuItemClick}
        activeClassName="text-primary-600 dark:text-primary-400"
        className={clsx(
          "group min-w-0 flex-1 rounded-md px-3 py-2 font-medium outline-hidden transition-colors ease-in-out",
          isActive
            ? "text-primary-600 dark:text-primary-400"
            : "text-gray-800 hover:bg-gray-100 hover:text-gray-950 focus:bg-gray-100 focus:text-gray-950 dark:text-dark-200 dark:hover:bg-dark-300/10 dark:hover:text-dark-50 dark:focus:bg-dark-300/10",
        )}
      >
        <div
          data-menu-active={isActive}
            className="flex min-w-0 items-center justify-between gap-2.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={clsx(
                  isActive
                    ? "bg-primary-600 opacity-80 dark:bg-primary-400"
                    : "opacity-50 transition-all",
                  "size-2 rounded-full border border-current",
                )}
              />
              <span className="truncate">{title}</span>
            </div>
            {info && info.val && (
              <Badge
                color={info.color}
                className="h-5 min-w-[1.25rem] shrink-0 rounded-full p-[5px]"
              >
                {info.val}
              </Badge>
            )}
        </div>
      </NavLink>
    </div>
  );
}

MenuItem.propTypes = {
  data: PropTypes.object.isRequired,
};
