import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";

import Modal from "../../components/Modal/Modal";
import Checkbox from "../../components/Checkbox/Checkbox";
import Tooltip from "../../components/Tooltip/Tooltip";
import Footer from "../../Footer";

import Vault from "../../abis/Vault.json";
import ReaderV2 from "../../abis/ReaderV2.json";
import RewardRouter from "../../abis/RewardRouter.json";
import RewardReader from "../../abis/RewardReader.json";
import Token from "../../abis/Token.json";
import GlpManager from "../../abis/GlpManager.json";

import { ethers } from "ethers";
import {
  fetcher,
  formatAmount,
  formatKeyAmount,
  getChainName,
  approveTokens,
  getServerUrl,
  useLocalStorageSerializeKey,
  useChainId,
  GLP_DECIMALS,
  USD_DECIMALS,
  ARBITRUM,
  PLACEHOLDER_ACCOUNT,
  getBalanceAndSupplyData,
  getDepositBalanceData,
  getVestingData,
  getStakingData,
  getProcessedData,
} from "../../Helpers";
import { callContract, useTCRPrice } from "../../Api";
import { getConstant } from "../../Constants";

import useSWR from "swr";

import { getContract } from "../../Addresses";

import mlp40Icon from "../../img/ic_mlp_40.svg";
import * as StakeV2Styled from "./StakeV2Styles";

import "./StakeV2.css";

