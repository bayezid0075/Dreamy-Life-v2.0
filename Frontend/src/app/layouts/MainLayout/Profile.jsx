// Import Dependencies
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import {
  ArrowLeftStartOnRectangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { TbCoins, TbUser } from "react-icons/tb";
import { Link } from "components/shared/Link";
import { toast } from "sonner";

// Local Imports
import { Avatar, AvatarDot, Button } from "components/ui";
import { useAuthContext } from "app/contexts/auth/context";
import { useState, useEffect } from "react";
import axios from "utils/axios";

// ----------------------------------------------------------------------

// Removed Settings and Billing - now available in profile page
const links = [];

export function Profile() {
  const { logout, user } = useAuthContext();
  const [userInfo, setUserInfo] = useState(null);

  // Fetch user info to get profile picture
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user) return;
      try {
        const response = await axios.get("/api/users/userinfo/");
        setUserInfo(response.data);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };
    fetchUserInfo();
  }, [user]);

  const profilePicture =
    userInfo?.profile_picture || "/images/avatar/avatar-12.jpg";

  const handleLogout = () => {
    toast.success("Logged out successfully", {
      description: "You have been logged out. Redirecting to login...",
      duration: 2000,
    });
    logout();
  };

  return (
    <Popover className="relative">
      <PopoverButton
        as={Avatar}
        size={12}
        role="button"
        src={profilePicture}
        alt="Profile"
        indicator={
          <AvatarDot color="success" className="ltr:right-0 rtl:left-0" />
        }
        classNames={{
          root: "cursor-pointer",
        }}
      />
      <Transition
        enter="duration-200 ease-out"
        enterFrom="translate-x-2 opacity-0"
        enterTo="translate-x-0 opacity-100"
        leave="duration-200 ease-out"
        leaveFrom="translate-x-0 opacity-100"
        leaveTo="translate-x-2 opacity-0"
      >
        <PopoverPanel
          anchor={{ to: "right end", gap: 12 }}
          className="border-gray-150 shadow-soft dark:border-dark-600 dark:bg-dark-700 z-70 flex w-64 flex-col rounded-lg border bg-white transition dark:shadow-none"
        >
          {({ close }) => (
            <>
              <div className="dark:bg-dark-800 flex items-center gap-4 rounded-t-lg bg-gray-100 px-4 py-5">
                <Avatar size={14} src={profilePicture} alt="Profile" />
                <div>
                  <Link
                    className="hover:text-primary-600 focus:text-primary-600 dark:text-dark-100 dark:hover:text-primary-400 dark:focus:text-primary-400 text-base font-medium text-gray-700"
                    to="/profile"
                  >
                    {user?.user?.username || user?.username || "User"}
                  </Link>

                  <p className="dark:text-dark-300 mt-0.5 text-xs text-gray-400">
                    {user?.user?.email || user?.email || "No email"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col pt-2 pb-5">
                <div className="px-4 pt-4">
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      handleLogout();
                      close();
                    }}
                  >
                    <ArrowLeftStartOnRectangleIcon className="size-4.5" />
                    <span>Logout</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </PopoverPanel>
      </Transition>
    </Popover>
  );
}
