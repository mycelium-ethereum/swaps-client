import React, { useState, useMemo, useEffect } from "react";

import useSWR from "swr";
import { useLocation } from "react-router-dom";

import {
  getPageTitle,
  getTokenInfo,
  useChainId,
  useENS,
  fetcher,
  expandDecimals,
  ETH_DECIMALS,
  helperToast,
  useLocalStorageSerializeKey,
  getOffsetRewardRound
} from "../../Helpers";
import { useWeb3React } from "@web3-react/core";
import { callContract } from "../../Api";
import { ethers } from "ethers";
import TraderRewards from "./TraderRewards";
import Leaderboard from "./Leaderboard";
import * as Styles from "./Rewards.styles";

import SEO from "../../components/Common/SEO";
import { getContract } from "../../Addresses";

import FeeDistributor from "../../abis/FeeDistributor.json";
import FeeDistributorReader from "../../abis/FeeDistributorReader.json";
import ViewSwitch from "../../components/ViewSwitch/ViewSwitch";
import { RoundDropdown } from "../../components/RewardsRoundSelect/RewardsRoundSelect";
import { getServerUrl } from "src/lib";

const PersonalHeader = () => (
  <div className="Page-title-section mt-0">
    <div className="Page-title">Trader Rewards</div>
    <div className="Page-description">
      Be in the top 5% of traders to earn weekly rewards.
      <br /> Read the Terms of Use{" "}
      <a href="https://mycelium.xyz/rewards-terms-of-use" target="_blank" rel="noopener noreferrer">
        here
      </a>
      .
    </div>
  </div>
);

const LeaderboardHeader = () => (
  <div className="Page-title-section mt-0">
    <div className="Page-title">Rewards Leaderboard</div>
    <div className="Page-description">User rankings by volume.</div>
  </div>
);

