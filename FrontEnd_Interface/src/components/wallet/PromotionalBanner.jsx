"use client";
import PropTypes from "prop-types";
import clsx from "clsx";

// ----------------------------------------------------------------------

// Wallet Icon with Plus
const WalletPlusIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10H21" />
    <path d="M12 15V9" />
    <path d="M9 12H15" />
  </svg>
);

export function PromotionalBanner({ 
  offerText = "১ম বার ৫০০",
  offerSubtext = "কার্ড টু বিকাশ করলে",
  rewardAmount = "৩০০",
  monthlyMax = "মাসে সার্বাচ্চ ৭৫",
  onTap,
  currentSlide = 0,
  totalSlides = 5,
}) {
  return (
    <div className="relative mx-4 my-4 overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-pink-400 to-rose-500 p-5">
      <div className="flex items-start justify-between gap-3">
        {/* Left Side - Icon and Offer Text */}
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white/20">
              <WalletPlusIcon className="size-5 text-white" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold leading-tight text-white">
              {offerText}
            </p>
            <p className="text-sm font-semibold leading-tight text-white">
              {offerSubtext}
            </p>
          </div>
        </div>

        {/* Right Side - Reward Amount and Button */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-col items-end">
            <span className="text-4xl font-bold leading-none text-yellow-300">{rewardAmount}</span>
            <span className="mt-1 text-xs text-white/80">{monthlyMax}</span>
          </div>
          <button
            onClick={onTap}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-pink-600 transition-all hover:bg-pink-50 active:scale-95"
          >
            ট্যাপ করুন
          </button>
        </div>
      </div>

      {/* Carousel Indicators */}
      <div className="mt-3 flex justify-center gap-1.5">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <div
            key={index}
            className={clsx(
              "h-1.5 rounded-full transition-all",
              index === currentSlide
                ? "w-6 bg-white"
                : "w-1.5 bg-white/40"
            )}
          />
        ))}
      </div>
    </div>
  );
}

PromotionalBanner.propTypes = {
  offerText: PropTypes.string,
  offerSubtext: PropTypes.string,
  rewardAmount: PropTypes.string,
  monthlyMax: PropTypes.string,
  onTap: PropTypes.func,
  currentSlide: PropTypes.number,
  totalSlides: PropTypes.number,
};

