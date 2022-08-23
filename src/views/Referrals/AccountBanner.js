import React from "react";
import Davatar from "@davatar/react";
import * as Styles from "./Referrals.styles";
import { ETH_DECIMALS, formatAmount, shortenAddress, USD_DECIMALS } from "../../Helpers";

export default function AccountBanner(props) {
  const { active, account, ensName, userData, totalRewardAmountUsd, unclaimedRewardsUsd } = props;

  return (
    <Styles.AccountBanner className="App-card">
      {active && (
        <Styles.AccountBannerAddresses>
          {account ? <Davatar size={40} address={account} /> : <Styles.EmptyAvatar />}
          <Styles.AppCardTitle>{ensName || shortenAddress(account, 13)}</Styles.AppCardTitle>
          <Styles.AccountBannerShortenedAddress> Wallet address </Styles.AccountBannerShortenedAddress>
        </Styles.AccountBannerAddresses>
      )}
      {!active && (
        <Styles.AccountBannerAddresses>
          <Styles.AppCardTitle>Connect Wallet </Styles.AppCardTitle>
          <Styles.AccountBannerShortenedAddress> Wallet not connected </Styles.AccountBannerShortenedAddress>
        </Styles.AccountBannerAddresses>
      )}
      <Styles.AccountBannerRewards>
        <div className="App-card-row">
          <div className="label">Total Volume Traded</div>
          <div> ${formatAmount(userData?.totalTradingVolume, USD_DECIMALS, 2, true)}</div>
        </div>
        <div className="App-card-row">
          <div className="label">Total Rewards</div>
          <div>
            {formatAmount(userData?.totalRewards, ETH_DECIMALS, 4, true)} ETH($
            {formatAmount(totalRewardAmountUsd, ETH_DECIMALS + USD_DECIMALS, 2, true)})
          </div>
        </div>
        <div className="App-card-row">
          <div className="label">Unclaimed Rewards</div>
          <div>
            {formatAmount(userData?.unclaimedRewards, ETH_DECIMALS, 4, true)} ETH($
            {formatAmount(unclaimedRewardsUsd, ETH_DECIMALS + USD_DECIMALS, 2, true)})
          </div>
        </div>
      </Styles.AccountBannerRewards>
    </Styles.AccountBanner>
  );
}
