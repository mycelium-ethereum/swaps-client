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
  RewardsButton,
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
function TableRow({ ensName, totalTraders, position, account, userAccount, volume, reward, trackAction, rewardAmountUsd }) {
  return (
    <>
      {position === Math.ceil(totalTraders / 2) + 1 ? <TopFiftyIndicatorRow /> : null}
      <tr
        className={cx({
          "highlight-current": account === userAccount,
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
          </div>
        </UserCell>
        <VolumeCell>${formatAmount(volume, USD_DECIMALS, 2, true)}</VolumeCell>
        <RewardCell>
          {formatAmount(reward, ETH_DECIMALS, 4, true)} ETH{" "}
          {rewardAmountUsd && `($${formatAmount(rewardAmountUsd, ETH_DECIMALS + USD_DECIMALS, 2, true)})`}
        </RewardCell>
        <ClaimCell
          className={cx({
            "highlight-current": account === userAccount,
          })}
        >
          {account === userAccount ? (
            <ClaimButton
              onClick={() => {
                // TODO: Add claim reward function
                trackAction("Button clicked", {
                  buttonName: "Claim rewards",
                });
              }}
            >
              Claim ETH
            </ClaimButton>
          ) : null}
        </ClaimCell>
      </tr>
    </>
  );
}

export default function Leaderboard(props) {
  const { weekData, userWeekData, userAccount, ensName, currentView, selectedWeek, connectWallet, trackAction } = props;

  return (
    <LeaderboardContainer hidden={currentView === "Personal"}>
      <Title>Your rewards</Title>
      <PersonalRewardsTableContainer>
        <RewardsTableBorder />
        {userAccount && userWeekData && userWeekData.position ? (
          <RewardsTableWrapper>
            <TableRow
              position={userWeekData.position}
              account={userAccount}
              ensName={ensName}
              volume={userWeekData.volume}
              reward={userWeekData.reward}
              rewardAmountUsd={userWeekData.rewardAmountUsd}
              trackAction={trackAction}
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
          {weekData?.traders?.length > 1 ? (
            <RewardsTableWrapper>
              {weekData?.traders?.map(({ user_address, volume, reward, rewardAmountUsd }, index) => (
                <TableRow
                  key={user_address}
                  totalTraders={weekData.traders.length}
                  position={index + 1}
                  account={user_address}
                  volume={volume}
                  reward={reward}
                  rewardAmountUsd={rewardAmountUsd}
                  trackAction={trackAction}
                />
              ))}
            </RewardsTableWrapper>
          ) : (!weekData?.traders || weekData?.traders?.length === 0) && selectedWeek ? (
            <FullWidthText>
              <p>No data available for Week {selectedWeek}</p>
            </FullWidthText>
          ) : (
            <FullWidthText>
              <p>Loading week data...</p>
            </FullWidthText>
          )}
        </ScrollContainer>
      </RewardsTableContainer>
    </LeaderboardContainer>
  );
}
