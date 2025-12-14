// Import Dependencies
import PropTypes from "prop-types";
import { WalletIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

// Local Imports
import { Button } from "components/ui";

// ----------------------------------------------------------------------

export function PromotionalBanner({ 
  offerText = "First time 500 card to wallet if you do",
  rewardAmount = "600",
  rewardSubtext = "up to offer",
  monthlyMax = "max 75 per month",
  terms = "4 times during offer • terms apply",
  onTap,
  currentSlide = 0,
  totalSlides = 5,
}) {
  return (
    <div className="relative mx-4 my-4 overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-pink-400 to-rose-500 p-6">
      <div className="flex items-start justify-between gap-4">
        {/* Left Side - Icon and Offer Text */}
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <WalletIcon className="size-6 text-white" />
            </div>
          </div>
          <p className="text-base font-semibold leading-tight text-white">
            {offerText}
          </p>
        </div>

        {/* Right Side - Reward Amount */}
        <div className="flex flex-col items-end">
          <span className="text-xs text-white/90">{rewardSubtext}</span>
          <span className="text-5xl font-bold text-yellow-300">{rewardAmount}</span>
          <span className="mt-1 text-xs text-white/80">{monthlyMax}</span>
        </div>
      </div>

      {/* Call to Action Button */}
      <div className="mt-4 flex justify-end">
        <Button
          onClick={onTap}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-pink-600 hover:bg-pink-50"
        >
          Tap here
        </Button>
      </div>

      {/* Terms and Conditions */}
      <p className="mt-3 text-xs text-white/70">*{terms}</p>

      {/* Carousel Indicators */}
      <div className="mt-4 flex justify-center gap-1.5">
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
  rewardAmount: PropTypes.string,
  rewardSubtext: PropTypes.string,
  monthlyMax: PropTypes.string,
  terms: PropTypes.string,
  onTap: PropTypes.func,
  currentSlide: PropTypes.number,
  totalSlides: PropTypes.number,
};

