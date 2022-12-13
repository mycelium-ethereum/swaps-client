import { useMemo, useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import Davatar from "@davatar/react";
import { useENS, truncateMiddleEthAddress, formatAmount, USD_DECIMALS } from "../../../Helpers";
// import { ReactComponent as PositionIndicator } from "../../../img/position-indicator.svg";
import * as Styles from "./LiveLeaderboard.styles";
import liveIcon from "../../../img/nav/live.svg";
import { useLocation } from "react-router-dom";

const ARBISCAN_URL = "https://arbiscan.io/address/";
// const MIN_UI_PERCENTAGE = 10;
// const MAX_UI_PERCENTAGE = 91.3;
const BOTTOM_PERCENT = 95;

export const LiveLeaderboard = ({ leaderboardData, userPosition, moveUser }) => {
  const location = useLocation();
  const { account } = useWeb3React();
  const { ensName } = useENS(account);

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

  const userPositionData = useMemo(() => {
    return leaderboardData.find((_trader, index) => index + 1 === userPosition)
  }, [userPosition, leaderboardData])

  return (
    <Styles.LeaderboardContainer>
      <Styles.LeaderboardHeader>
        <span>TRADING LEADERBOARD</span>
        <span>
          <img src={liveIcon} alt="live" />
          &nbsp;LIVE
        </span>
      </Styles.LeaderboardHeader>
      <Styles.LeaderboardBody>
        {userPosition &&
        <Styles.SlidingLeaderboardBody userPosition={userPosition}>
          {leaderboardData?.map(({ user_address, volume }, index) => {
              const position = index + 1;
              const isUserRow = position === userPosition;
              return (
                <TableRow
                  key={user_address}
                  isUserRow={isUserRow}
                  position={position}
                  opacity={getOpacity(position)}
                  user_address={user_address}
                  volume={volume}
                  ensName={ensName}
                />
              );
            })}
        </Styles.SlidingLeaderboardBody>
        }
      </Styles.LeaderboardBody>
      {userPositionData && (
        <>
        <UserTableRow
          position={userPosition}
          user_address={userPositionData.user_address}
          volume={userPositionData.volume}
          ensName={ensName}
        />
        <Styles.UserPositionOverlay position={userPosition}/>
        </>
      )}
      {/* <ProgressToTopFive
        userPercentage={
          userPercentage === 0 || leaderboardData.length === 1 || userPercentage > MAX_UI_PERCENTAGE
            ? MAX_UI_PERCENTAGE
            : userPercentage
        }
      /> */}
      <Styles.BottomContainer>
        {differenceBetweenUserAndTopFive && userPercentage >= 0 && (
          <AmountToTopFive
            differenceBetweenUserAndTopFive={differenceBetweenUserAndTopFive}
            userPercentage={userPercentage}
          />
        )}
        {location?.pathname !== "/" && <Styles.TradeNowButton to="/">Trade Now</Styles.TradeNowButton>}
      </Styles.BottomContainer>
    </Styles.LeaderboardContainer>
  );
};

const TableRow = ({ position, opacity, isUserRow, ensName, user_address, volume }) => (
  <Styles.ArbiscanLink href={`${ARBISCAN_URL}${user_address}`} rel="noopener noreferrer" target="_blank">
    <Styles.UserRow opacity={opacity} isUser={isUserRow} className={`table-row`}>
      <Styles.Position>#{position}</Styles.Position>
      {!isUserRow &&
      <Styles.BorderOutline isUser={isUserRow}>
        <Styles.UserAddress>
          {isUserRow
            ? <Davatar size={16} address={user_address} />
            : <Jazzicon diameter={16} seed={jsNumberForAddress(user_address)} />
          }
          <Styles.UserDetails>
            <span>{truncateMiddleEthAddress(user_address)}</span>
            {isUserRow && <span>{ensName}</span>}
          </Styles.UserDetails>
        </Styles.UserAddress>
        <Styles.Volume>${formatAmount(volume, USD_DECIMALS, 2, true)}</Styles.Volume>
      </Styles.BorderOutline>
      }
    </Styles.UserRow>
  </Styles.ArbiscanLink>
)

const UserTableRow = ({ user_address, volume, ensName, position }) => (
  <Styles.ArbiscanLink href={`${ARBISCAN_URL}${user_address}`} rel="noopener noreferrer" target="_blank">
    <Styles.UserRowOverlay opacity={1} isUser={true} position={position}>
      <Styles.BorderOutline isUser={true}>
        <Styles.UserAddress>
            <Davatar size={16} address={user_address} />
          <Styles.UserDetails>
            <span>{truncateMiddleEthAddress(user_address)}</span>
            <span>{ensName}</span>
          </Styles.UserDetails>
        </Styles.UserAddress>
        <Styles.Volume>${formatAmount(volume, USD_DECIMALS, 2, true)}</Styles.Volume>
      </Styles.BorderOutline>
    </Styles.UserRowOverlay>
  </Styles.ArbiscanLink>
);

// const ProgressToTopFive = ({ userPercentage }) => (
//   <Styles.ProgressBarContainer>
//     <Styles.ProgressBar />
//     <Styles.UserIndicator percent={userPercentage === 0 || isNaN(userPercentage) ? MIN_UI_PERCENTAGE : userPercentage}>
//       <PositionIndicator />
//       <Styles.IndicatorBar />
//       <Styles.IndicatorLabel>You</Styles.IndicatorLabel>
//     </Styles.UserIndicator>
//     <Styles.FivePercentIndicator>
//       <PositionIndicator />
//       <Styles.IndicatorBar />
//       <Styles.IndicatorLabel>
//         Top <Styles.BoldPercentage>5%</Styles.BoldPercentage>
//       </Styles.IndicatorLabel>
//     </Styles.FivePercentIndicator>
//   </Styles.ProgressBarContainer>
// );

const AmountToTopFive = ({ differenceBetweenUserAndTopFive, userPercentage }) => (
  <Styles.AmountText>
    {userPercentage >= BOTTOM_PERCENT ? (
      <span>You are in the top 5%! Keep trading to hold your position.</span>
    ) : (
      <span>
        Trade <b>${formatAmount(differenceBetweenUserAndTopFive, USD_DECIMALS, 2, true)}</b> to unlock Top 5% Rewards
      </span>
    )}
  </Styles.AmountText> 
);
