import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import Davatar from "@davatar/react";
import { useENS, truncateMiddleEthAddress, formatAmount, USD_DECIMALS } from "../../Helpers";
import liveIcon from "../../img/live.svg";
import closeIcon from "../../img/close.svg";
import { ReactComponent as PositionIndicator } from "../../img/position-indicator.svg";
import * as Styles from "./LiveLeaderboard.styles";

const ARBISCAN_URL = "https://arbiscan.io/address/";
const VISIBLE_DURATION = 5000;
const MIN_PERCENTAGE = 4;
const MAX_PERCENTAGE = 98;
let timeout;

export default function LiveLeaderboard(props) {
  const { userPosition, leaderboardData, fivePercentOfFees, isVisible, setIsVisible } = props;
  const [isCountdownTriggered, setIsCountdownTriggered] = useState(false);
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

  useEffect(() => {
    if (isVisible && !isCountdownTriggered) {
      timeout = setTimeout(() => {
        setIsVisible(false);
        setIsCountdownTriggered(true);
      }, VISIBLE_DURATION);
    }
  }, [isVisible, isCountdownTriggered, setIsVisible]);

  return (
    <Styles.LeaderboardContainer isActive={isVisible && userPosition} onMouseEnter={clearTimeout(timeout)}>
      <Styles.LeaderboardHeader>
        <Styles.FlexContainer>
          <img src={liveIcon} alt="Live" />
          <span className="green">Live</span> Leaderboard
        </Styles.FlexContainer>
        <Styles.CloseButton onClick={() => setIsVisible(false)}>
          <Styles.CloseIcon src={closeIcon} alt="Close" />
        </Styles.CloseButton>
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
      <ProgressToTopFive userPercentage={userPercentage === 0 ? MAX_PERCENTAGE : userPercentage} />
      <Styles.BottomContainer>
        {differenceBetweenUserAndTopFive && fivePercentOfFees && (
          <AmountToTopFive
            fivePercentOfFees={fivePercentOfFees}
            differenceBetweenUserAndTopFive={differenceBetweenUserAndTopFive}
          />
        )}
        <Styles.ViewLeaderboardButton exact to="/rewards#leaderboard">
          View Leaderboard
        </Styles.ViewLeaderboardButton>
      </Styles.BottomContainer>
    </Styles.LeaderboardContainer>
  );
}

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
    <Styles.UserIndicator percent={userPercentage || MIN_PERCENTAGE}>
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

const AmountToTopFive = ({ differenceBetweenUserAndTopFive, fivePercentOfFees }) => (
  <Styles.AmountText>
    <span>
      Trade <b>${formatAmount(differenceBetweenUserAndTopFive, USD_DECIMALS, 2, true)}</b> to share in
      <br /> <b>${formatAmount(fivePercentOfFees, USD_DECIMALS, 2, true)}</b> rewards
    </span>
  </Styles.AmountText>
);
