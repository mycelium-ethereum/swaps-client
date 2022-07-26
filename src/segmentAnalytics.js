import React, { createContext, useEffect, useState } from "react";
import { AnalyticsBrowser } from "@segment/analytics-next";
import { useLocation } from "react-router-dom";
import { ARBITRUM, ARBITRUM_TESTNET, AVALANCHE, hasConsented } from "./Helpers";
import { useWeb3React } from "@web3-react/core";
import { CURRENT_PROVIDER_LOCALSTORAGE_KEY } from "./Helpers";

const writeKey = process.env.REACT_APP_SEGMENT_WRITE_KEY;

const networkName = {
  [ARBITRUM]: "Arbitrum",
  [ARBITRUM_TESTNET]: "Rinkeby",
  [AVALANCHE]: "Avalanche",
};

const useValues = () => {
  const { account } = useWeb3React();
  const location = useLocation();
  const [analytics, setAnalytics] = useState(undefined);

  const trackLogin = (chainId, gmxBalances, ethBalance) => {
    try {
      if (account && hasConsented()) {
        const provider = localStorage.getItem(CURRENT_PROVIDER_LOCALSTORAGE_KEY);
        analytics?.track("userLoggedIn", {
          walletProvider: provider,
          walletAddress: account,
          network: networkName[chainId],
          ethBalance: ethBalance,
          gmxBalances: gmxBalances,
        });
      }
    } catch (err) {
      console.error("Failed to send Login action to Segment", err);
    }
  };

  // Identify call
  useEffect(() => {
    try {
      if (account && hasConsented()) {
        analytics?.identify(account, {
          walletAddress: account,
        });
      }
    } catch (err) {
      console.error("Failed to send Identify action to Segment", err);
    }
  }, [analytics, account]);

  // Page call
  useEffect(() => {
    analytics?.page();
  }, [analytics, location.pathname]);

  useEffect(() => {
    if (!writeKey) {
      console.warn("Segment.io write key not set");
    } else {
      const loadAnalytics = async () => {
        const [response] = await AnalyticsBrowser.load({ writeKey });
        setAnalytics(response);
      };
      loadAnalytics();
    }
  }, []);

  return {
    trackLogin,
  };
};

export const AnalyticsContext = createContext({});

export const AnalyticsProvider = ({ children }) => {
  return <AnalyticsContext.Provider value={useValues()}>{children}</AnalyticsContext.Provider>;
};
