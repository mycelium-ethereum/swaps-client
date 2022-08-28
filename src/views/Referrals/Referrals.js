import React, { useState, useEffect, useMemo } from "react";

import { ETH_DECIMALS, expandDecimals, fetcher, getPageTitle, useChainId, useENS, REFERRALS_SELECTED_TAB_KEY, isHashZero, useLocalStorageSerializeKey, REFERRAL_CODE_KEY, bigNumberify, getTracerServerUrl, formatTimeTill, getTokenInfo } from "../../Helpers";
import { useWeb3React } from "@web3-react/core";
import * as Styles from "./Referrals.styles";
import CreateCodeModal from "./CreateCodeModal";
import EnterCodeModal from "./EnterCodeModal";
import EditCodeModal from "./EditCodeModal";

import SEO from "../../components/Common/SEO";
import ViewSwitch from "../../components/ViewSwitch/ViewSwitch";
import TraderRebateStats from "./TraderRebateStats";
import ReferralRewards from "./ReferralRewards";
import AccountBanner from "./AccountBanner";
import ReferralCodesTable from "./ReferralCodesTable";
import { useLocalStorage } from "react-use";
import { decodeReferralCode, useReferralsData, useReferrerTier, useUserReferralCode, useCodeOwner } from "../../Api/referrals";
import useSWR from "swr";
import { ethers } from "ethers";

import FeeDistributorReader from "../../abis/FeeDistributorReader.json";
import { getContract } from "../../Addresses";

const REFERRAL_DATA_MAX_TIME = 60000 * 5; // 5 minutes
export function isRecentReferralCodeNotExpired(referralCodeInfo) {
  if (referralCodeInfo.time) {
    return referralCodeInfo.time + REFERRAL_DATA_MAX_TIME > Date.now();
  }
}

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

export const COMMISSIONS = "Commissions";
export const REBATES = "Rebates";

