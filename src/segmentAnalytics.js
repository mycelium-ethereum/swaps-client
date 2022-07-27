import React, { createContext, useEffect, useState } from "react";
import { AnalyticsBrowser } from "@segment/analytics-next";
import { useLocation } from "react-router-dom";
import { ARBITRUM, ARBITRUM_TESTNET, AVALANCHE, CURRENT_PROVIDER_LOCALSTORAGE_KEY, hasUserConsented } from "./Helpers";
import { useWeb3React } from "@web3-react/core";

const writeKey = process.env.REACT_APP_SEGMENT_WRITE_KEY;

const networkName = {
  [ARBITRUM]: "Arbitrum",
  [ARBITRUM_TESTNET]: "Rinkeby",
  [AVALANCHE]: "Avalanche",
};

const IGNORE_IP_CONTEXT = {
  context: {
    ip: 0,
  },
};

const useValues = () => {
  const { account } = useWeb3React();
  const location = useLocation();
  const [analytics, setAnalytics] = useState(undefined);

  const trackPageWithTraits = (traits = {}) => {
    analytics?.page({ ...traits });
  };

  const trackLogin = (chainId, gmxBalances, balanceEth) => {
    const hasConsented = hasUserConsented();
    try {
      const provider = localStorage.getItem(CURRENT_PROVIDER_LOCALSTORAGE_KEY);
      const traits = {
        walletProvider: provider,
        walletAddress: account,
        network: networkName[chainId],
        balanceEth: balanceEth,
        ...gmxBalances,
      };
      if (account && hasConsented) {
        analytics?.track("userLoggedIn", {
          ...traits,
        });
      } else if (account && !hasConsented) {
        analytics?.track("userLoggedIn", {
          ...IGNORE_IP_CONTEXT,
          ...traits,
        });
      }
    } catch (err) {
      console.error("Failed to send Login action to Segment", err);
    }
  };

  // Identify call
  useEffect(() => {
    try {
      if (account) {
        analytics?.alias(account); // Alias previous anonymousId to wallet address
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
    const hasConsented = hasUserConsented();
    const windowTraits = {
      screen: {
        height: window.innerHeight || "unknown",
        width: window.innerWidth || "unknown",
        density: window.devicePixelRatio || "unknown",
      },
    };
    if (hasConsented) {
      analytics?.page({ context: { ...windowTraits } });
    } else if (!hasConsented) {
      analytics?.page({
        context: { ...windowTraits, ip: 0 },
      });
    }
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
    trackPageWithTraits,
  };
};

export const AnalyticsContext = createContext({});

export const AnalyticsProvider = ({ children }) => {
  return <AnalyticsContext.Provider value={useValues()}>{children}</AnalyticsContext.Provider>;
};
