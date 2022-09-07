import React from "react";
import { truncateMiddleEthAddress, formatAmount, USD_DECIMALS, ETH_DECIMALS } from "../../Helpers";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import Davatar from "@davatar/react";
import cx from "classnames";
import {
  ConnectWalletText,
  ConnectWalletOverlay,
  LeaderboardContainer,
  Title,
  PersonalRewardsTableContainer,
  RewardsTableBorder,
  RewardsTable,
  RewardsTableHeader,
  RewardsTableHeading,
  FullWidthText,
  LeaderboardTitle,
  RewardsTableContainer,
  ScrollContainer,
  RankCell,
  UserCell,
  UserDetails,
  VolumeCell,
  RewardCell,
  ClaimCell,
  ClaimButton,
  WalletIcon,
  TopFiftyRow,
  TopFiftyRowCell,
} from "./Rewards.styles";
import { RewardsButton } from "../../Shared.styles";
import TooltipComponent from "../../components/Tooltip/Tooltip";

import degenScore from '../../img/ic_degen.svg';

const ARBISCAN_URL = "https://arbiscan.io/address/";
const headings = ["Rank", "User", "Volume", "Reward", ""];

function RewardsTableWrapper({ children }) {
  return (
    <RewardsTable>
      <RewardsTableHeader>
        <tr>
          {headings.map((heading) => (
            <RewardsTableHeading key={heading}>{heading}</RewardsTableHeading>
          ))}
        </tr>
      </RewardsTableHeader>
      <tbody>{children ? children : null}</tbody>
    </RewardsTable>
  );
}

function TopFiftyIndicatorRow() {
  return (
    <TopFiftyRow>
      <TopFiftyRowCell colSpan={5} className="">
        <span>Top 50% of traders</span>
      </TopFiftyRowCell>
    </TopFiftyRow>
  );
}
function TableRow({
  ensName,
  position,
  account,
  volume,
  totalReward,
  positionReward,
  degenReward,
  handleClaim,
  userRow,
  rewardAmountUsd,
  latestRound,
  isClaiming,
  hasClaimed
}) {
  const hasLoaded = hasClaimed !== undefined;
  return (
    <>
      <tr
        className={cx({
          "highlight-current": userRow,
        })}
      >
        <RankCell>{position}</RankCell>
        <UserCell>
          <div>
            {ensName ? (
              <Davatar size={40} address={account} />
            ) : (
              <Jazzicon diameter={40} seed={jsNumberForAddress(account)} />
            )}
            <UserDetails>
              <a href={`${ARBISCAN_URL}${account}`} rel="noopener noreferrer" target="_blank">
                <span>{truncateMiddleEthAddress(account)}</span>
              </a>
              <span>{ensName}</span>
            </UserDetails>
            {!!degenReward && !degenReward.eq(0) && <TooltipComponent
              handle={<img src={degenScore} alt="degen_score_logo"/>}
              renderContent={() => 'Rewards boosted by DegenScore'}
            />}
          </div>
        </UserCell>
        <VolumeCell>${formatAmount(volume, USD_DECIMALS, 2, true)}</VolumeCell>
        <RewardCell>
          <TooltipComponent
              handle={`${formatAmount(totalReward, ETH_DECIMALS, 4, true)} WETH`}
              renderContent={() => (
                <>
                  Top 50%: {formatAmount(positionReward, ETH_DECIMALS, 6, true)} WETH
                  <br />
                  Degen rewards: {formatAmount(degenReward, ETH_DECIMALS, 6, true)} WETH
                </>
              )}
          />
          {rewardAmountUsd && `($${formatAmount(rewardAmountUsd, USD_DECIMALS, 2, true)})`}
        </RewardCell>
        <ClaimCell
          className={cx({
            "highlight-current": userRow,
          })}
        >
          {userRow && !totalReward.eq(0) && !latestRound && hasLoaded && !hasClaimed && (
            <ClaimButton
              disabled={isClaiming}
              onClick={handleClaim}
            >
              {isClaiming ? 'Claiming WETH' : 'Claim WETH'}
            </ClaimButton>
          )}
          {userRow && !totalReward.eq(0) && hasLoaded && hasClaimed &&
            <span className="claimed">WETH Claimed</span>
          }
        </ClaimCell>
      </tr>
    </>
  );
}

