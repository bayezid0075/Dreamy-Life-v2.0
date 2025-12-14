"use client";
import PropTypes from "prop-types";
import {
  ArrowRightIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Card } from "components/ui";

// ----------------------------------------------------------------------

const quickFeatures = [
  {
    id: "1",
    label: "Rabbi...",
    icon: ArrowRightIcon,
    color:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    id: "2",
    label: "Ammu...",
    icon: DevicePhoneMobileIcon,
    color:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    id: "3",
    label: "৳ 017313...",
    icon: ArrowRightIcon,
    color:
      "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  },
];

export function QuickFeatures({ onFeatureClick }) {
  return (
    <div className="dark:bg-dark-900 bg-white px-4 py-6">
      <h3 className="dark:text-dark-50 mb-5 text-lg font-bold text-gray-800">
        কুইক ফিচারসমূহ
      </h3>
      <div className="space-y-3">
        {quickFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.id}
              onClick={() => onFeatureClick?.(feature.id)}
              className="dark:border-dark-600 dark:bg-dark-800 cursor-pointer rounded-xl border border-gray-200/80 bg-white shadow-sm transition-all hover:border-purple-200 hover:shadow-lg active:scale-[0.98] dark:hover:border-purple-800"
            >
              <div className="flex items-center gap-3 p-4">
                <div
                  className={clsx(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all",
                    feature.color,
                  )}
                >
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="dark:text-dark-100 truncate text-sm font-semibold text-gray-800">
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
