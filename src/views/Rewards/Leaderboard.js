import React from "react";
import { useENS, truncateMiddleEthAddress, formatAmount, USD_DECIMALS } from "../../Helpers";
import Davatar from "@davatar/react";
import cx from "classnames";
import {
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
  EmptyAvatar,
  UserDetails,
  VolumeCell,
  RewardCell,
  ClaimCell,
  ClaimButton,
} from "./Rewards.styles";
const DEFAULT_LISTINGS_COUNT = 50;
const ARBISCAN_URL = "https://arbiscan.io/address/";

function TableRow({ position, account, userAccount, volume, reward }) {
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
        {account === userAccount ? <ClaimButton>Claim ETH</ClaimButton> : null}
      </ClaimCell>
    </tr>
  );
}

export default function Leaderboard(props) {
  const { weekData, userWeekData, userAccount, ensName, currentView, selectedWeek } = props;
  const headings = ["Rank", "User", "Volume", "Reward", ""];

  return (
    <LeaderboardContainer hidden={currentView === "Personal"}>
      <Title>Your rewards</Title>
      <PersonalRewardsTableContainer>
        <RewardsTableBorder />
        {userWeekData && userWeekData.position ? (
          <RewardsTable>
            <RewardsTableHeader>
              <tr>
                {headings.map((heading) => (
                  <RewardsTableHeading key={heading}>{heading}</RewardsTableHeading>
                ))}
              </tr>
            </RewardsTableHeader>
            <tbody>
              <TableRow
                position={userWeekData.position}
                account={userAccount}
                ensName={ensName}
                volume={userWeekData.volume}
                reward={userWeekData.reward}
              />
            </tbody>
          </RewardsTable>
        ) : (
          <FullWidthText>
            <p>No previous trades</p>
          </FullWidthText>
        )}
      </PersonalRewardsTableContainer>
      <LeaderboardTitle>Leaderboard</LeaderboardTitle>
      <RewardsTableContainer>
        <RewardsTableBorder />
        <ScrollContainer>
          {weekData?.traders?.length > 1 ? (
            <RewardsTable>
              <RewardsTableHeader>
                <tr>
                  {headings.map((heading) => (
                    <RewardsTableHeading>{heading}</RewardsTableHeading>
                  ))}
                </tr>
              </RewardsTableHeader>
              <tbody>
                {weekData?.traders?.slice(0, DEFAULT_LISTINGS_COUNT).map(({ user_address, volume, reward }, index) => (
                  <TableRow
                    key={user_address}
                    position={index + 1}
                    account={user_address}
                    volume={volume}
                    reward={reward}
                  />
                ))}
              </tbody>
            </RewardsTable>
          ) : !weekData?.traders || weekData?.traders?.length === 0 ? (
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
