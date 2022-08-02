import { useEffect, useState } from "react";
import { AnalyticsBrowser } from "@segment/analytics-next";
import { useLocation } from "react-router-dom";
import { NETWORK_NAME, CURRENT_PROVIDER_LOCALSTORAGE_KEY, hasUserConsented } from "./Helpers";
import { useWeb3React } from "@web3-react/core";

const writeKey = process.env.REACT_APP_SEGMENT_WRITE_KEY;

const IGNORE_IP_CONTEXT = {
  context: {
    ip: 0,
  },
};

export const useAnalytics = () => {
  const { account } = useWeb3React();
  const location = useLocation();
  const [analytics, setAnalytics] = useState(undefined);

  const trackAction = (actionName, traits) => {
    const hasConsented = hasUserConsented();
    const pageTitle = document.title;
    const currentPageContext = { path: location.pathname, title: pageTitle };
    if (hasConsented) {
      analytics?.track(actionName, { ...traits, ...currentPageContext });
    } else {
      analytics?.track(actionName, {
        ...IGNORE_IP_CONTEXT,
        ...traits,
        ...currentPageContext,
      });
    }
  };

  const trackPageWithTraits = (traits) => {
    const hasConsented = hasUserConsented();
    const urlParams = getUrlParameters(location.search);
    if (hasConsented) {
      analytics?.page({ ...traits, ...urlParams });
    } else {
      analytics?.page({
        ...IGNORE_IP_CONTEXT,
        ...traits,
        ...urlParams,
      });
    }
  };

  const trackLogin = (chainId, gmxBalances, userBalances) => {
    const hasConsented = hasUserConsented();
    try {
      const provider = localStorage.getItem(CURRENT_PROVIDER_LOCALSTORAGE_KEY);
      const traits = {
        walletProvider: provider,
        walletAddress: account,
        network: NETWORK_NAME[chainId] ?? `Unsupported (${chainId})`,
        ...userBalances,
        ...gmxBalances,
      };
      if (account && hasConsented) {
        analytics?.track("User logged in", {
          ...traits,
        });
      } else {
        analytics?.track("User logged in", {
          ...IGNORE_IP_CONTEXT,
          ...traits,
        });
      }
    } catch (err) {
      console.error("Failed to send Login action to Segment", err);
    }
  };

  const getUrlParameters = (searchString) => {
    const queryString = searchString;
    const urlParams = new URLSearchParams(queryString);
    const keys = urlParams.keys();
    const params = {};
    for (const key of keys) params[key] = urlParams.get(key);
    return params;
  };

  // Identify call
  useEffect(() => {
    const wasPreviouslyIdentified = window.localStorage.getItem("analyticsIdentified");
    try {
      if (account) {
        // Prevent repeated Identify and Alias calls
        if (!wasPreviouslyIdentified || wasPreviouslyIdentified !== "true") {
          analytics?.alias(account); // Alias previous anonymousId to wallet address
          analytics?.identify(account, {
            walletAddress: account,
          });
          window.localStorage.setItem("analyticsIdentified", "true");
        }
      }
    } catch (err) {
      console.error("Failed to send Identify action to Segment", err);
    }
  }, [analytics, account]);

  // Page call
  useEffect(() => {
    const customTrackPages = ["/trade", "/buy_tlp", "/rewards"];

    if (!customTrackPages.includes(location.pathname)) {
      const hasConsented = hasUserConsented();
      const urlParams = getUrlParameters(location.search);
      const windowTraits = {
        screenHeight: window.innerHeight || "unknown",
        screenWidth: window.innerWidth || "unknown",
        screenDensity: window.devicePixelRatio || "unknown",
      };
      if (hasConsented) {
        analytics?.page({ ...windowTraits, ...urlParams });
      } else {
        analytics?.page({
          ...IGNORE_IP_CONTEXT,
          ...windowTraits,
          ...urlParams,
        });
      }
    }
  }, [analytics, location.pathname, location.search]);

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
    trackAction,
  };
};
