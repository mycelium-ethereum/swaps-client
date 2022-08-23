import React, { useState, useMemo, useEffect, useRef } from "react";

import useSWR from "swr";

import { getTracerServerUrl, getPageTitle, getTokenInfo, useChainId, useENS, fetcher, expandDecimals, ETH_DECIMALS, helperToast } from "../../Helpers";
import { useWeb3React } from "@web3-react/core";
import { callContract, useInfoTokens } from "../../Api";
import { ethers } from "ethers";
import TraderRewards from "./TraderRewards";
import Leaderboard from "./Leaderboard";
import * as Styles from "./Rewards.styles";
import { LeaderboardSwitch } from "./ViewSwitch";

import SEO from "../../components/Common/SEO";
import { getContract } from "../../Addresses";

import FeeDistributor from "../../abis/FeeDistributor.json";
import FeeDistributorReader from "../../abis/FeeDistributorReader.json";

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
  const { connectWallet, trackPageWithTraits, trackAction, analytics, setPendingTxns } = props;
  const [currentView, setCurrentView] = useState("Personal");

  const { chainId } = useChainId();
  const { active, account, library } = useWeb3React();
  const { ensName } = useENS(account);

  const [selectedWeek, setSelectedWeek] = useState("latest");
  const [pageTracked, setPageTracked] = useState(false);
  const [nextRewards, setNextRewards] = useState(undefined);
  const [isClaiming, setIsClaiming] = useState(false);

  const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);

  const feeDistributor = getContract(chainId, "FeeDistributor");
  const feeDistributorReader = getContract(chainId, "FeeDistributorReader");

  // Fetch all week data from server
  const { data: allWeeksRewardsData, error: failedFetchingRewards } = useSWR([getTracerServerUrl(chainId, "/rewards")], {
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
  });

  // Fetch only the latest week's data from server
  const { data: currentRewardWeek, error: failedFetchingWeekRewards } = useSWR(
    [getTracerServerUrl(chainId, "/rewards"), selectedWeek],
    {
      fetcher: (url, week) => fetch(`${url}&week=${week}`).then((res) => res.json()),
    }
  );

  const { data: hasClaimed } = useSWR(
    [`Rewards:claimed:${active}`, chainId, feeDistributorReader, "getUserClaimed", feeDistributor, account, allWeeksRewardsData?.length ?? 1],
    {
      fetcher: fetcher(library, FeeDistributorReader),
    }
  );

  // Fetch user proof
  const { data: userProof } = useSWR(
    [getTracerServerUrl(chainId, "/userRewardProof"), selectedWeek, account],
    {
      fetcher: (url, week, account) => fetch(`${url}&week=${week}&userAddress=${account}`).then((res) => res.json()),
    }
  );

  // Get the data for the current user
  const userData = useMemo(
    () =>
      allWeeksRewardsData?.reduce(
        (totals, week) => {
          const trader = week.traders?.find((trader) => trader.user_address === account);
          if (!trader) {
            return totals;
          }
          let unclaimedRewards = totals.unclaimedRewards;
          const userReward = ethers.BigNumber.from(trader.reward).add(trader.degen_reward);
          if (hasClaimed && hasClaimed[week]) {
            unclaimedRewards = unclaimedRewards.add(userReward);
          }
          return {
            totalTradingVolume: totals.totalTradingVolume.add(trader.volume),
            totalRewards: totals.totalRewards.add(userReward),
            unclaimedRewards
          };
        },
        {
          totalTradingVolume: ethers.BigNumber.from(0),
          totalRewards: ethers.BigNumber.from(0),
          unclaimedRewards: ethers.BigNumber.from(0),
        }
      ),
    [allWeeksRewardsData, hasClaimed, account]
  );

  // Extract week data from full API response
  let middleRow = useRef(null);
  const weekData = useMemo(() => {
    if (!currentRewardWeek || !!currentRewardWeek?.message) {
      middleRow.current = null;
      return undefined;
    }
    if (!currentRewardWeek) {
      middleRow.current = null;
      return undefined;
    }
    const traders = currentRewardWeek.traders?.sort((a, b) => b.volume - a.volume).map((trader, index) => {
      const positionReward = ethers.BigNumber.from(trader.reward);
      const degenReward = ethers.BigNumber.from(trader.degen_reward);
      if (middleRow.current === null && positionReward.eq(0)) {
        middleRow.current = index;
      }
      return ({
        ...trader,
        totalReward: positionReward.add(degenReward),
        positionReward,
        degenReward,
      })
    }); // Sort traders by highest to lowest in volume
    return {
      ...currentRewardWeek,
      traders
    } 
  }, [currentRewardWeek]);

  // Get volume, position and reward from user week data
  const userWeekData = useMemo(() => {
    if (!currentRewardWeek) {
      return undefined;
    }
    const leaderboardPosition = currentRewardWeek.traders?.findIndex((trader) => trader.user_address.toLowerCase() === account?.toLowerCase());
    let traderData
    if (leaderboardPosition && leaderboardPosition >= 0) {
      traderData = currentRewardWeek.traders[leaderboardPosition];
    }
    // trader's data found
    if (traderData) {
      traderData.position = leaderboardPosition;
      const positionReward = ethers.BigNumber.from(traderData.reward);
      const degenReward = ethers.BigNumber.from(traderData.degen_reward);
      return {
        volume: ethers.BigNumber.from(traderData.volume),
        totalReward: positionReward.add(degenReward),
        position: leaderboardPosition,
        positionReward,
        degenReward,
      };
    } else {
      // trader not found but data exists so user has no rewards
      return {
        volume: ethers.BigNumber.from(0),
        totalReward: ethers.BigNumber.from(0),
        positionReward: ethers.BigNumber.from(0),
        degenReward: ethers.BigNumber.from(0),
        rewardAmountUsd: ethers.BigNumber.from(0),
      };
    }
  }, [account, currentRewardWeek]);

  const eth = getTokenInfo(infoTokens, ethers.constants.AddressZero);
  const ethPrice = eth?.maxPrimaryPrice;

  if (ethPrice && userWeekData?.totalReward) {
    userWeekData.rewardAmountUsd = userWeekData.totalReward?.mul(ethPrice).div(expandDecimals(1, ETH_DECIMALS));
  }

  let unclaimedRewardsUsd, totalRewardAmountUsd;
  if (ethPrice && userData) {
    unclaimedRewardsUsd = userData.totalRewards.mul(ethPrice).div(expandDecimals(1, ETH_DECIMALS));
    totalRewardAmountUsd = userData.totalRewards.mul(ethPrice).div(expandDecimals(1, ETH_DECIMALS));
  }

  let rewardsMessage = "";
  if (!currentRewardWeek) {
    rewardsMessage = "Fetching rewards";
  } else if (!!failedFetchingWeekRewards) {
    rewardsMessage = "Failed fetching current week rewards";
  } else if (!!failedFetchingRewards) {
    rewardsMessage = "Failed fetching rewards";
  } else {
    if (currentRewardWeek?.length === 0) {
      rewardsMessage = "No rewards";
    } else if (selectedWeek === "latest") {
      rewardsMessage = `Week ${Number.parseInt(currentRewardWeek.week) + 1}`;
    } else {
      rewardsMessage = `Week ${selectedWeek + 1}`;
    }
  }

  const switchView = () => {
    setCurrentView(currentView === "Personal" ? "Leaderboard" : "Personal");
  };

  useEffect(() => {
    if (!!currentRewardWeek && nextRewards === undefined) {
      // this will load latest first and set next rewards
      setNextRewards(currentRewardWeek.end);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRewardWeek]);

  // Segment Analytics Page tracking
  useEffect(() => {
    if (!pageTracked && currentRewardWeek && analytics) {
      const traits = {
        week: currentRewardWeek.key,
      };
      trackPageWithTraits(traits);
      setPageTracked(true); // Prevent Page function being called twice
    }
  }, [currentRewardWeek, pageTracked, trackPageWithTraits, analytics]);

  const handleClaim = () => {
    setIsClaiming(true);
    // helperToast.error("Claiming rewards is currently disabled");
    trackAction("Button clicked", {
      buttonName: "Claim rewards",
    });
    if (selectedWeek === 'latest') {
      helperToast.error("Cannot claim rewards before week has ended");
      return;
    }
    if (!userProof) {
      helperToast.error("Fetching merkle proof");
      return;
    }
    if (userProof.amount === '0') {
      helperToast.error(`No rewards for week: ${selectedWeek}`);
      return;
    }
    if (!!userProof?.message) {
      helperToast.error(`Invalid user proof`);
      return;
    }
    const contract = new ethers.Contract(feeDistributor, FeeDistributor.abi, library.getSigner());
    callContract(
      chainId,
      contract,
      "withdraw",
      [
        userProof.merkleProof, // proof
        userProof.amount, // amount
        selectedWeek // week
      ],
      {
        sentMsg: "Claim submitted!",
        failMsg: "Claim failed.",
        successMsg: "Claim completed!",
        setPendingTxns,
      }
    )
      .finally(() => {
        setIsClaiming(false);
      });
  }

  const isLatestWeek = selectedWeek === "latest";
  const hasClaimedWeek = selectedWeek !== 'latest' && hasClaimed && hasClaimed[selectedWeek]

  return (
    <>
      <SEO
        title={getPageTitle("Rewards")}
        description="Claim fees earned via being in the top 50% of traders on Mycelium Perpetual Swaps."
      />
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
          allWeeksRewardsData={allWeeksRewardsData}
          setSelectedWeek={setSelectedWeek}
          trackAction={trackAction}
        />
        <TraderRewards
          active={active}
          account={account}
          ensName={ensName}
          userData={userData}
          totalRewardAmountUsd={totalRewardAmountUsd}
          unclaimedRewardsUsd={unclaimedRewardsUsd}
          rewardsMessage={rewardsMessage}
          allWeeksRewardsData={allWeeksRewardsData}
          setSelectedWeek={setSelectedWeek}
          connectWallet={connectWallet}
          userWeekData={userWeekData}
          currentView={currentView}
          trackAction={trackAction}
          nextRewards={nextRewards}
          latestWeek={isLatestWeek}
          handleClaim={handleClaim}
          isClaiming={isClaiming}
          hasClaimed={hasClaimedWeek}
        />
        <Leaderboard
          weekData={weekData}
          middleRow={middleRow.current}
          userWeekData={userWeekData}
          userAccount={account}
          ensName={ensName}
          currentView={currentView}
          selectedWeek={selectedWeek}
          connectWallet={connectWallet}
          trackAction={trackAction}
          handleClaim={handleClaim}
          latestWeek={isLatestWeek}
          isClaiming={isClaiming}
          hasClaimed={hasClaimedWeek}
        />
      </Styles.StyledRewardsPage>
    </>
  );
}
