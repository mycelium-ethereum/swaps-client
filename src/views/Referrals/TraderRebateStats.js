import React from "react";
import { ETH_DECIMALS, formatAmount, USD_DECIMALS } from "../../Helpers";
import * as Styles from "./Referrals.styles";
import WeekDropdown from "./WeekDropdown";

export default function TraderRebateStats(props) {
  const {
    active,
    referralMessage,
    allWeeksReferralData,
    setSelectedWeek,
    connectWallet,
    userWeekData,
    currentView,
    trackAction,
    nextRewards,
    latestWeek,
    timeTillRewards,
    hasActivatedReferral,
    setIsEnterCodeModalVisible,
  } = props;

  return (
    <Styles.ReferralData className="App-card" hidden={currentView === "Commissions"}>
      {hasActivatedReferral ? (
        <>
          <Styles.AppCardTitle>Weekly data</Styles.AppCardTitle>
          <Styles.ReferralWeekSelect>
            {!!allWeeksReferralData && (
              <WeekDropdown
                allWeeksReferralData={allWeeksReferralData}
                setSelectedWeek={setSelectedWeek}
                referralMessage={referralMessage}
                trackAction={trackAction}
              />
            )}
            {nextRewards && (
              <Styles.ReferralWeekNextReferral>
                Next Rewards in <Styles.ReferralWeekCountdown>{timeTillRewards}</Styles.ReferralWeekCountdown>
              </Styles.ReferralWeekNextReferral>
            )}
          </Styles.ReferralWeekSelect>
          <Styles.ReferralDataBoxes>
            <Styles.ReferralDataBox>
              <Styles.ReferralDataBoxTitle>Volume Traded</Styles.ReferralDataBoxTitle>
              <Styles.LargeText> {`$${formatAmount(userWeekData?.volume, USD_DECIMALS, 2, true)}`}</Styles.LargeText>
            </Styles.ReferralDataBox>
            <Styles.ReferralDataBox className="claimable">
              <Styles.ReferralDataBoxTitle>Claimable Rebates</Styles.ReferralDataBoxTitle>
              <div>
                <Styles.LargeText>{`${formatAmount(
                  userWeekData?.reward,
                  ETH_DECIMALS,
                  4,
                  true
                )} ETH`}</Styles.LargeText>
                <span>
                  {" "}
                  {` ($${formatAmount(userWeekData?.rewardAmountUsd, ETH_DECIMALS + USD_DECIMALS, 2, true)})`}
                </span>
              </div>
            </Styles.ReferralDataBox>
          </Styles.ReferralDataBoxes>
          {active && latestWeek && (
            <Styles.ReferralButton disabled className="App-cta large">
              Week ends in {timeTillRewards}
            </Styles.ReferralButton>
          )}
          {active && !latestWeek && (
            <Styles.ReferralButton className="App-cta large"> Claim Rebates </Styles.ReferralButton>
          )}
          {!active && (
            <Styles.ReferralButton className="App-cta large" onClick={() => connectWallet()}>
              Connect Wallet
            </Styles.ReferralButton>
          )}
        </>
      ) : (
        <Styles.InputCodeText>
          <Styles.AppCardTitle>Enter Referral Code</Styles.AppCardTitle>
          <p>Add a referral code below to receive fee discounts.</p>
          {!active ? (
            <Styles.ReferralButton className="App-cta large" onClick={() => connectWallet()}>
              Connect Wallet
            </Styles.ReferralButton>
          ) : (
            <Styles.ReferralButton className="App-cta large" onClick={() => setIsEnterCodeModalVisible(true)}>
              Enter Code
            </Styles.ReferralButton>
          )}
        </Styles.InputCodeText>
      )}
    </Styles.ReferralData>
  );
}
