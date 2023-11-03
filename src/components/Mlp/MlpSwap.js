import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

import { useWeb3React } from "@web3-react/core";
import useSWR from "swr";
import { BigNumber, ethers } from "ethers";
import cx from 'classnames';

import { getContract } from "../../Addresses";
import Modal from "../../components/Modal/Modal";
import {
  ARBITRUM,
  BASIS_POINTS_DIVISOR,
  MLP_COOLDOWN_DURATION,
  MLP_DECIMALS,
  NETWORK_NAME,
  PLACEHOLDER_ACCOUNT,
  SECONDS_PER_YEAR,
  USDG_DECIMALS,
  USD_DECIMALS,
  adjustForDecimals,
  approveTokens,
  bigNumberify,
  expandDecimals,
  fetcher,
  formatAmount,
  formatAmountFree,
  formatKeyAmount,
  getBuyMlpFromAmount,
  // formatDateTime,
  getBuyMlpToAmount,
  getSellMlpFromAmount,
  getSellMlpToAmount,
  getTokenInfo,
  getUsd,
  getUserTokenBalances,
  helperToast,
  parseValue,
  // getChainName,
  useChainId,
  getVestingData,
  useLocalStorageByChainId,
} from "../../Helpers";
import { getNativeToken, getToken, getTokens, getWhitelistedTokens, getWrappedToken } from "../../data/Tokens";

import { callContract, useMYCPrice } from "../../Api";

import BuyInputSection from "../BuyInputSection/BuyInputSection";
import TokenSelector from "../Exchange/TokenSelector";
import Tooltip from "../Tooltip/Tooltip";

import MlpManager from "../../abis/MlpManager.json";
import ReaderV2 from "../../abis/ReaderV2.json";
import RewardReader from "../../abis/RewardReader.json";
import RewardRouter from "../../abis/RewardRouter.json";
import RewardTracker from "../../abis/RewardTracker.json";
import Token from "../../abis/Token.json";
import VaultV2 from "../../abis/VaultV2.json";
import Vester from "../../abis/Vester.json";

import arrowIcon from "../../img/ic_convert_down.svg";
import tlp24Icon from "../../img/ic_mlp_24.svg";
import myc40Icon from "../../img/ic_myc_40.svg";

import { useInfoTokens } from "src/hooks/useInfoTokens";
import { getAnalyticsEventStage } from "../../utils/analytics";
import AssetDropdown from "../../views/Dashboard/AssetDropdown";
import * as StakeV2Styled from "../../views/Stake/StakeV2Styles";
import "./MlpSwap.css";

const { AddressZero } = ethers.constants;

function getStakingData(stakingInfo) {
  if (!stakingInfo || stakingInfo.length === 0) {
    return;
  }

  const keys = ["stakedMlpTracker", "feeMlpTracker"];
  const data = {};
  const propsLength = 5;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    data[key] = {
      claimable: stakingInfo[i * propsLength],
      tokensPerInterval: stakingInfo[i * propsLength + 1],
      averageStakedAmounts: stakingInfo[i * propsLength + 2],
      cumulativeRewards: stakingInfo[i * propsLength + 3],
      totalSupply: stakingInfo[i * propsLength + 4],
    };
  }

  return data;
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

