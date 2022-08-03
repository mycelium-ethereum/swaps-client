import React, { useState, useEffect } from "react";

import Footer from "../../Footer";

import { shortenAddress, useENS } from "../../Helpers";
import * as Styles from "./Rewards.styles";
// import {createBreakpoint} from "react-use";
import { useWeb3React } from "@web3-react/core";
import Davatar from "@davatar/react";
import { Menu } from "@headlessui/react";
import { FaChevronDown } from "react-icons/fa";

const REWARD_WEEKS = [
  {
    label: "Week 1",
    key: 0,
  },
  {
    label: "Week 2",
    key: 1,
  },
];

export default function Rewards(props) {
  const { connectWallet, trackPageWithTraits, trackAction, analytics } = props;

  const { ensName } = useENS();
  const { active, account } = useWeb3React();
  // const useBreakpoint = createBreakpoint({ L: 600, M: 550, S: 400 });
  // const breakpoint = useBreakpoint();

  const [rewardsWeek, setRewardsWeek] = useState(REWARD_WEEKS[0].key);

  const [pageTracked, setPageTracked] = useState(false);

  // Segment Analytics Page tracking
  useEffect(() => {
    if (!pageTracked && analytics) {
      const traits = {
        week: REWARD_WEEKS[REWARD_WEEKS.length - 1].key,
      };
      trackPageWithTraits(traits);
      setPageTracked(true); // Prevent Page function being called twice
    }
  }, [pageTracked, trackPageWithTraits, analytics]);

  return (
    <Styles.StyledRewardsPage className="default-container page-layout">
      <div className="Page-title-section mt-0">
        <div className="Page-title">Trader Rewards</div>
        <div className="Page-description">Be in the top 50% of traders to earn weekly rewards.</div>
      </div>
      <Styles.AccountBanner className="App-card">
        {active && (
          <Styles.AccountBannerAddresses>
            <Davatar size={40} address={account} />
            <Styles.AppCardTitle>{ensName || shortenAddress(account, 13)}</Styles.AppCardTitle>
            <Styles.AccountBannerShortenedAddress>Wallet address</Styles.AccountBannerShortenedAddress>
          </Styles.AccountBannerAddresses>
        )}
        {!active && (
          <Styles.AccountBannerAddresses>
            <Styles.AppCardTitle>Connect Wallet</Styles.AppCardTitle>
            <Styles.AccountBannerShortenedAddress>Wallet not connected</Styles.AccountBannerShortenedAddress>
          </Styles.AccountBannerAddresses>
        )}
        <Styles.AccountBannerRewards>
          <div className="App-card-row">
            <div className="label">Total Volume Traded</div>
            <div>$67.00</div>
          </div>
          <div className="App-card-row">
            <div className="label">Total Rewards</div>
            <div>1050.00 ETH ($36.75)</div>
          </div>
          <div className="App-card-row">
            <div className="label">Unclaimed Rewards</div>
            <div>1050.00 ETH ($36.75)</div>
          </div>
        </Styles.AccountBannerRewards>
      </Styles.AccountBanner>
      <Styles.RewardsData className="App-card">
        <Styles.AppCardTitle>Rewards data</Styles.AppCardTitle>
        <Styles.RewardsWeekSelect>
          <Styles.RewardsWeekSelectMenu>
            <Menu>
              <Menu.Button as="div">
                <Styles.WeekSelectButton className="App-cta transparent">
                  <span>{REWARD_WEEKS[rewardsWeek].label}</span>
                  <FaChevronDown />
                </Styles.WeekSelectButton>
              </Menu.Button>
              <div>
                <Menu.Items as="div" className="menu-items">
                  {REWARD_WEEKS.map((week) => (
                    <Menu.Item key={week.key}>
                      <div className="menu-item" onClick={() => setRewardsWeek(week.key)}>
                        {week.label}
                      </div>
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </div>
            </Menu>
          </Styles.RewardsWeekSelectMenu>
          <Styles.RewardsWeekNextRewards>
            Next rewards in <Styles.RewardsWeekCountdown>8d 13h 42m</Styles.RewardsWeekCountdown>
          </Styles.RewardsWeekNextRewards>
        </Styles.RewardsWeekSelect>
        <Styles.RewardsDataBoxes>
          <Styles.RewardsDataBox>
            <Styles.RewardsDataBoxTitle>Volume Traded</Styles.RewardsDataBoxTitle>
            <Styles.LargeText>$1.00</Styles.LargeText>
          </Styles.RewardsDataBox>
          <Styles.RewardsDataBox className="claimable">
            <Styles.RewardsDataBoxTitle>Claimable Rewards</Styles.RewardsDataBoxTitle>
            <div>
              <Styles.LargeText>107.14 ETH</Styles.LargeText>
              <span>($3.75)</span>
            </div>
          </Styles.RewardsDataBox>
        </Styles.RewardsDataBoxes>
        {active && (
          <Styles.RewardsButton
            className="App-cta large"
            onClick={() =>
              trackAction("Button clicked", {
                buttonName: "Claim TCR",
              })
            }
          >
            Claim TCR
          </Styles.RewardsButton>
        )}
        {!active && (
          <Styles.RewardsButton
            className="App-cta large"
            onClick={() => {
              connectWallet();
              trackAction("Button clicked", {
                buttonName: "Connect Wallet",
              });
            }}
          >
            Connect Wallet
          </Styles.RewardsButton>
        )}
      </Styles.RewardsData>
      <Footer />
    </Styles.StyledRewardsPage>
  );
}
