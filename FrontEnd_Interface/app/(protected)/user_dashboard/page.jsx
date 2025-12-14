"use client";

import { useState, useEffect } from "react";
import { Page } from "components/shared/Page";
import { MobileWalletHeader } from "components/wallet/MobileWalletHeader";
import { FeatureGrid } from "components/wallet/FeatureGrid";
import { PromotionalBanner } from "components/wallet/PromotionalBanner";
import { QuickFeatures } from "components/wallet/QuickFeatures";
import { BottomNavigation } from "components/wallet/BottomNavigation";
import { useIsomorphicEffect } from "hooks";

export default function Wallet() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hide layout header on mobile for wallet page, but allow sidebar to toggle
  useIsomorphicEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      const header = document.querySelector(".app-header");
      const main = document.querySelector("main.main-content");
      
      if (header) {
        header.style.display = "none";
      }
      if (main) {
        main.style.marginLeft = "0";
        main.style.marginRight = "0";
      }
      
      return () => {
        if (header) header.style.display = "";
        if (main) {
          main.style.marginLeft = "";
          main.style.marginRight = "";
        }
      };
    }
  }, []);

  const handleBalanceClick = () => {
    console.log("View balance clicked");
    // Add your balance view logic here
  };

  const handleFeatureClick = (featureId) => {
    console.log("Feature clicked:", featureId);
    // Add your feature navigation logic here
  };

  const handleSeeMore = () => {
    console.log("See more clicked");
    // Add your see more logic here
  };

  const handleBannerTap = () => {
    console.log("Banner tapped");
    // Add your banner action logic here
  };

  const handleQuickFeatureClick = (featureId) => {
    console.log("Quick feature clicked:", featureId);
    // Add your quick feature logic here
  };

  return (
    <Page title="Wallet">
      <div className="wallet-mobile-page min-h-screen bg-white pb-20 md:pb-0">
        {/* Mobile Wallet Header */}
        <MobileWalletHeader
          username="Bayezid Hoshen"
          avatarSrc="/images/avatar/avatar-20.jpg"
          onBalanceClick={handleBalanceClick}
        />

        {/* Feature Grid */}
        <FeatureGrid
          onFeatureClick={handleFeatureClick}
          onSeeMore={handleSeeMore}
        />

        {/* Promotional Banner */}
        <PromotionalBanner
          offerText="১ম বার ৫০০"
          offerSubtext="কার্ড টু বিকাশ করলে"
          rewardAmount="৩০০"
          monthlyMax="মাসে সার্বাচ্চ ৭৫"
          onTap={handleBannerTap}
          currentSlide={currentSlide}
          totalSlides={5}
        />

        {/* Quick Features */}
        <QuickFeatures onFeatureClick={handleQuickFeatureClick} />

        {/* Bottom Navigation - Mobile Only */}
        <BottomNavigation />
      </div>
    </Page>
  );
}

