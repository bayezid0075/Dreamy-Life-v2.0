// Import Dependencies
import { MagnifyingGlassIcon, Bars3Icon } from "@heroicons/react/24/outline";
import clsx from "clsx";

// Local Imports
import { Avatar, Button } from "components/ui";

// ----------------------------------------------------------------------

export function MobileWalletHeader({ 
  username = "Bayezid Hoshen",
  avatarSrc,
  onBalanceClick,
  onSearchClick,
  onMenuClick,
}) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-pink-400 to-rose-500 px-4 pt-12 pb-6">
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg
          className="h-full w-full"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 150 Q100 120 200 140 T400 130 L400 200 L0 200 Z"
            fill="white"
            opacity="0.3"
          />
          <circle cx="350" cy="50" r="30" fill="white" opacity="0.2" />
          <rect
            x="300"
            y="100"
            width="40"
            height="30"
            rx="5"
            fill="white"
            opacity="0.2"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Top Row - Profile and Icons */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              src={avatarSrc}
              name={username}
              size={12}
              className="ring-2 ring-white/30"
            />
            <div>
              <h3 className="text-base font-semibold text-white">{username}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSearchClick}
              className="flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all hover:bg-white/30"
            >
              <MagnifyingGlassIcon className="size-5 text-white" />
            </button>
            <button
              onClick={onMenuClick}
              className="flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all hover:bg-white/30"
            >
              <Bars3Icon className="size-5 text-white" />
            </button>
          </div>
        </div>

        {/* Balance Button */}
        <Button
          onClick={onBalanceClick}
          className={clsx(
            "w-full justify-between rounded-xl border-2 border-white/30 bg-white/10 px-4 py-3 backdrop-blur-sm",
            "hover:bg-white/20 transition-all"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-pink-600">
              <span className="text-xl font-bold text-white">৳</span>
            </div>
            <span className="font-medium text-white">View Balance</span>
          </div>
        </Button>
      </div>
    </div>
  );
}

