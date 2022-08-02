import React from "react";
import { useENS, truncateMiddleEthAddress, formatAmount, USD_DECIMALS } from "../../Helpers";
import * as Styles from "./Rewards.styles";
import Davatar from "@davatar/react";

const MAX_LISTINGS = 100;

function TableRow({ position, account, volume, reward }) {
  const { ensName } = useENS(account);

  return (
    <tr>
      <Styles.RankCell>{position}</Styles.RankCell>
      <Styles.UserCell>
        <div>
          <Davatar size={32} address={account} />
          <div>
            <span>{truncateMiddleEthAddress(account)}</span>
            <span>{ensName}</span>
          </div>
        </div>
      </Styles.UserCell>
      <Styles.VolumeCell>${formatAmount(volume, USD_DECIMALS, 4, true)}</Styles.VolumeCell>
      <Styles.RewardCell>${formatAmount(reward, USD_DECIMALS, 2, true)}</Styles.RewardCell>
      <Styles.ClaimCell>
        <Styles.ClaimButton>Claim ETH</Styles.ClaimButton>
      </Styles.ClaimCell>
    </tr>
  );
}

export default function Leaderboard(props) {
  const { weekData, userWeekData, account, ensName } = props;

  const headings = ["Rank", "User", "Volume", "Reward", ""];
  return (
    <Styles.LeaderboardContainer>
      <Styles.Title>Your rewards</Styles.Title>
      <Styles.RewardsTableContainer>
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
                account={account}
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
      </Styles.RewardsTableContainer>
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
