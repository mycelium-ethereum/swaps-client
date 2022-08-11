import React, { useState, useEffect } from "react";
import { useENS, truncateMiddleEthAddress, formatAmount, USD_DECIMALS } from "../../Helpers";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import cx from "classnames";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  ConnectWalletText,
  ConnectWalletOverlay,
  LeaderboardContainer,
  Title,
  PersonalRewardsTableContainer,
  RewardsButton,
  RewardsTableBorder,
  RewardsTable,
  RewardsTableHeader,
  RewardsTableHeading,
  FullWidthText,
  LeaderboardTitle,
  RewardsTableContainer,
  RankCell,
  UserCell,
  EmptyAvatar,
  UserDetails,
  VolumeCell,
  RewardCell,
  ClaimCell,
  ClaimButton,
  WalletIcon,
  TopFiftyRow,
  TopFiftyRowCell,
} from "./Rewards.styles";
const DEFAULT_LISTINGS_COUNT = 50;
const ARBISCAN_URL = "https://arbiscan.io/address/";
const headings = ["Rank", "User", "Volume", "Reward", ""];

function RewardsTableWrapper({ children }) {
  return (
    <RewardsTable>
      <RewardsTableHeader>
        <tr>
          {headings.map((heading) => (
            <RewardsTableHeading key={heading}>{heading}</RewardsTableHeading>
          ))}
        </tr>
      </RewardsTableHeader>
      <tbody>{children ? children : null}</tbody>
    </RewardsTable>
  );
}

function TopFiftyIndicatorRow() {
  return (
    <TopFiftyRow>
      <TopFiftyRowCell colSpan={5} className="">
        <span>Top 50% of traders</span>
      </TopFiftyRowCell>
    </TopFiftyRow>
  );
}

function TableRow({ totalTraders, position, account, userAccount, volume, reward, trackAction }) {
  const { ensName } = useENS(account);
  return (
    <>
      {position === Math.ceil(totalTraders / 2) + 1 ? <TopFiftyIndicatorRow /> : null}
      <tr
        className={cx({
          "highlight-current": account === userAccount,
        })}
      >
        <RankCell>{position}</RankCell>
        <UserCell>
          <div>
            {account ? <Jazzicon diameter={32} seed={jsNumberForAddress(account)} /> : <EmptyAvatar />}
            <UserDetails>
              <a href={`${ARBISCAN_URL}${account}`} rel="noopener noreferrer" target="_blank">
                <span>{truncateMiddleEthAddress(account)}</span>
              </a>
              {/* <span>{ensName}</span> */}
            </UserDetails>
          </div>
        </UserCell>
        <VolumeCell>${formatAmount(volume, USD_DECIMALS, 2, true)}</VolumeCell>
        <RewardCell>${formatAmount(reward, USD_DECIMALS, 2, true)}</RewardCell>
        <ClaimCell>
          {account === userAccount ? (
            <ClaimButton
              onClick={() => {
                // TODO: Add claim reward function
                trackAction("Button clicked", {
                  buttonName: "Claim rewards",
                });
              }}
            >
              Claim ETH
            </ClaimButton>
          ) : null}
        </ClaimCell>
      </tr>
    </>
  );
}

export default function Leaderboard(props) {
  const { weekData, userweekData, userAccount, ensName, currentView, selectedWeek, connectWallet, trackAction } = props;
  const [hasMore, setHasMore] = useState(true);
  const [index, setIndex] = useState(DEFAULT_LISTINGS_COUNT);

  const fetchMoreData = () => {
    let newIndex = index + DEFAULT_LISTINGS_COUNT;
    console.log(newIndex);
    if (newIndex >= weekData?.traders.length) {
      setHasMore(false);
      setIndex(weekData?.traders.length);
      return;
    }
    setTimeout(() => {
      setIndex(newIndex);
    }, 1000);
  };

  useEffect(() => {
    setIndex(DEFAULT_LISTINGS_COUNT);
  }, [selectedWeek]);

  return (
    <LeaderboardContainer hidden={currentView === "Personal"}>
      <Title>Your rewards</Title>
      <PersonalRewardsTableContainer>
        <RewardsTableBorder />
        {userAccount && userweekData && userweekData.position ? (
          <RewardsTableWrapper>
            <TableRow
              position={userweekData.position}
              account={userAccount}
              ensName={ensName}
              volume={userweekData.volume}
              reward={userweekData.reward}
              trackAction={trackAction}
            />
          </RewardsTableWrapper>
        ) : userAccount ? (
          <FullWidthText>
            <p>No previous trades</p>
          </FullWidthText>
        ) : (
          <ConnectWalletOverlay>
            {/* Empty table as placeholder */}
            <RewardsTableWrapper>
              <tr>
                <td colSpan={5}>
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                </td>
              </tr>
            </RewardsTableWrapper>
            <ConnectWalletText>
              <span>Connect to wallet to view your rewards</span>
              <RewardsButton
                className="App-cta large"
                onClick={() => {
                  connectWallet();
                  trackAction &&
                    trackAction("Button clicked", {
                      buttonName: "Connect wallet on page",
                    });
                }}
              >
                Connect Wallet <WalletIcon src="/icons/wallet.svg" />
              </RewardsButton>
            </ConnectWalletText>
          </ConnectWalletOverlay>
        )}
      </PersonalRewardsTableContainer>
      <LeaderboardTitle>Leaderboard</LeaderboardTitle>
      <RewardsTableContainer>
        <RewardsTableBorder />
        {weekData?.traders?.length > 1 ? (
          <InfiniteScroll
            dataLength={weekData?.traders?.length}
            next={fetchMoreData}
            hasMore={hasMore}
            height={490}
            style={{ position: "relative" }}
          >
            <RewardsTableWrapper>
              {weekData.traders.slice(0, index).map(({ user_address, volume, reward }, index) => (
                <TableRow
                  key={user_address}
                  totalTraders={weekData?.traders.length}
                  position={index + 1}
                  account={user_address}
                  volume={volume}
                  reward={reward}
                  trackAction={trackAction}
                />
              ))}
            </RewardsTableWrapper>
          </InfiniteScroll>
        ) : (!weekData?.traders || weekData?.traders?.length === 0) && selectedWeek ? (
          <FullWidthText>
            <p>No data available for Week {selectedWeek}</p>
          </FullWidthText>
        ) : (
          <FullWidthText>
            <p>Loading week data...</p>
          </FullWidthText>
        )}
      </RewardsTableContainer>
    </LeaderboardContainer>
  );
}
