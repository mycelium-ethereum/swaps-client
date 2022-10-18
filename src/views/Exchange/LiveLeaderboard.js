import { useMemo } from "react";
import styled from "styled-components";
import { ethers } from "ethers";
import useSWR from "swr";
import { useWeb3React } from "@web3-react/core";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import Davatar from "@davatar/react";
import {
  getTracerServerUrl,
  useChainId,
  useENS,
  truncateMiddleEthAddress,
  formatAmount,
  USD_DECIMALS,
} from "../../Helpers";
import liveIcon from "../../img/live.svg";
import closeIcon from "../../img/close.svg";

const ARBISCAN_URL = "https://arbiscan.io/address/";

export default function LiveLeaderboard(props) {
  const { chainId } = useChainId();
  const { active, account, library } = useWeb3React();
  const { ensName } = useENS(account);
  const { data: currentRewardRound, error: failedFetchingRoundRewards } = useSWR(
    [getTracerServerUrl(chainId, "/tradingRewards"), "latest"],
    {
      fetcher: (url, round) => fetch(`${url}&round=${round}`).then((res) => res.json()),
    }
  );

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

  const userPosition = 12;

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
    <LeaderboardContainer>
      <LeaderboardHeader>
        <FlexContainer>
          <img src={liveIcon} alt="Live" />
          <span className="green">Live</span> Leaderboard
        </FlexContainer>
        <CloseButton>
          <CloseIcon src={closeIcon} alt="Close" />
        </CloseButton>
      </LeaderboardHeader>
      <LeaderboardBody>
        {userPosition &&
          twoAboveTwoBelow?.map(({ user_address, volume, position }, index) => {
            /* const isUserRow = user_address === account; */
            const isUserRow = position === userPosition;
            return (
              <UserRow opacity={getOpacity(position)} key={index} isUser={isUserRow}>
                <FlexContainer>
                  <Position>#{position}</Position>
                  <UserAddress>
                    {ensName ? (
                      <Davatar size={24} address={user_address} />
                    ) : (
                      <Jazzicon diameter={24} seed={jsNumberForAddress(user_address)} />
                    )}
                    <UserDetails>
                      <a href={`${ARBISCAN_URL}${account}`} rel="noopener noreferrer" target="_blank">
                        <span>{truncateMiddleEthAddress(account)}</span>
                      </a>
                      <span>{ensName}</span>
                    </UserDetails>
                  </UserAddress>
                </FlexContainer>
                <Volume>${formatAmount(volume, USD_DECIMALS, 2, true)}</Volume>
              </UserRow>
            );
          })}
      </LeaderboardBody>
    </LeaderboardContainer>
  );
}

export const LeaderboardContainer = styled.div`
  position: fixed;
  top: 60px;
  right: 16px;
  width: 388px;
  padding: 12px 16px;
  border-radius: 4px;
  border: 1px solid var(--cell-stroke);
  background: linear-gradient(119.04deg, #003100 -3.31%, rgba(0, 49, 0, 0) 76.25%), #000a00;
  z-index: 998;
`;

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
  justify-content: space-between;
  width: 100%;
  opacity: ${props.opacity};
  margin-bottom: 4px;
  height: 40px;
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
  ${UserAddress},
  ${Volume} {
    border-top: ${props.isUser ? "1px solid var(--action-active)" : "none"};
    border-bottom: ${props.isUser ? "1px solid var(--action-active)" : "none"};
  }
  ${Volume} {
    border-right: ${props.isUser ? "1px solid var(--action-active)" : "none"};
  }
  `
);

export const Position = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  height: 100%;
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
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
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
