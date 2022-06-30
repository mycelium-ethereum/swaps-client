import React, { useState } from "react";

import Footer from "../../Footer";

import { shortenAddress, useENS } from "../../Helpers";
import {usePageSpecAnalytics} from "../../segmentAnalytics";
import * as Styles from "./Rewards.styles";
import {createBreakpoint} from "react-use";
import {useWeb3React} from "@web3-react/core";
import Davatar from "@davatar/react";
import {Menu} from "@headlessui/react";
import {FaChevronDown} from "react-icons/fa";


const REWARD_WEEKS = [
  {
    label: 'Week 1',
    key: 0,
  },
  {
    label: 'Week 2',
    key: 1,
  },
]

export default function Rewards(props) {
  usePageSpecAnalytics();
  const { connectWallet } = props;

  const { ensName } = useENS();
  const { active, account } = useWeb3React();
  const useBreakpoint = createBreakpoint({ L: 600, M: 550, S: 400 });
  const breakpoint = useBreakpoint();

  const [rewardsWeek, setRewardsWeek] = useState(REWARD_WEEKS[0].key);

  return (
    <div className="default-container buy-tlp-content page-layout">
      <Styles.AccountBanner className="App-card"> 
        {active &&
          <Styles.AccountBannerAddresses>
            <Davatar size={40} address={account} />
            <Styles.AppCardTitle>
              {ensName || account}
            </Styles.AppCardTitle>
            <Styles.AccountBannerShortenedAddress>
              {shortenAddress(account, breakpoint === "S" ? 9 : 13)}
            </Styles.AccountBannerShortenedAddress>
          </Styles.AccountBannerAddresses>
        }
        {!active &&
          <button className="App-button-option App-card-option" onClick={() => connectWallet()}>
            Connect Wallet
          </button>
        }
        <Styles.AccountBannerRewards>
          <div className="App-card-row">
            <div className="label">Total Volume Traded</div>
            <div>
              $67.00
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">Total Rewards</div>
            <div>
              1050.00 ETH ($36.75)
            </div>
          </div>
          <div className="App-card-row">
            <div className="label">Unclaimed Rewards</div>
            <div>
              1050.00 ETH ($36.75)
            </div>
          </div>
        </Styles.AccountBannerRewards>
      </Styles.AccountBanner>
      <Styles.RewardsData className="App-card">
        <Styles.AppCardTitle>
          Rewards data
        </Styles.AppCardTitle>
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
                    <Menu.Item>
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
            <Styles.LargeText>
              $1.00
            </Styles.LargeText>
          </Styles.RewardsDataBox>
          <Styles.RewardsDataBox className="claimable">
            <Styles.RewardsDataBoxTitle>Claimable Rewards</Styles.RewardsDataBoxTitle>
            <div>
              <Styles.LargeText>
                107.14 ETH 
              </Styles.LargeText>
              <span>($3.75)</span>
            </div>
          </Styles.RewardsDataBox>
        </Styles.RewardsDataBoxes>
        <Styles.RewardsClaimButton className="App-cta large">
          Claim TCR
        </Styles.RewardsClaimButton>
      </Styles.RewardsData>
      <Footer />
    </div>
  );
}
