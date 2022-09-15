import React from "react";
import { ETH_DECIMALS, formatAmount, shortenAddress, USD_DECIMALS, formatTimeTill } from "../../Helpers";
import * as Styles from "./Rewards.styles";
import Davatar from "@davatar/react";
import { EmptyAvatar } from "./Rewards.styles";
import cx from "classnames";
import RewardsRoundSelect from "../../components/RewardsRoundSelect/RewardsRoundSelect";
import { RewardsButton } from "../../Shared.styles";
import { Text } from "../../components/Translation/Text";

export default function TraderRewards(props) {
  const {
    active,
    account,
    ensName,
    userData,
    totalRewardAmountUsd,
    unclaimedRewardsUsd,
    rewardsMessage,
    allRoundsRewardsData,
    setSelectedRound,
    connectWallet,
    userRoundData,
    currentView,
    trackAction,
    nextRewards,
    latestRound,
    handleClaim,
    isClaiming,
    hasClaimed,
  } = props;

  let timeTillRewards;
  if (nextRewards) {
    timeTillRewards = formatTimeTill(nextRewards / 1000);
  }

  return (
    <Styles.PersonalRewardsContainer hidden={currentView === "Leaderboard"}>
      <Styles.AccountBanner className="App-card">
        {active && (
          <Styles.AccountBannerAddresses>
            {account ? <Davatar size={40} address={account} /> : <EmptyAvatar />}
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
        <Styles.AccountBannerRewards>
          <div className="App-card-row">
            <div className="label">
              <Text>Total Volume Traded</Text>
            </div>
            <div> ${formatAmount(userData?.totalTradingVolume, USD_DECIMALS, 2, true)}</div>
          </div>
          <div className="App-card-row">
            <div className="label">
              <Text>Total Rewards</Text>
            </div>
            <div>
              {formatAmount(userData?.totalRewards, ETH_DECIMALS, 4, true)} WETH($
              {formatAmount(totalRewardAmountUsd, USD_DECIMALS, 2, true)})
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">
              <Text>Unclaimed Rewards</Text>
            </div>
            <div>
              {formatAmount(userData?.unclaimedRewards, ETH_DECIMALS, 4, true)} WETH($
              {formatAmount(unclaimedRewardsUsd, USD_DECIMALS, 2, true)})
            </div>
          </div>
        </Styles.AccountBannerRewards>
      </Styles.AccountBanner>
      <Styles.RewardsData className="App-card">
        <Styles.AppCardTitle>
          <Text>Rewards data</Text>
        </Styles.AppCardTitle>
        <RewardsRoundSelect
          allRoundsRewardsData={allRoundsRewardsData}
          setSelectedRound={setSelectedRound}
          rewardsMessage={rewardsMessage}
          trackAction={trackAction}
          timeTillRewards={timeTillRewards}
        />
        <Styles.RewardsDataBoxes>
          <Styles.RewardsDataBox>
            <Styles.RewardsDataBoxTitle>
              <Text>Volume Traded</Text>{" "}
            </Styles.RewardsDataBoxTitle>
            <Styles.LargeText> {`$${formatAmount(userRoundData?.volume, USD_DECIMALS, 2, true)}`}</Styles.LargeText>
          </Styles.RewardsDataBox>
          <Styles.RewardsDataBox className={cx({ claimable: !hasClaimed })}>
            <Styles.RewardsDataBoxTitle>
              <Text>{hasClaimed ? "Claimed Rewards" : "Claimable Rewards"}</Text>
            </Styles.RewardsDataBoxTitle>
            <div>
              <Styles.LargeText>{`${formatAmount(
                userRoundData?.totalReward,
                ETH_DECIMALS,
                4,
                true
              )} WETH`}</Styles.LargeText>
              <span> {` ($${formatAmount(userRoundData?.rewardAmountUsd, USD_DECIMALS, 2, true)})`}</span>
            </div>
          </Styles.RewardsDataBox>
        </Styles.RewardsDataBoxes>
        {active && (
          <RewardsButton
            className={"App-cta large"}
            disabled={
              !userRoundData?.totalReward ||
              userRoundData.totalReward.eq(0) ||
              isClaiming ||
              hasClaimed ||
              hasClaimed === undefined ||
              latestRound
            }
            onClick={handleClaim}
          >
            <Text>Claim</Text> WETH
          </RewardsButton>
        )}
        {!active && (
          <RewardsButton className="App-cta large" onClick={() => connectWallet()}>
            <Text>Connect Wallet</Text>
          </RewardsButton>
        )}
      </Styles.RewardsData>
      {hasClaimed && (
        <Styles.ClaimedRewards>
          <span />
          <span>
            WETH <Text>has been claimed</Text>
          </span>
          <span />
        </Styles.ClaimedRewards>
      )}
    </Styles.PersonalRewardsContainer>
  );
}