function CompoundModal(props) {
  const {
    isVisible,
    setIsVisible,
    rewardRouterAddress,
    active,
    account,
    library,
    chainId,
    setPendingTxns,
    totalVesterRewards,
    nativeTokenSymbol,
    wrappedTokenSymbol,
  } = props;
  const [isCompounding, setIsCompounding] = useState(false);
  const [shouldClaimTCR, setShouldClaimTCR] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-tcr"],
    true
  );
  const [shouldClaimWeth, setShouldClaimWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-weth"],
    true
  );
  const [shouldConvertWeth, setShouldConvertWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-convert-weth"],
    true
  );
  const [shouldBuyMlpWithEth, setShouldBuyMlpWithEth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-buy-mlp"],
    true
  );

  const gmxAddress = getContract(chainId, "GMX");
  const stakedGlpTrackerAddress = getContract(chainId, "StakedGlpTracker");

  const [isApproving, setIsApproving] = useState(false);

  const { data: tokenAllowance } = useSWR(
    active && [active, chainId, gmxAddress, "allowance", account, stakedGlpTrackerAddress],
    {
      fetcher: fetcher(library, Token),
    }
  );

  const needApproval = tokenAllowance && totalVesterRewards && totalVesterRewards.gt(tokenAllowance);

  const isPrimaryEnabled = () => {
    return !isCompounding && !isApproving && !isCompounding;
  };

  const getPrimaryText = () => {
    if (isApproving) {
      return `Approving TCR...`;
    }
    if (needApproval) {
      return `Approve TCR`;
    }
    if (isCompounding) {
      return "Compounding...";
    }
    return "Compound";
  };

  const onClickPrimary = () => {
    if (needApproval) {
      approveTokens({
        setIsApproving,
        library,
        tokenAddress: gmxAddress,
        spender: stakedGlpTrackerAddress,
        chainId,
      });
      return;
    }

    setIsCompounding(true);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    contract.feeGmxTracker().then((res) => {
      console.log(res);
    })
    callContract(
      chainId,
      contract,
      "handleRewards",
      [
        shouldClaimTCR,
        false, // shouldStakeTCR,
        false, // shouldClaimEsGMX
        false, // shouldStakeEsGmx,
        false, // shouldStakeMultiplierPoints,
        shouldClaimWeth || shouldConvertWeth || shouldBuyMlpWithEth,
        shouldConvertWeth,
        shouldBuyMlpWithEth,
      ],
      {
        sentMsg: "Compound submitted!",
        failMsg: "Compound failed.",
        successMsg: "Compound completed!",
        setPendingTxns,
      }
    )
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsCompounding(false);
      });
  };

  const toggleConvertWeth = (value) => {
    if (value) {
      setShouldClaimWeth(true);
      setShouldBuyMlpWithEth(false);
    }
    setShouldConvertWeth(value);
  };

  const toggleBuyTlp = (value) => {
    if (value) {
      setShouldClaimWeth(true);
      setShouldConvertWeth(false);
    } 
    setShouldBuyMlpWithEth(value);
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label="Compound Rewards">
        <div className="CompoundModal-menu">
          <div>
            <Checkbox isChecked={shouldClaimTCR} setIsChecked={setShouldClaimTCR} disabled>
              Claim TCR Rewards
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldClaimWeth} setIsChecked={setShouldClaimWeth} disabled={shouldConvertWeth || shouldBuyMlpWithEth}>
              Claim {wrappedTokenSymbol} Rewards
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldConvertWeth} setIsChecked={toggleConvertWeth}>
              Convert {wrappedTokenSymbol} to {nativeTokenSymbol}
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldBuyMlpWithEth} setIsChecked={toggleBuyTlp}>
              Buy MLP with {wrappedTokenSymbol}
            </Checkbox>
          </div>
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function ClaimModal(props) {
  const {
    isVisible,
    setIsVisible,
    rewardRouterAddress,
    library,
    chainId,
    setPendingTxns,
    nativeTokenSymbol,
    wrappedTokenSymbol,
  } = props;
  const [isClaiming, setIsClaiming] = useState(false);
  const [shouldClaimTCR, setShouldClaimTCR] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-claim-tcr"],
    true
  );
  const [shouldClaimWeth, setShouldClaimWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-claim-weth"],
    true
  );
  const [shouldConvertWeth, setShouldConvertWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-convert-weth"],
    true
  );

  const isPrimaryEnabled = () => {
    return !isClaiming;
  };

  const getPrimaryText = () => {
    if (isClaiming) {
      return `Claiming...`;
    }
    return "Claim";
  };

  const onClickPrimary = () => {
    setIsClaiming(true);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    callContract(
      chainId,
      contract,
      "handleRewards",
      [
        shouldClaimTCR,
        false, // shouldStakeTCR
        false, // shouldClaimEsGmx,
        false, // shouldStakeEsGmx
        false, // shouldStakeMultiplierPoints
        shouldClaimWeth,
        shouldConvertWeth,
        false, // shouldBuyTlpWithEth
      ],
      {
        sentMsg: "Claim submitted.",
        failMsg: "Claim failed.",
        successMsg: "Claim completed!",
        setPendingTxns,
      }
    )
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsClaiming(false);
      });
  };

  const toggleConvertWeth = (value) => {
    if (value) {
      setShouldClaimWeth(true);
    }
    setShouldConvertWeth(value);
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label="Claim Rewards">
        <div className="CompoundModal-menu">
          <div>
            <Checkbox isChecked={shouldClaimTCR} setIsChecked={setShouldClaimTCR}>
              Claim TCR Rewards
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldClaimWeth} setIsChecked={setShouldClaimWeth} disabled={shouldConvertWeth}>
              Claim {wrappedTokenSymbol} Rewards
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldConvertWeth} setIsChecked={toggleConvertWeth}>
              Convert {wrappedTokenSymbol} to {nativeTokenSymbol}
            </Checkbox>
          </div>
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            {getPrimaryText()}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function StakeV2({ setPendingTxns, connectWallet }) {
  const { active, library, account } = useWeb3React();
  const { chainId } = useChainId();

  const chainName = getChainName(chainId);

  const [isCompoundModalVisible, setIsCompoundModalVisible] = useState(false);
  const [isClaimModalVisible, setIsClaimModalVisible] = useState(false);

  const rewardRouterAddress = getContract(chainId, "RewardRouter");
  const rewardReaderAddress = getContract(chainId, "RewardReader");
  const readerAddress = getContract(chainId, "Reader");

  const vaultAddress = getContract(chainId, "Vault");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
  const gmxAddress = getContract(chainId, "GMX");
  const esGmxAddress = getContract(chainId, "ES_GMX");
  const bnGmxAddress = getContract(chainId, "BN_GMX");
  const glpAddress = getContract(chainId, "GLP");

  const stakedGmxTrackerAddress = getContract(chainId, "StakedGmxTracker");
  const bonusGmxTrackerAddress = getContract(chainId, "BonusGmxTracker");
  const feeGmxTrackerAddress = getContract(chainId, "FeeGmxTracker");

  const stakedGlpTrackerAddress = getContract(chainId, "StakedGlpTracker");
  const feeGlpTrackerAddress = getContract(chainId, "FeeGlpTracker");

  const glpManagerAddress = getContract(chainId, "GlpManager");

  const gmxVesterAddress = getContract(chainId, "GmxVester");
  const glpVesterAddress = getContract(chainId, "GlpVester");

  const vesterAddresses = [gmxVesterAddress, glpVesterAddress];

  const nativeTokenSymbol = getConstant(chainId, "nativeTokenSymbol");
  const wrappedTokenSymbol = getConstant(chainId, "wrappedTokenSymbol");

  const walletTokens = [gmxAddress, esGmxAddress, glpAddress, stakedGmxTrackerAddress];
  const depositTokens = [
    gmxAddress,
    esGmxAddress,
    stakedGmxTrackerAddress,
    bonusGmxTrackerAddress,
    bnGmxAddress,
    glpAddress,
  ];
  const rewardTrackersForDepositBalances = [
    stakedGmxTrackerAddress,
    stakedGmxTrackerAddress,
    bonusGmxTrackerAddress,
    feeGmxTrackerAddress,
    feeGmxTrackerAddress,
    feeGlpTrackerAddress,
  ];
  const rewardTrackersForStakingInfo = [
    stakedGmxTrackerAddress,
    bonusGmxTrackerAddress,
    feeGmxTrackerAddress,
    stakedGlpTrackerAddress,
    feeGlpTrackerAddress,
  ];

  const { data: walletBalances } = useSWR(
    [
      `StakeV2:walletBalances:${active}`,
      chainId,
      readerAddress,
      "getTokenBalancesWithSupplies",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(library, ReaderV2, [walletTokens]),
    }
  );

  const { data: depositBalances } = useSWR(
    [
      `StakeV2:depositBalances:${active}`,
      chainId,
      rewardReaderAddress,
      "getDepositBalances",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(library, RewardReader, [depositTokens, rewardTrackersForDepositBalances]),
    }
  );

  const { data: stakingInfo } = useSWR(
    [`StakeV2:stakingInfo:${active}`, chainId, rewardReaderAddress, "getStakingInfo", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, RewardReader, [rewardTrackersForStakingInfo]),
    }
  );

  const { data: stakedGmxSupply } = useSWR(
    [`StakeV2:stakedGmxSupply:${active}`, chainId, gmxAddress, "balanceOf", stakedGmxTrackerAddress],
    {
      fetcher: fetcher(library, Token),
    }
  );

  const { data: aums } = useSWR([`StakeV2:getAums:${active}`, chainId, glpManagerAddress, "getAums"], {
    fetcher: fetcher(library, GlpManager),
  });

  const { data: nativeTokenPrice } = useSWR(
    [`StakeV2:nativeTokenPrice:${active}`, chainId, vaultAddress, "getMinPrice", nativeTokenAddress],
    {
      fetcher: fetcher(library, Vault),
    }
  );

  const { data: vestingInfo } = useSWR(
    [`StakeV2:vestingInfo:${active}`, chainId, readerAddress, "getVestingInfo", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, ReaderV2, [vesterAddresses]),
    }
  );

  const { tcrPrice } = useTCRPrice(chainId, { arbitrum: chainId === ARBITRUM ? library : undefined }, active);

  const gmxSupplyUrl = getServerUrl(chainId, "/gmx_supply");
  const { data: gmxSupply } = useSWR([gmxSupplyUrl], {
    fetcher: (...args) => fetch(...args).then((res) => res.text()),
  });

  let aum;
  if (aums && aums.length > 0) {
    aum = aums[0].add(aums[1]).div(2);
  }

  const { balanceData, supplyData } = getBalanceAndSupplyData(walletBalances);
  const depositBalanceData = getDepositBalanceData(depositBalances);
  const stakingData = getStakingData(stakingInfo);
  const vestingData = getVestingData(vestingInfo);

  const processedData = getProcessedData(
    balanceData,
    supplyData,
    depositBalanceData,
    stakingData,
    vestingData,
    aum,
    nativeTokenPrice,
    stakedGmxSupply,
    tcrPrice,
    gmxSupply
  );

  let totalRewardTokens;
  if (processedData && processedData.bnGmxInFeeGmx && processedData.bonusGmxInFeeGmx) {
    totalRewardTokens = processedData.bnGmxInFeeGmx.add(processedData.bonusGmxInFeeGmx);
  }

  let totalRewardTokensAndGlp;
  if (totalRewardTokens && processedData && processedData.glpBalance) {
    totalRewardTokensAndGlp = totalRewardTokens.add(processedData.glpBalance);
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  let earnMsg;
  if (totalRewardTokensAndGlp && totalRewardTokensAndGlp.gt(0)) {
    let gmxAmountStr;
    if (processedData.gmxInStakedGmx && processedData.gmxInStakedGmx.gt(0)) {
      gmxAmountStr = formatAmount(processedData.gmxInStakedGmx, 18, 2, true) + " GMX";
    }
    let esGmxAmountStr;
    if (processedData.esGmxInStakedGmx && processedData.esGmxInStakedGmx.gt(0)) {
      esGmxAmountStr = formatAmount(processedData.esGmxInStakedGmx, 18, 2, true) + " esGMX";
    }
    let mpAmountStr;
    if (processedData.bonusGmxInFeeGmx && processedData.bnGmxInFeeGmx.gt(0)) {
      mpAmountStr = formatAmount(processedData.bnGmxInFeeGmx, 18, 2, true) + " MP";
    }
    let glpStr;
    if (processedData.glpBalance && processedData.glpBalance.gt(0)) {
      glpStr = formatAmount(processedData.glpBalance, 18, 2, true) + " MLP";
    }
    const amountStr = [gmxAmountStr, esGmxAmountStr, mpAmountStr, glpStr].filter((s) => s).join(", ");
    earnMsg = (
      <div>
        You are earning {nativeTokenSymbol} rewards with {formatAmount(totalRewardTokensAndGlp, 18, 2, true)} tokens.
        <br />
        Tokens: {amountStr}.
      </div>
    );
  }

  return (
    <div className="StakeV2 Page page-layout">
      <CompoundModal
        active={active}
        account={account}
        setPendingTxns={setPendingTxns}
        isVisible={isCompoundModalVisible}
        setIsVisible={setIsCompoundModalVisible}
        rewardRouterAddress={rewardRouterAddress}
        totalVesterRewards={processedData.totalVesterRewards}
        wrappedTokenSymbol={wrappedTokenSymbol}
        nativeTokenSymbol={nativeTokenSymbol}
        library={library}
        chainId={chainId}
      />
      <ClaimModal
        active={active}
        account={account}
        setPendingTxns={setPendingTxns}
        isVisible={isClaimModalVisible}
        setIsVisible={setIsClaimModalVisible}
        rewardRouterAddress={rewardRouterAddress}
        totalVesterRewards={processedData.totalVesterRewards}
        wrappedTokenSymbol={wrappedTokenSymbol}
        nativeTokenSymbol={nativeTokenSymbol}
        library={library}
        chainId={chainId}
      />
      <div className="StakeV2-content">
        <div className="Page-title-section mt-0">
          <div className="Page-title">Earn</div>
          <div className="Page-description">
            Stake{" "}
            <a
              href="https://tracer-1.gitbook.io/tracer-perpetual-swaps/6VOYVKGbCCw0I8cj7vdF/protocol-design/shared-liquidity-pool/mlp-token-pricing"
              target="_blank"
              rel="noopener noreferrer"
            >
              MLP
            </a>{" "}
            to earn rewards.
          </div>
          {earnMsg && <div className="Page-description">{earnMsg}</div>}
        </div>
        <div className="StakeV2-cards">
          <div className="App-card">
            <div className="App-card-title">
              <img src={mlp40Icon} alt="mlp40Icon" />
              MLP ({chainName})
            </div>
            <StakeV2Styled.RewardsBanner>
              <StakeV2Styled.RewardsBannerRow>
                <StakeV2Styled.RewardsBannerText secondary>Rewards</StakeV2Styled.RewardsBannerText>
                <div>
                  <StakeV2Styled.RewardsBannerTextWrap>
                    <StakeV2Styled.RewardsBannerText large inline>
                      {formatKeyAmount(processedData, "feeGlpTrackerRewards", 18, 4)} {nativeTokenSymbol} (
                      {wrappedTokenSymbol})
                    </StakeV2Styled.RewardsBannerText>{" "}
                    <StakeV2Styled.RewardsBannerText inline>
                      ($
                      {formatKeyAmount(processedData, "feeGlpTrackerRewardsUsd", USD_DECIMALS, 2, true)})
                    </StakeV2Styled.RewardsBannerText>
                  </StakeV2Styled.RewardsBannerTextWrap>
                  <StakeV2Styled.RewardsBannerTextWrap>
                    <StakeV2Styled.RewardsBannerText large inline>
                      {formatKeyAmount(processedData, "stakedGlpTrackerRewards", 18, 4)} TCR
                    </StakeV2Styled.RewardsBannerText>{" "}
                    <StakeV2Styled.RewardsBannerText inline>
                      ($
                      {formatKeyAmount(processedData, "stakedGlpTrackerRewardsUsd", USD_DECIMALS, 2, true)})
                    </StakeV2Styled.RewardsBannerText>
                  </StakeV2Styled.RewardsBannerTextWrap>
                </div>
              </StakeV2Styled.RewardsBannerRow>
              <StakeV2Styled.RewardsBannerRow>
                <StakeV2Styled.RewardsBannerText secondary>APR</StakeV2Styled.RewardsBannerText>
                <StakeV2Styled.RewardsBannerText large inline>
                  <Tooltip
                    handle={`${formatKeyAmount(processedData, "glpAprTotal", 2, 2, true)}%`}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          <div className="Tooltip-row">
                            <span className="label">
                              {nativeTokenSymbol} ({wrappedTokenSymbol}) APR
                            </span>
                            <span>{formatKeyAmount(processedData, "glpAprForNativeToken", 2, 2, true)}%</span>
                          </div>
                          <div className="Tooltip-row">
                            <span className="label">TCR APR</span>
                            <span>{formatKeyAmount(processedData, "glpAprForEsGmx", 2, 2, true)}%</span>
                          </div>
                        </>
                      );
                    }}
                  />
                </StakeV2Styled.RewardsBannerText>
              </StakeV2Styled.RewardsBannerRow>
            </StakeV2Styled.RewardsBanner>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">Price</div>
                <div>${formatKeyAmount(processedData, "glpPrice", USD_DECIMALS, 3, true)}</div>
              </div>
              <div className="App-card-row">
                <div className="label">Wallet</div>
                <div>
                  {formatKeyAmount(processedData, "glpBalance", GLP_DECIMALS, 2, true)} MLP ($
                  {formatKeyAmount(processedData, "glpBalanceUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Staked</div>
                <div>
                  {formatKeyAmount(processedData, "glpBalance", GLP_DECIMALS, 2, true)} MLP ($
                  {formatKeyAmount(processedData, "glpBalanceUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">Total Staked</div>
                <div>
                  {formatKeyAmount(processedData, "glpSupply", 18, 2, true)} MLP ($
                  {formatKeyAmount(processedData, "glpSupplyUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Total Supply</div>
                <div>
                  {formatKeyAmount(processedData, "glpSupply", 18, 2, true)} MLP ($
                  {formatKeyAmount(processedData, "glpSupplyUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-options">
                <Link className="App-button-option App-card-option" to="/buy_mlp">
                  Buy MLP
                </Link>
                <Link className="App-button-option App-card-option" to="/buy_mlp#redeem">
                  Sell MLP
                </Link>
                {active && (
                  <button className="App-button-option App-card-option" onClick={() => setIsCompoundModalVisible(true)}>
                    Compound
                  </button>
                )}
                {active && (
                  <button className="App-button-option App-card-option" onClick={() => setIsClaimModalVisible(true)}>
                    Claim
                  </button>
                )}
                {!active && (
                  <button className="App-button-option App-card-option" onClick={() => connectWallet()}>
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
