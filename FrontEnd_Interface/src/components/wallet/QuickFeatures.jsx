"use client";
import PropTypes from "prop-types";
import { ArrowRightIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Card } from "components/ui";

// ----------------------------------------------------------------------

const quickFeatures = [
  {
    id: "1",
    label: "Rabbi...",
    icon: ArrowRightIcon,
    color: "bg-pink-100 text-pink-600",
  },
  {
    id: "2",
    label: "Ammu...",
    icon: DevicePhoneMobileIcon,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "3",
    label: "৳ 017313...",
    icon: ArrowRightIcon,
    color: "bg-pink-100 text-pink-600",
  },
];

export function QuickFeatures({ onFeatureClick }) {
  return (
    <div className="bg-white px-4 py-6">
      <h3 className="mb-4 text-base font-semibold text-gray-800">
        কুইক ফিচারসমূহ
      </h3>
      <div className="space-y-3">
        {quickFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.id}
              onClick={() => onFeatureClick?.(feature.id)}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 p-3">
                <div
                  className={clsx(
                    "flex size-12 shrink-0 items-center justify-center rounded-lg",
                    feature.color
                  )}
                >
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {feature.label}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {/* Tap text below */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">ট্যাপ করুন</p>
      </div>
    </div>
  );
}

QuickFeatures.propTypes = {
  onFeatureClick: PropTypes.func,
};

