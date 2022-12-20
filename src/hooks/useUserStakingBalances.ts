import useSWR from "swr";
import { ChainId } from "src/types/common";

import RewardsTracker from "../abis/RewardTracker.json";
import Token from "../abis/Token.json";

import { getContract } from "../Addresses";
import {
  fetcher,
  ARBITRUM_GOERLI,
} from "../Helpers";

export const getMycTokenAddresses = (chainId: ChainId): { esMycTokenAddress: string, mycTokenAddress: string } => {
  if (chainId === ARBITRUM_GOERLI) {
    return ({
      mycTokenAddress: getContract(chainId, "MYC_V2"),
      esMycTokenAddress: getContract(chainId, "ES_MYC_V2"),
    })
  } else {
    return ({
      mycTokenAddress: getContract(chainId, "MYC"),
      esMycTokenAddress: getContract(chainId, "ES_MYC")
    })
  }
}

export function useUserStakingBalances(address: string, chainId: ChainId) {
  const {
    mycTokenAddress,
    esMycTokenAddress
  } = getMycTokenAddresses(chainId);

  const stakingAddress = getContract(chainId, "MYCStakingRewards");

  const { data: userMycBalance } = useSWR(
    address ? [`useStakingBalances:balanceOf(MYC):${chainId}`, chainId, mycTokenAddress, "balanceOf", address] : null,
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const { data: userMycAllowance } = useSWR(
    address ? [`useStakingBalances:allowance(MYC):${chainId}`, chainId, mycTokenAddress, "allowance", address, stakingAddress] : null,
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const { data: userEsMycBalance } = useSWR(
    address
      ? [`useStakingBalances:balanceOf(esMYC):${chainId}`, chainId, esMycTokenAddress, "balanceOf", address]
      : null,
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const { data: userEsMycAllowance } = useSWR(
    address ? [`useStakingBalances:allowance(MYC):${chainId}`, chainId, esMycTokenAddress, "allowance", address, stakingAddress] : null,
    {
      fetcher: fetcher(undefined, Token),
    }
  );

  const { data: userStakedMycBalance } = useSWR(
    address
      ? [`useStakingBalances:depositBalances(MYC):${chainId}`, chainId, stakingAddress, "depositBalances", address]
      : null,
    {
      fetcher: fetcher(undefined, RewardsTracker, mycTokenAddress),
    }
  );

  const { data: userStakedEsMycBalance } = useSWR(
    address
      ? [`useStakingBalances:depositBalances(esMYC):${chainId}`, chainId, stakingAddress, "depositBalances", address]
      : null,
    {
      fetcher: fetcher(undefined, RewardsTracker, esMycTokenAddress),
    }
  );

  const { data: rewardsEarned } = useSWR(
    address ? [`useStakingBalances:claimable:${chainId}`, chainId, stakingAddress, "claimable", address] : null,
    {
      fetcher: fetcher(undefined, RewardsTracker),
    }
  );

  const { data: cumulativeRewards } = useSWR(
    address ? [`useStakingBalances:claimable:${chainId}`, chainId, stakingAddress, "cumulativeRewards", address] : null,
    {
      fetcher: fetcher(undefined, RewardsTracker),
    }
  );

  return {
    userMycBalance,
    userMycAllowance,
    userEsMycBalance,
    userEsMycAllowance,
    userStakedMycBalance,
    userStakedEsMycBalance,
    rewardsEarned,
    cumulativeRewards,
  };
}
