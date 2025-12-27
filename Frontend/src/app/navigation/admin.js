import { NAV_TYPE_ROOT, NAV_TYPE_ITEM } from "constants/app.constant";
import { 
  UserGroupIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";

const ROOT_ADMIN = "/admin";

const path = (root, item) => `${root}${item}`;

export const admin = {
    id: 'admin',
    type: NAV_TYPE_ROOT,
    path: ROOT_ADMIN,
    title: 'Admin Panel',
    transKey: 'nav.admin.admin',
    Icon: ChartBarIcon,
    childs: [
        {
            id: 'admin-dashboard',
            type: NAV_TYPE_ITEM,
            path: path(ROOT_ADMIN, ''),
            title: 'Dashboard',
            transKey: 'nav.admin.dashboard',
            Icon: ChartBarIcon,
        },
        {
            id: 'admin-users',
            type: NAV_TYPE_ITEM,
            path: path(ROOT_ADMIN, '/users'),
            title: 'Users',
            transKey: 'nav.admin.users',
            Icon: UserGroupIcon,
        },
        {
            id: 'admin-vendors',
            type: NAV_TYPE_ITEM,
            path: path(ROOT_ADMIN, '/vendors'),
            title: 'Vendors',
            transKey: 'nav.admin.vendors',
            Icon: BuildingStorefrontIcon,
        },
    ],
};

