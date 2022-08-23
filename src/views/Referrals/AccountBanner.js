import React from "react";
import Davatar from "@davatar/react";
import * as Styles from "./Referrals.styles";
import { ETH_DECIMALS, formatAmount, shortenAddress, USD_DECIMALS } from "../../Helpers";

export default function AccountBanner(props) {
  const { active, account, ensName, userData, totalRewardAmountUsd, unclaimedReferralUsd } = props;

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
      <Styles.AccountBannerReferral>
        <div className="App-card-row">
          <div className="label">Total Volume Referred</div>
          <div> ${formatAmount(userData?.totalTradingVolume, USD_DECIMALS, 2, true)}</div>
        </div>
        <div className="App-card-row">
          <div className="label">Total Trading Fee Rebates</div>
          <div>
            {formatAmount(userData?.totalReferral, ETH_DECIMALS, 4, true)} ETH($
            {formatAmount(totalRewardAmountUsd, ETH_DECIMALS + USD_DECIMALS, 2, true)})
          </div>
        </div>
        <div className="App-card-row">
          <div className="label">Active Code</div>
          <div>.........................................</div>
        </div>
        <div className="App-card-row">
          <div className="label">Tier Level</div>
          <div>Tier 2 (5% Rebate)</div>
        </div>
      </Styles.AccountBannerReferral>
    </Styles.AccountBanner>
  );
}
