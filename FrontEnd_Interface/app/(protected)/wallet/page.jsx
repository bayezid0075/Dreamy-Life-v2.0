"use client";

import { useState } from "react";
import { Page } from "components/shared/Page";
import { MobileWalletHeader } from "components/wallet/MobileWalletHeader";
import { FeatureGrid } from "components/wallet/FeatureGrid";
import { PromotionalBanner } from "components/wallet/PromotionalBanner";
import { QuickFeatures } from "components/wallet/QuickFeatures";
import { BottomNavigation } from "components/wallet/BottomNavigation";

export default function Wallet() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleBalanceClick = () => {
    console.log("View balance clicked");
    // Add your balance view logic here
  };

  const handleSearchClick = () => {
    console.log("Search clicked");
    // Add your search logic here
  };

  const handleMenuClick = () => {
    console.log("Menu clicked");
    // Add your menu logic here
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
      <div className="min-h-screen bg-gray-50 pb-20 dark:bg-dark-800 md:pb-0">
        {/* Mobile Wallet Header */}
        <MobileWalletHeader
          username="Bayezid Hoshen"
          avatarSrc="/images/avatar/avatar-20.jpg"
          onBalanceClick={handleBalanceClick}
          onSearchClick={handleSearchClick}
          onMenuClick={handleMenuClick}
        />

        {/* Feature Grid */}
        <FeatureGrid
          onFeatureClick={handleFeatureClick}
          onSeeMore={handleSeeMore}
        />

        {/* Promotional Banner */}
        <PromotionalBanner
          offerText="First time 500 card to wallet if you do"
          rewardAmount="600"
          rewardSubtext="up to offer"
          monthlyMax="max 75 per month"
          terms="4 times during offer • terms apply"
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

