import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";

import Modal from "../../components/Modal/Modal";
import Checkbox from "../../components/Checkbox/Checkbox";
import Tooltip from "../../components/Tooltip/Tooltip";

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
import { callContract, useMYCPrice, useTotalMYCSupply } from "../../Api";
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

  const [shouldClaimMyc, setShouldClaimMyc] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-myc"],
    true
  );

  const [shouldClaimEsMyc, setShouldClaimEsMyc] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-esMyc"],
    true
  );

  const [shouldClaimWeth, setShouldClaimWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-weth"],
    true
  );
  const [shouldConvertWeth, setShouldConvertWeth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-convert-weth"],
    false
  );
  const [shouldBuyMlpWithEth, setShouldBuyMlpWithEth] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-buy-mlp"],
    true
  );

  const mycAddress = getContract(chainId, "MYC");
  const stakedMlpTrackerAddress = getContract(chainId, "StakedMlpTracker");

  const [isApproving, setIsApproving] = useState(false);

  const { data: tokenAllowance } = useSWR(
    active && [active, chainId, mycAddress, "allowance", account, stakedMlpTrackerAddress],
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
        shouldClaimMyc,
        false, // shouldStakeMYC,
        shouldClaimEsMyc,
        false, // shouldStakeEsMyc,
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

  const toggleBuyMlp = (value) => {
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
            <Checkbox isChecked={shouldClaimMyc} setIsChecked={setShouldClaimMyc}>
              Claim MYC Rewards
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldClaimEsMyc} setIsChecked={setShouldClaimEsMyc}>
              Claim esMYC Rewards
            </Checkbox>
          </div>
          <div>
            <Checkbox
              isChecked={shouldClaimWeth}
              setIsChecked={setShouldClaimWeth}
              disabled={shouldConvertWeth || shouldBuyMlpWithEth}
            >
              Claim {wrappedTokenSymbol} Rewards
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldConvertWeth} setIsChecked={toggleConvertWeth}>
              Convert {wrappedTokenSymbol} to {nativeTokenSymbol}
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldBuyMlpWithEth} setIsChecked={toggleBuyMlp}>
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

  const [shouldClaimMyc, setShouldClaimMyc] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-compound-should-claim-myc"],
    true
  );

  const [shouldClaimEsMyc, setShouldClaimEsMyc] = useLocalStorageSerializeKey(
    [chainId, "StakeV2-claim-should-claim-esMyc"],
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
        shouldClaimMyc, // shouldClaimMYC,
        false, // shouldStakeMYC
        shouldClaimEsMyc, // shouldClaimEsMyc,
        false, // shouldStakeEsMyc
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
            <Checkbox isChecked={shouldClaimMyc} setIsChecked={setShouldClaimMyc}>
              Claim MYC Rewards
            </Checkbox>
          </div>
          <div>
            <Checkbox isChecked={shouldClaimEsMyc} setIsChecked={setShouldClaimEsMyc}>
              Claim esMYC Rewards
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
    maxVestableAmount,
    library,
    vesterAddress,
    setPendingTxns,
  } = props;
  const [isDepositing, setIsDepositing] = useState(false);

  let amount = parseValue(value, 18);

  let nextDepositAmount = vestedAmount;
  if (amount) {
    nextDepositAmount = vestedAmount.add(amount);
  }

  const getError = () => {
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
          </div>
          <div className="Exchange-swap-button-container">
            <button className="App-cta Exchange-swap-button" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
              {getPrimaryText()}
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

export default function StakeV2({ setPendingTxns, connectWallet, trackAction }) {
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
    earnMsg = (
      <div>
        You are earning {nativeTokenSymbol} rewards with {formatAmount(totalRewardTokensAndMlp, 18, 2, true)} MLP
        tokens.
      </div>
    );
  }

  const showMycVesterDepositModal = () => {
    if (!vestingData) {
      helperToast.error("Loading vesting data, please wait.");
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
    if (!vestingData || !vestingData.mlpVesterVestedAmount || vestingData.mlpVesterVestedAmount.eq(0)) {
      helperToast.error("You have not deposited any tokens for vesting.");
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
                  href="https://swaps.docs.mycelium.xyz/protocol-design/mycelium-liquidity-pool-mlp/mlp-token"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  MLP
                </a>{" "}
                to earn rewards. Read the Terms of Use{" "}
                <a href="https://mycelium.xyz/rewards-terms-of-use" target="_blank" rel="noopener noreferrer">
                  here
                </a>
                .
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
                        {formatKeyAmount(processedData, "stakedMlpTrackerRewards", 18, 4)} esMYC
                      </StakeV2Styled.RewardsBannerText>{" "}
                      <StakeV2Styled.RewardsBannerText inline>
                        ($
                        {formatKeyAmount(processedData, "stakedMlpTrackerRewardsUsd", USD_DECIMALS, 2, true)})
                      </StakeV2Styled.RewardsBannerText>
                    </StakeV2Styled.RewardsBannerTextWrap>
                  </div>
                </StakeV2Styled.RewardsBannerRow>
                <StakeV2Styled.RewardsBannerRow>
                  <StakeV2Styled.RewardsBannerText secondary>Market Making APR</StakeV2Styled.RewardsBannerText>
                  <StakeV2Styled.RewardsBannerText large inline>
                    <Tooltip
                      handle={`${formatKeyAmount(processedData, "mmApr", 2, 2, true)}%`}
                      position="right-bottom"
                      renderContent={() => "Market Making APR is sourced from the spread of the traded markets and is realised by MLP holders through the appreciation of the MLP token."
                      }
                    />
                  </StakeV2Styled.RewardsBannerText>
                </StakeV2Styled.RewardsBannerRow>
                <StakeV2Styled.RewardsBannerRow>
                  <StakeV2Styled.RewardsBannerText secondary>Total APR</StakeV2Styled.RewardsBannerText>
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
                            <div className="Tooltip-row">
                              <span className="label">Market Making APR</span>
                              <span>{formatKeyAmount(processedData, "mmApr", 2, 2, true)}%</span>
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
                  <Link className="App-button-option App-card-option" to="/buy_mlp">
                    Buy MLP
                  </Link>
                  <Link className="App-button-option App-card-option" to="/buy_mlp#redeem">
                    Sell MLP
                  </Link>
                  {active && (
                    <button
                      className="App-button-option App-card-option"
                      onClick={() => setIsCompoundModalVisible(true)}
                    >
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
                <a
                  href="https://swaps.docs.mycelium.xyz/protocol-design/mycelium-liquidity-pool-mlp/mlp-rewards/esmyc-escrowed-myc"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  vesting details
                </a>{" "}
                before using the vaults.
              </div>
            </div>
            <div className="App-card StakeV2-myc-card">
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
                        {formatKeyAmount(vestingData, "mlpVesterVestedAmount", 18, 4, true)} esMYC
                      </StakeV2Styled.RewardsBannerText>{" "}
                      <StakeV2Styled.RewardsBannerText inline>
                        ($
                        {formatKeyAmount(processedData, "mlpVesterVestedAmountUsd", USD_DECIMALS, 2, true)})
                      </StakeV2Styled.RewardsBannerText>
                    </StakeV2Styled.RewardsBannerTextWrap>
                  </div>
                </StakeV2Styled.RewardsBannerRow>
              </StakeV2Styled.RewardsBanner>
              <div className="App-card-content">
                <div className="App-card-row">
                  <div className="label">Reserved for Vesting</div>
                  <div>
                    {formatKeyAmount(vestingData, "mlpVesterPairAmount", 18, 2, true)} /{" "}
                    {formatAmount(totalRewardTokens, 18, 2, true)}
                  </div>
                </div>
                <div className="App-card-row">
                  <div className="label">Vesting Status</div>
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
                            {formatKeyAmount(vestingData, "mlpVesterClaimSum", 18, 4, true)} tokens have been converted
                            to MYC from the&nbsp;
                            {formatKeyAmount(vestingData, "mlpVesterVestedAmount", 18, 4, true)} esMYC deposited for
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
                      handle={`${formatKeyAmount(vestingData, "mlpVesterClaimable", 18, 4, true)} MYC`}
                      position="right-bottom"
                      renderContent={() =>
                        `${formatKeyAmount(
                          vestingData,
                          "mlpVesterClaimable",
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
                    <button className="App-button-option App-card-option" onClick={() => showMycVesterDepositModal()}>
                      Deposit
                    </button>
                  )}
                  {active && (
                    <button className="App-button-option App-card-option" onClick={() => showMycVesterWithdrawModal()}>
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
