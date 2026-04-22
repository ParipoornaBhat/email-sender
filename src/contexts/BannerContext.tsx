"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface BannerContextType {
  isBannerVisible: boolean;
  setIsBannerVisible: (visible: boolean) => void;
  bannerHeight: number;
  setBannerHeight: (height: number) => void;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export const BannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [bannerHeight, setBannerHeight] = useState(0);

  return (
    <BannerContext.Provider
      value={{ isBannerVisible, setIsBannerVisible, bannerHeight, setBannerHeight }}
    >
      {children}
    </BannerContext.Provider>
  );
};

export const useBannerContext = () => {
  const context = useContext(BannerContext);
  if (context === undefined) {
    throw new Error("useBannerContext must be used within a BannerProvider");
  }
  return context;
};
