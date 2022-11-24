import { useMemo } from "react";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import Davatar from "@davatar/react";
import { useENS, truncateMiddleEthAddress, formatAmount, useChainId, USD_DECIMALS } from "../../../Helpers";
import { ReactComponent as PositionIndicator } from "../../../img/position-indicator.svg";
import * as Styles from "./LiveLeaderboard.styles";
import liveIcon from "../../../img/live.svg";

const ARBISCAN_URL = "https://arbiscan.io/address/";
const MIN_PERCENTAGE = 4;
const MAX_PERCENTAGE = 98;
let timeout;

export const LiveLeaderboard = ({ leaderboardData, userPosition }) => {
  const { account } = useWeb3React();
  const { ensName } = useENS(account);

  const twoAboveTwoBelow = useMemo(() => {
    if (!leaderboardData || !userPosition) {
      return undefined;
    }
    const twoAbove = userPosition + 2;
    const twoBelow = userPosition - 2;
    const twoAboveTwoBelow = leaderboardData
      ?.map((trader, index) => {
        if (index + 1 >= twoBelow && index + 1 <= twoAbove) {
          trader.position = index + 1;
          return trader;
        } else {
          return undefined;
        }
      })
      .filter(Boolean);
    return twoAboveTwoBelow;
  }, [leaderboardData, userPosition]);

  const userPercentage = useMemo(
    () => 100 - (userPosition / leaderboardData?.length) * 100,
    [leaderboardData, userPosition]
  );

  const lastInTopFive = useMemo(() => {
    if (!leaderboardData || !userPosition) {
      return undefined;
    }
    const topFiveIndex = Math.floor(userPosition / leaderboardData?.length);
    const topFivePercentUser = leaderboardData[topFiveIndex];
    return topFivePercentUser;
  }, [leaderboardData, userPosition]);

  const differenceBetweenUserAndTopFive = useMemo(() => {
    if (!leaderboardData || !userPosition || !lastInTopFive) {
      return undefined;
    }
    const difference = ethers.BigNumber.from(lastInTopFive.volume).sub(
      ethers.BigNumber.from(leaderboardData[userPosition - 1].volume)
    );
    return difference;
  }, [leaderboardData, userPosition, lastInTopFive]);

  const getOpacity = (position) => {
    if (position === userPosition) {
      return 1;
    } else if (position === userPosition + 1 || position === userPosition - 1) {
      return 0.8;
    } else {
      return 0.4;
    }
  };

  return (
    <Styles.LeaderboardContainer onMouseEnter={clearTimeout(timeout)}>
      <Styles.LeaderboardHeader>
        <Styles.FlexContainer>
          <img src={liveIcon} alt="Live" />
          <span className="green">Live</span> Leaderboard
        </Styles.FlexContainer>
      </Styles.LeaderboardHeader>
      <Styles.LeaderboardBody>
        {userPosition &&
          twoAboveTwoBelow?.map(({ user_address, volume, position }, index) => {
            /* const isUserRow = user_address === account; */
            const isUserRow = position === userPosition;
            return (
              <TableRow
                key={index}
                isUserRow={isUserRow}
                position={position}
                opacity={getOpacity(position)}
                user_address={user_address}
                volume={volume}
                ensName={ensName}
              />
            );
          })}
      </Styles.LeaderboardBody>
      <ProgressToTopFive
        userPercentage={userPercentage === 0 && leaderboardData.length === 1 ? MAX_PERCENTAGE : userPercentage}
      />
      <Styles.BottomContainer>
        {differenceBetweenUserAndTopFive && (
          <AmountToTopFive differenceBetweenUserAndTopFive={differenceBetweenUserAndTopFive} />
        )}
        <Styles.ViewLeaderboardButton exact to="/rewards#leaderboard">
          View Leaderboard
        </Styles.ViewLeaderboardButton>
      </Styles.BottomContainer>
    </Styles.LeaderboardContainer>
  );
};

const TableRow = ({ position, opacity, isUserRow, user_address, volume, ensName }) => (
  <Styles.UserRow opacity={opacity} isUser={isUserRow}>
    <Styles.Position>#{position}</Styles.Position>
    <Styles.BorderOutline>
      <Styles.UserAddress>
        {ensName ? (
          <Davatar size={24} address={user_address} />
        ) : (
          <Jazzicon diameter={24} seed={jsNumberForAddress(user_address)} />
        )}
        <Styles.UserDetails>
          <a href={`${ARBISCAN_URL}${user_address}`} rel="noopener noreferrer" target="_blank">
            <span>{truncateMiddleEthAddress(user_address)}</span>
          </a>
          <span>{ensName}</span>
        </Styles.UserDetails>
      </Styles.UserAddress>
      <Styles.Volume>${formatAmount(volume, USD_DECIMALS, 2, true)}</Styles.Volume>
    </Styles.BorderOutline>
  </Styles.UserRow>
);

const ProgressToTopFive = ({ userPercentage }) => (
  <Styles.ProgressBarContainer>
    <Styles.ProgressBar />
    <Styles.UserIndicator percent={userPercentage === 0 ? MIN_PERCENTAGE : userPercentage}>
      <PositionIndicator />
      <Styles.IndicatorBar />
      <Styles.IndicatorLabel>You</Styles.IndicatorLabel>
    </Styles.UserIndicator>
    <Styles.FivePercentIndicator>
      <PositionIndicator />
      <Styles.IndicatorBar />
      <Styles.IndicatorLabel>
        Top <Styles.BoldPercentage>5%</Styles.BoldPercentage>
      </Styles.IndicatorLabel>
    </Styles.FivePercentIndicator>
  </Styles.ProgressBarContainer>
);

const AmountToTopFive = ({ differenceBetweenUserAndTopFive }) => (
  <Styles.AmountText>
    <span>
      Trade <b>${formatAmount(differenceBetweenUserAndTopFive, USD_DECIMALS, 2, true)}</b> to unlock Top 5% Rewards
    </span>
  </Styles.AmountText>
);
