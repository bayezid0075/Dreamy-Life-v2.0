"use client";
import PropTypes from "prop-types";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Avatar } from "components/ui";

// bKash 'b' Icon Component
const BKashIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
  </svg>
);

export function MobileWalletHeader({ 
  username = "Bayezid Hoshen",
  avatarSrc,
  onBalanceClick,
  onSearchClick,
  onMenuClick,
}) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-pink-400 to-rose-500 px-4 pt-4 pb-5">
      {/* Abstract Landscape Background */}
      <div className="absolute inset-0 opacity-10">
        <svg
          className="h-full w-full"
          viewBox="0 0 400 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hills */}
          <path
            d="M0 140 Q80 100 160 120 T320 110 L400 100 L400 180 L0 180 Z"
            fill="white"
          />
          <path
            d="M0 160 Q60 130 120 145 T240 135 L400 125 L400 180 L0 180 Z"
            fill="white"
            opacity="0.7"
          />
          {/* House */}
          <rect x="320" y="100" width="35" height="25" rx="2" fill="white" />
          <path d="M320 100 L337.5 85 L355 100 Z" fill="white" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Top Row - Profile and Icons */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              src={avatarSrc}
              name={username}
              size={12}
              className="ring-2 ring-white/20"
            />
            <div className="flex flex-col">
              <h3 className="text-base font-semibold text-white leading-tight">{username}</h3>
              {/* Balance Button - Below name */}
              <button
                onClick={onBalanceClick}
                className={clsx(
                  "mt-1 flex items-center gap-1.5 rounded-lg bg-white/20 px-2.5 py-1",
                  "text-xs font-medium text-white transition-all hover:bg-white/30 active:scale-95"
                )}
              >
                <BKashIcon className="size-3.5" />
                <span>ব্যালেন্স দেখুন</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSearchClick}
              className="flex size-10 items-center justify-center rounded-full bg-white transition-all hover:bg-gray-100 active:scale-95"
            >
              <MagnifyingGlassIcon className="size-5 text-gray-800" />
            </button>
            <button
              onClick={onMenuClick}
              className="flex size-10 items-center justify-center rounded-full bg-white transition-all hover:bg-gray-100 active:scale-95"
            >
              {/* Menu Icon - Three horizontal lines */}
              <svg
                className="size-5 text-pink-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

MobileWalletHeader.propTypes = {
  username: PropTypes.string,
  avatarSrc: PropTypes.string,
  onBalanceClick: PropTypes.func,
  onSearchClick: PropTypes.func,
  onMenuClick: PropTypes.func,
};

