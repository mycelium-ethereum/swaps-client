import React, { useState } from "react";

import { getPageTitle, useChainId, useENS, REFERRALS_SELECTED_TAB_KEY, isHashZero, useLocalStorageSerializeKey, REFERRAL_CODE_KEY, bigNumberify } from "../../Helpers";
import { useWeb3React } from "@web3-react/core";
import * as Styles from "./Referrals.styles";
import CreateCodeModal from "./CreateCodeModal";
import EnterCodeModal from "./EnterCodeModal";
import EditCodeModal from "./EditCodeModal";

import SEO from "../../components/Common/SEO";
import ViewSwitch from "../../components/ViewSwitch/ViewSwitch";
import TraderRebateStats from "./TraderRebateStats";
import AccountBanner from "./AccountBanner";
import ReferralCodesTable from "./ReferralCodesTable";
import { useLocalStorage } from "react-use";
import { decodeReferralCode, useReferralsData, useReferrerTier, useUserReferralCode, useCodeOwner } from "../../Api/referrals";

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
  const { active, account, library, chainId: chainIdWithoutLocalStorage, pendingTxns, setPendingTxns } = useWeb3React();
  const { chainId } = useChainId();
  const { ensName } = useENS(account);
  const { data: referralsData } = useReferralsData(chainIdWithoutLocalStorage, account);
  const [recentlyAddedCodes, setRecentlyAddedCodes] = useLocalStorageSerializeKey([chainId, "REFERRAL", account], []);
  const { userReferralCode } = useUserReferralCode(library, chainId, account);
  const { codeOwner } = useCodeOwner(library, chainId, account, userReferralCode);
  const { referrerTier: tradersTier } = useReferrerTier(library, chainId, codeOwner);
  const userReferralCodeInLocalStorage = window.localStorage.getItem(REFERRAL_CODE_KEY);

  const { connectWallet, trackAction } = props;
  const [currentView, setCurrentView] = useLocalStorage(REFERRALS_SELECTED_TAB_KEY, REBATES);
  const [isEnterCodeModalVisible, setIsEnterCodeModalVisible] = useState(false);
  const [isCreateCodeModalVisible, setIsCreateCodeModalVisible] = useState(false);

  const [isEditCodeModalVisible, setIsEditCodeModalVisible] = useState(false);

  const switchView = () => {
    setCurrentView(currentView === COMMISSIONS ? REBATES : COMMISSIONS);
    trackAction &&
      trackAction("Button clicked", {
        buttonName: "Referral panel",
        view: currentView === "Commissions" ? "Rebates" : "Commissions",
      });
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
          <TraderRebateStats
            active={active}
            connectWallet={connectWallet}
            hidden={currentView === COMMISSIONS}
            trackAction={trackAction}
            referralCodeInString={referralCodeInString}
            setIsEnterCodeModalVisible={setIsEnterCodeModalVisible}
            setIsEditCodeModalVisible={setIsEditCodeModalVisible}
            tradersTier={tradersTier}
          />
          <ReferralCodesTable
            chainId={chainId}
            active={active}
            connectWallet={connectWallet}
            hidden={currentView === REBATES}
            trackAction={trackAction}
            setIsCreateCodeModalVisible={setIsCreateCodeModalVisible}
            hasCreatedCode={hasCreatedCode}
            finalReferrerTotalStats={finalReferrerTotalStats}
          />
        </Styles.PersonalReferralContainer>
      </Styles.StyledReferralPage>
    </>
  );
}
