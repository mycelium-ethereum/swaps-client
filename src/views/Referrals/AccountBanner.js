import React from "react";
import Davatar from "@davatar/react";
import * as Styles from "./Referrals.styles";
import {
  formatAmount,
  shortenAddress,
  USD_DECIMALS,
  copyReferralCode,
  getTierIdDisplay,
  TIER_DISCOUNT_INFO,
} from "../../Helpers";
import CopyIcon from "../../img/copy.svg";
import Tooltip from "../../components/Tooltip/Tooltip";
import { Text } from "../../components/Translation/Text";
// import { COMMISSIONS } from "./Referrals";

export default function AccountBanner(props) {
  const {
    active,
    account,
    ensName,
    currentView,
    // rebates
    tradersTier,
    tradersRebates,
    tradersVolume,
    referralCodeInString,
    // commissions
    referrerTier,
    referrerRebates,
    referrerVolume,
  } = props;

  const getInfo = () => {
    if (!active) {
      return;
    } else if (currentView === "Rebates") {
      return (
        <>
          <div className="App-card-row">
            <div className="label">
              <Text>Total Volume Traded</Text>
            </div>
            <div>${formatAmount(tradersVolume, USD_DECIMALS, 2, true, "0.00")}</div>
          </div>
          <div className="App-card-row">
            <div className="label">
              <Text>Total Trading Fee Rebates</Text>
            </div>
            <div>${formatAmount(tradersRebates, USD_DECIMALS, 2, true, "0.00")}</div>
          </div>
          {referralCodeInString && (
            <div className="App-card-row">
              <div className="label">
                <Text>Active Code</Text>
              </div>
              <Styles.FlexContainer>
                <span>{referralCodeInString}</span>
                <Styles.CopyButton onClick={() => copyReferralCode(referralCodeInString)}>
                  <img src={CopyIcon} alt="Copy" />{" "}
                </Styles.CopyButton>
              </Styles.FlexContainer>
            </div>
          )}
          <div className="App-card-row">
            <div className="label">
              <Text>Tier Level</Text>
            </div>
            {tradersTier && (
              <div className="tier">
                <Tooltip
                  handle={
                    <>
                      <Text>Tier</Text> {getTierIdDisplay(tradersTier)} (${TIER_DISCOUNT_INFO[tradersTier]}%{" "}
                      <Text>discount</Text>)
                    </>
                  }
                  position="right-bottom"
                  renderContent={() => (
                    <>
                      <Text>You will receive a</Text> {TIER_DISCOUNT_INFO[tradersTier]}%{" "}
                      <Text>
                        discount on your opening and closing fees, this discount will be claimable fortnightly.
                      </Text>
                    </>
                  )}
                />
              </div>
            )}
          </div>
        </>
      );
    }
    return (
      <>
        <div className="App-card-row">
          <div className="label">
            <Text>Total Volume Referred</Text>
          </div>
          <div>${formatAmount(referrerVolume, USD_DECIMALS, 2, true, "0.00")}</div>
        </div>
        <div className="App-card-row">
          <div className="label">
            <Text>Total Commissions</Text>
          </div>
          <div>${formatAmount(referrerRebates, USD_DECIMALS, 2, true, "0.00")}</div>
        </div>
        {referrerTier && (
          <div className="App-card-row">
            <div className="label">
              <Text>Tier Level</Text>
            </div>
            <div className="tier">
              <Tooltip
                handle={
                  <>
                    <Text>Tier</Text> {getTierIdDisplay(referrerTier)} (${TIER_DISCOUNT_INFO[referrerTier]}%{" "}
                    <Text>commissions</Text>)
                  </>
                }
                position="right-bottom"
                renderContent={() => (
                  <>
                    <Text>You will receive a</Text> {TIER_DISCOUNT_INFO[referrerTier]}%{" "}
                    <Text>
                      commission on referred opening and closing fees, this commission will be claimable fortnightly.
                    </Text>
                  </>
                )}
              />
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <Styles.AccountBanner className="App-card">
      {active && (
        <Styles.AccountBannerAddresses>
          <Davatar size={40} address={account} />
          <Styles.AppCardTitle>{ensName || shortenAddress(account, 13)}</Styles.AppCardTitle>
          <Styles.AccountBannerShortenedAddress>
            <Text>Wallet address</Text>
          </Styles.AccountBannerShortenedAddress>
        </Styles.AccountBannerAddresses>
      )}
      {!active && (
        <Styles.AccountBannerAddresses>
          <Styles.AppCardTitle>
            <Text>Connect Wallet</Text>
          </Styles.AppCardTitle>
          <Styles.AccountBannerShortenedAddress>
            <Text>Wallet not connected</Text>
          </Styles.AccountBannerShortenedAddress>
        </Styles.AccountBannerAddresses>
      )}
      <Styles.AccountBannerReferral>{getInfo()}</Styles.AccountBannerReferral>
    </Styles.AccountBanner>
  );
}