export default function Rewards(props) {
  const location = useLocation();
  const { connectWallet, trackPageWithTraits, trackAction, analytics, setPendingTxns, infoTokens } = props;

  const { chainId } = useChainId();
  const { active, account, library } = useWeb3React();
  const { ensName } = useENS(account);

  const [selectedRound, setSelectedRound] = useLocalStorageSerializeKey([chainId, "Rewards-selected-round"], "latest");

  const [currentView, setCurrentView] = useLocalStorageSerializeKey([chainId, "Rewards-current-view"], "Personal");

  const [pageTracked, setPageTracked] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [nextRewards, setNextRewards] = useState();
  const [claimDelay, setClaimDelay] = useState();

  const feeDistributor = getContract(chainId, "FeeDistributor");
  const feeDistributorReader = getContract(chainId, "FeeDistributorReader");

  // Fetch all round data from server
  const { data: allRoundsRewardsData_, error: failedFetchingRewards } = useSWR(
    [getServerUrl(chainId, "/tradingRewards")],
    {
      fetcher: (...args) => fetch(...args).then((res) => res.json()),
    }
  );

  const allRoundsRewardsData = Array.isArray(allRoundsRewardsData_) ? allRoundsRewardsData_ : undefined;

  // Fetch only the latest round's data from server
  const { data: currentRewardRound, error: failedFetchingRoundRewards } = useSWR(
    [getServerUrl(chainId, "/tradingRewards"), selectedRound],
    {
      fetcher: (url, round) => fetch(`${url}&round=${round}`).then((res) => res.json()),
    }
  );

  const { data: hasClaimed } = useSWR(
    [
      `Rewards:claimed:${active}`,
      chainId,
      feeDistributorReader,
      "getUserClaimed",
      feeDistributor,
      account ?? ethers.constants.AddressZero,
      allRoundsRewardsData?.length ?? 1,
    ],
    {
      fetcher: fetcher(library, FeeDistributorReader),
    }
  );

  // Fetch user proof
  const { data: userProof } = useSWR(
    [getServerUrl(chainId, "/tradingRewardProof"), selectedRound, account ?? ethers.constants.AddressZero],
    {
      fetcher: (url, round, account) => fetch(`${url}&round=${round}&userAddress=${account}`).then((res) => res.json()),
    }
  );

  // Get the data for the current user
  const userData = useMemo(
    () =>
      allRoundsRewardsData?.reduce(
        (totals, round) => {
          const trader = round.rewards?.find((trader) => trader.user_address.toLowerCase() === account?.toLowerCase());
          if (!trader) {
            return totals;
          }
          let unclaimedRewards = totals.unclaimedRewards;
          const userReward = ethers.BigNumber.from(trader.reward).add(trader.degen_reward);
          if (hasClaimed && !hasClaimed[getOffsetRewardRound(round.round)]) {
            unclaimedRewards = unclaimedRewards.add(userReward);
          }
          return {
            totalTradingVolume: totals.totalTradingVolume.add(trader.volume),
            totalRewards: totals.totalRewards.add(userReward),
            unclaimedRewards,
          };
        },
        {
          totalTradingVolume: ethers.BigNumber.from(0),
          totalRewards: ethers.BigNumber.from(0),
          unclaimedRewards: ethers.BigNumber.from(0),
        }
      ),
    [allRoundsRewardsData, hasClaimed, account]
  );

  // Extract round data from full API response
  const [middleRow, setMiddleRow] = useState();
  const roundData = useMemo(() => {
    if (!currentRewardRound || !!currentRewardRound?.message) {
      setMiddleRow(undefined);
      return undefined;
    }
    let hasSetMiddle = false;
    const rewards = currentRewardRound.rewards
      ?.sort((a, b) => b.volume - a.volume)
      .map((trader, index) => {
        const positionReward = ethers.BigNumber.from(trader.reward);
        const degenReward = ethers.BigNumber.from(trader.degen_reward);
        if (!hasSetMiddle && positionReward.eq(0)) {
          hasSetMiddle = true;
          setMiddleRow(index);
        }
        return {
          ...trader,
          totalReward: positionReward.add(degenReward),
          positionReward,
          degenReward,
        };
      }); // Sort traders by highest to lowest in volume
    return {
      ...currentRewardRound,
      rewards,
    };
  }, [currentRewardRound]);

  // Get volume, position and reward from user round data
  const userRoundData = useMemo(() => {
    if (!currentRewardRound) {
      return undefined;
    }
    const leaderBoardIndex = currentRewardRound.rewards?.findIndex(
      (trader) => trader.user_address.toLowerCase() === account?.toLowerCase()
    );
    let traderData;
    if (leaderBoardIndex !== undefined && leaderBoardIndex >= 0) {
      traderData = currentRewardRound.rewards[leaderBoardIndex];
    }
    // trader's data found
    if (traderData) {
      const positionReward = ethers.BigNumber.from(traderData.reward);
      const degenReward = ethers.BigNumber.from(traderData.degen_reward);
      return {
        volume: ethers.BigNumber.from(traderData.volume),
        totalReward: positionReward.add(degenReward),
        position: leaderBoardIndex + 1,
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
  }, [account, currentRewardRound]);

  const eth = getTokenInfo(infoTokens, ethers.constants.AddressZero);
  const ethPrice = eth?.maxPrimaryPrice;

  if (ethPrice && userRoundData?.totalReward) {
    userRoundData.rewardAmountUsd = userRoundData.totalReward?.mul(ethPrice).div(expandDecimals(1, ETH_DECIMALS));
  }

  let unclaimedRewardsUsd, totalRewardAmountUsd;
  if (ethPrice && userData) {
    unclaimedRewardsUsd = userData.unclaimedRewards.mul(ethPrice).div(expandDecimals(1, ETH_DECIMALS));
    totalRewardAmountUsd = userData.totalRewards.mul(ethPrice).div(expandDecimals(1, ETH_DECIMALS));
  }

  let rewardsMessage = "";
  if (!currentRewardRound) {
    rewardsMessage = "Fetching rewards";
  } else if (!!failedFetchingRoundRewards) {
    rewardsMessage = "Failed fetching current round rewards";
  } else if (!!failedFetchingRewards) {
    rewardsMessage = "Failed fetching rewards";
  } else {
    if (currentRewardRound?.length === 0) {
      rewardsMessage = "No rewards";
    } else if (selectedRound === "latest") {
      rewardsMessage = `Round ${Number.parseInt(currentRewardRound.round) + 1}`;
    } else {
      rewardsMessage = `Round ${selectedRound + 1}`;
    }
  }

  const switchView = () => {
    setCurrentView(currentView === "Personal" ? "Leaderboard" : "Personal");
    trackAction &&
      trackAction("Button clicked", {
        buttonName: "Rewards panel",
        view: currentView === "Leaderboard" ? "Rewards" : "Leaderboard",
      });
  };

  useEffect(() => {
    const now = Date.now();
    const buffer = 60 * 60 * 2 * 1000; // 2 hours
    if (currentRewardRound && Number(currentRewardRound.end) + buffer > now) {
      setClaimDelay(true);
    } else {
      setClaimDelay(false);
    }
  }, [currentRewardRound]);

  useEffect(() => {
    if (!!allRoundsRewardsData) {
      const ends = allRoundsRewardsData.map((round) => Number(round.end));
      const max = Math.max(...ends);
      if (!Number.isNaN(max)) {
        setNextRewards(max);
      }
    }
  }, [allRoundsRewardsData]);

  // Segment Analytics Page tracking
  useEffect(() => {
    if (!pageTracked && currentRewardRound && analytics) {
      const traits = {
        round: currentRewardRound.key,
      };
      trackPageWithTraits(traits);
      setPageTracked(true); // Prevent Page function being called twice
    }
  }, [currentRewardRound, pageTracked, trackPageWithTraits, analytics]);

  const handleClaim = () => {
    setIsClaiming(true);
    // helperToast.error("Claiming rewards is currently disabled");
    trackAction("Button clicked", {
      buttonName: "Claim rewards",
    });
    let error;
    if (selectedRound === "latest") {
      helperToast.error("Cannot claim rewards before round has ended");
      error = true;
    }
    if (!userProof) {
      helperToast.error("Fetching merkle proof");
      error = true;
    }
    if (userProof.amount === "0") {
      helperToast.error(`No rewards for round: ${selectedRound + 1}`);
      error = true;
    }
    if (!!userProof?.message) {
      helperToast.error(`Invalid user proof`);
      error = true;
    }
    if (error) {
      setIsClaiming(true);
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
        getOffsetRewardRound(selectedRound)
      ],
      {
        sentMsg: "Claim submitted!",
        failMsg: "Claim failed.",
        successMsg: "Claim completed!",
        setPendingTxns,
      }
    ).finally(() => {
      setIsClaiming(false);
    });
  };

  const isLatestRound = selectedRound === "latest";
  let hasClaimedRound;
  if (selectedRound !== "latest" && hasClaimed) {
    hasClaimedRound = hasClaimed[getOffsetRewardRound(selectedRound)];
  }

  useEffect(() => {
    const hash = location.hash;
    if (hash === "#leaderboard") {
      setCurrentView("Leaderboard");
    }
  }, [location.hash, setCurrentView]);

  return (
    <>
      <SEO
        title={getPageTitle("Rewards")}
        description="Claim fees earned via being in the top 5% of traders on Mycelium Perpetual Swaps."
      />
      <Styles.StyledRewardsPage className="default-container page-layout">
        {
          {
            Personal: <PersonalHeader />,
            Leaderboard: <LeaderboardHeader />,
          }[currentView]
        }
        <ViewSwitch switchView={switchView} currentView={currentView} views={["Personal", "Leaderboard"]}>
          {currentView === "Leaderboard" && !!allRoundsRewardsData ? (
            <RoundDropdown
              allRoundsRewardsData={allRoundsRewardsData}
              setSelectedRound={setSelectedRound}
              rewardsMessage={rewardsMessage}
            />
          ) : null}
        </ViewSwitch>
        <TraderRewards
          active={active}
          account={account}
          ensName={ensName}
          userData={userData}
          totalRewardAmountUsd={totalRewardAmountUsd}
          unclaimedRewardsUsd={unclaimedRewardsUsd}
          rewardsMessage={rewardsMessage}
          allRoundsRewardsData={allRoundsRewardsData}
          setSelectedRound={setSelectedRound}
          connectWallet={connectWallet}
          userRoundData={userRoundData}
          currentView={currentView}
          trackAction={trackAction}
          nextRewards={nextRewards}
          latestRound={isLatestRound}
          handleClaim={handleClaim}
          claimDelay={claimDelay}
          isClaiming={isClaiming}
          hasClaimed={hasClaimedRound}
        />
        <Leaderboard
          roundData={roundData}
          middleRow={middleRow}
          userRoundData={userRoundData}
          userAccount={account}
          ensName={ensName}
          currentView={currentView}
          selectedRound={selectedRound}
          connectWallet={connectWallet}
          trackAction={trackAction}
          handleClaim={handleClaim}
          claimDelay={claimDelay}
          latestRound={isLatestRound}
          isClaiming={isClaiming}
          hasClaimed={hasClaimedRound}
        />
      </Styles.StyledRewardsPage>
    </>
  );
}
