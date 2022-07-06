import React, { useState, useMemo } from "react";

import useSWR from "swr";

import Footer from "../../Footer";

import { shortenAddress, useENS } from "../../Helpers";
import * as Styles from "./Rewards.styles";

import { useWeb3React } from "@web3-react/core";
import Davatar from "@davatar/react";
import { Menu } from "@headlessui/react";
import { FaChevronDown } from "react-icons/fa";
import { generateProof } from "../../helpers/merkle";


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
  const { connectWallet } = props;

  const { ensName } = useENS();
  const { active, account } = useWeb3React();

  // const ethRewardsUrl = getServerUrl(chainId, "/gmx_supply");
  const ethRewardsUrl = "https://ipfs.io/ipfs/QmXcaF11fuXnUsCXez79JGgvcg5i4ZjT1v6Uf6FDFH1SuL"
  const { data: dataLeaves } = useSWR([ethRewardsUrl], {
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
  });

  console.log(dataLeaves);
  const merkleProof = useMemo(() => generateProof(dataLeaves.accounts, account), [account, dataLeaves]) 
  console.log(merkleProof);

  const [rewardsWeek, setRewardsWeek] = useState(REWARD_WEEKS[0].key);

  return (
    <Styles.StyledRewardsPage className="default-container page-layout">
      <div className="Page-title-section mt-0">
        <div className="Page-title">Trader Rewards</div>
        <div className="Page-description">
          Be in the top 50% of traders to earn weekly rewards.
        </div>
      </div>
      <Styles.AccountBanner className="App-card"> 
        {active &&
          <Styles.AccountBannerAddresses>
            <Davatar size={40} address={account} />
            <Styles.AppCardTitle>
              {ensName || shortenAddress(account, 13)}
            </Styles.AppCardTitle>
            <Styles.AccountBannerShortenedAddress>
              Wallet address
            </Styles.AccountBannerShortenedAddress>
          </Styles.AccountBannerAddresses>
        }
        {!active &&
          <Styles.AccountBannerAddresses>
            <Styles.AppCardTitle>
              Connect Wallet
            </Styles.AppCardTitle>
            <Styles.AccountBannerShortenedAddress>
              Wallet not connected
            </Styles.AccountBannerShortenedAddress>
          </Styles.AccountBannerAddresses>
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
        {active &&
          <Styles.RewardsButton className="App-cta large">
            Claim TCR
          </Styles.RewardsButton>
        }
        {!active &&
          <Styles.RewardsButton className="App-cta large" onClick={() => connectWallet()}>
            Connect Wallet
          </Styles.RewardsButton>
        }
      </Styles.RewardsData>
      <Footer />
    </Styles.StyledRewardsPage>
  );
}
