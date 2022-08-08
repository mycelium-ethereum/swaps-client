import React from "react";
import { useENS, truncateMiddleEthAddress, formatAmount, USD_DECIMALS } from "../../Helpers";
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
  EmptyAvatar,
  UserDetails,
  VolumeCell,
  RewardCell,
  ClaimCell,
  ClaimButton,
  WalletIcon,
} from "./Rewards.styles";
const DEFAULT_LISTINGS_COUNT = 50;
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

function TableRow({ position, account, userAccount, volume, reward, trackAction }) {
  const { ensName } = useENS(account);

  return (
    <tr>
      <RankCell>{position}</RankCell>
      <UserCell>
        <div>
          {account ? <Davatar size={32} address={account} /> : <EmptyAvatar />}
          <UserDetails>
            <a href={`${ARBISCAN_URL}${account}`} rel="noopener noreferrer" target="_blank">
              <span>{truncateMiddleEthAddress(account)}</span>
            </a>
            <span>{ensName}</span>
          </UserDetails>
        </div>
      </UserCell>
      <VolumeCell>${formatAmount(volume, USD_DECIMALS, 2, true)}</VolumeCell>
      <RewardCell>${formatAmount(reward, USD_DECIMALS, 2, true)}</RewardCell>
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
              {weekData?.traders?.slice(0, DEFAULT_LISTINGS_COUNT).map(({ user_address, volume, reward }, index) => (
                <TableRow
                  key={user_address}
                  position={index + 1}
                  account={user_address}
                  volume={volume}
                  reward={reward}
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
