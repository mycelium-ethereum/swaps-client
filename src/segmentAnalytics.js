import { useEffect, useState } from "react";
import { AnalyticsBrowser } from "@segment/analytics-next";
import { useLocation } from "react-router-dom";
import { NETWORK_NAME, CURRENT_PROVIDER_LOCALSTORAGE_KEY, hasUserConsented } from "./Helpers";
import { useWeb3React } from "@web3-react/core";
import platform from "platform";

const writeKey = process.env.REACT_APP_SEGMENT_WRITE_KEY;
const customTrackPages = ["/trade", "/buy_tlp", "/rewards"];

const IGNORE_IP_CONTEXT = {
  context: {
    ip: 0,
  },
};

const saveAccountToLocalStorage = (address) => {
  const prevIdentifiedAccounts = window.localStorage.getItem("analyticsIdentifiedAddresses");
  if (!prevIdentifiedAccounts) {
    // Create new localStorage variable to store imported accounts
    localStorage.setItem("analyticsIdentifiedAddresses", JSON.stringify([address]));
  } else {
    const parsedAccounts = JSON.parse(prevIdentifiedAccounts);
    if (!parsedAccounts.includes(address)) {
      parsedAccounts.push(address);
    }
    localStorage.setItem("analyticsIdentifiedAddresses", JSON.stringify(parsedAccounts));
  }
};

const getPreviousAccounts = () => {
  const prevIdentifiedAccounts = window.localStorage.getItem("analyticsIdentifiedAddresses");
  if (prevIdentifiedAccounts) {
    return JSON.parse(prevIdentifiedAccounts);
  } else {
    return [];
  }
};

export const setCurrentAccount = (account) => {
  window.localStorage.setItem("walletAddress", account);
};

const hasBeenIdentified = (account) => {
  const prevIdentifiedAddresses = window.localStorage.getItem("analyticsIdentifiedAddresses");
  const formattedAddresses = JSON.parse(prevIdentifiedAddresses) || [];
  return Boolean(formattedAddresses.includes(account));
};

export const hasChangedAccount = (account) => {
  const prevAccount = window.localStorage.getItem("walletAddress");
  return Boolean(prevAccount && prevAccount !== account);
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
    if (account) {
      try {
        // Prevent repeated Identify calls
        const accountIdentified = hasBeenIdentified(account);
        const accountChanged = hasChangedAccount(account);
        const prevAccounts = getPreviousAccounts();

        if (
          (prevAccounts && prevAccounts.length === 0) ||
          !prevAccounts.includes(account) ||
          (!accountIdentified && accountChanged)
        ) {
          const os = { name: platform.description, version: platform.version };
          analytics?.identify(account, {
            walletAddress: account,
            context: { os },
          });
          setCurrentAccount(account);
          saveAccountToLocalStorage(account);
        }
      } catch (err) {
        console.error("Failed to send Identify action to Segment", err);
      }
    }
  }, [analytics, account]);

  // Page call
  useEffect(() => {
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
