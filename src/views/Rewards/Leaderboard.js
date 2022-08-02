import React from "react";
import { useENS, truncateMiddleEthAddress, formatAmount, USD_DECIMALS } from "../../Helpers";
import * as Styles from "./Rewards.styles";
import Davatar from "@davatar/react";

const MAX_LISTINGS = 25;

function TableRow({ position, account, userAccount, volume, reward }) {
  const { ensName } = useENS(account);

  return (
    <tr>
      <Styles.RankCell>{position}</Styles.RankCell>
      <Styles.UserCell>
        <div>
          {!!account && <Davatar size={32} address={account} />}
          <Styles.UserDetails>
            <span>{truncateMiddleEthAddress(account)}</span>
            <span>{ensName}</span>
          </Styles.UserDetails>
        </div>
      </Styles.UserCell>
      <Styles.VolumeCell>${formatAmount(volume, USD_DECIMALS, 2, true)}</Styles.VolumeCell>
      <Styles.RewardCell>${formatAmount(reward, USD_DECIMALS, 2, true)}</Styles.RewardCell>
      <Styles.ClaimCell>
        {account === userAccount ? <Styles.ClaimButton>Claim ETH</Styles.ClaimButton> : null}
      </Styles.ClaimCell>
    </tr>
  );
}

export default function Leaderboard(props) {
  const { weekData, userWeekData, userAccount, ensName, currentView } = props;

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
                  <Styles.RewardsTableHeading>{heading}</Styles.RewardsTableHeading>
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
        {weekData && weekData.traders ? (
          <Styles.RewardsTable>
            <Styles.RewardsTableHeader>
              <tr>
                {headings.map((heading) => (
                  <Styles.RewardsTableHeading>{heading}</Styles.RewardsTableHeading>
                ))}
              </tr>
            </Styles.RewardsTableHeader>
            <tbody>
              {weekData.traders.slice(0, MAX_LISTINGS).map(({ user_address, volume, reward }, index) => (
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
        ) : (
          <Styles.FullWidthText>
            <p>Loading week data...</p>
          </Styles.FullWidthText>
        )}
      </Styles.RewardsTableContainer>
    </Styles.LeaderboardContainer>
  );
}
