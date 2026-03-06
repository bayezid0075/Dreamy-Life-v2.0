"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { getBanners, type BannerSlidePublic } from "@/lib/api/banners";

function SlideCard({ slide }: { slide: BannerSlidePublic }) {
  const content = (
    <div
      className="relative w-full flex-shrink-0 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700"
      style={{
        aspectRatio: "16/9",
        scrollSnapAlign: "start",
      }}
    >
      <img
        src={slide.image_url}
        alt={slide.title || "Banner"}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {slide.title && (
        <div
          className="absolute bottom-0 left-0 right-0 px-3 py-2 text-white text-xs font-medium truncate"
          style={{
            background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
          }}
        >
          {slide.title}
        </div>
      )}
    </div>
  );

  if (slide.link && slide.link.trim()) {
    const isExternal = /^https?:\/\//i.test(slide.link);
    if (isExternal) {
      return (
        <a
          href={slide.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-[85%] sm:w-[75%] flex-shrink-0 px-1 first:pl-3 last:pr-3"
          style={{ scrollSnapAlign: "center" }}
        >
          {content}
        </a>
      );
    }
    return (
      <Link
        href={slide.link}
        className="block w-[85%] sm:w-[75%] flex-shrink-0 px-1 first:pl-3 last:pr-3"
        style={{ scrollSnapAlign: "center" }}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className="w-[85%] sm:w-[75%] flex-shrink-0 px-1 first:pl-3 last:pr-3"
      style={{ scrollSnapAlign: "center" }}
    >
      {content}
    </div>
  );
}

export function DashboardBannerSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: getBanners,
  });

  const count = banners.length;

  useEffect(() => {
    if (count <= 1) return;
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const slideWidth = el.offsetWidth * 0.85;
      const index = Math.round(scrollLeft / slideWidth);
      setActiveIndex(Math.min(index, count - 1));
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [count]);

  if (isLoading || count === 0) {
    return null;
  }

  return (
    <div className="md:hidden mt-4 px-3 sm:px-4">
      <div
        className="rounded-2xl sm:rounded-3xl overflow-hidden p-3 sm:p-4"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-0 snap-x snap-mandatory scroll-smooth pb-2 -mx-1"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {banners.map((slide) => (
            <SlideCard key={slide.id} slide={slide} />
          ))}
        </div>
        {count > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex
                    ? "w-5 bg-violet-500 dark:bg-violet-400"
                    : "w-1.5 bg-slate-300 dark:bg-slate-600"
                }`}
                onClick={() => {
                  const el = scrollRef.current;
                  if (el) {
                    const slideWidth = el.offsetWidth * 0.85;
                    el.scrollTo({ left: i * slideWidth, behavior: "smooth" });
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
