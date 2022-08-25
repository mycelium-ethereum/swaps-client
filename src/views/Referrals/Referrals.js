import React, { useState, useMemo, useCallback, useEffect } from "react";

import useSWR from "swr";

import { getTracerServerUrl, getPageTitle, getTokenInfo, useChainId, useENS, formatTimeTill, REFERRALS_SELECTED_TAB_KEY, isHashZero, useLocalStorageSerializeKey, REFERRAL_CODE_KEY, bigNumberify } from "../../Helpers";
import { useWeb3React } from "@web3-react/core";
import { registerReferralCode, useCodeOwner, useInfoTokens, useReferrerTier, useUserReferralCode } from "../../Api";
import * as Styles from "./Referrals.styles";
import { ReferralsSwitch } from "./ViewSwitch";
import CreateCodeModal from "./CreateCodeModal";
import EnterCodeModal from "./EnterCodeModal";

import SEO from "../../components/Common/SEO";
import TraderRebateStats from "./TraderRebateStats";
import AccountBanner from "./AccountBanner";
import ReferralCodesTable from "./ReferralCodesTable";
import { useLocalStorage } from "react-use";
import { decodeReferralCode, encodeReferralCode, useReferralsData } from "../../Api/referrals";
import Loader from "../../components/Common/Loader";

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

export default function Referral(props) {
  const { active, account, library, chainId: chainIdWithoutLocalStorage, pendingTxns, setPendingTxns } = useWeb3React();
  const { chainId } = useChainId();
  const { ensName } = useENS(account);
  const { data: referralsData, loading } = useReferralsData(chainIdWithoutLocalStorage, account);
  const [recentlyAddedCodes, setRecentlyAddedCodes] = useLocalStorageSerializeKey([chainId, "REFERRAL", account], []);
  const { userReferralCode } = useUserReferralCode(library, chainId, account);
  const { codeOwner } = useCodeOwner(library, chainId, account, userReferralCode);
  const { referrerTier: traderTier } = useReferrerTier(library, chainId, codeOwner);
  const userReferralCodeInLocalStorage = window.localStorage.getItem(REFERRAL_CODE_KEY);

  const { connectWallet, trackPageWithTraits, trackAction, analytics } = props;
  const [currentView, setCurrentView] = useLocalStorage(REFERRALS_SELECTED_TAB_KEY, "Rebates");
  const [isEnterCodeModalVisible, setIsEnterCodeModalVisible] = useState(false);
  const [isCreateCodeModalVisible, setIsCreateCodeModalVisible] = useState(false);

  const [hasActivatedReferral, setHasActivatedReferral] = useState(false);

  const [selectedWeek, setSelectedWeek] = useState("latest");

  const switchView = useCallback(() => {
    setCurrentView(currentView === "Commissions" ? "Rebates" : "Commissions");
  }, [currentView]);

  let referralCodeInString;
  if (userReferralCode && !isHashZero(userReferralCode)) {
    referralCodeInString = decodeReferralCode(userReferralCode);
  }

  if (!referralCodeInString && userReferralCodeInLocalStorage && !isHashZero(userReferralCodeInLocalStorage)) {
    referralCodeInString = decodeReferralCode(userReferralCodeInLocalStorage);
  }

  function handleCreateReferralCode(code) {
    const referralCodeHex = encodeReferralCode(code);
    return registerReferralCode(chainId, referralCodeHex, {
      library,
      sentMsg: "Referral code submitted!",
      failMsg: "Referral code creation failed.",
      pendingTxns,
    });
  }


  let cumulativeStats, referrerTotalStats, rebateDistributions, referrerTierInfo
  if (referralsData) {
    ({ cumulativeStats, referrerTotalStats, rebateDistributions, referrerTierInfo } = referralsData);
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


  let traderRebates = referrerTotalStats?.discountUsd;
  let tradersVolume = referrerTotalStats?.volume;

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
      <CreateCodeModal
        active={active}
        chainId={chainId}
        connectWallet={connectWallet}
        isCreateCodeModalVisible={isCreateCodeModalVisible}
        setIsCreateCodeModalVisible={setIsCreateCodeModalVisible}
        handleCreateReferralCode={handleCreateReferralCode}
        recentlyAddedCodes={recentlyAddedCodes}
        setRecentlyAddedCodes={setRecentlyAddedCodes}
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
            currentView={currentView}
            // Rebates
            traderTier={traderTier}
            traderRebates={traderRebates}
            tradersVolume={tradersVolume}
            referralCodeInString={referralCodeInString}
            // Commissions
            referrerTier={referrerTier}
            referrerRebates={referrerRebates}
            referrerVolume={referrerVolume}
          />
          <TraderRebateStats
            active={active}
            setSelectedWeek={setSelectedWeek}
            connectWallet={connectWallet}
            currentView={currentView}
            trackAction={trackAction}
            hasActivatedReferral={hasActivatedReferral}
            setIsEnterCodeModalVisible={setIsEnterCodeModalVisible}
          />
          <ReferralCodesTable
            chainId={chainId}
            active={active}
            connectWallet={connectWallet}
            currentView={currentView}
            trackAction={trackAction}
            setSelectedWeek={setSelectedWeek}
            setIsCreateCodeModalVisible={setIsCreateCodeModalVisible}
            hasCreatedCode={hasCreatedCode}
            handleCreateReferralCode={handleCreateReferralCode}
            referralsData={referralsData}
            recentlyAddedCodes={recentlyAddedCodes}
          />
        </Styles.PersonalReferralContainer>
      </Styles.StyledReferralPage>
    </>
  );
}
