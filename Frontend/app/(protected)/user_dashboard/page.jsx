"use client";

import { useState, useEffect } from "react";
import { Page } from "components/shared/Page";
import { MobileWalletHeader } from "components/wallet/MobileWalletHeader";
import { FeatureGrid } from "components/wallet/FeatureGrid";
import { PromotionalBanner } from "components/wallet/PromotionalBanner";
import { BottomNavigation } from "components/wallet/BottomNavigation";
import { useIsomorphicEffect } from "hooks";
import { useAuthContext } from "app/contexts/auth/context";
import axios from "utils/axios";

export default function UserDashboard() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { user } = useAuthContext();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("/api/users/userinfo/");
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

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

  // Get user display name and avatar
  const displayName = userData?.user?.username || user?.username || "User";
  const avatarSrc = userData?.profile_picture || "/images/avatar/avatar-20.jpg";

  if (loading) {
    return (
      <Page title="Dashboard">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block size-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Dashboard">
      <div className="wallet-mobile-page min-h-screen bg-white pb-20 md:pb-0">
        {/* Mobile Wallet Header */}
        <MobileWalletHeader
          username={displayName}
          avatarSrc={avatarSrc}
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

        {/* Bottom Navigation - Mobile Only */}
        <BottomNavigation />
      </div>
    </Page>
  );
}
