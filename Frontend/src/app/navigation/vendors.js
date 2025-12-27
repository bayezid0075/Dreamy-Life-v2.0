import {
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { NAV_TYPE_COLLAPSE, NAV_TYPE_ITEM } from "constants/app.constant";

// ----------------------------------------------------------------------

const ROOT_VENDORS = "/vendors";

const path = (root, item) => `${root}${item}`;

export const vendors = {
  id: "vendors",
  type: NAV_TYPE_COLLAPSE,
  path: ROOT_VENDORS,
  title: "Vendor",
  transKey: "nav.vendors.vendors",
  Icon: BuildingStorefrontIcon,
  childs: [
    {
      id: "vendor-dashboard",
      type: NAV_TYPE_ITEM,
      path: path(ROOT_VENDORS, "/dashboard"),
      title: "Dashboard",
      transKey: "nav.vendors.dashboard",
      Icon: ChartBarIcon,
    },
    {
      id: "vendor-products",
      type: NAV_TYPE_ITEM,
      path: path(ROOT_VENDORS, "/products"),
      title: "Products",
      transKey: "nav.vendors.products",
      Icon: ShoppingBagIcon,
    },
    {
      id: "vendor-profile",
      type: NAV_TYPE_ITEM,
      path: path(ROOT_VENDORS, "/profile"),
      title: "Profile",
      transKey: "nav.vendors.profile",
      Icon: UserCircleIcon,
    },
    {
      id: "vendor-sales",
      type: NAV_TYPE_ITEM,
      path: path(ROOT_VENDORS, "/sales"),
      title: "Sales & Income",
      transKey: "nav.vendors.sales",
      Icon: ChartBarIcon,
    },
  ],
};

