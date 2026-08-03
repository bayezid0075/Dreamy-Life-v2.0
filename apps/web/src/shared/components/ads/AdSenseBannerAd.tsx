import { useEffect, useRef, useState } from 'react';

interface AdSenseBannerAdProps {
  /** Google AdSense ad slot ID (data-ad-slot) */
  adSlot: string;
  /** Ad format: 'auto', 'rectangle', 'horizontal', 'vertical', etc. */
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  /** Fixed width in pixels (optional, use with format !== 'auto') */
  width?: number;
  /** Fixed height in pixels (optional, use with format !== 'auto') */
  height?: number;
  /** Extra CSS classes */
  className?: string;
  /** Whether to show label "Advertisement" */
  showLabel?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
    __adsenseLoadError?: boolean;
  }
}

const ADSENSE_PUBLISHER_ID =
  process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || 'ca-pub-9617633768223840';

export default function AdSenseBannerAd({
  adSlot,
  format = 'auto',
  width,
  height,
  className = '',
  showLabel = true,
}: AdSenseBannerAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const initializedRef = useRef(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (window.__adsenseLoadError) {
      setLoadError(true);
      return;
    }

    // Check if the adsbygoogle script is actually loaded
    const scriptExists = document.querySelector(
      `script[src*="pagead2.googlesyndication.com"][src*="client=${ADSENSE_PUBLISHER_ID}"]`,
    );

    if (!scriptExists && !window.adsbygoogle) {
      setLoadError(true);
      return;
    }

    if (!initializedRef.current && adRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initializedRef.current = true;
      } catch (e) {
        console.error('AdSense push error:', e);
        setLoadError(true);
      }
    }
  }, []);

  if (loadError) {
    return null;
  }

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {showLabel && (
        <span className="text-[10px] uppercase tracking-[0.15em] text-[#45474b]/40 mb-1 font-semibold">
          — Advertisement —
        </span>
      )}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
