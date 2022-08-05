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
import GlpManager from "../../abis/GlpManager.json";

import { ethers } from "ethers";
import {
  helperToast,
  bigNumberify,
  fetcher,
  formatAmount,
  formatKeyAmount,
  formatAmountFree,
  getChainName,
  parseValue,
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
  getPageTitle,
  GMX_DECIMALS,
} from "../../Helpers";
import { callContract, useTCRPrice } from "../../Api";
import { getConstant } from "../../Constants";

import useSWR from "swr";

import { getContract } from "../../Addresses";

import mlp40Icon from "../../img/ic_mlp_40.svg";
import myc40Icon from "../../img/ic_myc_40.svg";
import * as StakeV2Styled from "./StakeV2Styles";

import "./StakeV2.css";

import SEO from "../../components/Common/SEO";

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
            <Checkbox isChecked={shouldClaimTCR} setIsChecked={setShouldClaimTCR}>
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

function VesterDepositModal(props) {
  const {
    isVisible,
    setIsVisible,
    chainId,
    title,
    maxAmount,
    value,
    setValue,
    balance,
    vestedAmount,
    averageStakedAmount,
    maxVestableAmount,
    library,
    stakeTokenLabel,
    reserveAmount,
    maxReserveAmount,
    vesterAddress,
    setPendingTxns,
  } = props;
  const [isDepositing, setIsDepositing] = useState(false);

  let amount = parseValue(value, 18);

  let nextReserveAmount = reserveAmount;

  let nextDepositAmount = vestedAmount;
  if (amount) {
    nextDepositAmount = vestedAmount.add(amount);
  }

  let additionalReserveAmount = bigNumberify(0);
  if (amount && averageStakedAmount && maxVestableAmount && maxVestableAmount.gt(0)) {
    nextReserveAmount = nextDepositAmount.mul(averageStakedAmount).div(maxVestableAmount);
    if (nextReserveAmount.gt(reserveAmount)) {
      additionalReserveAmount = nextReserveAmount.sub(reserveAmount);
    }
  }

  const getError = () => {
    if (!amount || amount.eq(0)) {
      return "Enter an amount";
    }
    if (maxAmount && amount.gt(maxAmount)) {
      return "Max amount exceeded";
    }
    if (nextReserveAmount.gt(maxReserveAmount)) {
      return "Insufficient staked tokens";
    }
  };

  const onClickPrimary = () => {
    setIsDepositing(true);
    const contract = new ethers.Contract(vesterAddress, Vester.abi, library.getSigner());

    callContract(chainId, contract, "deposit", [amount], {
      sentMsg: "Deposit submitted!",
      failMsg: "Deposit failed!",
      successMsg: "Deposited!",
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsDepositing(false);
      });
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isDepositing) {
      return false;
    }
    return true;
  };

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }
    if (isDepositing) {
      return "Depositing...";
    }
    return "Deposit";
  };

  return (
    <SEO title={getPageTitle("Earn")}>
      <div className="StakeModal">
        <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title} className="non-scrollable">
          <div className="Exchange-swap-section">
            <div className="Exchange-swap-section-top">
              <div className="muted">
                <div className="Exchange-swap-usd">Deposit</div>
              </div>
              <div
                className="muted align-right clickable"
                onClick={() => setValue(formatAmountFree(maxAmount, 18, 18))}
              >
                Max: {formatAmount(maxAmount, 18, 4, true)}
              </div>
            </div>
            <div className="Exchange-swap-section-bottom">
              <div>
                <input
                  type="number"
                  placeholder="0.0"
                  className="Exchange-swap-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              <div className="PositionEditor-token-symbol">esMYC</div>
            </div>
          </div>
          <div className="VesterDepositModal-info-rows">
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">Wallet</div>
              <div className="align-right">{formatAmount(balance, 18, 2, true)} esMYC</div>
            </div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">Vault Capacity</div>
              <div className="align-right">
                <Tooltip
                  handle={`${formatAmount(nextDepositAmount, 18, 2, true)} / ${formatAmount(
                    maxVestableAmount,
                    18,
                    2,
                    true
                  )}`}
                  position="right-bottom"
                  renderContent={() => {
                    return (
                      <>
                        Vault Capacity for your Account
                        <br />
                        <br />
                        Deposited: {formatAmount(vestedAmount, 18, 2, true)} esMYC
                        <br />
                        Max Capacity: {formatAmount(maxVestableAmount, 18, 2, true)} esMYC
                        <br />
                      </>
                    );
                  }}
                />
              </div>
            </div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">Reserve Amount</div>
              <div className="align-right">
                <Tooltip
                  handle={`${formatAmount(
                    reserveAmount && reserveAmount.gte(additionalReserveAmount)
                      ? reserveAmount
                      : additionalReserveAmount,
                    18,
                    2,
                    true
                  )} / ${formatAmount(maxReserveAmount, 18, 2, true)}`}
                  position="right-bottom"
                  renderContent={() => {
                    return (
                      <>
                        Current Reserved: {formatAmount(reserveAmount, 18, 2, true)}
                        <br />
                        Additional reserve required: {formatAmount(additionalReserveAmount, 18, 2, true)}
                        <br />
                        {amount && nextReserveAmount.gt(maxReserveAmount) && (
                          <div>
                            <br />
                            You need a total of at least {formatAmount(nextReserveAmount, 18, 2, true)}{" "}
                            {stakeTokenLabel} to vest {formatAmount(amount, 18, 2, true)} esMYC.
                          </div>
                        )}
                      </>
                    );
                  }}
                />
              </div>
            </div>
          </div>
          <div className="Exchange-swap-button-container">
            <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
              {getPrimaryText()}
            </button>
          </div>
        </Modal>
      </div>
    </SEO>
  );
}

