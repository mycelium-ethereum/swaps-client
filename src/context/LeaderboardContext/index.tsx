import React, { useState, useMemo, useEffect, createContext } from "react";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import useSWR from "swr";
import { CurrentRewards, RewardsEntity } from "src/types/rewards";
import { getServerUrl } from "../../lib";
import { useChainId } from "../../Helpers";

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
  const userPosition = useMemo(() => {
    if (!leaderboardData) {
      return undefined;
    }
    const leaderBoardIndex = leaderboardData?.findIndex(
      (trader: RewardsEntity) => trader.user_address.toLowerCase() === account?.toLowerCase()
    );

    return leaderBoardIndex + 1;
  }, [account, leaderboardData]);

  useEffect(() => {
    if (!currentRewardRound || !!currentRewardRound?.message) {
      return undefined;
    }
    const traders = (currentRewardRound as CurrentRewards).rewards
      ?.sort((a, b) => parseInt(b.volume) - parseInt(a.volume))
      .map((trader) => {
        const positionReward = ethers.BigNumber.from(trader.reward);
        const degenReward = ethers.BigNumber.from(trader.degen_reward);

        return {
          ...trader,
          totalReward: positionReward.add(degenReward),
          positionReward,
          degenReward,
        };
      }); // Sort traders by highest to lowest in volume
    setLeaderboardData(traders);
  }, [currentRewardRound]);

  const updateLeaderboard = (_leaderboardData: RewardsEntity[]) => {
    return _leaderboardData.sort((a, b) => parseInt(b.volume) - parseInt(a.volume));
  };

  const updateLeaderboardOptimistically = (volumeToAdd: string) => {
    if (!leaderboardData) {
      return;
    }
    const _leaderboardData: any[] = [...leaderboardData];
    const currentUser: any = _leaderboardData.find(
      (trader: any) => trader?.user_address?.toLowerCase() === account?.toLowerCase()
    );
    // If user exists, update volume
    if (currentUser) {
      currentUser.volume = ethers.BigNumber.from(currentUser.volume).add(ethers.BigNumber.from(volumeToAdd).toString());
      const updatedLeaderboard = updateLeaderboard(_leaderboardData);
      setLeaderboardData(updatedLeaderboard);
    }
    // Otherwise insert at the end of the list after users without volume
    else {
      const firstUserIndexWithoutVolume = leaderboardData.findIndex((trader) => trader?.volume === "0");
      const userItem = {
        user_address: account,
        volume: volumeToAdd,
        reward: 0,
        degen_reward: 0,
      };
      _leaderboardData.splice(firstUserIndexWithoutVolume, 0, userItem);
    }
    setLeaderboardData(_leaderboardData);
  };

  return { updateLeaderboardOptimistically, leaderboardData, userPosition, failedFetchingRoundRewards };
};

export const LeaderboardContext = createContext({} as ReturnType<typeof useValues>);

interface LeaderboardProviderProps {
  children: React.ReactNode;
}

export const LeaderboardProvider: React.FC<LeaderboardProviderProps> = ({ children }) => {
  return <LeaderboardContext.Provider value={useValues()}>{children}</LeaderboardContext.Provider>;
};
