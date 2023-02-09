import React, { useState, useEffect, useMemo } from "react";

import {
  ETH_DECIMALS,
  expandDecimals,
  fetcher,
  getPageTitle,
  useChainId,
  useENS,
  isHashZero,
  useLocalStorageSerializeKey,
  bigNumberify,
  formatTimeTill,
  getTokenInfo,
  helperToast,
  getOffsetRewardRound
} from "../../Helpers";
import { useWeb3React } from "@web3-react/core";
import * as Styles from "./Referrals.styles";
import CreateCodeModal from "./CreateCodeModal";
import EnterCodeModal from "./EnterCodeModal";

import SEO from "../../components/Common/SEO";
import ViewSwitchTriple from "../../components/ViewSwitchTriple/ViewSwitchTriple";
import TraderRebateStats from "./TraderRebateStats";
import ReferralRewards from "./ReferralRewards";
import AccountBanner from "./AccountBanner";
import ReferralCodesTable from "./ReferralCodesTable";
import { useLocalStorage } from "react-use";
import {
  decodeReferralCode,
  useReferralsData,
  useReferrerTier,
  useUserReferralCode,
  useCodeOwner,
} from "../../Api/referrals";
import useSWR from "swr";
import { ethers } from "ethers";
import { useLocation } from "react-router-dom";
import MerkleDistributor from "../../abis/MerkleDistributor.json";
import MerkleDistributorReader from "../../abis/MerkleDistributorReader.json";

import { getContract } from "../../Addresses";
import { REFERRALS_SELECTED_TAB_KEY, REFERRAL_CODE_KEY } from "../../config/localstorage";
import ReferralLeaderboard from "./ReferralLeaderboard";
import { getServerUrl } from "src/lib";
import ReferralsClaim from "./ReferralsClaim";
import { callContract } from "src/Api";

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

const LeaderboardHeader = () => (
  <div className="Page-title-section mt-0">
    <div className="Page-title">Commissions Leaderboard</div>
    <div className="Page-description">Distribute a referral code and earn commissions on referred volume.</div>
  </div>
);

export const COMMISSIONS = "Commissions";
export const REBATES = "Rebates";
export const LEADERBOARD = "Commissions Leaderboard";

export const COMMISSIONS_HASH = "#commissions";
export const REBATES_HASH = "#rebates";
export const LEADERBOARD_HASH = "#leaderboard";

const HASH_BY_VIEW = {
  [COMMISSIONS]: COMMISSIONS_HASH,
  [REBATES]: REBATES_HASH,
  [LEADERBOARD]: LEADERBOARD_HASH,
};

