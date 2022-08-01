import React from "react";
import * as Styles from "./Rewards.styles";

export default function Leaderboard(props) {
  const { userWeekData, account, ensName } = props;
  const headings = ["Rank", "User", "Volume", "Reward"];
  console.log(userWeekData);
  return (
    <Styles.LeaderboardContainer>
      <Styles.Title>Your rewards</Styles.Title>
      <Styles.RewardsTableContainer>
        <Styles.RewardsTableBorder />
        <Styles.RewardsTable>
          <Styles.RewardsTableHeader>
            <tr>
              {headings.map((heading) => (
                <Styles.RewardsTableHeading>{heading}</Styles.RewardsTableHeading>
              ))}
            </tr>
          </Styles.RewardsTableHeader>
          <tbody>
            <tr>
              {/* {userWeekData.map((userData) => (} */}
              <Styles.RankCell>{userWeekData.position}</Styles.RankCell>
            </tr>
          </tbody>
        </Styles.RewardsTable>
      </Styles.RewardsTableContainer>
    </Styles.LeaderboardContainer>
  );
}
