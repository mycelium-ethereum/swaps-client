import React, { createContext, useEffect, useState } from "react";
import { Analytics, AnalyticsBrowser } from "@segment/analytics-next";
import { useLocation } from "react-router-dom";
import { ARBITRUM, ARBITRUM_TESTNET, AVALANCHE, hasConsented } from "./Helpers";
import { useWeb3React } from "@web3-react/core";

const writeKey = process.env.REACT_APP_SEGMENT_WRITE_KEY;

// Helper functions
// const convertBNToFloat = (bn: BigNumber) => {
//   return parseFloat(BigNumber.max(bn).toString());
// };

const networkName = {
  [ARBITRUM]: "Arbitrum",
  [ARBITRUM_TESTNET]: "Arbitrum Testnet",
  [AVALANCHE]: "Avalanche",
};

const useValues = () => {
  const { account } = useWeb3React();
  const location = useLocation();
  const [analytics, setAnalytics] = useState(undefined);

  // const trackStakeAction = (
  //   stakeAction: StakeActionEnum,
  //   tokenName: string,
  //   amount: string,
  //   amountUSD: string,
  //   balance: BigNumber,
  //   isPreCommit: boolean
  // ) => {
  //   const actionStage = isPreCommit ? "preCommitStake" : "postCommitStake";

  //   try {
  //     const balanceAsFloat = convertBNToFloat(balance);
  //     const balanceAttr = isPreCommit ? { preCommitBalance: balanceAsFloat } : { postCommitBalance: balanceAsFloat };

  //     account &&
  //       analytics?.track(actionStage, {
  //         action: stakeAction,
  //         amount: amount,
  //         amountUSD: amountUSD,
  //         ...balanceAttr,
  //         network: networkName,
  //         tokenName: tokenName,
  //         version: POOLS_VERSION,
  //         walletAddress: account,
  //       });
  //   } catch (err) {
  //     console.error("Failed to send Stake action to Segment", err);
  //   }
  // };

  const trackLogin = (chainId, balance) => {
    try {
      account &&
        analytics?.track(account, {
          walletAddress: account,
          network: networkName[chainId],
          balance: balance,
        });
    } catch (err) {
      console.error("Failed to send Login action to Segment", err);
    }
  };

  // Identify
  useEffect(() => {
    try {
      account &&
        analytics?.identify(account, {
          walletAddress: account,
        });
    } catch (err) {
      console.error("Failed to send Identify action to Segment", err);
    }
  }, [analytics, account]);

  // Page
  useEffect(() => {
    analytics && analytics.page();
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
