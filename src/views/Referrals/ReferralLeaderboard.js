import * as Styles from "./ReferralLeaderboard.styles";
import { getTierIdDisplay, numberToOrdinal, TIER_DISCOUNT_INFO, USD_DECIMALS, formatAmount } from "../../Helpers";
// import { getCodeByAccount } from "../../Api/referrals";
import liveIcon from "../../img/live.svg";
import { RoundDropdown } from "../../components/RewardsRoundSelect/RewardsRoundSelect";
import { decodeReferralCode } from "../../Api/referrals";

const TABLE_HEADINGS = [
  "Rank",
  "Referral Code",
  // "Tier",
  // "Traders Referred",
  // "Number of Trades",
  "Total Volume Referred (USD)",
  "Rewards (USD)",
];

export default function ReferralLeaderboard(props) {
  const {
    active,
    account,
    allRoundsRewardsData,
    setSelectedRound,
    rewardsMessage,
    trackAction,
    timeTillRewards,
    userRoundData,
    referrerTier,
    referralCodeInString,
    currentRoundData,
  } = props;

  return (
    <div>
      <span>Your rewards</span>
      <Styles.RewardsTableContainer>
        <Styles.RewardsTable>
          <thead>
            <tr>
              {TABLE_HEADINGS.map((heading) => (
                <Styles.RewardsTableHeading>{heading}</Styles.RewardsTableHeading>
              ))}
            </tr>
          </thead>
          <tbody>
            <Styles.UserRow className="no-border highlight">
              <Styles.TableCell className="bold">{numberToOrdinal(userRoundData?.position)}</Styles.TableCell>
              <Styles.TableCell className="bold">{referralCodeInString ?? "Jeff123"}</Styles.TableCell>
              <Styles.TableCell className="tier">
                <span>{`Tier ${getTierIdDisplay(referrerTier)}`}</span>{" "}
                <span>{`${TIER_DISCOUNT_INFO[referrerTier]}% discount`}</span>
              </Styles.TableCell>
              <Styles.TableCell>${formatAmount(userRoundData?.volume, USD_DECIMALS, 2, true, "0.00")}</Styles.TableCell>
              <Styles.TableCell>
                ${formatAmount(userRoundData?.totalRewardUsd, USD_DECIMALS, 2, true, "0.00")}
              </Styles.TableCell>
            </Styles.UserRow>
          </tbody>
        </Styles.RewardsTable>
      </Styles.RewardsTableContainer>
      <Styles.FlexBetweenContainer>
        <Styles.LeaderboardTitle>
          <img src={liveIcon} alt="Live" /> <span className="green">Live&nbsp;</span> <span>Referrals Leaderboard</span>
        </Styles.LeaderboardTitle>
        <RoundDropdown
          allRoundsRewardsData={allRoundsRewardsData}
          setSelectedRound={setSelectedRound}
          rewardsMessage={rewardsMessage}
          trackAction={trackAction}
        />
      </Styles.FlexBetweenContainer>
      <Styles.RewardsTableContainer>
        <Styles.RewardsTable>
          <thead>
            <tr>
              {TABLE_HEADINGS.map((heading) => (
                <Styles.RewardsTableHeading>{heading}</Styles.RewardsTableHeading>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRoundData?.map((row, index) => {
              return (
                <Styles.UserRow key={index}>
                  <Styles.TableCell>{numberToOrdinal(index + 1)}</Styles.TableCell>
                  <Styles.TableCell>{decodeReferralCode(row.referral_code)}</Styles.TableCell>
                  {/* <Styles.TableCell className="tier">
                    <span>{`Tier ${getTierIdDisplay(row.tier)}`}</span>{" "}
                    <span>{`${TIER_DISCOUNT_INFO[row.tier]}% discount`}</span>
                  </Styles.TableCell> */}

                  <Styles.TableCell>${formatAmount(row.volume, USD_DECIMALS, 2, true, "0.00")}</Styles.TableCell>
                  <Styles.TableCell>
                    ${formatAmount(row.totalRewardUsd, USD_DECIMALS, 2, true, "0.00")}
                  </Styles.TableCell>
                </Styles.UserRow>
              );
            })}
          </tbody>
        </Styles.RewardsTable>
      </Styles.RewardsTableContainer>
    </div>
  );
}
