// Import Dependencies
import PropTypes from "prop-types";
import clsx from "clsx";
import { NavLink } from "components/shared/NavLink";
import { usePathname } from "next/navigation";

// Local Imports
import { Badge } from "components/ui";
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useSidebarContext } from "app/contexts/sidebar/context";
import { useTranslation } from "react-i18next";

// ----------------------------------------------------------------------

export function MenuItem({ data }) {
  const { transKey, path, id } = data;
  const { lgAndDown } = useBreakpointsContext();
  const { close } = useSidebarContext();
  const { t } = useTranslation();

  const title = t(transKey) || data.title;
  const pathname = usePathname();
  const info = null; // useRouteLoaderData not available in Next.js

  const handleMenuItemClick = () => lgAndDown && close();
  const isActive = pathname === path || pathname.startsWith(path + "/");

  return (
    <NavLink
      to={path}
      onClick={handleMenuItemClick}
      id={id}
      activeClassName="text-primary-600 dark:text-primary-400 font-medium"
      className={clsx(
        "text-xs-plus flex cursor-pointer items-center justify-between px-2 tracking-wide outline-hidden transition-[color,padding-left,padding-right] duration-300 ease-in-out hover:ltr:pl-4 hover:rtl:pr-4",
        isActive
          ? "text-primary-600 dark:text-primary-400 font-medium"
          : "dark:text-dark-200 dark:hover:text-dark-50 dark:focus:text-dark-50 text-gray-600 hover:text-gray-900 focus:text-gray-900",
      )}
    >
      <div
        data-menu-active={isActive}
          className="flex min-w-0 items-center justify-between"
          style={{ height: "34px" }}
        >
          <div className="flex min-w-0 items-center space-x-2 ">
            <div
              className={clsx(
                isActive
                  ? "bg-primary-600 dark:bg-primary-400 opacity-80"
                  : "opacity-50 transition-all",
                "size-1.5 rounded-full border border-current",
              )}
            ></div>
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
  );
}

MenuItem.propTypes = {
  data: PropTypes.object,
};