export default function Leaderboard(props) {
  const {
    roundData,
    middleRow,
    userRoundData,
    userAccount,
    ensName,
    currentView,
    selectedRound,
    connectWallet,
    trackAction,
    handleClaim,
    latestRound,
    isClaiming,
    hasClaimed
  } = props;

  return (
    <LeaderboardContainer hidden={currentView === "Personal"}>
      <Title>Your rewards</Title>
      <PersonalRewardsTableContainer>
        <RewardsTableBorder />
        {userAccount && userRoundData && userRoundData.position ? (
          <RewardsTableWrapper>
            <TableRow
              position={userRoundData.position}
              account={userAccount}
              ensName={ensName}
              volume={userRoundData.volume}
              totalReward={userRoundData.totalReward}
              positionReward={userRoundData.positionReward}
              degenReward={userRoundData.degenReward}
              rewardAmountUsd={userRoundData.rewardAmountUsd}
              userRow={true}
              handleClaim={handleClaim}
              latestRound={latestRound}
              isClaiming={isClaiming}
              hasClaimed={hasClaimed}
            />
          </RewardsTableWrapper>
        ) : userAccount ? (
          <FullWidthText>
            <p>No previous trades</p>
          </FullWidthText>
        ) : (
          <ConnectWalletOverlay>
            {/* Empty table as placeholder */}
            <RewardsTableWrapper>
              <tr>
                <td colSpan={5}>
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                </td>
              </tr>
            </RewardsTableWrapper>
            <ConnectWalletText>
              <span>Connect to wallet to view your rewards</span>
              <RewardsButton
                className="App-cta large"
                onClick={() => {
                  connectWallet();
                  trackAction &&
                    trackAction("Button clicked", {
                      buttonName: "Connect wallet on page",
                    });
                }}
              >
                Connect Wallet <WalletIcon src="/icons/wallet.svg" />
              </RewardsButton>
            </ConnectWalletText>
          </ConnectWalletOverlay>
        )}
      </PersonalRewardsTableContainer>
      <LeaderboardTitle>Leaderboard</LeaderboardTitle>
      <RewardsTableContainer>
        <RewardsTableBorder />
        <ScrollContainer>
          {roundData?.rewards?.length > 0 ? (
            <RewardsTableWrapper>
              {roundData?.rewards?.map(({ user_address, volume, totalReward, positionReward, degenReward, rewardAmountUsd }, index) => {
                const isUserRow = user_address === userAccount;
                return (
                  <>
                    {index === middleRow ? <TopFiftyIndicatorRow /> : null}
                    <TableRow
                      key={user_address}
                      totalTraders={roundData.rewards.length}
                      position={index + 1}
                      ensName={isUserRow ? ensName : undefined}
                      account={user_address}
                      volume={volume}
                      totalReward={totalReward}
                      positionReward={positionReward}
                      degenReward={degenReward}
                      rewardAmountUsd={rewardAmountUsd}
                      handleClaim={handleClaim}
                      userRow={isUserRow}
                      latestRound={latestRound}
                      isClaiming={isClaiming}
                      hasClaimed={hasClaimed}
                    />
                  </>
                )
              })}
            </RewardsTableWrapper>
          ) : (!roundData?.rewards || roundData?.rewards?.length === 0) && selectedRound ? (
            <FullWidthText>
              <p>No data available for Round {selectedRound}</p>
            </FullWidthText>
          ) : (
            <FullWidthText>
              <p>Loading round data...</p>
            </FullWidthText>
          )}
        </ScrollContainer>
      </RewardsTableContainer>
    </LeaderboardContainer>
  );
}
