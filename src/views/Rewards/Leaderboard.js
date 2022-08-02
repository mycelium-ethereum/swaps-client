import React from "react";
import { useENS, truncateMiddleEthAddress, formatAmount, USD_DECIMALS } from "../../Helpers";
import * as Styles from "./Rewards.styles";
import Davatar from "@davatar/react";
import cx from "classnames";

const DEFAULT_LISTINGS_COUNT = 50;
const ARBISCAN_URL = "https://arbiscan.io/address/";

function TableRow({ position, account, userAccount, volume, reward }) {
  const { ensName } = useENS(account);

  return (
    <tr>
      <Styles.RankCell>{position}</Styles.RankCell>
      <Styles.UserCell>
        <div>
          {account ? <Davatar size={32} address={account} /> : <Styles.EmptyAvatar />}
          <Styles.UserDetails>
            <a href={`${ARBISCAN_URL}${account}`} rel="noopener noreferrer" target="_blank">
              <span>{truncateMiddleEthAddress(account)}</span>
            </a>
            <span>{ensName}</span>
          </Styles.UserDetails>
        </div>
      </Styles.UserCell>
      <Styles.VolumeCell>${formatAmount(volume, USD_DECIMALS, 2, true)}</Styles.VolumeCell>
      <Styles.RewardCell>${formatAmount(reward, USD_DECIMALS, 2, true)}</Styles.RewardCell>
      <Styles.ClaimCell
        className={cx({
          "highlight-current": account === userAccount,
        })}
      >
        {account === userAccount ? <Styles.ClaimButton>Claim ETH</Styles.ClaimButton> : null}
      </Styles.ClaimCell>
    </tr>
  );
}

export default function Leaderboard(props) {
  const { weekData, userWeekData, userAccount, ensName, currentView, selectedWeek } = props;
  const headings = ["Rank", "User", "Volume", "Reward", ""];

  return (
    <Styles.LeaderboardContainer hidden={currentView === "Personal"}>
      <Styles.Title>Your rewards</Styles.Title>
      <Styles.PersonalRewardsTableContainer>
        <Styles.RewardsTableBorder />
        {userWeekData && userWeekData.position ? (
          <Styles.RewardsTable>
            <Styles.RewardsTableHeader>
              <tr>
                {headings.map((heading) => (
                  <Styles.RewardsTableHeading key={heading}>{heading}</Styles.RewardsTableHeading>
                ))}
              </tr>
            </Styles.RewardsTableHeader>
            <tbody>
              <TableRow
                position={userWeekData.position}
                account={userAccount}
                ensName={ensName}
                volume={userWeekData.volume}
                reward={userWeekData.reward}
              />
            </tbody>
          </Styles.RewardsTable>
        ) : (
          <Styles.FullWidthText>
            <p>No previous trades</p>
          </Styles.FullWidthText>
        )}
      </Styles.PersonalRewardsTableContainer>
      <Styles.LeaderboardTitle>Leaderboard</Styles.LeaderboardTitle>
      <Styles.RewardsTableContainer>
        <Styles.RewardsTableBorder />
        <Styles.ScrollContainer>
          {weekData?.traders?.length > 1 ? (
            <Styles.RewardsTable>
              <Styles.RewardsTableHeader>
                <tr>
                  {headings.map((heading) => (
                    <Styles.RewardsTableHeading>{heading}</Styles.RewardsTableHeading>
                  ))}
                </tr>
              </Styles.RewardsTableHeader>
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
            </Styles.RewardsTable>
          ) : weekData?.traders?.length === 0 ? (
            <Styles.FullWidthText>
              <p>No data available for Week {selectedWeek}</p>
            </Styles.FullWidthText>
          ) : (
            <Styles.FullWidthText>
              <p>Loading week data...</p>
            </Styles.FullWidthText>
          )}
        </Styles.ScrollContainer>
      </Styles.RewardsTableContainer>
    </Styles.LeaderboardContainer>
  );
}