export default function Referral(props) {
  const { connectWallet, trackAction, infoTokens } = props;
  const { active, account, library, chainId: chainIdWithoutLocalStorage, pendingTxns, setPendingTxns } = useWeb3React();
  const { chainId } = useChainId();
  const { ensName } = useENS(account);
  const { data: referralsData } = useReferralsData(chainIdWithoutLocalStorage, account);
  const [recentlyAddedCodes, setRecentlyAddedCodes] = useLocalStorageSerializeKey([chainId, "REFERRAL", account], []);
  const { userReferralCode } = useUserReferralCode(library, chainId, account);
  const { codeOwner } = useCodeOwner(library, chainId, account, userReferralCode);
  const { referrerTier: tradersTier } = useReferrerTier(library, chainId, codeOwner);
  const userReferralCodeInLocalStorage = window.localStorage.getItem(REFERRAL_CODE_KEY);

  const [currentView, setCurrentView] = useLocalStorage(REFERRALS_SELECTED_TAB_KEY, REBATES);
  const [isEnterCodeModalVisible, setIsEnterCodeModalVisible] = useState(false);
  const [isCreateCodeModalVisible, setIsCreateCodeModalVisible] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState("latest");
  const [nextRewards, setNextRewards] = useState();

  const [isEditCodeModalVisible, setIsEditCodeModalVisible] = useState(false);

  const switchView = () => {
    setCurrentView(currentView === COMMISSIONS ? REBATES : COMMISSIONS);
    trackAction &&
      trackAction("Button clicked", {
        buttonName: "Referral panel",
        view: currentView === "Commissions" ? "Rebates" : "Commissions",
      });
  }

  function handleClaim () {
    // TODO handle claim
  }

  const feeDistributor = getContract(chainId, "FeeDistributor");
  const feeDistributorReader = getContract(chainId, "FeeDistributorReader");

  // Fetch all week data from server
  const { data: allWeeksRewardsData, error: failedFetchingRewards } = useSWR([getTracerServerUrl(chainId, "/rewards")], {
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
  });

  // Fetch only the latest week's data from server
  const { data: currentRewardWeek, error: failedFetchingWeekRewards } = useSWR(
    [getTracerServerUrl(chainId, "/rewards"), selectedWeek],
    {
      fetcher: (url, week) => fetch(`${url}&week=${week}`).then((res) => res.json()),
    }
  );

  const { data: hasClaimed } = useSWR(
    [`Rewards:claimed:${active}`, chainId, feeDistributorReader, "getUserClaimed", feeDistributor, account ?? ethers.constants.AddressZero, allWeeksRewardsData?.length ?? 1],
    {
      fetcher: fetcher(library, FeeDistributorReader),
    }
  );

  useEffect(() => {
    if (!!allWeeksRewardsData) {
      const ends = allWeeksRewardsData.map((week) => Number(week.end));
      const max = Math.max(...ends);
      if (!Number.isNaN(max)) {
        setNextRewards(max)
      }
    }
  }, [allWeeksRewardsData]);

  // Get volume, position and reward from user week data
  const userWeekData = useMemo(() => {
    if (!currentRewardWeek) {
      return undefined;
    }
    const leaderBoardIndex = currentRewardWeek.traders?.findIndex((trader) => trader.user_address.toLowerCase() === account?.toLowerCase());
    let traderData
    if (leaderBoardIndex && leaderBoardIndex >= 0) {
      traderData = currentRewardWeek.traders[leaderBoardIndex];
    }
    // trader's data found
    if (traderData) {
      const positionReward = ethers.BigNumber.from(traderData.reward);
      const degenReward = ethers.BigNumber.from(traderData.degen_reward);
      return {
        volume: ethers.BigNumber.from(traderData.volume),
        totalReward: positionReward.add(degenReward),
        position: leaderBoardIndex + 1,
        positionReward,
        degenReward,
      };
    } else {
      // trader not found but data exists so user has no rewards
      return {
        volume: ethers.BigNumber.from(0),
        totalReward: ethers.BigNumber.from(0),
        positionReward: ethers.BigNumber.from(0),
        degenReward: ethers.BigNumber.from(0),
        rewardAmountUsd: ethers.BigNumber.from(0),
      };
    }
  }, [account, currentRewardWeek]);

  const eth = getTokenInfo(infoTokens, ethers.constants.AddressZero);
  const ethPrice = eth?.maxPrimaryPrice;

  if (ethPrice && userWeekData?.totalReward) {
    userWeekData.rewardAmountUsd = userWeekData.totalReward?.mul(ethPrice).div(expandDecimals(1, ETH_DECIMALS));
  }


  let referralCodeInString;
  if (userReferralCode && !isHashZero(userReferralCode)) {
    referralCodeInString = decodeReferralCode(userReferralCode);
  }

  if (!referralCodeInString && userReferralCodeInLocalStorage && !isHashZero(userReferralCodeInLocalStorage)) {
    referralCodeInString = decodeReferralCode(userReferralCodeInLocalStorage);
  }


  let cumulativeStats, referrerTotalStats, referrerTierInfo, referralTotalStats /*, rebateDistributions */;
  if (referralsData) {
    ({ cumulativeStats, referrerTotalStats, referrerTierInfo, referralTotalStats /*, rebateDistributions */} = referralsData);
  }

  const finalReferrerTotalStats = recentlyAddedCodes.filter(isRecentReferralCodeNotExpired).reduce((acc, cv) => {
    const addedCodes = referrerTotalStats.map((c) => c.referralCode.trim());
    if (!addedCodes.includes(cv.referralCode)) {
      acc = acc.concat(cv);
    }
    return acc;
  }, referrerTotalStats);

  const referrerTier = referrerTierInfo?.tierId;
  let referrerRebates = bigNumberify(0);
  if (cumulativeStats && cumulativeStats.rebates && cumulativeStats.discountUsd) {
    referrerRebates = cumulativeStats.rebates.sub(cumulativeStats.discountUsd);
  }
  let referrerVolume = cumulativeStats?.volume;

  let tradersVolume = referralTotalStats?.volume;
  let tradersRebates = referralTotalStats?.discountUsd;

  let hasCreatedCode = referralsData && referralsData?.codes?.length > 0;

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

  let rewardsMessage = "";
  if (!currentRewardWeek) {
    rewardsMessage = "Fetching rewards";
  } else if (!!failedFetchingWeekRewards) {
    rewardsMessage = "Failed fetching current week rewards";
  } else if (!!failedFetchingRewards) {
    rewardsMessage = "Failed fetching rewards";
  } else {
    if (currentRewardWeek?.length === 0) {
      rewardsMessage = "No rewards";
    } else if (selectedWeek === "latest") {
      rewardsMessage = `Week ${Number.parseInt(currentRewardWeek.week) + 1}`;
    } else {
      rewardsMessage = `Week ${selectedWeek + 1}`;
    }
  }

  let timeTillRewards;
  if (nextRewards) {
    timeTillRewards = formatTimeTill(nextRewards / 1000);
  }

  const isLatestWeek = selectedWeek === "latest";
  let hasClaimedWeek
  if (selectedWeek !== 'latest' && hasClaimed) {
    hasClaimedWeek = hasClaimed[selectedWeek]
  }
  
  return (
    <>
      <SEO
        title={getPageTitle("Referral")}
        description="Claim fees earned via being in the top 50% of traders on Mycelium Perpetual Swaps."
      />
      <EnterCodeModal
        active={active}
        chainId={chainId}
        library={library}
        setPendingTxns={setPendingTxns}
        pendingTxns={pendingTxns}
        isEnterCodeModalVisible={isEnterCodeModalVisible}
        setIsEnterCodeModalVisible={setIsEnterCodeModalVisible}
      />
      <EditCodeModal
        active={active}
        chainId={chainId}
        library={library}
        connectWallet={connectWallet}
        isEditCodeModalVisible={isEditCodeModalVisible}
        setIsEditCodeModalVisible={setIsEditCodeModalVisible}
        referralCodeInString={referralCodeInString}
        pendingTxns={pendingTxns}
        setPendingTxns={setPendingTxns}
      />
      <CreateCodeModal
        active={active}
        chainId={chainId}
        library={library}
        connectWallet={connectWallet}
        isCreateCodeModalVisible={isCreateCodeModalVisible}
        setIsCreateCodeModalVisible={setIsCreateCodeModalVisible}
        recentlyAddedCodes={recentlyAddedCodes}
        setRecentlyAddedCodes={setRecentlyAddedCodes}
        pendingTxns={pendingTxns}
        setPendingTxns={setPendingTxns}
      />
      <Styles.StyledReferralPage className="default-container page-layout">
        {
          {
            [REBATES]: <RebatesHeader />,
            [COMMISSIONS]: <CommissionsHeader />,
          }[currentView]
        }
        <ViewSwitch 
          switchView={switchView}
          currentView={currentView}
          views={[REBATES, COMMISSIONS]}
        />
        <Styles.PersonalReferralContainer>
          <AccountBanner
            active={active}
            account={account}
            ensName={ensName}
            currentView={currentView}
            // Rebates
            tradersTier={tradersTier}
            tradersRebates={tradersRebates}
            tradersVolume={tradersVolume}
            referralCodeInString={referralCodeInString}
            // Commissions
            referrerTier={referrerTier}
            referrerRebates={referrerRebates}
            referrerVolume={referrerVolume}
          />
          {currentView === REBATES && 
            <TraderRebateStats
              active={active}
              connectWallet={connectWallet}
              trackAction={trackAction}
              referralCodeInString={referralCodeInString}
              setIsEnterCodeModalVisible={setIsEnterCodeModalVisible}
              setIsEditCodeModalVisible={setIsEditCodeModalVisible}
              tradersTier={tradersTier}
            />
          }
          {currentView === COMMISSIONS &&
            <ReferralCodesTable
              chainId={chainId}
              active={active}
              connectWallet={connectWallet}
              trackAction={trackAction}
              setIsCreateCodeModalVisible={setIsCreateCodeModalVisible}
              hasCreatedCode={hasCreatedCode}
              finalReferrerTotalStats={finalReferrerTotalStats}
            />
          }
          {userWeekData &&
            <ReferralRewards
              active={active}
              connectWallet={connectWallet}
              trackAction={trackAction}
              userWeekData={userWeekData}
              allWeeksRewardsData={allWeeksRewardsData}
              latestWeek={isLatestWeek}
              timeTillRewards={timeTillRewards}
              rewardsMessage={rewardsMessage}
              setSelectedWeek={setSelectedWeek}
              hasClaimed={hasClaimedWeek}
              handleClaim={handleClaim}
            />
          }
        </Styles.PersonalReferralContainer>
      </Styles.StyledReferralPage>
    </>
  );
}
