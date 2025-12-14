import { NAV_TYPE_ITEM, } from "constants/app.constant";
import { DashboardsIcon } from 'components/shared/SvgIcons';

export const baseNavigation = [
    {
        id: 'dashboards',
        type: NAV_TYPE_ITEM,
        path: '/dashboards',
        title: 'Dashboards',
        transKey: 'nav.dashboards.dashboards',
        Icon: DashboardsIcon,
    },
]
