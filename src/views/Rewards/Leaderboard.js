import React from "react";
import * as Styles from "./Rewards.styles";

export default function Leaderboard(props) {
  const headings = ["Rank", "User", "Volume", "Reward"];
  // const {} = props;
  //   {
  //   week: number,
  //   traders: {
  //     user_address: string,
  //     volume: string,
  //     reward: string
  //   }[]
  // }[]
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
              <Styles.RankCell>22nd</Styles.RankCell>
            </tr>
          </tbody>
        </Styles.RewardsTable>
      </Styles.RewardsTableContainer>
    </Styles.LeaderboardContainer>
  );
}
