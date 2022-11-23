import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";

import Modal from "../../components/Modal/Modal";
import Tooltip from "../../components/Tooltip/Tooltip";
import { Text } from "../../components/Translation/Text";

import Vault from "../../abis/Vault.json";
import ReaderV2 from "../../abis/ReaderV2.json";
import Vester from "../../abis/Vester.json";
import RewardRouter from "../../abis/RewardRouter.json";
import RewardReader from "../../abis/RewardReader.json";
import Token from "../../abis/Token.json";
import MlpManager from "../../abis/MlpManager.json";

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
  useLocalStorageSerializeKey,
  useChainId,
  MLP_DECIMALS,
  USD_DECIMALS,
  ARBITRUM,
  PLACEHOLDER_ACCOUNT,
  getBalanceAndSupplyData,
  getDepositBalanceData,
  getVestingData,
  getStakingData,
  getProcessedData,
  getPageTitle,
} from "../../Helpers";
import { callContract, useMYCPrice, useStakingApr, useTotalMYCSupply } from "../../Api";
import { getConstant } from "../../Constants";

import useSWR from "swr";

import { getContract } from "../../Addresses";

import mlp40Icon from "../../img/ic_mlp_40.svg";
import myc40Icon from "../../img/ic_myc_40.svg";
import * as StakeV2Styled from "./StakeV2Styles";

import "./StakeV2.css";

