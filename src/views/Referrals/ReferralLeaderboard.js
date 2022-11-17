import { useState } from "react";
import cx from "classnames";
import * as Styles from "./ReferralLeaderboard.styles";
import { USD_DECIMALS, formatAmount } from "../../Helpers";
import { TIER_DISCOUNT_INFO } from "../../config/referrals";
import { getTierIdDisplay } from "../../utils/referrals";
import liveIcon from "../../img/live.svg";
import { RoundDropdown } from "../../components/RewardsRoundSelect/RewardsRoundSelect";
import { decodeReferralCode } from "../../Api/referrals";
import { competitionPodiumContent } from "./presets";
import { numberToOrdinal } from "../../utils/common";


const TABLE_HEADINGS = [
  "Rank",
  "Referral Code",
  "Tier",
  "Traders Referred",
  "Number of Trades",
  "Total Volume Referred (USD)",
  "Rewards (USD)",
];

const COMPETITION_ROUND = '7';

export default function ReferralLeaderboard(props) {
  const [isPodiumShown, setIsPodiumShown] = useState(true);
  const {
    allRoundsRewardsData,
    allUsersRoundData,
    selectedRound,
    setSelectedRound,
    rewardsMessage,
    trackAction,
    userRoundData,
  } = props;

  const togglePodium = () => {
    setIsPodiumShown(!isPodiumShown);
  };

  const modifiedAllRoundsRewardsData = allRoundsRewardsData?.map((data) => {
    if (data?.round === COMPETITION_ROUND) {
      return {
        ...data,
        customRoundText: "Competition Round",
      };
    } else {
      return data;
    }
  });

  const modifiedRewardsMessage = [COMPETITION_ROUND].includes(selectedRound)
    ? "Competition Round"
    : rewardsMessage;

  return (
    <>
      {selectedRound === 7 && (
        <>
          <Styles.CompetitionRewardsToggle onClick={togglePodium}>
            <span>Referral Competition Rewards</span>
            <Styles.ChevronDown isOpen={isPodiumShown} />
          </Styles.CompetitionRewardsToggle>
          <Styles.CompetitionRewardsBanner isOpen={isPodiumShown}>
            <Styles.PodiumBackground />
            <Styles.CompetitionRewardsContainer className="desktop">
              {competitionPodiumContent.map(({ icon, prize, eligibility, className, mobileOnly }) => {
                if (!mobileOnly)
                  return (
                    <Styles.PodiumItem className={className} key={prize}>
                      {icon && <img src={icon} alt="podium icon" />}
                      <h3>{prize}</h3>
                      {eligibility}
                    </Styles.PodiumItem>
                  );
              })}
            </Styles.CompetitionRewardsContainer>
            <Styles.CompetitionRewardsContainer className="mobile">
              {competitionPodiumContent.map(({ icon, prize, eligibility, className, desktopOnly }) => {
                if (!desktopOnly)
                  return (
                    <Styles.PodiumItem className={className} key={prize}>
                      {icon && <img src={icon} alt="podium icon" />}
                      <h3>{prize}</h3>
                      {eligibility}
                    </Styles.PodiumItem>
                  );
              })}
            </Styles.CompetitionRewardsContainer>
          </Styles.CompetitionRewardsBanner>
        </>
      )}
      <UserStatsRow userRoundData={userRoundData} />
      <Styles.FlexBetweenContainer>
        <Styles.LeaderboardTitle>
          <img src={liveIcon} alt="Live" /> <span className="green">Live&nbsp;</span> <span>Referrals Leaderboard</span>
        </Styles.LeaderboardTitle>
        <RoundDropdown
          allRoundsRewardsData={modifiedAllRoundsRewardsData}
          setSelectedRound={setSelectedRound}
          rewardsMessage={modifiedRewardsMessage}
          trackAction={trackAction}
        />
      </Styles.FlexBetweenContainer>
      <Styles.RewardsTableContainer className="referrals-table">
        <Styles.RewardsTable>
          <thead>
            <tr>
              {TABLE_HEADINGS.map((heading) => (
                <Styles.RewardsTableHeading>{heading}</Styles.RewardsTableHeading>
              ))}
            </tr>
          </thead>
          <tbody>
            {allUsersRoundData?.map((row, index) => {
              if (row.volume.gt(0)) {
                return <TableRow key={index} row={row} isUserRow={row?.position === userRoundData?.position} isTable />;
              } else {
                return <></>;
              }
            })}
          </tbody>
        </Styles.RewardsTable>
      </Styles.RewardsTableContainer>
    </>
  );
}

const TableRow = ({ row, isUserRow, isTable }) => (
  <Styles.TableRow
    isUserRow={isUserRow}
    className={cx({
      highlight: isUserRow,
      "no-border": !isTable,
    })}
  >
    <Styles.TableCell>{numberToOrdinal(row.position)}</Styles.TableCell>
    <Styles.TableCell>{row.referralCode ? decodeReferralCode(row.referralCode) : `-`}</Styles.TableCell>
    <Styles.TableCell className="tier">
      <span>{`Tier ${getTierIdDisplay(row.tier)}`}</span> <span>{`${TIER_DISCOUNT_INFO[row.tier]}% discount`}</span>
    </Styles.TableCell>
    <Styles.TableCell>{row.tradersReferred}</Styles.TableCell>
    <Styles.TableCell>{row.numberOfTrades}</Styles.TableCell>
    <Styles.TableCell>${formatAmount(row.volume, USD_DECIMALS, 2, true, "0.00")}</Styles.TableCell>
    <Styles.TableCell>${formatAmount(row.totalRewardUsd, USD_DECIMALS, 2, true, "0.00")}</Styles.TableCell>
  </Styles.TableRow>
);

const UserStatsRow = ({ userRoundData }) => (
  <>
    <span>Your rewards</span>
    <Styles.RewardsTableContainer>
      {userRoundData?.position ? (
        <Styles.RewardsTable>
          <thead>
            <tr>
              {TABLE_HEADINGS.map((heading) => (
                <Styles.RewardsTableHeading>{heading}</Styles.RewardsTableHeading>
              ))}
            </tr>
          </thead>
          <tbody>
            <TableRow row={userRoundData} isUserRow />
          </tbody>
        </Styles.RewardsTable>
      ) : (
        <Styles.NoData>No rewards data available</Styles.NoData>
      )}
    </Styles.RewardsTableContainer>
  </>
);
