// Import Dependencies
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { useDidUpdate, useIsomorphicEffect } from "hooks";
import SimpleBar from "simplebar-react";

// Local Imports
import { navigation } from "app/navigation";
import { Group } from "./Group";
import { MenuItem } from "./Group/MenuItem";
import { Accordion } from "components/ui";
import { isRouteActive } from "utils/isRouteActive";
import { UserProfileCard } from "components/shared/UserProfileCard";
import { NAV_TYPE_ITEM } from "constants/app.constant";

// ----------------------------------------------------------------------

export function Menu() {
  const pathname = usePathname();
  const { ref } = useRef();

  const activeGroup = navigation.find((item) => {
    if (item.path) return isRouteActive(item.path, pathname);
  });

  const activeCollapsible = activeGroup?.childs?.find((item) => {
    if (item.path) return isRouteActive(item.path, pathname);
  }) || null;

  const [expanded, setExpanded] = useState(activeCollapsible?.path || null);

  useDidUpdate(() => {
    activeCollapsible?.path !== expanded &&
      setExpanded(activeCollapsible?.path);
  }, [activeCollapsible?.path]);

  useIsomorphicEffect(() => {
    const activeItem = ref?.current.querySelector("[data-menu-active=true]");
    activeItem?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <SimpleBar
      scrollableNodeProps={{ ref }}
      className="h-full overflow-x-hidden pt-10 pb-6"
    >
      <div className="relative space-y-1 break-words print:border">
        {/* User Profile Card */}
        <UserProfileCard
          username="Bayeid Hoshen"
          phoneNumber="++8801728181464"
          avatarSrc="/images/avatar/avatar-20.jpg"
          referralCode="BAYEID2024"
          showStatus={true}
          statusColor="success"
        />

        <Accordion
          value={expanded}
          onChange={setExpanded}
          className="space-y-1"
        >
          {navigation.map((nav) => {
            // If item has no children and is a standalone item, render as MenuItem directly
            if (!nav.childs && nav.type === NAV_TYPE_ITEM) {
              return <MenuItem key={nav.id} data={nav} />;
            }
            // Otherwise, render as Group (for items with children)
            return <Group key={nav.id} data={nav} />;
          })}
        </Accordion>
      </div>
    </SimpleBar>
  );
}
