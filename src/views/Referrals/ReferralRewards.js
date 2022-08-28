import React from "react";
import { ETH_DECIMALS, formatAmount, USD_DECIMALS } from "../../Helpers";
import * as Styles from "./Referrals.styles";
import cx from "classnames";
import RewardsWeekSelect from "../../components/RewardsWeekSelect/RewardsWeekSelect";

// import Davatar from '@davatar/react';
// import { EmptyAvatar } from './Rewards.styles'

export default function Rewards (props) {
  const {
    active,
    connectWallet,
    trackAction,
    hasClaimed,
    userWeekData,
    allWeeksRewardsData,
    latestWeek,
    isClaiming,
    handleClaim,
    timeTillRewards,
    rewardsMessage,
    setSelectedWeek
  } = props;

  return (
      <Styles.ReferralData className="App-card">
        <Styles.AppCardTitle>Rewards data</Styles.AppCardTitle>
        <RewardsWeekSelect
          allWeeksRewardsData={allWeeksRewardsData}
          setSelectedWeek={setSelectedWeek}
          rewardsMessage={rewardsMessage}
          trackAction={trackAction}
          timeTillRewards={timeTillRewards}
        />
        <Styles.ReferralDataBoxes>
          <Styles.ReferralDataBox>
            <Styles.ReferralDataBoxTitle>Volume Traded </Styles.ReferralDataBoxTitle>
            <Styles.LargeText>
              {`$${formatAmount(userWeekData?.volume, USD_DECIMALS, 2, true)}`}
            </Styles.LargeText>
          </Styles.ReferralDataBox>
          <Styles.ReferralDataBox className={cx({ claimable: !hasClaimed })}>
            <Styles.ReferralDataBoxTitle>{hasClaimed ? 'Claimed Rewards' : 'Claimable Rewards'}</Styles.ReferralDataBoxTitle>
            <div>
              <Styles.LargeText>
                {`${formatAmount(userWeekData?.totalReward, ETH_DECIMALS, 4, true)} WETH`}
              </Styles.LargeText>
              <span>
                {` ($${formatAmount(userWeekData?.rewardAmountUsd, USD_DECIMALS, 2, true)})`}
              </span>
            </div>
          </Styles.ReferralDataBox>
        </Styles.ReferralDataBoxes>
        {active && <Styles.ReferralButton
          className={'App-cta large'}
          disabled={!userWeekData?.totalReward || userWeekData.totalReward.eq(0) || isClaiming || hasClaimed || hasClaimed === undefined || latestWeek}
          onClick={handleClaim}
        >
          Claim WETH
        </Styles.ReferralButton>}
        {!active && (
          <Styles.ReferralButton className="App-cta large" onClick={() => connectWallet()}>
            Connect Wallet
          </Styles.ReferralButton>
        )}
      </Styles.ReferralData>
  )
}