function VesterWithdrawModal(props) {
  const { isVisible, setIsVisible, chainId, title, library, vesterAddress, setPendingTxns } = props;
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const onClickPrimary = () => {
    setIsWithdrawing(true);
    const contract = new ethers.Contract(vesterAddress, Vester.abi, library.getSigner());

    callContract(chainId, contract, "withdraw", [], {
      sentMsg: "Withdraw submitted.",
      failMsg: "Withdraw failed.",
      successMsg: "Withdrawn!",
      setPendingTxns,
    })
      .then(async (res) => {
        setIsVisible(false);
      })
      .finally(() => {
        setIsWithdrawing(false);
      });
  };

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title}>
        <div>
          This will withdraw and unreserve all tokens as well as pause vesting.
          <br />
          <br />
          esMYC tokens that have been converted to MYC will remain as MYC tokens.
          <br />
          <br />
          To claim MYC tokens without withdrawing, use the "Claim" button under the Total Rewards section.
          <br />
          <br />
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={isWithdrawing}>
            {!isWithdrawing && "Confirm Withdraw"}
            {isWithdrawing && "Confirming..."}
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

  const [isVesterDepositModalVisible, setIsVesterDepositModalVisible] = useState(false);
  const [vesterDepositTitle, setVesterDepositTitle] = useState("");
  const [vesterDepositStakeTokenLabel, setVesterDepositStakeTokenLabel] = useState("");
  const [vesterDepositMaxAmount, setVesterDepositMaxAmount] = useState("");
  const [vesterDepositBalance, setVesterDepositBalance] = useState("");
  const [vesterDepositEscrowedBalance, setVesterDepositEscrowedBalance] = useState("");
  const [vesterDepositVestedAmount, setVesterDepositVestedAmount] = useState("");
  const [vesterDepositAverageStakedAmount, setVesterDepositAverageStakedAmount] = useState("");
  const [vesterDepositMaxVestableAmount, setVesterDepositMaxVestableAmount] = useState("");
  const [vesterDepositValue, setVesterDepositValue] = useState("");
  const [vesterDepositReserveAmount, setVesterDepositReserveAmount] = useState("");
  const [vesterDepositMaxReserveAmount, setVesterDepositMaxReserveAmount] = useState("");
  const [vesterDepositAddress, setVesterDepositAddress] = useState("");

  const [isVesterWithdrawModalVisible, setIsVesterWithdrawModalVisible] = useState(false);
  const [vesterWithdrawTitle, setVesterWithdrawTitle] = useState(false);
  const [vesterWithdrawAddress, setVesterWithdrawAddress] = useState("");

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
      gmxAmountStr = formatAmount(processedData.gmxInStakedGmx, 18, 2, true) + " MYC";
    }
    let esGmxAmountStr;
    if (processedData.esGmxInStakedGmx && processedData.esGmxInStakedGmx.gt(0)) {
      esGmxAmountStr = formatAmount(processedData.esGmxInStakedGmx, 18, 2, true) + " esMYC";
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

  const showGmxVesterDepositModal = () => {
    let remainingVestableAmount = vestingData.gmxVester.maxVestableAmount.sub(vestingData.gmxVester.vestedAmount);
    if (processedData.esGmxBalance.lt(remainingVestableAmount)) {
      remainingVestableAmount = processedData.esGmxBalance;
    }

    setIsVesterDepositModalVisible(true);
    setVesterDepositTitle("MYC Vault");
    setVesterDepositStakeTokenLabel("staked MYC + esMYC + Multiplier Points");
    setVesterDepositMaxAmount(remainingVestableAmount);
    setVesterDepositBalance(processedData.esGmxBalance);
    setVesterDepositEscrowedBalance(vestingData.gmxVester.escrowedBalance);
    setVesterDepositVestedAmount(vestingData.gmxVester.vestedAmount);
    setVesterDepositMaxVestableAmount(vestingData.gmxVester.maxVestableAmount);
    setVesterDepositAverageStakedAmount(vestingData.gmxVester.averageStakedAmount);
    setVesterDepositReserveAmount(vestingData.gmxVester.pairAmount);
    setVesterDepositMaxReserveAmount(totalRewardTokens);
    setVesterDepositValue("");
    setVesterDepositAddress(gmxVesterAddress);
  };

  const showGmxVesterWithdrawModal = () => {
    if (!vestingData || !vestingData.gmxVesterVestedAmount || vestingData.gmxVesterVestedAmount.eq(0)) {
      helperToast.error("You have not deposited any tokens for vesting.");
      return;
    }

    setIsVesterWithdrawModalVisible(true);
    setVesterWithdrawTitle("Withdraw from MYC Vault");
    setVesterWithdrawAddress(gmxVesterAddress);
  };

  return (
    <div className="StakeV2 Page page-layout">
      <VesterDepositModal
        isVisible={isVesterDepositModalVisible}
        setIsVisible={setIsVesterDepositModalVisible}
        chainId={chainId}
        title={vesterDepositTitle}
        stakeTokenLabel={vesterDepositStakeTokenLabel}
        maxAmount={vesterDepositMaxAmount}
        balance={vesterDepositBalance}
        escrowedBalance={vesterDepositEscrowedBalance}
        vestedAmount={vesterDepositVestedAmount}
        averageStakedAmount={vesterDepositAverageStakedAmount}
        maxVestableAmount={vesterDepositMaxVestableAmount}
        reserveAmount={vesterDepositReserveAmount}
        maxReserveAmount={vesterDepositMaxReserveAmount}
        value={vesterDepositValue}
        setValue={setVesterDepositValue}
        library={library}
        vesterAddress={vesterDepositAddress}
        setPendingTxns={setPendingTxns}
      />
      <VesterWithdrawModal
        isVisible={isVesterWithdrawModalVisible}
        setIsVisible={setIsVesterWithdrawModalVisible}
        vesterAddress={vesterWithdrawAddress}
        chainId={chainId}
        title={vesterWithdrawTitle}
        library={library}
        setPendingTxns={setPendingTxns}
      />
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
        <div className="StakeV2-cards">
          <div>
            <div className="Page-title-section">
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
          <div>
            <div className="Page-title-section">
              <div className="Page-title">Vest</div>
              <div className="Page-description">
                Convert esMYC tokens to MYC tokens.
                <br />
                Please read the{" "}
                <a href="https://gmxio.gitbook.io/gmx/rewards#vesting" target="_blank" rel="noopener noreferrer">
                  vesting details
                </a>{" "}
                before using the vaults.
              </div>
            </div>
            <div className="App-card StakeV2-gmx-card">
              <div className="App-card-title">
                <img src={myc40Icon} alt="myc40Icon" />
                esMYC Vault
              </div>
              <StakeV2Styled.RewardsBanner>
                <StakeV2Styled.RewardsBannerRow>
                  <StakeV2Styled.RewardsBannerText secondary>Staked Tokens</StakeV2Styled.RewardsBannerText>
                  <div>
                    <StakeV2Styled.RewardsBannerTextWrap>
                      <StakeV2Styled.RewardsBannerText large inline>
                        {formatKeyAmount(processedData, "gmxInStakedGmx", GMX_DECIMALS, 2, true)} MYC
                      </StakeV2Styled.RewardsBannerText>{" "}
                      <StakeV2Styled.RewardsBannerText inline>
                        ($
                        {formatKeyAmount(processedData, "gmxInStakedGmxUsd", USD_DECIMALS, 2, true)}
                        )
                      </StakeV2Styled.RewardsBannerText>
                    </StakeV2Styled.RewardsBannerTextWrap>
                  </div>
                </StakeV2Styled.RewardsBannerRow>
              </StakeV2Styled.RewardsBanner>
              <div className="App-card-content">
                <div className="App-card-row">
                  <div className="label">Reserved for Vesting</div>
                  <div>
                    {formatKeyAmount(vestingData, "gmxVesterPairAmount", 18, 2, true)} /{" "}
                    {formatAmount(totalRewardTokens, 18, 2, true)}
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">Vesting Status</div>
                  <div>
                    <Tooltip
                      handle={`${formatKeyAmount(vestingData, "gmxVesterClaimSum", 18, 4, true)} / ${formatKeyAmount(
                        vestingData,
                        "gmxVesterVestedAmount",
                        18,
                        4,
                        true
                      )}`}
                      position="right-bottom"
                      renderContent={() => {
                        return (
                          <>
                            {formatKeyAmount(vestingData, "gmxVesterClaimSum", 18, 4, true)} tokens have been converted
                            to MYC from the&nbsp;
                            {formatKeyAmount(vestingData, "gmxVesterVestedAmount", 18, 4, true)} esMYC deposited for
                            vesting.
                          </>
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">Claimable</div>
                  <div>
                    <Tooltip
                      handle={`${formatKeyAmount(vestingData, "gmxVesterClaimable", 18, 4, true)} MYC`}
                      position="right-bottom"
                      renderContent={() =>
                        `${formatKeyAmount(
                          vestingData,
                          "gmxVesterClaimable",
                          18,
                          4,
                          true
                        )} MYC tokens can be claimed, use the options under the Earn section to claim them.`
                      }
                    />
                  </div>
                </div>
                <div className="App-card-divider"></div>
                <div className="App-card-options">
                  {!active && (
                    <button className="App-button-option App-card-option" onClick={() => connectWallet()}>
                      Connect Wallet
                    </button>
                  )}
                  {active && (
                    <button className="App-button-option App-card-option" onClick={() => showGmxVesterDepositModal()}>
                      Deposit
                    </button>
                  )}
                  {active && (
                    <button className="App-button-option App-card-option" onClick={() => showGmxVesterWithdrawModal()}>
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
