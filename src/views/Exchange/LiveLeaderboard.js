import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { ethers } from "ethers";
import useSWR from "swr";
import { useWeb3React } from "@web3-react/core";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import Davatar from "@davatar/react";
import { NavLink } from "react-router-dom";
import {
  getTracerServerUrl,
  useChainId,
  useENS,
  truncateMiddleEthAddress,
  formatAmount,
  fetcher,
  USD_DECIMALS,
} from "../../Helpers";
import liveIcon from "../../img/live.svg";
import closeIcon from "../../img/close.svg";
import { ReactComponent as PositionIndicator } from "../../img/position-indicator.svg";
import { getFeeHistory, SECONDS_PER_WEEK } from "../../data/Fees";
import { useMarketMakingFeesSince, useFeesSince, useInfoTokens } from "../../Api";
import { getWhitelistedTokens } from "../../data/Tokens";
import { getContract } from "../../Addresses";
import ReaderV2 from "../../abis/ReaderV2.json";
import { getUnclaimedFees } from "../Dashboard/DashboardV2";

const ARBISCAN_URL = "https://arbiscan.io/address/";
const VISIBLE_DURATION = 5000;
const MIN_PERCENTAGE = 4;

export default function LiveLeaderboard(props) {
  const { isVisible, setIsVisible } = props;
  const [isCountdownTriggered, setIsCountdownTriggered] = useState(false);
  const { chainId } = useChainId();
  const { active, account, library } = useWeb3React();
  const { ensName } = useENS(account);
  const { data: currentRewardRound, error: failedFetchingRoundRewards } = useSWR(
    [getTracerServerUrl(chainId, "/tradingRewards"), "5"],
    {
      fetcher: (url, round) => fetch(`${url}&round=${round}`).then((res) => res.json()),
    }
  );
  const whitelistedTokens = getWhitelistedTokens(chainId);
  const whitelistedTokenAddresses = whitelistedTokens.map((token) => token.address);
  const stableTokens = whitelistedTokens.filter((t) => t.isStable);
  const readerAddress = getContract(chainId, "Reader");
  const vaultAddress = getContract(chainId, "Vault");

  const { data: fees } = useSWR([`Dashboard:fees:${active}`, chainId, readerAddress, "getFees", vaultAddress], {
    fetcher: fetcher(library, ReaderV2, [whitelistedTokenAddresses]),
  });

  const feeHistory = getFeeHistory(chainId);
  const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);

  const from = feeHistory[0]?.to;
  const to = from + SECONDS_PER_WEEK * 2;
  const currentMMFees = useMarketMakingFeesSince(chainId, from, to, stableTokens);
  const currentGraphFees = useFeesSince(chainId, from, to);
  const currentUnclaimedFees = getUnclaimedFees(whitelistedTokenAddresses, infoTokens, fees);
  let totalCurrentFees, currentFees, fivePercentOfFees;
  if (currentUnclaimedFees && currentGraphFees) {
    currentFees = currentUnclaimedFees.gt(currentGraphFees) ? currentUnclaimedFees : currentGraphFees;
  }

  if (currentFees && currentMMFees) {
    totalCurrentFees = currentFees.add(currentMMFees);
    fivePercentOfFees = totalCurrentFees.mul(5).div(100);
  }

  const roundData = useMemo(() => {
    if (!currentRewardRound || !!currentRewardRound?.message) {
      return undefined;
    }
    const rewards = currentRewardRound.rewards
      ?.sort((a, b) => b.volume - a.volume)
      .map((trader) => {
        const positionReward = ethers.BigNumber.from(trader.reward);
        const degenReward = ethers.BigNumber.from(trader.degen_reward);

        return {
          ...trader,
          totalReward: positionReward.add(degenReward),
          positionReward,
          degenReward,
        };
      }); // Sort traders by highest to lowest in volume
    return {
      ...currentRewardRound,
      rewards,
    };
  }, [currentRewardRound]);

  // Get volume, position and reward from user round data
  // const userPosition = useMemo(() => {
  //   if (!currentRewardRound) {
  //     return undefined;
  //   }
  //   const leaderBoardIndex = currentRewardRound.rewards?.findIndex(
  //     (trader) => trader.user_address.toLowerCase() === account?.toLowerCase()
  //   );
  //   return leaderBoardIndex + 1;
  // }, [account, currentRewardRound]);

  const userPosition = roundData.rewards.length;

  const twoAboveTwoBelow = useMemo(() => {
    if (!roundData || !userPosition) {
      return undefined;
    }
    const twoAbove = userPosition + 2;
    const twoBelow = userPosition - 2;
    const twoAboveTwoBelow = roundData.rewards
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
  }, [roundData, userPosition]);

  const userPercentage = useMemo(
    () => 100 - (userPosition / roundData?.rewards?.length) * 100,
    [roundData, userPosition]
  );

  const lastInTopFive = useMemo(() => {
    if (!roundData || !userPosition) {
      return undefined;
    }
    const topFiveIndex = Math.floor(userPosition / roundData?.rewards?.length);
    const topFivePercentUser = roundData.rewards[topFiveIndex];
    return topFivePercentUser;
  }, [roundData, userPosition]);

  const differenceBetweenUserAndTopFive = useMemo(() => {
    if (!roundData || !userPosition || !lastInTopFive) {
      return undefined;
    }
    const difference = ethers.BigNumber.from(lastInTopFive.volume).sub(
      ethers.BigNumber.from(roundData.rewards[userPosition - 1].volume)
    );
    return difference;
  }, [roundData, userPosition, lastInTopFive]);

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
      setTimeout(() => {
        setIsVisible(false);
        setIsCountdownTriggered(true);
      }, VISIBLE_DURATION);
    }
  }, [isVisible, isCountdownTriggered, setIsVisible]);

  return (
    <LeaderboardContainer isActive={true}>
      <LeaderboardHeader>
        <FlexContainer>
          <img src={liveIcon} alt="Live" />
          <span className="green">Live</span> Leaderboard
        </FlexContainer>
        <CloseButton onClick={() => setIsVisible(false)}>
          <CloseIcon src={closeIcon} alt="Close" />
        </CloseButton>
      </LeaderboardHeader>
      <LeaderboardBody>
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
      </LeaderboardBody>
      <ProgressToTopFive userPercentage={userPercentage} />
      <BottomContainer>
        <AmountToTopFive
          fivePercentOfFees={fivePercentOfFees}
          differenceBetweenUserAndTopFive={differenceBetweenUserAndTopFive}
        />
        <ViewLeaderboardButton exact to="/rewards#leaderboard">
          View Leaderboard
        </ViewLeaderboardButton>
      </BottomContainer>
    </LeaderboardContainer>
  );
}

