import React from "react";
import { ETH_DECIMALS, formatAmount, USD_DECIMALS } from "../../Helpers";
import * as Styles from "./Referrals.styles";
import cx from "classnames";
import RewardsRoundSelect from "../../components/RewardsRoundSelect/RewardsRoundSelect";
import { RewardsButton } from "../../Shared.styles";

// import Davatar from '@davatar/react';
// import { EmptyAvatar } from './Rewards.styles'

export default function Rewards (props) {
  const {
    active,
    connectWallet,
    trackAction,
    hasClaimed,
    userRoundData,
    allRoundsRewardsData,
    latestRound,
    isClaiming,
    setIsClaimModalOpen,
    timeTillRewards,
    rewardsMessage,
    setSelectedRound,
  } = props;

  return (
      <Styles.ReferralData className="App-card">
        <Styles.AppCardTitle>Rewards data</Styles.AppCardTitle>
        <RewardsRoundSelect
          allRoundsRewardsData={allRoundsRewardsData}
          setSelectedRound={setSelectedRound}
          rewardsMessage={rewardsMessage}
          trackAction={trackAction}
          timeTillRewards={timeTillRewards}
        />
        <Styles.ReferralDataBoxes>
          <Styles.ReferralDataBox>
            <Styles.ReferralDataBoxTitle>Volume Traded </Styles.ReferralDataBoxTitle>
            <Styles.LargeText>
              {`$${formatAmount(userRoundData?.volume, USD_DECIMALS, 2, true)}`}
            </Styles.LargeText>
          </Styles.ReferralDataBox>
          <Styles.ReferralDataBox className={cx({ claimable: !hasClaimed })}>
            <Styles.ReferralDataBoxTitle>{hasClaimed ? 'Claimed Rewards' : 'Claimable Rewards'}</Styles.ReferralDataBoxTitle>
            <div>
              <Styles.LargeText>
                {`${formatAmount(userRoundData?.totalReward, ETH_DECIMALS, 4, true)} WETH`}
              </Styles.LargeText>
              <span>
                {` ($${formatAmount(userRoundData?.totalRewardUsd, USD_DECIMALS, 2, true)})`}
              </span>
            </div>
          </Styles.ReferralDataBox>
        </Styles.ReferralDataBoxes>
        {active && <RewardsButton
          className={'App-cta large'}
          disabled={!userRoundData?.totalReward || userRoundData.totalReward.eq(0) || isClaiming || hasClaimed || hasClaimed === undefined || latestRound}
          onClick={() => setIsClaimModalOpen(true)}
        >
          Claim WETH
        </RewardsButton>}
        {!active && (
          <Styles.ReferralButton className="App-cta large" onClick={() => connectWallet()}>
            Connect Wallet
          </Styles.ReferralButton>
        )}
      </Styles.ReferralData>
  )
}
