import React from "react";
import { ETH_DECIMALS, formatAmount, USD_DECIMALS, formatTimeTill } from "../../Helpers";
import * as Styles from "./Referrals.styles";
import WeekDropdown from "./WeekDropdown";

export default function TraderRebateStats(props) {
  const {
    active,
    rewardsMessage,
    allWeeksRewardsData,
    setSelectedWeek,
    connectWallet,
    userWeekData,
    currentView,
    trackAction,
    nextRewards,
    latestWeek,
  } = props;

  const timeTillRewards = formatTimeTill(nextRewards / 1000);

  return (
    <Styles.RewardsData className="App-card" hidden={currentView === "Commissions"}>
      <Styles.AppCardTitle>Rewards data</Styles.AppCardTitle>
      <Styles.RewardsWeekSelect>
        {!!allWeeksRewardsData ? (
          <WeekDropdown
            allWeeksRewardsData={allWeeksRewardsData}
            setSelectedWeek={setSelectedWeek}
            rewardsMessage={rewardsMessage}
            trackAction={trackAction}
          />
        ) : null}
        {nextRewards && (
          <Styles.RewardsWeekNextRewards>
            Next rewards in <Styles.RewardsWeekCountdown>{timeTillRewards}</Styles.RewardsWeekCountdown>
          </Styles.RewardsWeekNextRewards>
        )}
      </Styles.RewardsWeekSelect>
      <Styles.RewardsDataBoxes>
        <Styles.RewardsDataBox>
          <Styles.RewardsDataBoxTitle>Volume Traded </Styles.RewardsDataBoxTitle>
          <Styles.LargeText> {`$${formatAmount(userWeekData?.volume, USD_DECIMALS, 2, true)}`}</Styles.LargeText>
        </Styles.RewardsDataBox>
        <Styles.RewardsDataBox className="claimable">
          <Styles.RewardsDataBoxTitle>Claimable Rebates</Styles.RewardsDataBoxTitle>
          <div>
            <Styles.LargeText>{`${formatAmount(userWeekData?.reward, ETH_DECIMALS, 4, true)} ETH`}</Styles.LargeText>
            <span> {` ($${formatAmount(userWeekData?.rewardAmountUsd, ETH_DECIMALS + USD_DECIMALS, 2, true)})`}</span>
          </div>
        </Styles.RewardsDataBox>
      </Styles.RewardsDataBoxes>
      {active && latestWeek && (
        <Styles.RewardsButton disabled className="App-cta large">
          Week ends in {timeTillRewards}
        </Styles.RewardsButton>
      )}
      {active && !latestWeek && <Styles.RewardsButton className="App-cta large"> Claim Rebates </Styles.RewardsButton>}
      {!active && (
        <Styles.RewardsButton className="App-cta large" onClick={() => connectWallet()}>
          Connect Wallet
        </Styles.RewardsButton>
      )}
    </Styles.RewardsData>
  );
}