const TableRow = ({ position, opacity, isUserRow, user_address, volume, ensName }) => (
  <UserRow opacity={opacity} isUser={isUserRow}>
    <Position>#{position}</Position>
    <BorderOutline>
      <UserAddress>
        {ensName ? (
          <Davatar size={24} address={user_address} />
        ) : (
          <Jazzicon diameter={24} seed={jsNumberForAddress(user_address)} />
        )}
        <UserDetails>
          <a href={`${ARBISCAN_URL}${user_address}`} rel="noopener noreferrer" target="_blank">
            <span>{truncateMiddleEthAddress(user_address)}</span>
          </a>
          <span>{ensName}</span>
        </UserDetails>
      </UserAddress>
      <Volume>${formatAmount(volume, USD_DECIMALS, 2, true)}</Volume>
    </BorderOutline>
  </UserRow>
);

const ProgressToTopFive = ({ userPercentage }) => (
  <ProgressBarContainer>
    <ProgressBar />
    <UserIndicator percent={userPercentage || MIN_PERCENTAGE}>
      <PositionIndicator />
      <IndicatorBar />
      <IndicatorLabel>You</IndicatorLabel>
    </UserIndicator>
    <FivePercentIndicator>
      <PositionIndicator />
      <IndicatorBar />
      <IndicatorLabel>
        Top <BoldPercentage>5%</BoldPercentage>
      </IndicatorLabel>
    </FivePercentIndicator>
  </ProgressBarContainer>
);

const AmountToTopFive = ({ differenceBetweenUserAndTopFive, fivePercentOfFees }) => (
  <div>
    <span>
      Trade <b>${formatAmount(differenceBetweenUserAndTopFive, USD_DECIMALS, 2, true)}</b>
    </span>
    <br />
    <span>
      to share in <b>${formatAmount(fivePercentOfFees, USD_DECIMALS, 2, true)}</b> rewards
    </span>
  </div>
);

