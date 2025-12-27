// Import Dependencies
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

// Local Imports
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useSidebarContext } from "app/contexts/sidebar/context";
import { navigation } from "app/navigation";
import { useDidUpdate } from "hooks";
import { isRouteActive } from "utils/isRouteActive";
import { MainPanel } from "./MainPanel";
import { PrimePanel } from "./PrimePanel";
import { useAuthContext } from "app/contexts/auth/context";

// ----------------------------------------------------------------------

export function Sidebar() {
  const pathname = usePathname();
  const { name, lgAndDown } = useBreakpointsContext();
  const { isExpanded, close } = useSidebarContext();
  const { user } = useAuthContext();
  
  // Filter navigation based on user role
  // User data comes from /api/users/userinfo/ which has nested structure: user.user.is_staff
  const userObj = user?.user || user;
  const filteredNavigation = navigation.filter((nav) => {
    // Show admin navigation only to staff/superuser
    if (nav.id === 'admin') {
      return userObj && (userObj.is_staff || userObj.is_superuser);
    }
    return true;
  });

  const initialSegment = useMemo(
    () => filteredNavigation.find((item) => isRouteActive(item.path, pathname)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredNavigation],
  );

  const [activeSegmentPath, setActiveSegmentPath] = useState(
    initialSegment?.path,
  );

  const currentSegment = useMemo(() => {
    return filteredNavigation.find((item) => item.path === activeSegmentPath);
  }, [activeSegmentPath, filteredNavigation]);

  useDidUpdate(() => {
    const activePath = filteredNavigation.find((item) =>
      isRouteActive(item.path, pathname),
    )?.path;

    if (!isRouteActive(activeSegmentPath, pathname)) {
      setActiveSegmentPath(activePath);
    }
  }, [pathname]);

  useDidUpdate(() => {
    if (lgAndDown && isExpanded) close();
  }, [name]);

  return (
    <>
      <MainPanel
        nav={filteredNavigation}
        activeSegment={activeSegmentPath}
        setActiveSegment={setActiveSegmentPath}
      />
      <PrimePanel
        close={close}
        currentSegment={currentSegment}
        pathname={pathname}
      />
    </>
  );
}