import SEO from "../../components/Common/SEO";
import ClaimModal from "./ClaimModal";
import Toggle from "../../components/Toggle/Toggle";
import MlpPriceChart from "./MlpPriceChart";

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
    processedData,
    vesterAddress,
    stakedMlpTrackerAddress,
    esMycAddress,
  } = props;
  const [isCompounding, setIsCompounding] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  const [shouldClaimMyc, setShouldClaimMyc] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-myc"],
    true
  );

  const [shouldClaimEsMyc, setShouldClaimEsMyc] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-esMyc"],
    true
  );

  const [shouldBuyMlpWithEth, setShouldBuyMlpWithEth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-buy-mlp"],
    true
  );

  const mycAddress = getContract(chainId, "MYC");
  const [isApproving, setIsApproving] = useState(false);

  const { data: tokenAllowance } = useSWR(
    active && [active, chainId, mycAddress, "allowance", account, stakedMlpTrackerAddress],
    {
      fetcher: fetcher(library, Token),
    }
  );

  const needApproval = tokenAllowance && totalVesterRewards && totalVesterRewards.gt(tokenAllowance);

  const isPrimaryEnabled = () => {
    return !isCompounding && !isApproving && !isCompounding && !isDepositing;
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
    if (isDepositing) {
      return "Depositing...";
    }
    return "Compound";
  };

  const onClickPrimary = () => {
    if (needApproval) {
      approveTokens({
        setIsApproving,
        library,
        tokenAddress: mycAddress,
        spender: stakedMlpTrackerAddress,
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
        shouldClaimMyc, // shouldClaimMyc,
        false, // shouldStakeMYC,
        shouldClaimEsMyc, // shouldClaimEsMyc,
        false, // shouldStakeEsMyc,
        false, // shouldStakeMultiplierPoints,
        shouldBuyMlpWithEth, // shouldClaimWeth,
        false, // shouldConvertWeth,
        shouldBuyMlpWithEth, // shouldBuyMlpWithEth
      ],
      {
        sentMsg: "Compound submitted!",
        failMsg: "Compound failed.",
        successMsg: "Compound completed!",
        setPendingTxns,
      }
    )
      .then(async (res) => {
        if (shouldClaimEsMyc) {
          await res.wait();
          depositEsMyc();
        } else {
          setIsVisible(false);
        }
      })
      .finally(() => {
        setIsCompounding(false);
      });
  };

  const depositEsMyc = async () => {
    setIsDepositing(true);
    const contract = new ethers.Contract(vesterAddress, Vester.abi, library.getSigner());
    const esMyc = new ethers.Contract(esMycAddress, Token.abi, library.getSigner());
    const balance = await esMyc.balanceOf(account);

    callContract(chainId, contract, "deposit", [balance], {
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

  return (
    <div className="StakeModal">
      <Modal isVisible={isVisible} setIsVisible={setIsVisible} label="Compound Rewards">
        <div className="CompoundModal-menu">
          <StakeV2Styled.ModalRow>
            <StakeV2Styled.ModalRowHeader>
              <Text>Claim Vested</Text> MYC
            </StakeV2Styled.ModalRowHeader>
            {shouldClaimMyc && (
              <>
                <StakeV2Styled.ModalRowText large inline>
                  {formatKeyAmount(processedData, "mlpVesterRewards", 18, 4)} MYC
                </StakeV2Styled.ModalRowText>{" "}
                <StakeV2Styled.ModalRowText inline secondary>
                  (${formatKeyAmount(processedData, "mlpVesterRewardsUsd", USD_DECIMALS, 4)})
                </StakeV2Styled.ModalRowText>
              </>
            )}
            <Toggle isChecked={shouldClaimMyc} handleToggle={setShouldClaimMyc} />
          </StakeV2Styled.ModalRow>
          <StakeV2Styled.ModalRow>
            <StakeV2Styled.ModalRowHeader>
              <Text>Claim and vest</Text> esMYC <Text>Rewards</Text>
            </StakeV2Styled.ModalRowHeader>
            {shouldClaimEsMyc && (
              <>
                <StakeV2Styled.ModalRowText inline large>
                  {formatKeyAmount(processedData, "stakedMlpTrackerRewards", 18, 4)} esMYC
                </StakeV2Styled.ModalRowText>{" "}
                <StakeV2Styled.ModalRowText inline secondary>
                  ($
                  {formatKeyAmount(processedData, "stakedMlpTrackerRewardsUsd", USD_DECIMALS, 2, true)})
                </StakeV2Styled.ModalRowText>
              </>
            )}
            <Toggle isChecked={shouldClaimEsMyc} handleToggle={setShouldClaimEsMyc} />
          </StakeV2Styled.ModalRow>
          <StakeV2Styled.ModalRow>
            <StakeV2Styled.ModalRowHeader>
              <Text>Buy MLP with</Text> {wrappedTokenSymbol} <Text>Rewards</Text>
            </StakeV2Styled.ModalRowHeader>
            {shouldBuyMlpWithEth && (
              <>
                <StakeV2Styled.ModalRowText large inline>
                  {formatKeyAmount(processedData, "feeMlpTrackerRewards", 18, 4)} {nativeTokenSymbol} (
                  {wrappedTokenSymbol})
                </StakeV2Styled.ModalRowText>{" "}
                <StakeV2Styled.ModalRowText inline secondary>
                  ($
                  {formatKeyAmount(processedData, "feeMlpTrackerRewardsUsd", USD_DECIMALS, 2, true)})
                </StakeV2Styled.ModalRowText>
              </>
            )}
            <Toggle isChecked={shouldBuyMlpWithEth} handleToggle={setShouldBuyMlpWithEth} />
          </StakeV2Styled.ModalRow>
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
            <Text>{getPrimaryText()}</Text>
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
    maxVestableAmount,
    vesterAddress,
    setPendingTxns,
  } = props;
  const [isDepositing, setIsDepositing] = useState(false);
  const { library, account } = useWeb3React();

  const { data: ethBalance } = useSWR([library, "getBalance", account, "latest"], {
    fetcher: (library, method, ...params) => library[method](...params),
  });

  let amount = parseValue(value, 18);

  let nextDepositAmount = vestedAmount;
  if (amount) {
    nextDepositAmount = vestedAmount.add(amount);
  }

  const getError = () => {
    if (ethBalance?.eq(0)) {
      return ["Not enough ETH for gas"];
    }

    if (!amount || amount.eq(0)) {
      return "Enter an amount";
    }
    if (maxAmount && amount.gt(maxAmount)) {
      return "Max amount exceeded";
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
    <>
      <SEO
        title={getPageTitle("Earn")}
        description="Claim fees and liquidity mining rewards earned via providing liquidity to the Mycelium Perpetual Swap liquidity pool."
      />
      <div className="StakeModal">
        <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title} className="non-scrollable">
          <div className="Exchange-swap-section">
            <div className="Exchange-swap-section-top">
              <div className="muted">
                <div className="Exchange-swap-usd">
                  <Text>Deposit</Text>
                </div>
              </div>
              <div
                className="muted align-right clickable"
                onClick={() => setValue(formatAmountFree(maxAmount, 18, 18))}
              >
                <Text>Max:</Text> {formatAmount(maxAmount, 18, 4, true)}
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
              <div className="PositionEditor-token-symbol">
                <Text>esMYC</Text>
              </div>
            </div>
          </div>
          <div className="VesterDepositModal-info-rows">
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">
                <Text>Wallet</Text>
              </div>
              <div className="align-right">
                {formatAmount(balance, 18, 2, true)} <Text>esMYC</Text>
              </div>
            </div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">
                <Text>Vault Capacity</Text>
              </div>
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
                        <Text>Vault Capacity for your Account</Text>
                        <br />
                        <br />
                        <Text>Deposited:</Text> {formatAmount(vestedAmount, 18, 2, true)} <Text>esMYC</Text>
                        <br />
                        <Text>Max Capacity:</Text> {formatAmount(maxVestableAmount, 18, 2, true)} <Text>esMYC</Text>
                        <br />
                      </>
                    );
                  }}
                />
              </div>
            </div>
          </div>
          <div className="Exchange-swap-button-container">
            <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
              <Text>{getPrimaryText()}</Text>
            </button>
          </div>
        </Modal>
      </div>
    </>
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
          <Text>This will withdraw and unreserve all tokens as well as pause vesting.</Text>
          <br />
          <br />
          <Text>esMYC tokens that have been converted to MYC will remain as MYC tokens.</Text>
          <br />
          <br />
          <Text>To claim MYC tokens without withdrawing, use the "Claim" button under the Total Rewards section.</Text>
          <br />
          <br />
        </div>
        <div className="Exchange-swap-button-container">
          <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={isWithdrawing}>
            <Text>
              {!isWithdrawing && "Confirm Withdraw"}
              {isWithdrawing && "Confirming..."}
            </Text>
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function StakeV2({
  setPendingTxns,
  connectWallet,
  trackAction,
  savedSlippageAmount,
  infoTokens,
  trackPageWithTraits,
  analytics,
}) {
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

  const { data: vestingInfo } = useSWR(
    [`StakeV2:vestingInfo:${active}`, chainId, readerAddress, "getVestingInfo", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, ReaderV2, [vesterAddresses]),
    }
  );

  const { data: ethBalance } = useSWR([library, "getBalance", account, "latest"], {
    fetcher: (library, method, ...params) => library[method](...params),
  });

  const { mycPrice } = useMYCPrice(chainId, { arbitrum: chainId === ARBITRUM ? library : undefined }, active);

  const { total: mycSupply } = useTotalMYCSupply();

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
    stakedMycSupply,
    mycPrice,
    mycSupply
  );

  const stakingApr = useStakingApr(mycPrice, nativeTokenPrice);

  let totalRewardTokens;
  if (processedData && processedData.bnMycInFeeMyc && processedData.bonusMycInFeeMyc) {
    totalRewardTokens = processedData.bnMycInFeeMyc.add(processedData.bonusMycInFeeMyc);
  }

  let totalRewardTokensAndMlp;
  if (totalRewardTokens && processedData && processedData.mlpBalance) {
    totalRewardTokensAndMlp = totalRewardTokens.add(processedData.mlpBalance);
  }

  let earnMsg;
  if (totalRewardTokensAndMlp && totalRewardTokensAndMlp.gt(0)) {
    earnMsg = (
      <div>
        <Text>You are earning</Text> {nativeTokenSymbol} <Text>rewards with</Text>{" "}
        {formatAmount(processedData, MLP_DECIMALS, 2, true)} MLP
        <Text>tokens.</Text>
      </div>
    );
  }

  const showMlpCompoundModal = () => {
    if (ethBalance?.eq(0)) {
      helperToast.error(<Text>You don't have any ETH to pay for gas</Text>);
    } else {
      setIsCompoundModalVisible(true);
    }
  };

  const showMlpClaimModal = () => {
    if (ethBalance?.eq(0)) {
      helperToast.error(<Text>You don't have any ETH to pay for gas</Text>);
    } else {
      setIsClaimModalVisible(true);
    }
  };

  const showMycVesterDepositModal = () => {
    if (ethBalance?.eq(0)) {
      helperToast.error(<Text>You don't have any ETH to pay for gas</Text>);
      return;
    } else if (!vestingData) {
      helperToast.error(<Text>Loading vesting data, please wait.</Text>);
      return;
    }
    // let remainingVestableAmount = vestingData.mlpVester.maxVestableAmount.sub(vestingData.mlpVester.vestedAmount);
    // if (processedData.esMycBalance.lt(remainingVestableAmount)) {
    // }
    let remainingVestableAmount = processedData.esMycBalance;
    let maxVestableAmount = bigNumberify(remainingVestableAmount).add(vestingData.mlpVesterVestedAmount);

    setIsVesterDepositModalVisible(true);
    setVesterDepositTitle("esMYC Vault");
    setVesterDepositStakeTokenLabel("staked MYC + esMYC + Multiplier Points");
    setVesterDepositMaxAmount(remainingVestableAmount);
    setVesterDepositBalance(processedData.esMycBalance);
    setVesterDepositEscrowedBalance(vestingData.mlpVester.escrowedBalance);
    setVesterDepositVestedAmount(vestingData.mlpVester.vestedAmount);
    setVesterDepositMaxVestableAmount(maxVestableAmount);
    setVesterDepositAverageStakedAmount(vestingData.mlpVester.averageStakedAmount);
    setVesterDepositReserveAmount(vestingData.mlpVester.pairAmount);
    setVesterDepositMaxReserveAmount(totalRewardTokens);
    setVesterDepositValue("");
    setVesterDepositAddress(mlpVesterAddress);
  };

  const showMycVesterWithdrawModal = () => {
    if (ethBalance?.eq(0)) {
      helperToast.error(<Text>You don't have any ETH to pay for gas</Text>);
      return;
    } else if (!vestingData || !vestingData.mlpVesterVestedAmount || vestingData.mlpVesterVestedAmount.eq(0)) {
      helperToast.error(<Text>You have not deposited any tokens for vesting.</Text>);
      return;
    }

    setIsVesterWithdrawModalVisible(true);
    setVesterWithdrawTitle("Withdraw from esMYC Vault");
    setVesterWithdrawAddress(mlpVesterAddress);
  };

  return (
    <div className="StakeV2 Page page-layout default-container">
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
        processedData={processedData}
        vesterAddress={mlpVesterAddress}
        stakedMlpTrackerAddress={stakedMlpTrackerAddress}
        esMycAddress={esMycAddress}
      />
      <ClaimModal
        active={active}
        setPendingTxns={setPendingTxns}
        connectWallet={connectWallet}
        library={library}
        chainId={chainId}
        isVisible={isClaimModalVisible}
        setIsVisible={setIsClaimModalVisible}
        rewardRouterAddress={rewardRouterAddress}
        wrappedTokenSymbol={wrappedTokenSymbol}
        nativeTokenSymbol={nativeTokenSymbol}
        processedData={processedData}
      />

      <StakeV2Styled.StakeV2Content className="StakeV2-content">
        <StakeV2Styled.StakeV2Cards className="StakeV2-cards">
          <StakeV2Styled.StakeV2Card>
            <div className="Page-title-section">
              <div className="Page-title">
                <Text>Earn</Text>
              </div>
              <div className="Page-description">
                <Text>Stake</Text>{" "}
                <a
                  href="https://swaps.docs.mycelium.xyz/protocol-design/mycelium-liquidity-pool-mlp/mlp-token"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MLP
                </a>{" "}
                <Text>to earn rewards. Read the Terms of Use</Text>{" "}
                <a href="https://mycelium.xyz/rewards-terms-of-use" target="_blank" rel="noopener noreferrer">
                  <Text>here</Text>
                </a>
                .
              </div>
              {earnMsg && (
                <div className="Page-description">
                  <Text>{earnMsg}</Text>
                </div>
              )}
            </div>
            <StakeV2Styled.Card>
              <StakeV2Styled.CardTitle className="App-card-title">
                <img src={mlp40Icon} alt="mlp40Icon" />
                MLP ({chainName})
              </StakeV2Styled.CardTitle>
              <MlpPriceChart chainId={chainId} mlpPrice={processedData.mlpPrice} />
              <StakeV2Styled.MlpInfo>
                <StakeV2Styled.RewardsBanner>
                  <StakeV2Styled.RewardsBannerRow>
                    <StakeV2Styled.RewardsBannerText large>
                      <Text>Statistics</Text>
                    </StakeV2Styled.RewardsBannerText>
                  </StakeV2Styled.RewardsBannerRow>
                  <StakeV2Styled.RewardsBannerRow>
                    <div className="App-card-row">
                      <div className="label">
                        <Text>Total APR</Text>
                      </div>
                      <div>
                        <Tooltip
                          handle={`${formatKeyAmount(processedData, "mlpAprTotal", 2, 2, true)}%`}
                          position="right-bottom"
                          renderContent={() => {
                            return (
                              <>
                                <div className="Tooltip-row">
                                  <span className="label">
                                    {nativeTokenSymbol} ({wrappedTokenSymbol}) <Text>APR</Text>
                                  </span>
                                  <span>{formatKeyAmount(processedData, "mlpAprForNativeToken", 2, 2, true)}%</span>
                                </div>
                                <div className="Tooltip-row">
                                  <span className="label">
                                    esMYC <Text>APR</Text>
                                  </span>
                                  <span>{formatKeyAmount(processedData, "mlpAprForEsMyc", 2, 2, true)}%</span>
                                </div>
                              </>
                            );
                          }}
                        />
                      </div>
                    </div>
                  </StakeV2Styled.RewardsBannerRow>
                  <StakeV2Styled.RewardsBannerRow>
                    <div className="App-card-row">
                      <div className="label">
                        <Text>Price</Text>
                      </div>
                      <div>${formatKeyAmount(processedData, "mlpPrice", USD_DECIMALS, 3, true)}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Text>Wallet</Text>
                      </div>
                      <div>
                        {formatKeyAmount(processedData, "mlpBalance", MLP_DECIMALS, 2, true)} MLP ($
                        {formatKeyAmount(processedData, "mlpBalanceUsd", USD_DECIMALS, 2, true)})
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Text>Staked</Text>
                      </div>
                      <div>
                        {formatKeyAmount(processedData, "mlpBalance", MLP_DECIMALS, 2, true)} MLP ($
                        {formatKeyAmount(processedData, "mlpBalanceUsd", USD_DECIMALS, 2, true)})
                      </div>
                    </div>
                  </StakeV2Styled.RewardsBannerRow>
                  <StakeV2Styled.RewardsBannerRow>
                    <div className="App-card-row">
                      <div className="label">
                        <Text>Total Staked</Text>
                      </div>
                      <div>
                        {formatKeyAmount(processedData, "mlpSupply", 18, 2, true)} MLP ($
                        {formatKeyAmount(processedData, "mlpSupplyUsd", USD_DECIMALS, 2, true)})
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Text>Total Supply</Text>
                      </div>
                      <div>
                        {formatKeyAmount(processedData, "mlpSupply", 18, 2, true)} MLP ($
                        {formatKeyAmount(processedData, "mlpSupplyUsd", USD_DECIMALS, 2, true)})
                      </div>
                    </div>
                  </StakeV2Styled.RewardsBannerRow>
                  <StakeV2Styled.Buttons>
                    <Link className="App-button-option App-card-option" to="/buy_mlp">
                      <Text>Buy</Text> MLP
                    </Link>
                    <Link className="App-button-option App-card-option" to="/buy_mlp#redeem">
                      <Text>Sell</Text> MLP
                    </Link>
                  </StakeV2Styled.Buttons>
                </StakeV2Styled.RewardsBanner>
                <StakeV2Styled.RewardsBanner>
                  <StakeV2Styled.RewardsBannerRow>
                    <StakeV2Styled.RewardsBannerText large>
                      <Text>Rewards</Text>
                    </StakeV2Styled.RewardsBannerText>
                  </StakeV2Styled.RewardsBannerRow>
                  <StakeV2Styled.RewardsBannerRow>
                    <div className="App-card-row">
                      <div className="label">
                        {nativeTokenSymbol} <Text>Rewards</Text>
                      </div>
                      <div>
                        <StakeV2Styled.RewardsBannerTextWrap>
                          <StakeV2Styled.RewardsBannerText large>
                            {formatKeyAmount(processedData, "feeMlpTrackerRewards", 18, 4)} {nativeTokenSymbol}
                          </StakeV2Styled.RewardsBannerText>{" "}
                          <StakeV2Styled.RewardsBannerText secondary>
                            ($
                            {formatKeyAmount(processedData, "feeMlpTrackerRewardsUsd", USD_DECIMALS, 2, true)})
                          </StakeV2Styled.RewardsBannerText>
                        </StakeV2Styled.RewardsBannerTextWrap>
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        esMYC <Text>Rewards</Text>
                      </div>
                      <StakeV2Styled.RewardsBannerTextWrap>
                        <StakeV2Styled.RewardsBannerText large>
                          {formatKeyAmount(processedData, "stakedMlpTrackerRewards", 18, 4)} esMYC
                        </StakeV2Styled.RewardsBannerText>{" "}
                        <StakeV2Styled.RewardsBannerText secondary>
                          ($
                          {formatKeyAmount(processedData, "stakedMlpTrackerRewardsUsd", USD_DECIMALS, 2, true)})
                        </StakeV2Styled.RewardsBannerText>
                      </StakeV2Styled.RewardsBannerTextWrap>
                    </div>
                  </StakeV2Styled.RewardsBannerRow>
                  <StakeV2Styled.Buttons>
                    {active && (
                      <button className="App-button-option App-card-option" onClick={() => showMlpClaimModal()}>
                        <Text>Claim</Text>
                      </button>
                    )}
                    {active && (
                      <button className="App-button-option App-card-option" onClick={() => showMlpCompoundModal()}>
                        <Text>Compound</Text>
                      </button>
                    )}
                    {!active && (
                      <button className="App-button-option App-card-option" onClick={() => connectWallet()}>
                        <Text>Connect Wallet</Text>
                      </button>
                    )}
                  </StakeV2Styled.Buttons>
                </StakeV2Styled.RewardsBanner>
              </StakeV2Styled.MlpInfo>
            </StakeV2Styled.Card>
          </StakeV2Styled.StakeV2Card>
          <StakeV2Styled.StakeV2Card>
            <div className="Page-title-section">
              <div className="Page-title">
                <Text>Vest</Text>
              </div>
              <div className="Page-description">
                <Text>Convert esMYC tokens to MYC tokens.</Text>
                <br />
                <Text>Please read the </Text>
                <a
                  href="https://swaps.docs.mycelium.xyz/protocol-design/mycelium-liquidity-pool-mlp/mlp-rewards/esmyc-escrowed-myc"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Text>vesting details</Text>
                </a>{" "}
                <Text>before using the vaults.</Text>
              </div>
            </div>
            <StakeV2Styled.Card>
              <StakeV2Styled.CardTitle className="App-card-title">
                <img src={myc40Icon} alt="myc40Icon" />
                esMYC <Text>Vault</Text>
              </StakeV2Styled.CardTitle>
              <StakeV2Styled.VestingInfo>
                <StakeV2Styled.StakedTokens>
                  <StakeV2Styled.RewardsBannerText secondary large>
                    <Text>Vesting Tokens</Text>
                  </StakeV2Styled.RewardsBannerText>
                  <div>
                    <StakeV2Styled.RewardsBannerTextWrap>
                      <StakeV2Styled.RewardsBannerText large inline>
                        {formatKeyAmount(vestingData, "mlpVesterVestedAmount", 18, 4, true)} <Text>esMYC</Text>
                      </StakeV2Styled.RewardsBannerText>{" "}
                      <StakeV2Styled.RewardsBannerText inline>
                        ($
                        {formatKeyAmount(processedData, "mlpVesterVestedAmountUsd", USD_DECIMALS, 2, true)})
                      </StakeV2Styled.RewardsBannerText>
                    </StakeV2Styled.RewardsBannerTextWrap>
                  </div>
                </StakeV2Styled.StakedTokens>
                <StakeV2Styled.StakingBannerRow>
                  <div className="App-card-row">
                    <div className="label">
                      <Text>Vesting Status</Text>
                    </div>
                    <div>
                      <Tooltip
                        handle={`${formatKeyAmount(vestingData, "mlpVesterClaimSum", 18, 4, true)} / ${formatKeyAmount(
                          vestingData,
                          "mlpVesterVestedAmount",
                          18,
                          4,
                          true
                        )}`}
                        position="right-bottom"
                        renderContent={() => {
                          return (
                            <>
                              {formatKeyAmount(vestingData, "mlpVesterClaimSum", 18, 4, true)}{" "}
                              <Text>tokens have been converted to MYC from</Text>&nbsp;
                              {formatKeyAmount(vestingData, "mlpVesterVestedAmount", 18, 4, true)}{" "}
                              <Text>esMYC deposited for vesting.</Text>
                            </>
                          );
                        }}
                      />
                    </div>
                  </div>
                  <div className="App-card-row">
                    <div className="label">
                      <Text>Claimable</Text>
                    </div>
                    <div>
                      <Tooltip
                        handle={`${formatKeyAmount(vestingData, "mlpVesterClaimable", 18, 4, true)} MYC`}
                        position="right-bottom"
                        renderContent={() => (
                          <>
                            {formatKeyAmount(vestingData, "mlpVesterClaimable", 18, 4, true)} MYC{" "}
                            <Text>tokens can be claimed, use the options under the Earn section to claim them.</Text>
                          </>
                        )}
                      />
                    </div>
                  </div>
                  <StakeV2Styled.Buttons>
                    {!active && (
                      <button className="App-button-option App-card-option" onClick={() => connectWallet()}>
                        <Text>Connect Wallet</Text>
                      </button>
                    )}
                    {active && (
                      <button className="App-button-option App-card-option" onClick={() => showMycVesterDepositModal()}>
                        <Text>Deposit</Text>
                      </button>
                    )}
                    {active && (
                      <button
                        className="App-button-option App-card-option"
                        onClick={() => showMycVesterWithdrawModal()}
                      >
                        <Text>Withdraw</Text>
                      </button>
                    )}
                  </StakeV2Styled.Buttons>
                </StakeV2Styled.StakingBannerRow>
                <StakeV2Styled.StakingBannerRow borderTop>
                  <StakeV2Styled.RewardsBannerText large title>
                    MYC/esMYC <Text>Staking</Text>
                  </StakeV2Styled.RewardsBannerText>
                  <StakeV2Styled.RewardsBannerText secondary title>
                    <Text>Stake MYC</Text> <Text>or</Text> esMYC <Text>to receive interest in</Text> ETH
                  </StakeV2Styled.RewardsBannerText>
                  {stakingApr && (
                    <div className="App-card-row">
                      <div className="label">
                        <Text>Staking</Text> APR
                      </div>
                      <div>{stakingApr}%</div>
                    </div>
                  )}
                  <StakeV2Styled.Buttons>
                    <a href="https://stake.mycelium.xyz" target="_blank" rel="noopener noreferrer">
                      <button className="App-button-option App-card-option">
                        MYC/esMYC <Text>Staking</Text>
                      </button>
                    </a>
                  </StakeV2Styled.Buttons>
                </StakeV2Styled.StakingBannerRow>
              </StakeV2Styled.VestingInfo>
            </StakeV2Styled.Card>
          </StakeV2Styled.StakeV2Card>
        </StakeV2Styled.StakeV2Cards>
      </StakeV2Styled.StakeV2Content>
    </div>
  );
}