export const LeaderboardContainer = styled.div(
  (props) => `
  position: fixed;
  top: 60px;
  right: 16px;
  width: 388px;
  padding: 12px 16px;
  border-radius: 4px;
  border: 1px solid var(--cell-stroke);
  background: linear-gradient(119.04deg, #003100 -3.31%, rgba(0, 49, 0, 0) 76.25%), #000a00;
  z-index: 998;
  transition: opacity 0.3s ease;
  pointer-events: ${props.isActive ? "all" : "none"};
  opacity: ${props.isActive ? 1 : 0};
`
);

export const LeaderboardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: bold;
  width: 100%;
  margin-bottom: 8px;
  .green {
    color: var(--action-active);
    display: inline-block;
    margin-right: 8px;
  }
  img {
    width: 27px;
    height: 20px;
    margin-right: 8px;
  }
`;

export const LeaderboardBody = styled.div`
  margin-bottom: 36px;
  padding-right: 24px;
`;

export const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

export const CloseButton = styled.button`
  background-color: transparent;
  border: none;
`;

export const CloseIcon = styled.img`
  width: 10px !important;
  height: 10px !important;
  margin-right: 0 !important;
`;

export const UserRow = styled.div(
  (props) => `
  display: flex;
  align-items: center;
  width: 100%;
  opacity: ${props.opacity};
  margin-bottom: 4px;
  min-height: 40px;
  filter: ${props.isUser ? "drop-shadow(0px 0px 10px rgba(9, 130, 0, 0.6))" : "none"};
  background: ${props.isUser ? "linear-gradient(111.31deg, #003000 23.74%, rgba(0, 48, 0, 0) 99.29%)" : "none"};
  ${Position} {
    background-color: ${props.isUser ? "var(--action-active)" : "transparent"};
  }
  ${Position},
  ${UserAddress},
  ${Volume} {
    font-weight: ${props.isUser ? "bold" : "400"};
  }
  ${BorderOutline} {
    border-color: ${props.isUser ? "var(--action-active)" : "transparent"};
  }
  `
);

export const Position = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  width: 80px;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
`;

export const UserAddress = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0 30px 0 16px;
  height: 100%;
`;

export const Volume = styled.span`
  display: inline-flex;
  align-items: center;
  padding-right: 5px;
  height: 100%;
`;

export const UserDetails = styled.div`
  margin-left: 8px;
  a {
    text-decoration: none;
  }
  span {
    display: block;
  }
  span:nth-child(2) {
    font-size: 12px;
    line-height: 18px;
    color: var(--text-secondary);
  }
`;

export const BorderOutline = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  border-width: 1px;
  border-left-width: 0;
  border-style: solid;
  height: 40px;
`;

export const ProgressBarContainer = styled.div`
  width: calc(100% + 32px);
  height: 16px;
  background-color: rgba(0, 48, 0, 0.2);
  transform: translateX(-16px);
  margin-bottom: 16px;
`;

export const ProgressBar = styled.div(
  (props) => `
  position: relative;
  height: 100%;
  width: ${props.percent}%;
  background: linear-gradient(90.35deg, rgba(79, 224, 33, 0.2) 5.23%, rgba(79, 224, 33, 0) 208.5%);
  &:after {
    content: "";
    position: absolute;
    width: 9%;
    right: 0;
    height: 100%;
    background: rgba(255, 255, 255, 0.2);
  }
`
);

export const IndicatorLabel = styled.span`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: black;
  z-index: 1;
  font-size: 9px;
`;

export const IndicatorBar = styled.span`
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 5px;
  height: 100%;
`;

export const Indicator = styled.div`
  display: flex;
  justify-content: center;
  text-align: center;
  position: absolute;
  bottom: 0;
  width: 27px;
  height: 51px;
`;

export const UserIndicator = styled(Indicator)(
  (props) => `
  z-index: 2;
  bottom: 0;
  left: calc(${props.percent}% - 16px);
  color: var(--action-active);
  ${IndicatorBar} {
    background-color: var(--action-active);
  }
  ${IndicatorLabel} {
    top: 10px;
  }
`
);

export const FivePercentIndicator = styled(Indicator)`
  right: 5%;
  color: white;

  ${IndicatorBar} {
    background-color: white;
  }
  ${IndicatorLabel} {
    top: 2px;
  }
`;

export const BoldPercentage = styled.span`
  font-weight: bold;
  font-size: 12px;
`;

export const BottomContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ViewLeaderboardButton = styled(NavLink)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  white-space: nowrap;
  height: 40px;
  background-color: var(--action-active);
  border-radius: 4px;
  border: none;
  transition: background-color 0.3s ease;
  color: white;
  text-decoration: none;
  &:hover {
    background-color: var(--cell-stroke);
  }
`;
