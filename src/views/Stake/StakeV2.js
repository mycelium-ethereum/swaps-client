import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";

import Modal from "../../components/Modal/Modal";
import Checkbox from "../../components/Checkbox/Checkbox";
import Tooltip from "../../components/Tooltip/Tooltip";
import Footer from "../../Footer";

import Vault from "../../abis/Vault.json";
import ReaderV2 from "../../abis/ReaderV2.json";
import Vester from "../../abis/Vester.json";
import RewardRouter from "../../abis/RewardRouter.json";
import RewardReader from "../../abis/RewardReader.json";
import Token from "../../abis/Token.json";
import MlpManager from "../../abis/MlpManager.json";

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
  MLP_DECIMALS,
  USD_DECIMALS,
  ARBITRUM,
  PLACEHOLDER_ACCOUNT,
  getBalanceAndSupplyData,
  getDepositBalanceData,
  // getVestingData,
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
  const [shouldStakeTCR, setShouldStakeTCR] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-stake-tcr"],
    true
  );
  const [shouldStakeMultiplierPoints, setShouldStakeMultiplierPoints] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-stake-multiplier-points"],
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
  const [shouldBuymlp, setShouldBuymlp] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-buy-mlp"],
    true
  );

  const mycAddress = getContract(chainId, "MYC");
  const stakedMycTrackerAddress = getContract(chainId, "StakedMycTracker");

  const [isApproving, setIsApproving] = useState(false);

  const { data: tokenAllowance } = useSWR(
    active && [active, chainId, mycAddress, "allowance", account, stakedMycTrackerAddress],
    {
      fetcher: fetcher(library, Token),
    }
  );

  const needApproval = shouldStakeTCR && tokenAllowance && totalVesterRewards && totalVesterRewards.gt(tokenAllowance);

  const isPrimaryEnabled = () => {
    return !isCompounding && !isApproving && !isCompounding;
  };

  const getPrimaryText = () => {
    if (isApproving) {
      return `Approving MYC...`;
    }
    if (needApproval) {
      return `Approve MYC`;
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
        tokenAddress: mycAddress,
        spender: stakedMycTrackerAddress,
        chainId,
      });
      return;
    }

    setIsCompounding(true);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    callContract(
      chainId,
      contract,
      "handleRewards",
      [
        shouldClaimTCR || shouldStakeTCR,
        shouldStakeTCR,
        false, // shouldClaimEsMYC
        false, // shouldStakeEsMyc,
        shouldStakeMultiplierPoints,
        shouldClaimWeth || shouldConvertWeth,
        shouldConvertWeth,
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

  const toggleShouldStakeTCR = (value) => {
    if (value) {
      setShouldClaimTCR(true);
    }
    setShouldStakeTCR(value);
  };

  const toggleConvertWeth = (value) => {
    if (value) {
      setShouldClaimWeth(true);
    }
    setShouldConvertWeth(value);
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label="Compound Rewards">
        <div className="CompoundModal-menu">
          <div>
            <Checkbox isChecked={shouldStakeMultiplierPoints} setIsChecked={setShouldStakeMultiplierPoints}>
              Stake Multiplier Points
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldClaimTCR} setIsChecked={setShouldClaimTCR} disabled={shouldStakeTCR}>
              Claim MYC Rewards
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldStakeTCR} setIsChecked={toggleShouldStakeTCR}>
              Stake MYC Rewards
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
          <div>
            <Checkbox isChecked={shouldBuymlp} setIsChecked={setShouldBuymlp}>
              Buy mlp
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
        false, // shouldClaimEsMyc,
        false, // shouldStakeEsMyc
        false, // shouldStakeMultiplierPoints
        shouldClaimWeth,
        shouldConvertWeth,
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
              Claim ETH Rewards
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

export default function StakeV2({ setPendingTxns, connectWallet, trackAction }) {
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
  const mycAddress = getContract(chainId, "MYC");
  const esMycAddress = getContract(chainId, "ES_MYC");
  const bnMycAddress = getContract(chainId, "BN_MYC");
  const mlpAddress = getContract(chainId, "MLP");

  const stakedMycTrackerAddress = getContract(chainId, "StakedMycTracker");
  const bonusMycTrackerAddress = getContract(chainId, "BonusMycTracker");
  const feeMycTrackerAddress = getContract(chainId, "FeeMycTracker");

  const stakedMlpTrackerAddress = getContract(chainId, "StakedMlpTracker");
  const feeMlpTrackerAddress = getContract(chainId, "FeeMlpTracker");

  const mlpManagerAddress = getContract(chainId, "MlpManager");

  const mycVesterAddress = getContract(chainId, "MycVester");
  const mlpVesterAddress = getContract(chainId, "MlpVester");

  const vesterAddresses = [mycVesterAddress, mlpVesterAddress];

  const nativeTokenSymbol = getConstant(chainId, "nativeTokenSymbol");
  const wrappedTokenSymbol = getConstant(chainId, "wrappedTokenSymbol");

  const walletTokens = [mycAddress, esMycAddress, mlpAddress, stakedMycTrackerAddress];
  const depositTokens = [
    mycAddress,
    esMycAddress,
    stakedMycTrackerAddress,
    bonusMycTrackerAddress,
    bnMycAddress,
    mlpAddress,
  ];
  const rewardTrackersForDepositBalances = [
    stakedMycTrackerAddress,
    stakedMycTrackerAddress,
    bonusMycTrackerAddress,
    feeMycTrackerAddress,
    feeMycTrackerAddress,
    feeMlpTrackerAddress,
  ];
  const rewardTrackersForStakingInfo = [
    stakedMycTrackerAddress,
    bonusMycTrackerAddress,
    feeMycTrackerAddress,
    stakedMlpTrackerAddress,
    feeMlpTrackerAddress,
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

  const { data: stakedMycSupply } = useSWR(
    [`StakeV2:stakedMycSupply:${active}`, chainId, mycAddress, "balanceOf", stakedMycTrackerAddress],
    {
      fetcher: fetcher(library, Token),
    }
  );

  const { data: aums } = useSWR([`StakeV2:getAums:${active}`, chainId, mlpManagerAddress, "getAums"], {
    fetcher: fetcher(library, MlpManager),
  });

  const { data: nativeTokenPrice } = useSWR(
    [`StakeV2:nativeTokenPrice:${active}`, chainId, vaultAddress, "getMinPrice", nativeTokenAddress],
    {
      fetcher: fetcher(library, Vault),
    }
  );

  // const { data: vestingInfo } = useSWR(
    // [`StakeV2:vestingInfo:${active}`, chainId, readerAddress, "getVestingInfo", account || PLACEHOLDER_ACCOUNT],
    // {
      // fetcher: fetcher(library, ReaderV2, [vesterAddresses]),
    // }
  // );
  const { data: mlpVesterRewards } = useSWR(
    [`StakeV2:claimable:${active}`, chainId, mlpVesterAddress, "claimable", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, Vester),
    }
  );

  const { tcrPrice } = useTCRPrice(chainId, { arbitrum: chainId === ARBITRUM ? library : undefined }, active);

  const mycSupplyUrl = getServerUrl(chainId, "/gmx_supply");
  const { data: mycSupply } = useSWR([mycSupplyUrl], {
    fetcher: (...args) => fetch(...args).then((res) => res.text()),
  });

  let aum;
  if (aums && aums.length > 0) {
    aum = aums[0].add(aums[1]).div(2);
  }

  const { balanceData, supplyData } = getBalanceAndSupplyData(walletBalances);
  const depositBalanceData = getDepositBalanceData(depositBalances);
  const stakingData = getStakingData(stakingInfo);
  // const vestingData = getVestingData(vestingInfo);
  const vestingData = mlpVesterRewards ? {
    mlpVester: {
      claimable: mlpVesterRewards
    },
    mycVester: {
      claimable: ethers.BigNumber.from(0)
    }
  } : undefined;

  const processedData = getProcessedData(
    balanceData,
    supplyData,
    depositBalanceData,
    stakingData,
    vestingData,
    aum,
    nativeTokenPrice,
    stakedMycSupply,
    tcrPrice,
    mycSupply
  );

  let totalRewardTokens;
  if (processedData && processedData.bnMycInFeeMyc && processedData.bonusMycInFeeMyc) {
    totalRewardTokens = processedData.bnMycInFeeMyc.add(processedData.bonusMycInFeeMyc);
  }

  let totalRewardTokensAndMlp;
  if (totalRewardTokens && processedData && processedData.mlpBalance) {
    totalRewardTokensAndMlp = totalRewardTokens.add(processedData.mlpBalance);
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  let earnMsg;
  if (totalRewardTokensAndMlp && totalRewardTokensAndMlp.gt(0)) {
    let mycAmountStr;
    if (processedData.mycInStakedMyc && processedData.mycInStakedMyc.gt(0)) {
      mycAmountStr = formatAmount(processedData.mycInStakedMyc, 18, 2, true) + " MYC";
    }
    let esMycAmountStr;
    if (processedData.esMycInStakedMyc && processedData.esMycInStakedMyc.gt(0)) {
      esMycAmountStr = formatAmount(processedData.esMycInStakedMyc, 18, 2, true) + " esMYC";
    }
    let mpAmountStr;
    if (processedData.bonusMycInFeeMyc && processedData.bnMycInFeeMyc.gt(0)) {
      mpAmountStr = formatAmount(processedData.bnMycInFeeMyc, 18, 2, true) + " MP";
    }
    let mlpStr;
    if (processedData.mlpBalance && processedData.mlpBalance.gt(0)) {
      mlpStr = formatAmount(processedData.mlpBalance, 18, 2, true) + " MLP";
    }
    const amountStr = [mycAmountStr, esMycAmountStr, mpAmountStr, mlpStr].filter((s) => s).join(", ");
    earnMsg = (
      <div>
        You are earning {nativeTokenSymbol} rewards with {formatAmount(totalRewardTokensAndMlp, 18, 2, true)} tokens.
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
                      {formatKeyAmount(processedData, "feeMlpTrackerRewards", 18, 4)} {nativeTokenSymbol} (
                      {wrappedTokenSymbol})
                    </StakeV2Styled.RewardsBannerText>{" "}
                    <StakeV2Styled.RewardsBannerText inline>
                      ($
                      {formatKeyAmount(processedData, "feeMlpTrackerRewardsUsd", USD_DECIMALS, 2, true)})
                    </StakeV2Styled.RewardsBannerText>
                  </StakeV2Styled.RewardsBannerTextWrap>
                  <StakeV2Styled.RewardsBannerTextWrap>
                    <StakeV2Styled.RewardsBannerText large inline>
                      {formatKeyAmount(processedData, "stakedMlpTrackerRewards", 18, 4)} MYC
                    </StakeV2Styled.RewardsBannerText>{" "}
                    <StakeV2Styled.RewardsBannerText inline>
                      ($
                      {formatKeyAmount(processedData, "stakedMlpTrackerRewardsUsd", USD_DECIMALS, 2, true)})
                    </StakeV2Styled.RewardsBannerText>
                  </StakeV2Styled.RewardsBannerTextWrap>
                </div>
              </StakeV2Styled.RewardsBannerRow>
              <StakeV2Styled.RewardsBannerRow>
                <StakeV2Styled.RewardsBannerText secondary>APR</StakeV2Styled.RewardsBannerText>
                <StakeV2Styled.RewardsBannerText large inline>
                  <Tooltip
                    handle={`${formatKeyAmount(processedData, "mlpAprTotal", 2, 2, true)}%`}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          <div className="Tooltip-row">
                            <span className="label">
                              {nativeTokenSymbol} ({wrappedTokenSymbol}) APR
                            </span>
                            <span>{formatKeyAmount(processedData, "mlpAprForNativeToken", 2, 2, true)}%</span>
                          </div>
                          <div className="Tooltip-row">
                            <span className="label">esMYC APR</span>
                            <span>{formatKeyAmount(processedData, "mlpAprForEsMyc", 2, 2, true)}%</span>
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
                <div>${formatKeyAmount(processedData, "mlpPrice", USD_DECIMALS, 3, true)}</div>
              </div>
              <div className="App-card-row">
                <div className="label">Wallet</div>
                <div>
                  {formatKeyAmount(processedData, "mlpBalance", MLP_DECIMALS, 2, true)} MLP ($
                  {formatKeyAmount(processedData, "mlpBalanceUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Staked</div>
                <div>
                  {formatKeyAmount(processedData, "mlpBalance", MLP_DECIMALS, 2, true)} MLP ($
                  {formatKeyAmount(processedData, "mlpBalanceUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-row">
                <div className="label">Total Staked</div>
                <div>
                  {formatKeyAmount(processedData, "mlpSupply", 18, 2, true)} MLP ($
                  {formatKeyAmount(processedData, "mlpSupplyUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">Total Supply</div>
                <div>
                  {formatKeyAmount(processedData, "mlpSupply", 18, 2, true)} MLP ($
                  {formatKeyAmount(processedData, "mlpSupplyUsd", USD_DECIMALS, 2, true)})
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-options">
                <Link
                  className="App-button-option App-card-option"
                  to="/buy_mlp"
                  onClick={() =>
                    trackAction &&
                    trackAction("Button clicked", {
                      buttonName: "Buy MLP",
                    })
                  }
                >
                  Buy MLP
                </Link>
                <Link
                  className="App-button-option App-card-option"
                  to="/buy_mlp#redeem"
                  onClick={() =>
                    trackAction &&
                    trackAction("Button clicked", {
                      buttonName: "Sell MLP",
                    })
                  }
                >
                  Sell MLP
                </Link>
                {active && (
                  <button
                    className="App-button-option App-card-option"
                    onClick={() => {
                      setIsCompoundModalVisible(true);
                      trackAction &&
                        trackAction("Button clicked", {
                          buttonName: "Compound",
                        });
                    }}
                  >
                    Compound
                  </button>
                )}
                {active && (
                  <button
                    className="App-button-option App-card-option"
                    onClick={() => {
                      setIsClaimModalVisible(true);
                      trackAction &&
                        trackAction("Button clicked", {
                          buttonName: "Claim",
                        });
                    }}
                  >
                    Claim
                  </button>
                )}
                {!active && (
                  <button
                    className="App-button-option App-card-option"
                    onClick={() => {
                      connectWallet(true);
                      trackAction &&
                        trackAction("Button clicked", {
                          buttonName: "Connect Wallet",
                        });
                    }}
                  >
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
