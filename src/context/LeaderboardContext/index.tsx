import React, { useState, useMemo, useEffect, createContext, useCallback } from "react";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import useSWR from "swr";
import { CurrentRewards, RewardsEntity } from "src/types/rewards";
import { getServerUrl } from "../../lib";
import { bigNumberify, useChainId } from "../../Helpers";

const useValues = () => {
  const { chainId } = useChainId();
  const { account } = useWeb3React();
  const { data: currentRewardRound, error: failedFetchingRoundRewards } = useSWR(
    [getServerUrl(chainId, "/tradingRewards"), "latest"],
    {
      fetcher: (url, round) => fetch(`${url}&round=${round}`).then((res) => res.json()),
    }
  );

  const [leaderboardData, setLeaderboardData] = useState<RewardsEntity[] | undefined>(undefined);


  // Get volume, position and reward from user round data
  const { userPosition, rewardIndicator } = useMemo(() => {
    if (!leaderboardData) {
      return ({
        userPosition: undefined,
        rewardIndicator: undefined
      })
    }
    const accountLower = account?.toLowerCase();
    const leaderBoardIndex = leaderboardData?.findIndex(
      (trader: RewardsEntity) => trader.user_address.toLowerCase() === accountLower
    );

    const lastRewardsIndex = leaderboardData?.findIndex(
      (trader: RewardsEntity) => bigNumberify(trader.reward).add(trader.degen_reward).eq(0)
    );

    return ({
      userPosition: leaderBoardIndex ? leaderBoardIndex + 1: undefined,
      rewardIndicator: lastRewardsIndex && lastRewardsIndex > 0 ? lastRewardsIndex - 1 : 0
    })
  }, [account, leaderboardData]);

  // testing functions
  // const moveUser = useCallback((up: boolean, toExtreme: boolean) => {
    // if (!leaderboardData) {
      // return undefined
    // }
    // const _leaderboardData: any[] = [...leaderboardData];
    // const accountLower = account?.toLowerCase()
    // const userIndex: any = _leaderboardData.findIndex(
      // (trader: any) => trader?.user_address?.toLowerCase() === accountLower
    // );
    // if (userIndex === undefined) { 
      // return undefined
    // }
    // const user = _leaderboardData[userIndex]
    // const ONE = expandDecimals(1, 30)
    // if (toExtreme) {
      // if (up) {
        // const topUser = leaderboardData[0];
        // user.volume = bigNumberify(topUser.volume).add(ONE).toString()
      // } else {
        // const bottomUser = leaderboardData[leaderboardData.length - 1];
        // user.volume = bigNumberify(bottomUser.volume).sub(ONE).toString()
      // }
    // } else {
      // if (up) {
        // const aboveUser = _leaderboardData[userIndex - 1];
        // user.volume = bigNumberify(aboveUser.volume).add(ONE).toString()
      // } else {
        // const belowUser = _leaderboardData[userIndex + 1];
        // user.volume = bigNumberify(belowUser.volume).sub(ONE).toString()
      // }
    // }

    // const sortedLeaderboard = _leaderboardData.sort((a, b) => parseInt(b.volume) - parseInt(a.volume));
    // setLeaderboardData(sortedLeaderboard)
  // }, [leaderboardData, account])

  useEffect(() => {
    if (!currentRewardRound || !!currentRewardRound?.message) {
      return undefined;
    }

    const accountLower = account?.toLowerCase();
    const currentUserLeaderboard = leaderboardData?.find((trader) => trader.user_address.toLowerCase() === accountLower)

    const traders = (currentRewardRound as CurrentRewards).rewards
      ?.map((trader_) => {
        const positionReward = ethers.BigNumber.from(trader_.reward);
        const degenReward = ethers.BigNumber.from(trader_.degen_reward);

        const trader = {
          ...trader_,
          totalReward: positionReward.add(degenReward),
          positionReward,
          degenReward,
        };

        if (trader.user_address.toLowerCase() === accountLower && currentUserLeaderboard) {
          trader.volume = currentUserLeaderboard.volume;
        }
        return trader;
      })?.sort((a, b) => parseInt(b.volume) - parseInt(a.volume)) // Sort traders by highest to lowest in volume

    setLeaderboardData(traders);
  }, [currentRewardRound]);

  const updateLeaderboardOptimistically = useCallback((volumeToAdd: string) => {
    if (!leaderboardData) {
      return;
    }
    const _leaderboardData: any[] = [...leaderboardData];
    const accountLower = account?.toLowerCase()
    const currentUser: any = _leaderboardData.find(
      (trader: any) => trader?.user_address?.toLowerCase() === accountLower
    );
    // If user exists, update volume
    if (currentUser) {
      currentUser.volume = ethers.BigNumber.from(currentUser.volume).add(ethers.BigNumber.from(volumeToAdd).toString());
    } else { // Otherwise insert at the end and then sort by volume
      const userItem = {
        user_address: account,
        volume: volumeToAdd,
        reward: 0,
        degen_reward: 0,
      };
      _leaderboardData.push(userItem);
    }
    const sortedLeaderboard = _leaderboardData.sort((a, b) => parseInt(b.volume) - parseInt(a.volume));
    setLeaderboardData(sortedLeaderboard);
  }, [leaderboardData, account]);

  return { updateLeaderboardOptimistically, leaderboardData, userPosition, rewardIndicator, failedFetchingRoundRewards };
};

export const LeaderboardContext = createContext({} as ReturnType<typeof useValues>);

interface LeaderboardProviderProps {
  children: React.ReactNode;
}

export const LeaderboardProvider: React.FC<LeaderboardProviderProps> = ({ children }) => {
  return <LeaderboardContext.Provider value={useValues()}>{children}</LeaderboardContext.Provider>;
};
