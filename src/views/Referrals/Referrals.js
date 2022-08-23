import React, { useState, useMemo, useCallback, useEffect } from "react";

import useSWR from "swr";

import { getTracerServerUrl, getPageTitle, getTokenInfo, useChainId, useENS, formatTimeTill } from "../../Helpers";
import { useWeb3React } from "@web3-react/core";
import { useInfoTokens } from "../../Api";
import { ethers } from "ethers";
import * as Styles from "./Referrals.styles";
import { ReferralsSwitch } from "./ViewSwitch";

import SEO from "../../components/Common/SEO";
import TraderRebateStats from "./TraderRebateStats";
import AccountBanner from "./AccountBanner";
import ReferralCodesTable from "./ReferralCodesTable";

const RebatesHeader = () => (
  <div className="Page-title-section mt-0">
    <div className="Page-title">Trader Referrals</div>
    <div className="Page-description">Claim trading fee rebates here.</div>
  </div>
);

const CommissionsHeader = () => (
  <div className="Page-title-section mt-0">
    <div className="Page-title">Referral Commissions</div>
    <div className="Page-description">Claim referral commissions here.</div>
  </div>
);

export default function Referral(props) {
  const { connectWallet, trackPageWithTraits, trackAction, analytics } = props;
  const [currentView, setCurrentView] = useState("Rebates");

  const { chainId } = useChainId();
  const { active, account, library } = useWeb3React();
  const { ensName } = useENS(account);

  const [selectedWeek, setSelectedWeek] = useState("latest");

  const switchView = useCallback(() => {
    setCurrentView(currentView === "Commissions" ? "Rebates" : "Commissions");
  }, [currentView]);

  // const [pageTracked, setPageTracked] = useState(false);
  const [nextRewards, setNextReferral] = useState(undefined);

  const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);

  // Fetch all week data from server
  const { data: allWeeksReferralData, error: failedFetchingReferral } = useSWR(
    [getTracerServerUrl(chainId, "/rewards")],
    {
      fetcher: (...args) => fetch(...args).then((res) => res.json()),
    }
  );

  // Fetch only the latest week's data from server
  const { data: currentReferralWeek, error: failedFetchingWeekReferral } = useSWR(
    [getTracerServerUrl(chainId, "/rewards"), selectedWeek],
    {
      fetcher: (url, week) => fetch(`${url}&week=${week}`).then((res) => res.json()),
    }
  );

  // Get the data for the current user
  const userData = useMemo(
    () =>
      allWeeksReferralData?.reduce(
        (totals, week) => {
          const trader = week.traders?.find((trader) => trader.user_address === account);
          if (!trader) {
            return totals;
          }
          return {
            totalTradingVolume: totals.totalTradingVolume.add(trader.volume),
            totalReferral: totals.totalReferral.add(trader.referral),
            // TODO calc what has been claimed
            unclaimedReferral: totals.unclaimedReferral.add(trader.referral),
          };
        },
        {
          totalTradingVolume: ethers.BigNumber.from(0),
          totalReferral: ethers.BigNumber.from(0),
          unclaimedReferral: ethers.BigNumber.from(0),
        }
      ),
    [allWeeksReferralData, account]
  );

  // Get volume, position and referral from user week data
  const userWeekData = useMemo(() => {
    if (!currentReferralWeek) {
      return undefined;
    }
    const traderData = currentReferralWeek.traders?.find((trader) => trader.user_address === account);
    const leaderboardPosition = currentReferralWeek.traders?.findIndex((trader) => trader.user_address === account);
    // trader's data found
    if (traderData) {
      traderData.position = leaderboardPosition;
      return {
        volume: ethers.BigNumber.from(traderData.volume),
        referral: ethers.BigNumber.from(traderData.referral),
        position: leaderboardPosition,
      };
    } else {
      // trader not found but data exists so user has no Referral
      return {
        volume: ethers.BigNumber.from(0),
        referral: ethers.BigNumber.from(0),
        referralAmountUsd: ethers.BigNumber.from(0),
      };
    }
  }, [account, currentReferralWeek]);

  const eth = getTokenInfo(infoTokens, ethers.constants.AddressZero);
  const ethPrice = eth?.maxPrimaryPrice;

  if (ethPrice && userWeekData?.referral) {
    userWeekData.referralAmountUsd = userWeekData.referral?.mul(ethPrice);
  }

  let unclaimedReferralUsd, totalReferralAmountUsd;
  if (ethPrice && userData) {
    unclaimedReferralUsd = userData.totalReferral.mul(ethPrice);
    totalReferralAmountUsd = userData.totalReferral.mul(ethPrice);
  }

  let referralMessage = "";
  if (!currentReferralWeek) {
    referralMessage = "Fetching Referral";
  } else if (!!failedFetchingWeekReferral) {
    referralMessage = "Failed fetching current week Referral";
  } else if (!!failedFetchingReferral) {
    referralMessage = "Failed fetching Referral";
  } else {
    if (allWeeksReferralData?.length === 0) {
      referralMessage = "No Referral for network";
    } else if (selectedWeek === "latest") {
      referralMessage = `Week ${Number.parseInt(currentReferralWeek.week) + 1}`;
    } else {
      referralMessage = `Week ${selectedWeek + 1}`;
    }
  }

  const timeTillRewards = useMemo(() => formatTimeTill(nextRewards / 1000), [nextRewards]);

  useEffect(() => {
    if (!!currentReferralWeek && nextRewards === undefined) {
      // this will load latest first and set next Referral
      setNextReferral(currentReferralWeek.end);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentReferralWeek]);

  // // Segment Analytics Page tracking
  // useEffect(() => {
  //   if (!pageTracked && currentReferralWeek && analytics) {
  //     const traits = {
  //       week: currentReferralWeek.key,
  //     };
  //     trackPageWithTraits(traits);
  //     setPageTracked(true); // Prevent Page function being called twice
  //   }
  // }, [currentReferralWeek, pageTracked, trackPageWithTraits, analytics]);

  return (
    <>
      <SEO
        title={getPageTitle("Referral")}
        description="Claim fees earned via being in the top 50% of traders on Mycelium Perpetual Swaps."
      />
      <Styles.StyledReferralPage className="default-container page-layout">
        {
          {
            Rebates: <RebatesHeader />,
            Commissions: <CommissionsHeader />,
          }[currentView]
        }
        <ReferralsSwitch
          switchView={switchView}
          currentView={currentView}
          setSelectedWeek={setSelectedWeek}
          trackAction={trackAction}
        />
        <Styles.PersonalReferralContainer>
          <AccountBanner
            active={active}
            account={account}
            ensName={ensName}
            userData={userData}
            totalReferralAmountUsd={totalReferralAmountUsd}
            unclaimedReferralUsd={unclaimedReferralUsd}
          />
          <TraderRebateStats
            active={active}
            referralMessage={referralMessage}
            allWeeksReferralData={allWeeksReferralData}
            setSelectedWeek={setSelectedWeek}
            connectWallet={connectWallet}
            userWeekData={userWeekData}
            currentView={currentView}
            trackAction={trackAction}
            nextRewards={nextRewards}
            latestWeek={selectedWeek === "latest"}
            timeTillRewards={timeTillRewards}
          />
          <ReferralCodesTable
            active={active}
            currentView={currentView}
            trackAction={trackAction}
            allWeeksReferralData={allWeeksReferralData}
            setSelectedWeek={setSelectedWeek}
            referralMessage={referralMessage}
            nextRewards={nextRewards}
            timeTillRewards={timeTillRewards}
            connectWallet={connectWallet}
            userWeekData={userWeekData}
            latestWeek={selectedWeek === "latest"}
          />
        </Styles.PersonalReferralContainer>
      </Styles.StyledReferralPage>
    </>
  );
}