export default function MlpSwap(props) {
  const {
    savedSlippageAmount,
    isBuying,
    setPendingTxns,
    connectWallet,
    trackPageWithTraits,
    trackAction,
    analytics,
  } = props;
  const history = useHistory();
  const swapLabel = "SellMlp";
  const tabLabel = "Burn MLP";
  const { active, library, account } = useWeb3React();
  const { chainId } = useChainId();
  // const chainName = getChainName(chainId)
  const tokens = getTokens(chainId);
  const whitelistedTokens = getWhitelistedTokens(chainId);
  const enabledWhitelistedTokens = whitelistedTokens.filter((token) => token.isEnabledForTrading);
  const tokenList = whitelistedTokens.filter((t) => !t.isWrapped);
  const [swapValue, setSwapValue] = useState("");
  const [mlpValue, setMlpValue] = useState("");
  const [swapTokenAddress, setSwapTokenAddress] = useLocalStorageByChainId(
    chainId,
    `${swapLabel}-swap-token-address`,
    AddressZero
  );
  // Clear cache of deprecated token address
  if (swapTokenAddress === "0x6467A2ad44C49dB9788d60e82B3adE35CcA5c5C4") {
    setSwapTokenAddress(AddressZero);
  }
  const [isApproving, setIsApproving] = useState(false);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anchorOnSwapAmount, setAnchorOnSwapAmount] = useState(true);
  const [feeBasisPoints, setFeeBasisPoints] = useState("");

  const readerAddress = getContract(chainId, "Reader");
  const rewardReaderAddress = getContract(chainId, "RewardReader");
  const vaultAddress = getContract(chainId, "Vault");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
  const stakedMlpTrackerAddress = getContract(chainId, "StakedMlpTracker");
  const feeMlpTrackerAddress = getContract(chainId, "FeeMlpTracker");
  const usdgAddress = getContract(chainId, "USDG");
  const mlpManagerAddress = getContract(chainId, "MlpManager");
  const rewardRouterAddress = getContract(chainId, "RewardRouter");
  const tokensForBalanceAndSupplyQuery = [stakedMlpTrackerAddress, usdgAddress];

  const [isVesterWithdrawModalVisible, setIsVesterWithdrawModalVisible] = useState(false);
  const [vesterWithdrawTitle, setVesterWithdrawTitle] = useState(false);
  const [vesterWithdrawAddress, setVesterWithdrawAddress] = useState("");

  const mycVesterAddress = getContract(chainId, "MycVester");
  const mlpVesterAddress = getContract(chainId, "MlpVester");

  const vesterAddresses = [mycVesterAddress, mlpVesterAddress];

  const { data: reservedAmount } = useSWR(
    [`MlpSwap:reservedAmount:${active}`, chainId, mlpVesterAddress, "pairAmounts", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, Vester),
    }
  );
  const { data: vestingInfo } = useSWR(
    [`StakeV2:vestingInfo:${active}`, chainId, readerAddress, "getVestingInfo", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, ReaderV2, [vesterAddresses]),
    }
  );
  
  const vestingData = getVestingData(vestingInfo);

  const tokenAddresses = tokens.map((token) => token.address);
  const { data: tokenBalances } = useSWR(
    [`MlpSwap:getTokenBalances:${active}`, chainId, readerAddress, "getTokenBalances", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, ReaderV2, [tokenAddresses]),
    }
  );

  const { data: balancesAndSupplies } = useSWR(
    [
      `MlpSwap:getTokenBalancesWithSupplies:${active}`,
      chainId,
      readerAddress,
      "getTokenBalancesWithSupplies",
      account || PLACEHOLDER_ACCOUNT,
    ],
    {
      fetcher: fetcher(library, ReaderV2, [tokensForBalanceAndSupplyQuery]),
    }
  );

  const { data: aums } = useSWR([`MlpSwap:getAums:${active}`, chainId, mlpManagerAddress, "getAums"], {
    fetcher: fetcher(library, MlpManager),
  });

  const { data: totalTokenWeights } = useSWR(
    [`MlpSwap:totalTokenWeights:${active}`, chainId, vaultAddress, "totalTokenWeights"],
    {
      fetcher: fetcher(library, VaultV2),
    }
  );

  const tokenAllowanceAddress = swapTokenAddress === AddressZero ? nativeTokenAddress : swapTokenAddress;
  const { data: tokenAllowance } = useSWR(
    [active, chainId, tokenAllowanceAddress, "allowance", account || PLACEHOLDER_ACCOUNT, mlpManagerAddress],
    {
      fetcher: fetcher(library, Token),
    }
  );

  const { data: lastPurchaseTime } = useSWR(
    [`MlpSwap:lastPurchaseTime:${active}`, chainId, mlpManagerAddress, "lastAddedAt", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, MlpManager),
    }
  );

  const { data: mlpBalance } = useSWR(
    [`MlpSwap:mlpBalance:${active}`, chainId, feeMlpTrackerAddress, "stakedAmounts", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, RewardTracker),
    }
  );

  const { data: ethBalance } = useSWR([library, "getBalance", account, "latest"], {
    fetcher: (library, method, ...params) => library[method](...params),
  });

  const { mycPrice } = useMYCPrice(chainId, { arbitrum: chainId === ARBITRUM ? library : undefined }, active);

  const rewardTrackersForStakingInfo = [stakedMlpTrackerAddress, feeMlpTrackerAddress];
  const { data: stakingInfo } = useSWR(
    [`MlpSwap:stakingInfo:${active}`, chainId, rewardReaderAddress, "getStakingInfo", account || PLACEHOLDER_ACCOUNT],
    {
      fetcher: fetcher(library, RewardReader, [rewardTrackersForStakingInfo]),
    }
  );

  const stakingData = getStakingData(stakingInfo);

  const redemptionTime = lastPurchaseTime ? lastPurchaseTime.add(MLP_COOLDOWN_DURATION) : undefined;
  const inCooldownWindow = redemptionTime && parseInt(Date.now() / 1000) < redemptionTime;

  const mlpSupply = balancesAndSupplies ? balancesAndSupplies[1] : bigNumberify(0);
  const usdgSupply = balancesAndSupplies ? balancesAndSupplies[3] : bigNumberify(0);
  let aum;
  if (aums && aums.length > 0) {
    aum = isBuying ? aums[0] : aums[1];
  }
  const mlpPrice =
    aum && aum.gt(0) && mlpSupply.gt(0)
      ? aum.mul(expandDecimals(1, MLP_DECIMALS)).div(mlpSupply)
      : expandDecimals(1, USD_DECIMALS);
  let mlpBalanceUsd;
  if (mlpBalance) {
    mlpBalanceUsd = mlpBalance.mul(mlpPrice).div(expandDecimals(1, MLP_DECIMALS));
  }
  const mlpSupplyUsd = mlpSupply.mul(mlpPrice).div(expandDecimals(1, MLP_DECIMALS));

  let reserveAmountUsd;
  if (reservedAmount) {
    reserveAmountUsd = reservedAmount.mul(mlpPrice).div(expandDecimals(1, MLP_DECIMALS));
  }

  const { infoTokens } = useInfoTokens(library, chainId, active, tokenBalances, undefined);
  const swapToken = getToken(chainId, swapTokenAddress);
  const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);

  const swapTokenBalance = swapTokenInfo && swapTokenInfo.balance ? swapTokenInfo.balance : bigNumberify(0);

  const swapAmount = parseValue(swapValue, swapToken && swapToken.decimals);
  const mlpAmount = parseValue(mlpValue, MLP_DECIMALS);

  const needApproval =
    isBuying && swapTokenAddress !== AddressZero && tokenAllowance && swapAmount && swapAmount.gt(tokenAllowance);

  const swapUsdMin = getUsd(swapAmount, swapTokenAddress, false, infoTokens);
  const mlpUsdMax = mlpAmount && mlpPrice ? mlpAmount.mul(mlpPrice).div(expandDecimals(1, MLP_DECIMALS)) : undefined;

  let isSwapTokenCapReached;
  if (swapTokenInfo.managedUsd && swapTokenInfo.maxUsdgAmount) {
    isSwapTokenCapReached = swapTokenInfo.managedUsd.gt(
      adjustForDecimals(swapTokenInfo.maxUsdgAmount, USDG_DECIMALS, USD_DECIMALS)
    );
  }

  const onSwapValueChange = (e) => {
    setAnchorOnSwapAmount(true);
    setSwapValue(e.target.value);
  };

  const onMlpValueChange = (e) => {
    setAnchorOnSwapAmount(false);
    setMlpValue(e.target.value);
  };

  const onSelectSwapToken = (token) => {
    setSwapTokenAddress(token.address);
    setIsWaitingForApproval(false);
  };

  const nativeToken = getTokenInfo(infoTokens, AddressZero);

  let totalApr = bigNumberify(0);

  let feeMlpTrackerAnnualRewardsUsd;
  let feeMlpTrackerApr;
  if (
    stakingData &&
    stakingData.feeMlpTracker &&
    stakingData.feeMlpTracker.tokensPerInterval &&
    nativeToken &&
    nativeToken.minPrice &&
    mlpSupplyUsd &&
    mlpSupplyUsd.gt(0)
  ) {
    feeMlpTrackerAnnualRewardsUsd = stakingData.feeMlpTracker.tokensPerInterval
      .mul(SECONDS_PER_YEAR)
      .mul(nativeToken.minPrice)
      .div(expandDecimals(1, 18));
    feeMlpTrackerApr = feeMlpTrackerAnnualRewardsUsd.mul(BASIS_POINTS_DIVISOR).div(mlpSupplyUsd);
  }

  let stakedMlpTrackerAnnualRewardsUsd;
  let stakedMlpTrackerApr;
  if (
    mycPrice &&
    stakingData &&
    stakingData.stakedMlpTracker &&
    stakingData.stakedMlpTracker.tokensPerInterval &&
    mlpSupplyUsd &&
    mlpSupplyUsd.gt(0)
  ) {
    stakedMlpTrackerAnnualRewardsUsd = stakingData.stakedMlpTracker.tokensPerInterval
      .mul(SECONDS_PER_YEAR)
      .mul(mycPrice)
      .div(expandDecimals(1, 18));
    stakedMlpTrackerApr = stakedMlpTrackerAnnualRewardsUsd.mul(BASIS_POINTS_DIVISOR).div(mlpSupplyUsd);
  }

  if (stakedMlpTrackerApr && feeMlpTrackerApr) {
    totalApr = totalApr.add(feeMlpTrackerApr).add(stakedMlpTrackerApr);
  }

  const showMycVesterWithdrawModal = () => {
    if (ethBalance?.eq(0)) {
      helperToast.error("You don't have any ETH to pay for gas");
      return;
    } else if (!vestingData || !vestingData.mlpVesterVestedAmount || vestingData.mlpVesterVestedAmount.eq(0)) {
      helperToast.error("You have not deposited any tokens for vesting.");
      return;
    }

    setIsVesterWithdrawModalVisible(true);
    setVesterWithdrawTitle("Withdraw from esMYC Vault");
    setVesterWithdrawAddress(mlpVesterAddress);
  };

  useEffect(() => {
    const updateSwapAmounts = () => {
      if (anchorOnSwapAmount) {
        if (!swapAmount) {
          setMlpValue("");
          setFeeBasisPoints("");
          return;
        }

        if (isBuying) {
          const { amount: nextAmount, feeBasisPoints: feeBps } = getBuyMlpToAmount(
            swapAmount,
            swapTokenAddress,
            infoTokens,
            mlpPrice,
            usdgSupply,
            totalTokenWeights
          );
          const nextValue = formatAmountFree(nextAmount, MLP_DECIMALS, MLP_DECIMALS);
          setMlpValue(nextValue);
          setFeeBasisPoints(feeBps);
        } else {
          const { amount: nextAmount, feeBasisPoints: feeBps } = getSellMlpFromAmount(
            swapAmount,
            swapTokenAddress,
            infoTokens,
            mlpPrice,
            usdgSupply,
            totalTokenWeights
          );
          const nextValue = formatAmountFree(nextAmount, MLP_DECIMALS, MLP_DECIMALS);
          setMlpValue(nextValue);
          setFeeBasisPoints(feeBps);
        }

        return;
      }

      if (!mlpAmount) {
        setSwapValue("");
        setFeeBasisPoints("");
        return;
      }

      if (swapToken) {
        if (isBuying) {
          const { amount: nextAmount, feeBasisPoints: feeBps } = getBuyMlpFromAmount(
            mlpAmount,
            swapTokenAddress,
            infoTokens,
            mlpPrice,
            usdgSupply,
            totalTokenWeights
          );
          const nextValue = formatAmountFree(nextAmount, swapToken.decimals, swapToken.decimals);
          setSwapValue(nextValue);
          setFeeBasisPoints(feeBps);
        } else {
          const { amount: nextAmount, feeBasisPoints: feeBps } = getSellMlpToAmount(
            mlpAmount,
            swapTokenAddress,
            infoTokens,
            mlpPrice,
            usdgSupply,
            totalTokenWeights,
            true
          );

          const nextValue = formatAmountFree(nextAmount, swapToken.decimals, swapToken.decimals);
          setSwapValue(nextValue);
          setFeeBasisPoints(feeBps);
        }
      }
    };

    updateSwapAmounts();
  }, [
    isBuying,
    anchorOnSwapAmount,
    swapAmount,
    mlpAmount,
    swapToken,
    swapTokenAddress,
    infoTokens,
    mlpPrice,
    usdgSupply,
    totalTokenWeights,
  ]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fillMaxAmount = () => {
    if (isBuying) {
      setAnchorOnSwapAmount(true);
      setSwapValue(formatAmountFree(swapTokenBalance, swapToken.decimals, swapToken.decimals));
      return;
    }

    setAnchorOnSwapAmount(false);
    setMlpValue(formatAmountFree(maxSellAmount, MLP_DECIMALS, MLP_DECIMALS));
  };

  const getError = () => {
    const gasTokenInfo = getTokenInfo(infoTokens, ethers.constants.AddressZero);
    if (gasTokenInfo.balance?.eq(0)) {
      return ["Not enough ETH for gas"];
    }

    if (!isBuying && inCooldownWindow) {
      return [`Redemption time not yet reached`];
    }

    if (!swapAmount || swapAmount.eq(0)) {
      return ["Enter an amount"];
    }
    if (!mlpAmount || mlpAmount.eq(0)) {
      return ["Enter an amount"];
    }

    if (isBuying) {
      const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);
      if (swapTokenInfo && swapTokenInfo.balance && swapAmount && swapAmount.gt(swapTokenInfo.balance)) {
        return [`Insufficient ${swapTokenInfo.symbol} balance`];
      }

      if (swapTokenInfo.maxUsdgAmount && swapTokenInfo.usdgAmount && swapUsdMin) {
        const usdgFromAmount = adjustForDecimals(swapUsdMin, USD_DECIMALS, USDG_DECIMALS);
        const nextUsdgAmount = swapTokenInfo.usdgAmount.add(usdgFromAmount);
        if (swapTokenInfo.maxUsdgAmount.gt(0) && nextUsdgAmount.gt(swapTokenInfo.maxUsdgAmount)) {
          return [`${swapTokenInfo.symbol} pool exceeded, try different token`, true];
        }
      }
    }

    if (!isBuying) {
      if (maxSellAmount && mlpAmount && mlpAmount.gt(maxSellAmount)) {
        return [`Insufficient MLP balance`];
      }

      const swapTokenInfo = getTokenInfo(infoTokens, swapTokenAddress);
      if (
        swapTokenInfo &&
        swapTokenInfo.availableAmount &&
        swapAmount &&
        swapAmount.gt(swapTokenInfo.availableAmount)
      ) {
        return [`Insufficient liquidity`];
      }
    }

    return [false];
  };

  const isPrimaryEnabled = () => {
    if (!active) {
      return true;
    }
    const [error, modal] = getError();
    if (error && !modal) {
      return false;
    }
    if ((needApproval && isWaitingForApproval) || isApproving) {
      return false;
    }
    if (isApproving) {
      return false;
    }
    if (isSubmitting) {
      return false;
    }
    if (isSwapTokenCapReached && isBuying) {
      return false;
    }

    return true;
  };

  const getPrimaryText = () => {
    if (!active) {
      return "Connect Wallet";
    }
    const [error, modal] = getError();
    if (error && !modal) {
      return error;
    }
    if (isBuying && isSwapTokenCapReached) {
      return `Max Capacity for ${swapToken.symbol} Reached`;
    }

    if (needApproval && isWaitingForApproval) {
      return "Waiting for Approval";
    }
    if (isApproving) {
      return `Approving ${swapToken.symbol}...`;
    }
    if (needApproval) {
      return `Approve ${swapToken.symbol}`;
    }

    if (isSubmitting) {
      return isBuying ? `Buying...` : `Selling...`;
    }

    return isBuying ? "Buy MLP" : "Sell MLP";
  };

  const approveFromToken = () => {
    approveTokens({
      setIsApproving,
      library,
      tokenAddress: swapToken.address,
      spender: mlpManagerAddress,
      chainId: chainId,
      onApproveSubmitted: () => {
        setIsWaitingForApproval(true);
      },
      infoTokens,
      getTokenInfo,
    });
  };

  const buyMlp = () => {
    setIsSubmitting(true);

    const minMlp = mlpAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    const method = swapTokenAddress === AddressZero ? "mintAndStakeMlpETH" : "mintAndStakeMlp";
    const params = swapTokenAddress === AddressZero ? [0, minMlp] : [swapTokenAddress, swapAmount, 0, minMlp];
    const value = swapTokenAddress === AddressZero ? swapAmount : 0;

    callContract(chainId, contract, method, params, {
      value,
      sentMsg: "Buy submitted.",
      failMsg: "Buy failed.",
      successMsg: `${formatAmount(mlpAmount, 18, 4, true)} MLP bought with ${formatAmount(
        swapAmount,
        swapTokenInfo.decimals,
        4,
        true
      )} ${swapTokenInfo.symbol}!`,
      setPendingTxns,
    })
      .then(async () => {
        trackMlpTrade(3, "Buy MLP");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const sellMlp = () => {
    setIsSubmitting(true);

    const minOut = swapAmount.mul(BASIS_POINTS_DIVISOR - savedSlippageAmount).div(BASIS_POINTS_DIVISOR);

    const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
    const method = swapTokenAddress === AddressZero ? "unstakeAndRedeemMlpETH" : "unstakeAndRedeemMlp";
    const params =
      swapTokenAddress === AddressZero ? [mlpAmount, minOut, account] : [swapTokenAddress, mlpAmount, minOut, account];

    callContract(chainId, contract, method, params, {
      sentMsg: "Sell submitted!",
      failMsg: "Sell failed.",
      successMsg: `${formatAmount(mlpAmount, 18, 4, true)} MLP sold for ${formatAmount(
        swapAmount,
        swapTokenInfo.decimals,
        4,
        true
      )} ${swapTokenInfo.symbol}!`,
      setPendingTxns,
    })
      .then(async () => {
        trackMlpTrade(3, "Burn MLP");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const onClickPrimary = () => {
    if (!active) {
      connectWallet();
      return;
    }

    if (needApproval) {
      approveFromToken();
      return;
    }

    const [, modal] = getError();

    if (modal) {
      return;
    }

    if (isBuying) {
      buyMlp();
    } else {
      sellMlp();
    }
  };

  let payLabel = "Pay";
  let receiveLabel = "Receive";
  let payBalance = "$0.00";
  let receiveBalance = "$0.00";
  if (isBuying) {
    if (swapUsdMin) {
      payBalance = `$${formatAmount(swapUsdMin, USD_DECIMALS, 2, true)}`;
    }
    if (mlpUsdMax) {
      receiveBalance = `$${formatAmount(mlpUsdMax, USD_DECIMALS, 2, true)}`;
    }
  } else {
    if (mlpUsdMax) {
      payBalance = `$${formatAmount(mlpUsdMax, USD_DECIMALS, 2, true)}`;
    }
    if (swapUsdMin) {
      receiveBalance = `$${formatAmount(swapUsdMin, USD_DECIMALS, 2, true)}`;
    }
  }

  const selectToken = (token) => {
    setAnchorOnSwapAmount(false);
    setSwapTokenAddress(token.address);
    helperToast.success(`${token.symbol} selected in order form`);
  };

  let feePercentageText = formatAmount(feeBasisPoints, 2, 2, true, "-");
  if (feeBasisPoints !== undefined && feeBasisPoints.toString().length > 0) {
    feePercentageText += "%";
  }

  let maxSellAmount = mlpBalance;
  if (mlpBalance && reservedAmount) {
    maxSellAmount = mlpBalance.sub(reservedAmount);
  }

  const wrappedTokenSymbol = getWrappedToken(chainId).symbol;
  const nativeTokenSymbol = getNativeToken(chainId).symbol;

  const trackMlpTrade = (stage, tradeType) => {
    const eventName = getAnalyticsEventStage(stage);

    const isBuy = tradeType.includes("Buy");
    try {
      const feePercentage = formatAmount(feeBasisPoints, 2, 2, false, "-");
      const feesUsd = (parseFloat(payBalance.replace("$", "")) * parseFloat(feePercentage)) / 100;
      const feesEth = (swapValue * parseFloat(feePercentage)) / 100;
      const amountToPay = isBuy ? swapValue : mlpValue;
      const amountToReceive = isBuy ? mlpValue : swapValue;
      const amountToReceiveUsd = receiveBalance?.replace("$", "");
      const tokenToPay = isBuy ? swapTokenInfo.symbol : "MLP";
      const tokenToReceive = isBuy ? "MLP" : swapTokenInfo.symbol;

      const [userBalances, tokenPrices, poolBalances] = getUserTokenBalances(infoTokens);

      const traits = {
        actionType: "Create",
        transactionType: isBuy ? "Buy" : "Sell",
        amountToReceiveUsd: parseFloat(amountToReceiveUsd),
        tradeType: tradeType,
        tokenToPay: tokenToPay,
        tokenToReceive: tokenToReceive,
        amountToPay: parseFloat(amountToPay),
        amountToReceive: parseFloat(amountToReceive),
        balance: parseFloat(formatAmount(swapTokenBalance, swapToken.decimals, 4, false)),
        balanceToken: swapToken.symbol,
        feesUsd: feesUsd.toFixed(2),
        feesEth: parseFloat(feesEth).toFixed(8),
        walletAddress: account,
        network: NETWORK_NAME[chainId],
        ...userBalances,
        ...tokenPrices,
        ...poolBalances,
      };
      trackAction && trackAction(eventName, traits);
    } catch (err) {
      console.error(`Unable to track ${eventName} event`, err);
    }
  };

  const [pageTracked, setPageTracked] = useState(false);

  const dataElements = [chainId, isBuying, pageTracked, swapTokenAddress, history.location.hash];
  const elementsLoaded = dataElements.every((element) => element !== undefined);

  // Segment Analytics Page tracking
  useEffect(() => {
    if (elementsLoaded && analytics && !pageTracked) {
      // If page hash is #redeem, then user is Buying
      const hash = history.location.hash.replace("#", "");
      const isBuying = hash === "redeem" ? false : true;
      // Swap pay and receive tokens depending on isBuying
      const tokenToPay = isBuying ? getToken(chainId, swapTokenAddress).symbol : "MLP";
      const tokenToReceive = isBuying ? "MLP" : getToken(chainId, swapTokenAddress).symbol;
      const traits = {
        action: isBuying ? "Buy" : "Sell",
        tokenToPay: tokenToPay,
        tokenToReceive: tokenToReceive,
      };
      trackPageWithTraits(traits);
      setPageTracked(true); // Prevent Page function being called twice
    }
  }, [
    chainId,
    isBuying,
    pageTracked,
    swapTokenAddress,
    elementsLoaded,
    trackPageWithTraits,
    history.location.hash,
    analytics,
  ]);

  return (
    <div className="MlpSwap">
      <div className="MlpSwap-content">
        <div className="MlpSwap-box App-box">
          <div className="section-title-block">
            {/*
              <div className="section-title-icon">
                <img src={buyMLPIcon} alt="buyMLPIcon" />
              </div>
            */}
            <div className="section-title-content">
              <div className="Page-title">Burn MLP</div>
              <div className="Page-description">
                Burn your MLP for available pool assets
              </div>
            </div>
          </div>
          {isBuying && (
            <BuyInputSection
              topLeftLabel={payLabel}
              topRightLabel={`Balance: `}
              tokenBalance={`${formatAmount(swapTokenBalance, swapToken.decimals, 4, true)}`}
              inputValue={swapValue}
              onInputValueChange={onSwapValueChange}
              showMaxButton={swapValue !== formatAmountFree(swapTokenBalance, swapToken.decimals, swapToken.decimals)}
              onClickTopRightLabel={fillMaxAmount}
              onClickMax={fillMaxAmount}
              selectedToken={swapToken}
              balance={payBalance}
              trackAction={trackAction}
              tabLabel={tabLabel}
            >
              <TokenSelector
                label="Pay"
                chainId={chainId}
                tokenAddress={swapTokenAddress}
                onSelectToken={onSelectSwapToken}
                tokens={enabledWhitelistedTokens}
                infoTokens={infoTokens}
                className="MlpSwap-from-token"
                showSymbolImage={true}
                showTokenImgInDropdown={true}
                trackAction={trackAction}
              />
            </BuyInputSection>
          )}

          {/* {!isBuying && ( */}
          <BuyInputSection
            topLeftLabel={payLabel}
            topRightLabel={`Available: `}
            tokenBalance={`${formatAmount(maxSellAmount, MLP_DECIMALS, 4, true)}`}
            inputValue={mlpValue}
            onInputValueChange={onMlpValueChange}
            showMaxButton={mlpValue !== formatAmountFree(maxSellAmount, MLP_DECIMALS, MLP_DECIMALS)}
            onClickTopRightLabel={fillMaxAmount}
            onClickMax={fillMaxAmount}
            balance={payBalance}
            defaultTokenName={"MLP"}
          >
            <div className="selected-token">
              MLP <img src={tlp24Icon} alt="tlp24Icon" />
            </div>
          </BuyInputSection>
          {/* )} */}

          <div className="AppOrder-ball-container">
            <div className="AppOrder-ball">
              <img
                src={arrowIcon}
                alt="arrowIcon"
                onClick={() => {
                  trackAction &&
                    trackAction("Button clicked", {
                      buttonName: `Swap action - ${isBuying ? "Sell MLP" : "Buy MLP"}`,
                    });
                }}
              />
            </div>
          </div>

          {!isBuying && (
            <BuyInputSection
              topLeftLabel={receiveLabel}
              topRightLabel={`Balance: `}
              tokenBalance={`${formatAmount(swapTokenBalance, swapToken.decimals, 4, true)}`}
              inputValue={swapValue}
              onInputValueChange={onSwapValueChange}
              balance={receiveBalance}
              selectedToken={swapToken}
              trackAction={trackAction}
              tabLabel={tabLabel}
            >
              <TokenSelector
                label="Receive"
                chainId={chainId}
                tokenAddress={swapTokenAddress}
                onSelectToken={onSelectSwapToken}
                tokens={whitelistedTokens}
                infoTokens={infoTokens}
                className="MlpSwap-from-token"
                showSymbolImage={true}
                showTokenImgInDropdown={true}
                trackAction={trackAction}
              />
            </BuyInputSection>
          )}
          <div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">{feeBasisPoints > 50 ? "WARNING: High Fees" : "Fees"}</div>
              <div className="align-right fee-block">
                {!isBuying && (
                  <Tooltip
                    handle={feePercentageText}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          {feeBasisPoints > 50 && <div>To reduce fees, select a different asset to receive.</div>}
                          Check the "Save on Fees" section below to get the lowest fee percentages.
                        </>
                      );
                    }}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="MlpSwap-cta Exchange-swap-button-container">
            <button
              className="App-cta Exchange-swap-button"
              onClick={() => {
                const buttonText = getPrimaryText();
                onClickPrimary();
                if (!buttonText.includes("Connect")) {
                  if (buttonText.includes("Approve")) {
                    trackMlpTrade(1, buttonText.split(" ")[1]); // Get token symbol
                    trackAction &&
                      trackAction("Button clicked", {
                        buttonName: "Approve",
                        fromToken: buttonText.split(" ")[1],
                      });
                  } else {
                    trackMlpTrade(2, buttonText);
                    trackAction &&
                      trackAction("Button clicked", {
                        buttonName: buttonText,
                      });
                  }
                }
              }}
              disabled={!isPrimaryEnabled()}
            >
              {getPrimaryText()}
            </button>
          </div>
        </div>
        <div className="EsMyc-box App-box">
          <div>
            <div className="Page-title">Withdraw Vesting</div>
            <div className="Page-description">
              Withdraw your vested esMYC (converted to MYC).
            </div>
          </div>
          {/* <StakeV2Styled.Card> */}
            <div>
              <StakeV2Styled.VestingInfo>
                <StakeV2Styled.StakedTokens>
                  <StakeV2Styled.RewardsBannerText secondary large>
                    Vesting Tokens
                  </StakeV2Styled.RewardsBannerText>
                  <div>
                    <StakeV2Styled.RewardsBannerTextWrap>
                      <StakeV2Styled.RewardsBannerText large inline>
                        {formatKeyAmount(vestingData, "mlpVesterVestedAmount", 18, 4, true)} esMYC
                      </StakeV2Styled.RewardsBannerText>{" "}
                      {/* <StakeV2Styled.RewardsBannerText inline>
                        ($
                        {formatKeyAmount(processedData, "mlpVesterVestedAmountUsd", USD_DECIMALS, 2, true)})
                      </StakeV2Styled.RewardsBannerText> */}
                    </StakeV2Styled.RewardsBannerTextWrap>
                  </div>
                </StakeV2Styled.StakedTokens>
                <StakeV2Styled.StakingBannerRow>
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
                              {formatKeyAmount(vestingData, "mlpVesterClaimSum", 18, 4, true)} tokens have been
                              converted to MYC from the&nbsp;
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
                  <StakeV2Styled.Buttons>
                    {!active && (
                      <button className="App-button-option App-card-option" onClick={() => connectWallet()}>
                        Connect Wallet
                      </button>
                    )}
                    {active && (
                      <button
                        className="App-button-option App-card-option"
                        onClick={() => showMycVesterWithdrawModal()}
                      >
                        Withdraw
                      </button>
                    )}
                  </StakeV2Styled.Buttons>
                </StakeV2Styled.StakingBannerRow>
              </StakeV2Styled.VestingInfo>
            </div>
          {/* </StakeV2Styled.Card> */}
        </div>
      </div>
      <div className="Tab-title-section">
        <div className="Page-title">Redeemable Assets</div>
      </div>
      <div className="MlpSwap-token-list">
        {/* <div className="MlpSwap-token-list-content"> */}
        <table className="token-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Price</th>
              <th>
                {isBuying ? (
                  <Tooltip
                    handle={"Available"}
                    tooltipIconPosition="right"
                    position="right-bottom text-none"
                    renderContent={() => "Available amount to deposit into MLP."}
                  />
                ) : (
                  <Tooltip
                    handle={"Available"}
                    tooltipIconPosition="right"
                    position="right-bottom text-none"
                    renderContent={() => {
                      return (
                        <>
                          <div>Available amount to withdraw from MLP.</div>
                          <div>Funds not utilized by current open positions.</div>
                        </>
                      );
                    }}
                  />
                )}
              </th>
              <th>Wallet</th>
              <th>
                <Tooltip
                  handle={"Fees"}
                  tooltipIconPosition="right"
                  position="right-bottom text-none"
                  renderContent={() => {
                    return (
                      <>
                        <div>Fees will be shown once you have entered an amount in the order form.</div>
                      </>
                    );
                  }}
                />
              </th>
              {/* <th></th> */}
            </tr>
          </thead>
          <tbody>
            {tokenList
              .filter(token => {
                const tokenInfo = getTokenInfo(infoTokens, token.address);
                let availableAmountUsd;
                if (tokenInfo && tokenInfo.minPrice && tokenInfo.availableAmount) {
                  availableAmountUsd = tokenInfo.availableAmount
                    .mul(tokenInfo.minPrice)
                    .div(expandDecimals(1, token.decimals));
                }

                console.log('TOKEN USD AVAILABLE AMOUNT', availableAmountUsd ? availableAmountUsd.toString() : 0)
                // 1 dollar with 30 decimal places
                return availableAmountUsd && availableAmountUsd.gt(BigNumber.from(10).pow(USD_DECIMALS))
              })
              .map((token) => {
                let tokenFeeBps;
                if (isBuying) {
                  const { feeBasisPoints: feeBps } = getBuyMlpFromAmount(
                    mlpAmount,
                    token.address,
                    infoTokens,
                    mlpPrice,
                    usdgSupply,
                    totalTokenWeights
                  );
                  tokenFeeBps = feeBps;
                } else {
                  const { feeBasisPoints: feeBps } = getSellMlpToAmount(
                    mlpAmount,
                    token.address,
                    infoTokens,
                    mlpPrice,
                    usdgSupply,
                    totalTokenWeights
                  );
                  tokenFeeBps = feeBps;
                }
                const tokenInfo = getTokenInfo(infoTokens, token.address);
                let managedUsd;
                if (tokenInfo && tokenInfo.managedUsd) {
                  managedUsd = tokenInfo.managedUsd;
                }
                let availableAmountUsd;
                if (tokenInfo && tokenInfo.minPrice && tokenInfo.availableAmount) {
                  availableAmountUsd = tokenInfo.availableAmount
                    .mul(tokenInfo.minPrice)
                    .div(expandDecimals(1, token.decimals));
                }
                let balanceUsd;
                if (tokenInfo && tokenInfo.minPrice && tokenInfo.balance) {
                  balanceUsd = tokenInfo.balance.mul(tokenInfo.minPrice).div(expandDecimals(1, token.decimals));
                }

                var tokenImage = null;

                try {
                  tokenImage = require("../../img/ic_" + token.symbol.toLowerCase() + "_40.svg");
                } catch (error) {
                  console.error(error);
                }
                let isCapReached = tokenInfo.managedAmount?.gt(tokenInfo.maxUsdgAmount);

                let amountLeftToDeposit;
                if (tokenInfo.maxUsdgAmount && tokenInfo.maxUsdgAmount.gt(0)) {
                  amountLeftToDeposit = adjustForDecimals(tokenInfo.maxUsdgAmount, USDG_DECIMALS, USD_DECIMALS).sub(
                    tokenInfo.managedUsd
                  );
                }
                function renderFees() {
                  const swapUrl = `https://app.uniswap.org/#/swap?inputCurrency=${token.address}&chain=arbitrum`;
                  switch (true) {
                    case (isBuying && isCapReached) || (!isBuying && managedUsd?.lt(1)):
                      return (
                        <Tooltip
                          handle="NA"
                          position="right-bottom"
                          renderContent={() => (
                            <div>
                              Max pool capacity reached for {tokenInfo.symbol}
                              <br />
                              <br />
                              Please mint MLP using another token
                              <br />
                              <p>
                                <a href={swapUrl} target="_blank" rel="noreferrer">
                                  Swap on {chainId === ARBITRUM ? "Uniswap" : "Trader Joe"}
                                </a>
                              </p>
                            </div>
                          )}
                        />
                      );
                    case (isBuying && !isCapReached) || (!isBuying && managedUsd?.gt(0)):
                      return `${formatAmount(tokenFeeBps, 2, 2, true, "-")}${tokenFeeBps !== undefined && tokenFeeBps.toString().length > 0 ? "%" : ""
                        }`;
                    default:
                      return "";
                  }
                }

                return (
                  <tr key={token.symbol}>
                    <td>
                      <div className="App-card-title-info">
                        <div className="App-card-title-info-icon">
                          <img src={tokenImage && tokenImage.default} alt={token.symbol} width="40px" />
                        </div>
                        <div className="App-card-title-info-text">
                          <div className="App-card-info-title">{token.name}</div>
                          <div className="App-card-info-subtitle">{token.symbol}</div>
                        </div>
                        <div>
                          <AssetDropdown assetSymbol={token.symbol} assetInfo={token} trackAction={trackAction} />
                        </div>
                      </div>
                    </td>
                    <td>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, 2, true)}</td>
                    <td>
                      {isBuying && (
                        <div>
                          <Tooltip
                            handle={
                              amountLeftToDeposit && amountLeftToDeposit.lt(0)
                                ? "$0.00"
                                : `$${formatAmount(amountLeftToDeposit, USD_DECIMALS, 2, true)}`
                            }
                            position="right-bottom"
                            tooltipIconPosition="right"
                            renderContent={() => {
                              return (
                                <>
                                  Current Pool Amount: ${formatAmount(managedUsd, USD_DECIMALS, 2, true)} (
                                  {formatKeyAmount(tokenInfo, "poolAmount", token.decimals, 2, true)} {token.symbol})
                                  <br />
                                  <br />
                                  Max Pool Capacity: ${formatAmount(tokenInfo.maxUsdgAmount, 18, 0, true)}
                                </>
                              );
                            }}
                          />
                        </div>
                      )}
                      {!isBuying && (
                        <div>
                          {formatKeyAmount(tokenInfo, "availableAmount", token.decimals, 2, true)} {token.symbol} ($
                          {formatAmount(availableAmountUsd, USD_DECIMALS, 2, true)})
                        </div>
                      )}
                    </td>
                    <td>
                      {formatKeyAmount(tokenInfo, "balance", tokenInfo.decimals, 2, true)} {tokenInfo.symbol} ($
                      {formatAmount(balanceUsd, USD_DECIMALS, 2, true)})
                    </td>
                    <td>{renderFees()}</td>
                    <td>
                      <button
                        className={cx("App-button-option action-btn", isBuying ? "buying" : "selling")}
                        onClick={() => {
                          selectToken(token);
                          trackAction &&
                            trackAction("Button clicked", {
                              buttonName: isBuying ? "Buy with " + token.symbol : "Burn for " + token.symbol,
                            });
                        }}
                      >
                        {isBuying ? "Buy with " + token.symbol : "Burn for " + token.symbol}
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        <div className="token-grid">
          {tokenList.map((token) => {
            let tokenFeeBps;
            if (isBuying) {
              const { feeBasisPoints: feeBps } = getBuyMlpFromAmount(
                mlpAmount,
                token.address,
                infoTokens,
                mlpPrice,
                usdgSupply,
                totalTokenWeights
              );
              tokenFeeBps = feeBps;
            } else {
              const { feeBasisPoints: feeBps } = getSellMlpToAmount(
                mlpAmount,
                token.address,
                infoTokens,
                mlpPrice,
                usdgSupply,
                totalTokenWeights
              );
              tokenFeeBps = feeBps;
            }
            const tokenInfo = getTokenInfo(infoTokens, token.address);
            let managedUsd;
            if (tokenInfo && tokenInfo.managedUsd) {
              managedUsd = tokenInfo.managedUsd;
            }
            let availableAmountUsd;
            if (tokenInfo && tokenInfo.minPrice && tokenInfo.availableAmount) {
              availableAmountUsd = tokenInfo.availableAmount
                .mul(tokenInfo.minPrice)
                .div(expandDecimals(1, token.decimals));
            }
            let balanceUsd;
            if (tokenInfo && tokenInfo.minPrice && tokenInfo.balance) {
              balanceUsd = tokenInfo.balance.mul(tokenInfo.minPrice).div(expandDecimals(1, token.decimals));
            }

            let amountLeftToDeposit;
            if (tokenInfo.maxUsdgAmount && tokenInfo.maxUsdgAmount.gt(0)) {
              amountLeftToDeposit = adjustForDecimals(tokenInfo.maxUsdgAmount, USDG_DECIMALS, USD_DECIMALS).sub(
                tokenInfo.managedUsd
              );
            }
            let isCapReached = tokenInfo.managedAmount?.gt(tokenInfo.maxUsdgAmount);

            function renderFees() {
              switch (true) {
                case (isBuying && isCapReached) || (!isBuying && managedUsd?.lt(1)):
                  return (
                    <Tooltip
                      handle="NA"
                      position="right-bottom"
                      renderContent={() =>
                        `Max pool capacity reached for ${tokenInfo.symbol}. Please mint MLP using another token`
                      }
                    />
                  );
                case (isBuying && !isCapReached) || (!isBuying && managedUsd?.gt(0)):
                  return `${formatAmount(tokenFeeBps, 2, 2, true, "-")}${tokenFeeBps !== undefined && tokenFeeBps.toString().length > 0 ? "%" : ""
                    }`;
                default:
                  return "";
              }
            }

            return (
              <div className="App-card" key={token.symbol}>
                <div className="App-card-title">{token.name}</div>
                <div className="App-card-divider"></div>
                <div className="App-card-content">
                  <div className="App-card-row">
                    <div className="label">Price</div>
                    <div>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, 2, true)}</div>
                  </div>
                  {isBuying && (
                    <div className="App-card-row">
                      <Tooltip
                        className="label"
                        handle="Available"
                        position="left-bottom"
                        renderContent={() => "Available amount to deposit into MLP."}
                      />
                      <div>
                        <Tooltip
                          handle={amountLeftToDeposit && `$${formatAmount(amountLeftToDeposit, USD_DECIMALS, 2, true)}`}
                          position="right-bottom"
                          tooltipIconPosition="right"
                          renderContent={() => {
                            return (
                              <>
                                Current Pool Amount: ${formatAmount(managedUsd, USD_DECIMALS, 2, true)} (
                                {formatKeyAmount(tokenInfo, "poolAmount", token.decimals, 2, true)} {token.symbol})
                                <br />
                                <br />
                                Max Pool Capacity: ${formatAmount(tokenInfo.maxUsdgAmount, 18, 0, true)}
                              </>
                            );
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {!isBuying && (
                    <div className="App-card-row">
                      <Tooltip
                        handle="Available"
                        position="left-bottom"
                        renderContent={() => {
                          return (
                            <>
                              <div>Available amount to withdraw from MLP.</div>
                              <div>Funds not utilized by current open positions.</div>
                            </>
                          );
                        }}
                      />
                      <div>
                        {formatKeyAmount(tokenInfo, "availableAmount", token.decimals, 2, true)} {token.symbol} ($
                        {formatAmount(availableAmountUsd, USD_DECIMALS, 2, true)})
                      </div>
                    </div>
                  )}

                  <div className="App-card-row">
                    <div className="label">Wallet</div>
                    <div>
                      {formatKeyAmount(tokenInfo, "balance", tokenInfo.decimals, 2, true)} {tokenInfo.symbol} ($
                      {formatAmount(balanceUsd, USD_DECIMALS, 2, true)})
                    </div>
                  </div>
                  <div className="App-card-row">
                    <div className="label">
                      {tokenFeeBps ? (
                        "Fees"
                      ) : (
                        <Tooltip
                          handle={`Fees`}
                          renderContent={() => `Please enter an amount to see fee percentages`}
                        />
                      )}
                    </div>
                    <div>{renderFees()}</div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-options">
                    {isBuying && (
                      <button className="App-button-option App-card-option" onClick={() => selectToken(token)}>
                        Buy with {token.symbol}
                      </button>
                    )}
                    {!isBuying && (
                      <button className="App-button-option App-card-option" onClick={() => selectToken(token)}>
                        Sell for {token.symbol}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* </div> */}
      </div>
    </div>
  );
}
