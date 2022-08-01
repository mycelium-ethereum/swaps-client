import React, { useState, useMemo } from "react";

import useSWR from "swr";

import Footer from "../../Footer";

import { ETH_DECIMALS, formatAmount, getTokenInfo, shortenAddress, USD_DECIMALS, useChainId, useENS } from "../../Helpers";
import * as Styles from "./Rewards.styles";

import { useWeb3React } from "@web3-react/core";
import Davatar from "@davatar/react";
import { Menu } from "@headlessui/react";
import { FaChevronDown } from "react-icons/fa";
import { getTracerServerUrl } from "../../Api/rewards";
import { useInfoTokens } from "../../Api";
import { ethers } from "ethers";

export default function Rewards(props) {
  const { connectWallet } = props;

  const { ensName } = useENS();
  const { chainId } = useChainId();
  const { active, account, library } = useWeb3React();

  const [selectedWeek, setSelectedWeek] = useState(undefined);

  const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);
  
  // const { data: rewardProof } = useSWR([getTracerServerUrl(chainId, "/user_reward_proof"), account, selectedWeek, chainId], {
    // fetcher: (url, account, week) => fetch(`${url}&userAddress=${account}&week=${week}`).then((res) => res.json())
  // });

  const { data: rewardWeeks, error: failedFetchingRewards } = useSWR([getTracerServerUrl(chainId, "/rewards")], {
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
  });

  console.log(rewardWeeks);

  const userData = useMemo(() => rewardWeeks?.reduce((totals, week) => {
    const trader = week.traders.find((trader) => trader.user_address === account);
    if (!trader) {
      return totals;
    }
    return ({
      totalTradingVolume: totals.totalTradingVolume.add(trader.volume),
      totalRewards: totals.totalRewards.add(trader.reward),
      unclaimedRewards: totals.unclaimedRewards.add(trader?.claimed ? trader.amount : 0),
    })
  }, {
      totalTradingVolume: ethers.BigNumber.from(0),
      totalRewards: ethers.BigNumber.from(0),
      unclaimedRewards: ethers.BigNumber.from(0),
  }), [rewardWeeks, account])

  const userWeekData = useMemo(() => {
    if (!rewardWeeks) {
      return undefined
    } 
    if (!!rewardWeeks?.message) {
      return undefined;
    }
    const weekData = rewardWeeks?.find((week) => week.week === selectedWeek?.toString())
    if (!weekData) { 
      return undefined
    }
    const tradersData = weekData.traders?.find((trader) => trader.user_address === account);
    // traders data found
    if (tradersData) {
      return tradersData;
    } else {
      // trader not found but data exists so user has no rewards
      return ({
        volume: ethers.BigNumber.from(0),
        reward: ethers.BigNumber.from(0)
      })
    }
  }, [rewardWeeks, selectedWeek, account])

  const eth = getTokenInfo(infoTokens, ethers.constants.AddressZero)
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

  if (!rewardWeeks && selectedWeek !== undefined) {
    setSelectedWeek(undefined)
  } else if (selectedWeek === undefined && !!rewardWeeks) {
    setSelectedWeek(0)
  }

  let rewardsMessage = "";
  if (!rewardWeeks) {
    rewardsMessage = "Fetching rewards"
  } else if (!!failedFetchingRewards) {
    rewardsMessage = "Failed fetching rewards"
  } else {
    if (rewardWeeks?.length === 0) {
      rewardsMessage = "No rewards for network"
    } else {
      rewardsMessage = `Week ${selectedWeek}`
    }
  } 

  return (
    <Styles.StyledRewardsPage className="default-container page-layout">
      <div className="Page-title-section mt-0">
        <div className="Page-title">Trader Rewards</div>
        <div className="Page-description">
          Be in the top 50% of traders to earn weekly rewards.
        </div>
      </div>
      <Styles.AccountBanner className="App-card"> 
        {active &&
          <Styles.AccountBannerAddresses>
            <Davatar size={40} address={account} />
            <Styles.AppCardTitle>
              {ensName || shortenAddress(account, 13)}
            </Styles.AppCardTitle>
            <Styles.AccountBannerShortenedAddress>
              Wallet address
            </Styles.AccountBannerShortenedAddress>
          </Styles.AccountBannerAddresses>
        }
        {!active &&
          <Styles.AccountBannerAddresses>
            <Styles.AppCardTitle>
              Connect Wallet
            </Styles.AppCardTitle>
            <Styles.AccountBannerShortenedAddress>
              Wallet not connected
            </Styles.AccountBannerShortenedAddress>
          </Styles.AccountBannerAddresses>
        }
        <Styles.AccountBannerRewards>
          <div className="App-card-row">
            <div className="label">Total Volume Traded</div>
            <div>
              ${formatAmount(userData?.totalTradingVolume, 0, 2, true)}
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">Total Rewards</div>
            <div>
              {formatAmount(userData?.totalRewards, ETH_DECIMALS, 2, true)} ETH (${formatAmount(totalRewardAmountEth, USD_DECIMALS + ETH_DECIMALS, 2, true)})
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">Unclaimed Rewards</div>
            <div>
              {formatAmount(userData?.unclaimedRewards, ETH_DECIMALS, 2, true)} ETH (${formatAmount(unclaimedRewardsEth, USD_DECIMALS + ETH_DECIMALS, 2, true)})
            </div>
          </div>
        </Styles.AccountBannerRewards>
      </Styles.AccountBanner>
      <Styles.RewardsData className="App-card">
        <Styles.AppCardTitle>
          Rewards data
        </Styles.AppCardTitle>
        <Styles.RewardsWeekSelect>
          <Styles.RewardsWeekSelectMenu>
            <Menu>
              <Menu.Button as="div">
                <Styles.WeekSelectButton className="App-cta transparent">
                  {rewardsMessage}
                  <FaChevronDown />
                </Styles.WeekSelectButton>
              </Menu.Button>
              <div>
                <Menu.Items as="div" className="menu-items">
                  {!!rewardWeeks && rewardWeeks.map((rewardWeek) => (
                    <Menu.Item>
                      <div className="menu-item" onClick={() => setSelectedWeek(rewardWeek.week)}>
                        Week {rewardWeek.week}
                      </div>
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </div>
            </Menu>
          </Styles.RewardsWeekSelectMenu>
          <Styles.RewardsWeekNextRewards>
            Next rewards in <Styles.RewardsWeekCountdown>8d 13h 42m</Styles.RewardsWeekCountdown>
          </Styles.RewardsWeekNextRewards>
        </Styles.RewardsWeekSelect>
        <Styles.RewardsDataBoxes>
          <Styles.RewardsDataBox>
            <Styles.RewardsDataBoxTitle>Volume Traded</Styles.RewardsDataBoxTitle>
            <Styles.LargeText>
              {`$${formatAmount(userWeekData?.volume, 0, 2, true)}`}
            </Styles.LargeText>
          </Styles.RewardsDataBox>
          <Styles.RewardsDataBox className="claimable">
            <Styles.RewardsDataBoxTitle>Claimable Rewards</Styles.RewardsDataBoxTitle>
            <div>
              <Styles.LargeText>
                {`${formatAmount(userWeekData?.reward, ETH_DECIMALS, 4, true)} ETH`}
              </Styles.LargeText>
              <span>
                {` ($${formatAmount(rewardAmountEth, USD_DECIMALS + ETH_DECIMALS, 2, true)})`}
              </span>
            </div>
          </Styles.RewardsDataBox>
        </Styles.RewardsDataBoxes>
        {active &&
          <Styles.RewardsButton className="App-cta large">
            Claim TCR
          </Styles.RewardsButton>
        }
        {!active &&
          <Styles.RewardsButton className="App-cta large" onClick={() => connectWallet()}>
            Connect Wallet
          </Styles.RewardsButton>
        }
      </Styles.RewardsData>
      <Footer />
    </Styles.StyledRewardsPage>
  );
}
