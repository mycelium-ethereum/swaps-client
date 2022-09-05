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
  const [selectedRound, setSelectedRound] = useState("latest");
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
  const { data: allRoundsRewardsData, error: failedFetchingRewards } = useSWR([getTracerServerUrl(chainId, "/referralRewards")], {
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
  });

  // Fetch only the latest week's data from server
  const { data: currentRewardRound, error: failedFetchingRoundRewards } = useSWR(
    [getTracerServerUrl(chainId, "/referralRewards"), selectedRound],
    {
      fetcher: (url, week) => fetch(`${url}&round=${week}`).then((res) => res.json()),
    }
  );

  const { data: hasClaimed } = useSWR(
    [`Rewards:claimed:${active}`, chainId, feeDistributorReader, "getUserClaimed", feeDistributor, account ?? ethers.constants.AddressZero, allRoundsRewardsData?.length ?? 1],
    {
      fetcher: fetcher(library, FeeDistributorReader),
    }
  );

  useEffect(() => {
    if (!!allRoundsRewardsData) {
      const ends = allRoundsRewardsData.map((week) => Number(week.end));
      const max = Math.max(...ends);
      if (!Number.isNaN(max)) {
        setNextRewards(max)
      }
    }
  }, [allRoundsRewardsData]);

  // Get volume, position and reward from user week data
  const userRoundData = useMemo(() => {
    if (!currentRewardRound) {
      return undefined;
    }
    const leaderBoardIndex = currentRewardRound.rewards?.findIndex((trader) => trader.user_address.toLowerCase() === account?.toLowerCase());
    let traderData
    if (leaderBoardIndex !== undefined && leaderBoardIndex >= 0) {
      traderData = currentRewardRound.rewards[leaderBoardIndex];
    }

    // trader's data found
    if (traderData) {
      const commissions = bigNumberify(traderData.commissions);
      const rebates = bigNumberify(traderData.rebates);

      return {
        volume: bigNumberify(traderData.commissions_volume),
        totalReward: commissions.add(rebates),
        commissions,
        rebates,
      };
    } else {
      return {
        volume: bigNumberify(0),
        totalReward: bigNumberify(0),
        commissions: bigNumberify(0),
        rebates: bigNumberify(0),
      };
    }
  }, [account, currentRewardRound]);

  const eth = getTokenInfo(infoTokens, ethers.constants.AddressZero);
  const ethPrice = eth?.maxPrimaryPrice;

  if (ethPrice && userRoundData?.totalReward) {
    userRoundData.totalRewardUsd = userRoundData.totalReward?.mul(ethPrice).div(expandDecimals(1, ETH_DECIMALS));
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
    const addedCodes = referrerTotalStats?.map((c) => c.referralCode.trim());
    if (addedCodes && !addedCodes.includes(cv.referralCode)) {
      // BigNumbers get converted in local storage, need to convert them back
      cv.totalRebateUsd = bigNumberify(cv.totalRebateUsd);
      cv.volume = bigNumberify(cv.volume);
      cv.discountUsd = bigNumberify(cv.discountUsd);
      acc = acc.concat(cv);
    }
    return acc;
  }, referrerTotalStats);

  const referrerTier = referrerTierInfo?.tierId;
  let referrerRebates = bigNumberify(0);
  if (cumulativeStats && cumulativeStats.totalRebateUsd && cumulativeStats.discountUsd) {
    referrerRebates = cumulativeStats.totalRebateUsd.sub(cumulativeStats.discountUsd);
  }
  let referrerVolume = cumulativeStats?.volume;

  let tradersVolume = referralTotalStats?.volume;
  let tradersRebates = referralTotalStats?.discountUsd;

  let hasCreatedCode = referralsData && referralsData?.codes?.length > 0;

  // // Segment Analytics Page tracking
  // useEffect(() => {
  //   if (!pageTracked && currentReferralRound && analytics) {
  //     const traits = {
  //       week: currentReferralRound.key,
  //     };
  //     trackPageWithTraits(traits);
  //     setPageTracked(true); // Prevent Page function being called twice
  //   }
  // }, [currentReferralRound, pageTracked, trackPageWithTraits, analytics]);

  let rewardsMessage = "";
  if (!currentRewardRound) {
    rewardsMessage = "Fetching rewards";
  } else if (!!failedFetchingRoundRewards) {
    rewardsMessage = "Failed fetching current week rewards";
  } else if (!!failedFetchingRewards) {
    rewardsMessage = "Failed fetching rewards";
  } else {
    if (currentRewardRound?.length === 0) {
      rewardsMessage = "No rewards";
    } else if (selectedRound === "latest") {
      rewardsMessage = `Round ${Number.parseInt(currentRewardRound.round) + 1}`;
    } else {
      rewardsMessage = `Round ${selectedRound + 1}`;
    }
  }

  let timeTillRewards;
  if (nextRewards) {
    timeTillRewards = formatTimeTill(nextRewards / 1000);
  }

  const isLatestRound = selectedRound === "latest";
  let hasClaimedRound
  if (selectedRound !== 'latest' && hasClaimed) {
    hasClaimedRound = hasClaimed[selectedRound]
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
        pendingTxns={pendingTxns}
        setPendingTxns={setPendingTxns}
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
          {userRoundData && /* disable for now */ false &&
            <ReferralRewards
              active={active}
              connectWallet={connectWallet}
              trackAction={trackAction}
              userRoundData={userRoundData}
              allRoundsRewardsData={allRoundsRewardsData}
              latestRound={isLatestRound}
              timeTillRewards={timeTillRewards}
              rewardsMessage={rewardsMessage}
              setSelectedRound={setSelectedRound}
              hasClaimed={hasClaimedRound}
              handleClaim={handleClaim}
            />
          }
        </Styles.PersonalReferralContainer>
      </Styles.StyledReferralPage>
    </>
  );
}
