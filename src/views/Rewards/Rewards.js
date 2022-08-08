import React, { useState, useMemo, useEffect } from "react";

import useSWR from "swr";

import { getTokenInfo, useChainId, useENS } from "../../Helpers";
import { useWeb3React } from "@web3-react/core";
import { getTracerServerUrl } from "../../Api/rewards";
import { useInfoTokens } from "../../Api";
import { ethers } from "ethers";
import TraderRewards from "./TraderRewards";
import Leaderboard from "./Leaderboard";
import * as Styles from "./Rewards.styles";
import { LeaderboardSwitch } from "./ViewSwitch";
import Footer from "../../Footer";

const PersonalHeader = () => (
  <div className="Page-title-section mt-0">
    <div className="Page-title">Trader Rewards</div>
    <div className="Page-description">Be in the top 50 % of traders to earn weekly rewards.</div>
  </div>
);

const LeaderboardHeader = () => (
  <div className="Page-title-section mt-0">
    <div className="Page-title">Rewards Leaderboard</div>
    <div className="Page-description">Weekly user rankings by volume.</div>
  </div>
);

export default function Rewards(props) {
  const [currentView, setCurrentView] = useState("Personal");
  const { connectWallet, trackPageWithTraits } = props;

  const { chainId } = useChainId();
  const { active, account, library } = useWeb3React();
  const { ensName } = useENS(account);

  const [selectedWeek, setSelectedWeek] = useState(undefined);

  const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);

  // Fetch all week data from server
  const { data: allWeeksRewardsData, error: failedFetchingRewards } = useSWR(
    [getTracerServerUrl(chainId, "/rewards")],
    {
      fetcher: (...args) => fetch(...args).then((res) => res.json()),
    }
  );

  // Fetch only the latest week's data from server
  const { data: currentRewardWeek, error: failedFetchingWeekRewards } = useSWR(
    [`${getTracerServerUrl(chainId, "/rewards")}&week=latest`],
    {
      fetcher: (...args) => fetch(...args).then((res) => res.json()),
    }
  );

  // If the full data has not been loaded, use current week data
  const weeksRewardsData = useMemo(() => {
    if (allWeeksRewardsData && selectedWeek) {
      return allWeeksRewardsData;
    } else if (currentRewardWeek) {
      return [currentRewardWeek];
    } else {
      return undefined;
    }
  }, [currentRewardWeek, allWeeksRewardsData, selectedWeek]);

  // Get the data for the current user
  const userData = useMemo(
    () =>
      weeksRewardsData?.reduce(
        (totals, week) => {
          const trader = week.traders.find((trader) => trader.user_address === account);
          if (!trader) {
            return totals;
          }
          return {
            totalTradingVolume: totals.totalTradingVolume.add(trader.volume),
            totalRewards: totals.totalRewards.add(trader.reward),
            unclaimedRewards: totals.unclaimedRewards.add(trader?.claimed ? trader.amount : 0),
          };
        },
        {
          totalTradingVolume: ethers.BigNumber.from(0),
          totalRewards: ethers.BigNumber.from(0),
          unclaimedRewards: ethers.BigNumber.from(0),
        }
      ),
    [weeksRewardsData, account]
  );

  // Extract week data from full API response
  const weekData = useMemo(() => {
    if (!weeksRewardsData) {
      return undefined;
    }
    if (!!weeksRewardsData?.message) {
      return undefined;
    }
    const selectedWeekActual = selectedWeek && parseFloat(selectedWeek) - 1;
    const allWeeksRewardsData = weeksRewardsData?.find((week) => week.week === selectedWeekActual?.toString());
    if (!allWeeksRewardsData) {
      return undefined;
    }
    allWeeksRewardsData.traders.sort((a, b) => b.volume - a.volume); // Sort traders by highest to lowest in volume
    return allWeeksRewardsData;
  }, [weeksRewardsData, selectedWeek]);

  // Get volume, position and reward from user week data
  const userWeekData = useMemo(() => {
    if (!weeksRewardsData) {
      return undefined;
    }
    const traderData = weeksRewardsData.traders?.find((trader) => trader.user_address === account);
    const leaderboardPosition = weeksRewardsData.traders?.findIndex((trader) => trader.user_address === account);
    // trader's data found
    if (traderData) {
      traderData.position = leaderboardPosition;
      return traderData;
    } else {
      // trader not found but data exists so user has no rewards
      return {
        volume: ethers.BigNumber.from(0),
        reward: ethers.BigNumber.from(0),
      };
    }
  }, [account, weeksRewardsData]);

  const eth = getTokenInfo(infoTokens, ethers.constants.AddressZero);
  const ethPrice = eth?.maxPrimaryPrice;

  let rewardAmountEth = 0;
  if (ethPrice && userWeekData) {
    rewardAmountEth = ethPrice.mul(userWeekData.reward);
  }

  let unclaimedRewardsEth, totalRewardAmountEth;
  if (ethPrice && userData) {
    unclaimedRewardsEth = ethPrice.mul(userData.unclaimedRewards);
    totalRewardAmountEth = ethPrice.mul(userData.totalRewards);
  }

  if (!currentRewardWeek && selectedWeek !== undefined) {
    setSelectedWeek(undefined);
  } else if (!!currentRewardWeek && selectedWeek === undefined) {
    setSelectedWeek(parseFloat(currentRewardWeek.week) + 1);
  }

  let rewardsMessage = "";
  if (!weeksRewardsData) {
    rewardsMessage = "Fetching rewards";
  } else if (!!failedFetchingWeekRewards) {
    rewardsMessage = "Failed fetching current week rewards";
  } else if (!!failedFetchingRewards) {
    rewardsMessage = "Failed fetching rewards";
  } else {
    if (weeksRewardsData?.length === 0) {
      rewardsMessage = "No rewards for network";
    } else {
      rewardsMessage = `Week ${selectedWeek}`;
    }
  }

  const [pageTracked, setPageTracked] = useState(false);

  const switchView = () => {
    setCurrentView(currentView === "Personal" ? "Leaderboard" : "Personal");
  };

  // Segment Analytics Page tracking
  useEffect(() => {
    if (!pageTracked && weeksRewardsData) {
      const traits = {
        week: weeksRewardsData[weeksRewardsData.length - 1].key,
      };
      trackPageWithTraits(traits);
      setPageTracked(true); // Prevent Page function being called twice
    }
  }, [weeksRewardsData, pageTracked, trackPageWithTraits]);

  return (
    <Styles.StyledRewardsPage className="default-container page-layout">
      {
        {
          Personal: <PersonalHeader />,
          Leaderboard: <LeaderboardHeader />,
        }[currentView]
      }
      <LeaderboardSwitch
        switchView={switchView}
        currentView={currentView}
        rewardsMessage={rewardsMessage}
        weeksRewardsData={weeksRewardsData}
        setSelectedWeek={setSelectedWeek}
      />
      <TraderRewards
        active={active}
        account={account}
        ensName={ensName}
        userData={userData}
        totalRewardAmountEth={totalRewardAmountEth}
        unclaimedRewardsEth={unclaimedRewardsEth}
        rewardsMessage={rewardsMessage}
        weeksRewardsData={weeksRewardsData}
        setSelectedWeek={setSelectedWeek}
        connectWallet={connectWallet}
        userWeekData={userWeekData}
        rewardAmountEth={rewardAmountEth}
        currentView={currentView}
      />
      <Leaderboard
        weekData={weekData}
        userWeekData={userWeekData}
        userAccount={account}
        ensName={ensName}
        currentView={currentView}
        selectedWeek={selectedWeek}
        connectWallet={connectWallet}
      />
      <Footer />
    </Styles.StyledRewardsPage>
  );
}