export default function Referral(props) {
  const location = useLocation();
  const { connectWallet, trackAction, infoTokens, pendingTxns, setPendingTxns } = props;
  const { active, account, library, chainId: chainIdWithoutLocalStorage } = useWeb3React();
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
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isCreateCodeModalVisible, setIsCreateCodeModalVisible] = useState(false);
  const [selectedRound, setSelectedRound] = useState("latest");
  const [nextRewards, setNextRewards] = useState();

  // Fetch user proof
  const { data: userProof } = useSWR(
    [getServerUrl(chainId, "/referralRewardProof"), selectedRound, account ?? ethers.constants.AddressZero],
    {
      fetcher: (url, round, account) => fetch(`${url}&round=${round}&userAddress=${account}`).then((res) => res.json()),
    }
  );

  const eth = getTokenInfo(infoTokens, ethers.constants.AddressZero);
  const ethPrice = eth?.maxPrimaryPrice;

  const switchView = (view) => {
    setCurrentView(view);
    const hash = HASH_BY_VIEW[view];

    // Update hash
    if (window.history.pushState) {
      window.history.pushState(null, null, hash);
    } else {
      location.hash = hash;
    }
    trackAction &&
      trackAction("Button clicked", {
        buttonName: "Referral panel",
        view: view,
      });
  };

  const merkleDistributor = getContract(chainId, "MerkleDistributor");
  const merkleDistributorReader = getContract(chainId, "MerkleDistributorReader");

  function handleClaim() {
    setIsClaiming(true);
    trackAction("Button clicked", {
      buttonName: "Claim referral rewards",
    });

    let error;
    if (selectedRound === "latest") {
      helperToast.error("Cannot claim rewards before round has ended");
      error = true;
    }
    if (!userProof) {
      helperToast.error("Fetching merkle proof. Please wait a minute and try again");
      error = true;
    }
    if (userProof.amount === "0") {
      helperToast.error(`No rewards for round: ${selectedRound + 1}`);
      error = true;
    }
    if (!!userProof?.message) {
      helperToast.error(`Invalid user proof`);
      error = true;
    }
    if (error) {
      setIsClaiming(false);
      return;
    }
    const contract = new ethers.Contract(merkleDistributor, MerkleDistributor.abi, library.getSigner());
    callContract(
      chainId,
      contract,
      "withdraw",
      [
        userProof.merkleProof, // proof
        userProof.amount, // amount
        getOffsetRewardRound(selectedRound)
      ],
      {
        sentMsg: "Claim submitted!",
        failMsg: "Claim failed.",
        successMsg: "Claim completed!",
        setPendingTxns,
      }
    ).then(async (res) => {
        await res.wait();
        setIsClaimModalOpen(false);
    }).finally(() => {
      setIsClaiming(false);
    })
  }

  // Fetch all week data from server
  const { data: allRoundsRewardsData_, error: failedFetchingRewards } = useSWR(
    [getServerUrl(chainId, "/referralRewards")],
    {
      fetcher: (...args) => fetch(...args).then((res) => res.json()),
    }
  );

  const allRoundsRewardsData = Array.isArray(allRoundsRewardsData_) ? allRoundsRewardsData_ : undefined;

  // Fetch only the latest week's data from server
  const { data: currentRewardRound, error: failedFetchingRoundRewards } = useSWR(
    [getServerUrl(chainId, "/referralRewards"), selectedRound],
    {
      fetcher: (url, week) => fetch(`${url}&round=${week}`).then((res) => res.json()),
    }
  );

  const allUsersRoundData = useMemo(() => {
    if (!allRoundsRewardsData || !ethPrice) {
      return undefined;
    }
    return currentRewardRound?.rewards
      ?.sort((a, b) => b.commissions_volume.toString() - a.commissions_volume.toString())
      .map((trader, index) => {
        const commissions = bigNumberify(trader.commissions);
        const rebates = bigNumberify(trader.rebates);
        return {
          position: index + 1,
          address: trader.user_address,
          volume: bigNumberify(trader.commissions_volume),
          totalReward: commissions,
          totalRewardUsd: commissions.mul(ethPrice).div(expandDecimals(1, ETH_DECIMALS)),
          referralCode: trader.referral_code,
          numberOfTrades: trader.number_of_trades,
          tradersReferred: trader.total_traders_referred,
          tier: trader.tier,
          commissions,
          rebates,
        };
      });
  }, [ethPrice, allRoundsRewardsData, currentRewardRound?.rewards]);

  const { data: hasClaimed } = useSWR(
    [
      `Rewards:claimed:${active}`,
      chainId,
      merkleDistributorReader,
      "getUserClaimed",
      merkleDistributor,
      account ?? ethers.constants.AddressZero,
      allRoundsRewardsData?.length ?? 1,
    ],
    {
      fetcher: fetcher(library, MerkleDistributorReader),
    }
  );

  useEffect(() => {
    if (!!allRoundsRewardsData) {
      const ends = allRoundsRewardsData.map((week) => Number(week.end));
      const max = Math.max(...ends);
      if (!Number.isNaN(max)) {
        setNextRewards(max);
      }
    }
  }, [allRoundsRewardsData]);

  // Get volume, position and reward from user week data
  const userRoundData = useMemo(() => {
    if (!currentRewardRound || !allUsersRoundData) {
      return undefined;
    }
    allUsersRoundData.findIndex((trader) => trader.address === account);
    const leaderBoardIndex = currentRewardRound.rewards?.findIndex(
      (trader) => trader.user_address.toLowerCase() === account?.toLowerCase()
    );
    let traderData;
    if (leaderBoardIndex !== undefined && leaderBoardIndex >= 0) {
      traderData = currentRewardRound.rewards[leaderBoardIndex];
    }

    // trader's data found
    if (traderData) {
      const commissions = bigNumberify(traderData.commissions);
      const rebates = bigNumberify(traderData.rebates);
      return {
        position: leaderBoardIndex + 1,
        address: traderData.user_address,
        volume: bigNumberify(traderData.commissions_volume),
        totalReward: commissions.add(rebates),
        totalRewardUsd: commissions.add(rebates).mul(ethPrice).div(expandDecimals(1, ETH_DECIMALS)),
        referralCode: traderData.referral_code,
        numberOfTrades: parseInt(traderData.number_of_trades),
        tradersReferred: traderData.traders_referred,
        tier: traderData.tier,
        commissions,
        rebates,
        commissionsVolume: bigNumberify(traderData.commissions_volume),
        rebatesVolume: bigNumberify(traderData.rebates_volume),
      };
    } else {
      return {
        volume: bigNumberify(0),
        totalReward: bigNumberify(0),
        commissions: bigNumberify(0),
        rebates: bigNumberify(0),
      };
    }
  }, [account, currentRewardRound, allUsersRoundData, ethPrice]);

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
    ({ cumulativeStats, referrerTotalStats, referrerTierInfo, referralTotalStats /*, rebateDistributions */ } =
      referralsData);
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
  let hasClaimedRound;
  if (selectedRound !== "latest" && hasClaimed) {
    hasClaimedRound = hasClaimed[getOffsetRewardRound(selectedRound)];
  }

  const handleSetIsEnterCodeModalVisible = (isEdit) => {
    setIsEdit(isEdit);
    setIsEnterCodeModalVisible(true);
  };

  // Change view based on window hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === REBATES_HASH) {
      setCurrentView(REBATES);
    } else if (hash === COMMISSIONS_HASH) {
      setCurrentView(COMMISSIONS);
    } else if (hash === LEADERBOARD_HASH) {
      setCurrentView(LEADERBOARD);
    } else {
      setCurrentView(REBATES);
    }
  }, [setCurrentView, location.hash]);

  return (
    <>
      <SEO
        title={getPageTitle("Referral")}
        description="Use a referral code on Mycelium Perpetual Swaps to earn rebates on trading fees."
      />
      <EnterCodeModal
        active={active}
        chainId={chainId}
        library={library}
        connectWallet={connectWallet}
        isEnterCodeModalVisible={isEnterCodeModalVisible}
        setIsEnterCodeModalVisible={setIsEnterCodeModalVisible}
        isEdit={isEdit}
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
            [LEADERBOARD]: <LeaderboardHeader />,
          }[currentView]
        }
        <ViewSwitchTriple
          switchView={switchView}
          currentView={currentView}
          views={[REBATES, COMMISSIONS, LEADERBOARD]}
        />
        <Styles.PersonalReferralContainer>
          {currentView !== LEADERBOARD && (
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
          )}
          {currentView === REBATES && (
            <TraderRebateStats
              active={active}
              connectWallet={connectWallet}
              trackAction={trackAction}
              referralCodeInString={referralCodeInString}
              handleSetIsEnterCodeModalVisible={handleSetIsEnterCodeModalVisible}
              tradersTier={tradersTier}
            />
          )}
          {currentView === COMMISSIONS && (
            <ReferralCodesTable
              chainId={chainId}
              active={active}
              connectWallet={connectWallet}
              trackAction={trackAction}
              setIsCreateCodeModalVisible={setIsCreateCodeModalVisible}
              hasCreatedCode={hasCreatedCode}
              finalReferrerTotalStats={finalReferrerTotalStats}
            />
          )}
          {currentView === LEADERBOARD && (
            <ReferralLeaderboard
              connectWallet={connectWallet}
              userRoundData={userRoundData}
              currentRoundData={currentRewardRound?.rewards}
              referralCodeInString={referralCodeInString}
              allRoundsRewardsData={allRoundsRewardsData}
              allUsersRoundData={allUsersRoundData}
              selectedRound={selectedRound}
              setSelectedRound={setSelectedRound}
              rewardsMessage={rewardsMessage}
              trackAction={trackAction}
            />
          )}
          {active && currentView !== LEADERBOARD && (
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
              setIsClaimModalOpen={setIsClaimModalOpen}
            />
          )}
          <ReferralsClaim
            isVisible={isClaimModalOpen}
            setIsVisible={setIsClaimModalOpen}
            userRoundData={userRoundData}
            round={selectedRound}
            handleClaim={handleClaim}
            isClaiming={isClaiming}
            connectWallet={connectWallet}
            active={active}
          />
        </Styles.PersonalReferralContainer>
      </Styles.StyledReferralPage>
    </>
  );
}
