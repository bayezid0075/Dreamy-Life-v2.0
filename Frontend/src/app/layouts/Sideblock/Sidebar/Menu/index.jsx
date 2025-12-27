// Import Dependencies
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { useDidUpdate, useIsomorphicEffect } from "hooks";
import SimpleBar from "simplebar-react";

// Local Imports
import { navigation } from "app/navigation";
import { Group } from "./Group";
import { CollapsibleItem } from "./Group/CollapsibleItem";
import { MenuItem } from "./Group/MenuItem";
import { Accordion } from "components/ui";
import { isRouteActive } from "utils/isRouteActive";
import { UserProfileCard } from "components/shared/UserProfileCard";
import { NAV_TYPE_ITEM, NAV_TYPE_COLLAPSE } from "constants/app.constant";
import { useAuthContext } from "app/contexts/auth/context";
import axios from "utils/axios";

// ----------------------------------------------------------------------

export function Menu() {
  const pathname = usePathname();
  const { ref } = useRef();
  const { user } = useAuthContext();
  const [userData, setUserData] = useState(null);
  const [hasVendor, setHasVendor] = useState(false);
  const [vendorLoading, setVendorLoading] = useState(true);

  // Fetch user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const response = await axios.get("/api/users/userinfo/");
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user]);

  // Check if user has a vendor
  useEffect(() => {
    const checkVendor = async () => {
      if (!user) {
        setVendorLoading(false);
        setHasVendor(false);
        return;
      }

      try {
        setVendorLoading(true);
        const response = await axios.get("/api/vendors/vendors/");
        
        // Handle both array and object responses
        let vendorData = null;
        if (Array.isArray(response.data)) {
          vendorData = response.data.length > 0 ? response.data[0] : null;
        } else if (response.data && typeof response.data === 'object') {
          vendorData = response.data;
        }
        
        // Set hasVendor based on whether we got valid vendor data
        setHasVendor(!!vendorData && vendorData.id);
      } catch (error) {
        // If 404 or 403, user has no vendor
        if (error.response?.status === 404 || error.response?.status === 403) {
          setHasVendor(false);
        } else {
          // For other errors, assume no vendor
          console.error("Error checking vendor:", error);
          setHasVendor(false);
        }
      } finally {
        setVendorLoading(false);
      }
    };

    checkVendor();
  }, [user]);

  // Transform navigation based on vendor status
  const transformedNavigation = navigation.map((nav) => {
    if (nav.id === "vendors") {
      // If user has no vendor, transform to a simple menu item
      if (!hasVendor && !vendorLoading) {
        // Create a new object without childs, explicitly set type to NAV_TYPE_ITEM
        const transformedNav = {
          id: nav.id,
          type: NAV_TYPE_ITEM,
          path: "/vendors/create",
          title: nav.title || "Vendor",
          transKey: nav.transKey,
          Icon: nav.Icon,
        };
        // Ensure childs is not present
        return transformedNav;
      }
      // If user has vendor, keep as is (with childs/accordion)
      return nav;
    }
    return nav;
  });

  const activeGroup = transformedNavigation.find((item) => {
    if (item.path) return isRouteActive(item.path, pathname);
  });

  const activeCollapsible =
    activeGroup?.childs?.find((item) => {
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

  // Don't render until vendor check is complete
  if (vendorLoading) {
    return (
      <SimpleBar
      scrollableNodeProps={{ ref }}
      className="h-full overflow-x-hidden pt-3 pb-6"
    >
      <div className="relative space-y-1 break-words print:border">
        {/* User Profile Card */}
        <UserProfileCard
          username={userData?.user?.username || user?.username || "User"}
          phoneNumber={
            userData?.user?.phone_number ||
            user?.phone_number ||
            "+8800000000000"
          }
          avatarSrc={
            userData?.profile_picture || "/images/avatar/avatar-20.jpg"
          }
          referralCode={userData?.own_refercode || "N/A"}
          showStatus={true}
          statusColor={userData?.is_verified ? "success" : "warning"}
          isVerified={userData?.is_verified || false}
          membershipStatus={
            userData?.active_membership?.name || 
            userData?.member_status || 
            "user"
          }
        />
      </div>
    </SimpleBar>
    );
  }

  return (
    <SimpleBar
      scrollableNodeProps={{ ref }}
      className="h-full overflow-x-hidden pt-3 pb-6"
    >
      <div className="relative space-y-1 break-words print:border">
        {/* User Profile Card */}
        <UserProfileCard
          username={userData?.user?.username || user?.username || "User"}
          phoneNumber={
            userData?.user?.phone_number ||
            user?.phone_number ||
            "+8800000000000"
          }
          avatarSrc={
            userData?.profile_picture || "/images/avatar/avatar-20.jpg"
          }
          referralCode={userData?.own_refercode || "N/A"}
          showStatus={true}
          statusColor={userData?.is_verified ? "success" : "warning"}
          isVerified={userData?.is_verified || false}
          membershipStatus={
            userData?.active_membership?.name || 
            userData?.member_status || 
            "user"
          }
        />

        <Accordion
          value={expanded}
          onChange={setExpanded}
          className="space-y-1"
        >
          {transformedNavigation.map((nav) => {
            // For vendors without vendor: render as simple MenuItem
            if (nav.id === "vendors" && nav.type === NAV_TYPE_ITEM && (!nav.childs || nav.childs.length === 0)) {
              return <MenuItem key={nav.id} data={nav} />;
            }
            // If item has no children and is a standalone item, render as MenuItem directly
            if ((!nav.childs || nav.childs.length === 0) && nav.type === NAV_TYPE_ITEM) {
              return <MenuItem key={nav.id} data={nav} />;
            }
            // If item is a collapsible item (accordion), render as CollapsibleItem
            if (nav.type === NAV_TYPE_COLLAPSE && nav.childs && nav.childs.length > 0) {
              return <CollapsibleItem key={nav.id} data={nav} />;
            }
            // Otherwise, render as Group (for items with children)
            return <Group key={nav.id} data={nav} />;
          })}
        </Accordion>
      </div>
    </SimpleBar>
  );
}
