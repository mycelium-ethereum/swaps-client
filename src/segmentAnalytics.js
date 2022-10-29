import { useEffect, useState } from "react";
import { AnalyticsBrowser } from "@segment/analytics-next";
import { useLocation } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";
import platform from "platform";
import ReactGA from "react-ga4";
import { NETWORK_NAME, hasUserConsented } from "./Helpers";
import {
  getPreviousAccounts,
  saveAccountToLocalStorage,
  setCurrentAccount,
  hasBeenIdentified,
  hasChangedAccount,
  getUrlParameters,
  getWindowFeatures,
} from "./Helpers";
import { CURRENT_PROVIDER_LOCALSTORAGE_KEY } from "./config/localstorage";

const writeKey = process.env.REACT_APP_SEGMENT_WRITE_KEY;
const GA_ID = process.env.REACT_APP_GA_TRACKING_ID;
const customTrackPages = ["/", "/buy_mlp", "/rewards"]; //These pages are tracked through trackPageWithTraits() separately

const IGNORE_IP_CONTEXT = {
  context: {
    ip: 0,
  },
};

export const useAnalytics = () => {
  if (GA_ID) {
    ReactGA.initialize(GA_ID);
  }
  const { account } = useWeb3React();
  const location = useLocation();
  const [analytics, setAnalytics] = useState(undefined);

  const trackAction = (actionName, traits) => {
    const hasConsented = hasUserConsented();
    const pageTitle = document.title;
    const currentPageContext = { path: location.pathname, title: pageTitle };
    try {
      if (hasConsented) {
        analytics?.track(actionName, { ...traits, ...currentPageContext });
      } else {
        analytics?.track(actionName, {
          ...IGNORE_IP_CONTEXT,
          ...traits,
          ...currentPageContext,
        });
      }
      ReactGA.event({
        category: actionName,
        action: JSON.stringify(traits),
      });
    } catch (err) {
      console.error(`Failed to send custom ${actionName} Track action to Segment`, err);
    }
  };

  const trackPageWithTraits = (traits) => {
    const hasConsented = hasUserConsented();
    const urlParams = getUrlParameters(location.search);
    const windowTraits = getWindowFeatures();

    try {
      const os = { name: platform.description, version: platform.version };
      if (hasConsented) {
        analytics?.page({ ...traits, ...windowTraits, ...urlParams, context: { os } });
      } else {
        analytics?.page({
          ...IGNORE_IP_CONTEXT,
          ...traits,
          ...windowTraits,
          ...urlParams,
          context: { os },
        });
      }
    } catch (err) {
      console.error("Failed to send Page with traits call to Segment", err);
    }
  };

  const trackLogin = (chainId, mycBalances, userBalances) => {
    const hasConsented = hasUserConsented();
    try {
      const provider = localStorage.getItem(CURRENT_PROVIDER_LOCALSTORAGE_KEY);
      const traits = {
        walletProvider: provider,
        walletAddress: account,
        network: NETWORK_NAME[chainId] ?? `Unsupported (${chainId})`,
        ...userBalances,
        ...mycBalances,
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

  // Identify call
  useEffect(() => {
    if (account && analytics) {
      try {
        // Prevent repeated Identify calls
        const accountIdentified = hasBeenIdentified(account);
        const accountChanged = hasChangedAccount(account);
        const prevAccounts = getPreviousAccounts();
        const anonId = analytics.user().anonymousId();

        if (
          (prevAccounts && prevAccounts.length === 0) ||
          !prevAccounts.includes(account) ||
          (!accountIdentified && accountChanged)
        ) {
          analytics.identify(anonId, {
            userId: anonId,
            walletAddress: account,
          });
          setCurrentAccount(account);
          saveAccountToLocalStorage(account);
        }
      } catch (err) {
        console.error("Failed to send Identify call to Segment", err);
      }
    }
  }, [analytics, account]);

  // Page call
  useEffect(() => {
    try {
      if (!customTrackPages.includes(location.pathname)) {
        const hasConsented = hasUserConsented();
        const urlParams = getUrlParameters(location.search);
        const windowTraits = getWindowFeatures();
        // GA pageview
        ReactGA.send("pageview");

        // Segment pageview
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
    } catch (err) {
      console.error("Failed to send Page call to Segment", err);
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
    analytics,
    trackLogin,
    trackPageWithTraits,
    trackAction,
  };
};
