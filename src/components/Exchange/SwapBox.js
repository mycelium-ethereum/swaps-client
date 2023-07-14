import cx from "classnames";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "../Modal/Modal";
import Tooltip from "../Tooltip/Tooltip";

import { ethers } from "ethers";
import useSWR from "swr";

import { BsArrowRight } from "react-icons/bs";
import { IoMdSwap } from "react-icons/io";

import { getContract } from "../../Addresses";
import * as Api from "../../Api";
import { getConstant } from "../../Constants";
import {
  adjustForDecimals,
  approveTokens,
  BASIS_POINTS_DIVISOR,
  bigNumberify,
  calculatePositionDelta,
  DEFAULT_HIGHER_SLIPPAGE_AMOUNT,
  DUST_BNB,
  expandDecimals,
  fetcher,
  formatAmount,
  formatAmountFree,
  getExchangeRate,
  getExchangeRateDisplay,
  getLeverage,
  getLiquidationPrice,
  getMostAbundantStableToken,
  getNextFromAmount,
  getNextToAmount,
  getPositionKey,
  getSpread,
  getTokenInfo,
  getUsd,
  getUserTokenBalances,
  helperToast,
  isHashZero,
  isSupportedChain,
  isTriggerRatioInverted,
  LEVERAGE_ORDER_OPTIONS,
  LIMIT,
  limitDecimals,
  LONG,
  MARGIN_FEE_BASIS_POINTS,
  MARKET,
  NETWORK_NAME,
  parseValue,
  PRECISION,
  replaceNativeTokenAddress,
  SHORT,
  shouldRaiseGasError,
  STOP,
  SWAP,
  SWAP_OPTIONS,
  SWAP_ORDER_OPTIONS,
  USD_DECIMALS,
  USDG_ADDRESS,
  USDG_DECIMALS,
  useLocalStorageByChainId,
  useLocalStorageSerializeKey,
  usePrevious,
} from "../../Helpers";

import Tab from "../Tab/Tab";
import ConfirmationBox from "./ConfirmationBox";
import ExchangeInfoRow from "./ExchangeInfoRow";
import OrdersToa from "./OrdersToa";
import TokenSelector from "./TokenSelector";

import PositionCreator from "../../abis/PositionCreator.json";
import PositionRouter from "../../abis/PositionRouter.json";
import Router from "../../abis/Router.json";
import Token from "../../abis/Token.json";
import WETH from "../../abis/WETH.json";
import { getToken, getTokenBySymbol, getTokens, getWhitelistedTokens } from "../../data/Tokens";

import { useUserReferralCode } from "../../Api/referrals";
import { REFERRAL_CODE_KEY } from "../../config/localstorage";
import longImg from "../../img/long.svg";
import shortImg from "../../img/short.svg";
import swapImg from "../../img/swap.svg";
import { getMaxLeverage, LeverageInput } from "./LeverageInput";
import { TriggerCreator } from "./TriggerCreator";

const SWAP_ICONS = {
  [LONG]: longImg,
  [SHORT]: shortImg,
  [SWAP]: swapImg,
};

const { AddressZero } = ethers.constants;

function getNextAveragePrice({ size, sizeDelta, hasProfit, delta, nextPrice, isLong }) {
  if (!size || !sizeDelta || !delta || !nextPrice) {
    return;
  }
  const nextSize = size.add(sizeDelta);
  let divisor;
  if (isLong) {
    divisor = hasProfit ? nextSize.add(delta) : nextSize.sub(delta);
  } else {
    divisor = hasProfit ? nextSize.sub(delta) : nextSize.add(delta);
  }
  if (!divisor || divisor.eq(0)) {
    return;
  }
  const nextAveragePrice = nextPrice.mul(nextSize).div(divisor);
  return nextAveragePrice;
}

export default function SwapBox(props) {
  const {
    pendingPositions,
    setPendingPositions,
    infoTokens,
    active,
    library,
    account,
    fromTokenAddress,
    setFromTokenAddress,
    toTokenAddress,
    setToTokenAddress,
    swapOption,
    setSwapOption,
    positionsMap,
    pendingTxns,
    setPendingTxns,
    tokenSelection,
    setTokenSelection,
    setIsConfirming,
    isConfirming,
    isPendingConfirmation,
    setIsPendingConfirmation,
    flagOrdersEnabled,
    chainId,
    nativeTokenAddress,
    savedSlippageAmount,
    totalTokenWeights,
    usdgSupply,
    orders,
    savedIsPnlInLeverage,
    orderBookApproved,
    positionRouterApproved,
    isWaitingForPluginApproval,
    approveOrderBook,
    approvePositionRouter,
    setIsWaitingForPluginApproval,
    isWaitingForPositionRouterApproval,
    setIsWaitingForPositionRouterApproval,
    isPluginApproving,
    isPositionRouterApproving,
    trackAction,
  } = props;

  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [anchorOnFromAmount, setAnchorOnFromAmount] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(false);
  const [isHigherSlippageAllowed, setIsHigherSlippageAllowed] = useState(false);
  const { userReferralCode } = useUserReferralCode(library, chainId, account);
  const userReferralCodeInLocalStorage = window.localStorage.getItem(REFERRAL_CODE_KEY);

  let allowedSlippage = savedSlippageAmount;
  if (isHigherSlippageAllowed) {
    allowedSlippage = DEFAULT_HIGHER_SLIPPAGE_AMOUNT;
  }

  const defaultCollateralSymbol = getConstant(chainId, "defaultCollateralSymbol");
  // TODO hack with useLocalStorageSerializeKey
  const [shortCollateralAddress, setShortCollateralAddress] = useLocalStorageByChainId(
    chainId,
    "Short-Collateral-Address",
    getTokenBySymbol(chainId, defaultCollateralSymbol).address
  );
  const isLong = swapOption === LONG;
  const isShort = swapOption === SHORT;
  const isSwap = swapOption === SWAP;

  function getTokenLabel() {
    switch (true) {
      case isLong:
        return "Long";
      case isShort:
        return "Short";
      case isSwap:
        return "Receive";
      default:
        return "";
    }
  }
  const [leverageOption, setLeverageOption] = useLocalStorageSerializeKey(
    [chainId, "Exchange-swap-leverage-option"],
    "2"
  );

  const hasLeverageOption = !isNaN(parseFloat(leverageOption));

  const [ordersToaOpen, setOrdersToaOpen] = useState(false);

  let [orderOption, setOrderOption] = useLocalStorageSerializeKey([chainId, "Order-option"], MARKET);
  if (!flagOrdersEnabled) {
    orderOption = MARKET;
  }

  const onOrderOptionChange = (option) => {
    // limits disabled
    if (typeof option === "string") {
      setOrderOption(option);
    }
  };

  const [sellValue, setSellValue] = useState("");

  const onSellChange = (evt) => {
    setSellValue(evt.target.value || "");
  };

  const isMarketOrder = orderOption === MARKET;
  const orderOptions = isSwap ? SWAP_ORDER_OPTIONS : LEVERAGE_ORDER_OPTIONS;

  const [triggerPriceValue, setTriggerPriceValue] = useState("");
  const triggerPriceUsd = isMarketOrder ? 0 : parseValue(triggerPriceValue, USD_DECIMALS);

  const onTriggerPriceChange = (evt) => {
    setTriggerPriceValue(evt.target.value || "");
  };

  const onTriggerRatioChange = (evt) => {
    setTriggerRatioValue(evt.target.value || "");
  };

  let positionKey;
  if (isLong) {
    positionKey = getPositionKey(account, toTokenAddress, toTokenAddress, true, nativeTokenAddress);
  }
  if (isShort) {
    positionKey = getPositionKey(account, shortCollateralAddress, toTokenAddress, false, nativeTokenAddress);
  }

  const existingPosition = positionKey ? positionsMap[positionKey] : undefined;
  const hasExistingPosition = existingPosition && existingPosition.size && existingPosition.size.gt(0);

  const whitelistedTokens = getWhitelistedTokens(chainId);
  const tokens = getTokens(chainId);
  const enabledTokens = tokens.filter((token) => token.isEnabledForTrading);
  const fromTokens = enabledTokens;
  const stableTokens = tokens.filter((token) => token.isStable);
  const indexTokens = whitelistedTokens.filter((token) => !token.isStable && !token.isWrapped);
  const enabledIndexTokens = whitelistedTokens.filter((token) => token.isEnabledForTrading);
  const shortableTokens = indexTokens.filter((token) => token.isShortable && token.isEnabledForTrading);
  let toTokens = tokens;
  if (isLong) {
    toTokens = enabledIndexTokens;
  }
  if (isShort) {
    toTokens = shortableTokens;
  }

  const isToTokenEnabled = useMemo(
    () => tokens.find((token) => token.address === toTokenAddress)?.isEnabledForTrading,
    [tokens, toTokenAddress]
  );

  // Only allow toTokenAddress if it is not included as a disabled token or if the swapOption is Swap
  const checkedToTokenAddress = useMemo(
    () => (swapOption !== SWAP && !isToTokenEnabled ? AddressZero : toTokenAddress),
    [swapOption, toTokenAddress, isToTokenEnabled]
  );

  const triggerReferencePrice = isShort ? infoTokens[toTokenAddress].maxPrice : infoTokens[toTokenAddress].minPrice;
  const [stopLossTriggerPercent, setStopLossTriggerPercent] = React.useState(null); // number or null
  const [takeProfitTriggerPercent, setTakeProfitTriggerPercent] = React.useState(null); // number or null

  const stopLossTriggerPrice = calculateTriggerPrice(stopLossTriggerPercent, leverageOption, true);
  const takeProfitTriggerPrice = calculateTriggerPrice(takeProfitTriggerPercent, leverageOption, false);

  function calculateTriggerPrice(pnlPercent, leverage, isStopLoss) {
    const PERCENT_PRECISION = 10000;
    if (!pnlPercent) return null;
    const priceMovePrecision = Math.round((pnlPercent * PERCENT_PRECISION) / leverage);
    if (isLong ? isStopLoss : !isStopLoss) {
      return triggerReferencePrice.mul(PERCENT_PRECISION - priceMovePrecision).div(PERCENT_PRECISION);
    } else {
      return triggerReferencePrice.mul(PERCENT_PRECISION + priceMovePrecision).div(PERCENT_PRECISION);
    }
  }

  const needOrderBookApproval =
    !orderBookApproved && (!isMarketOrder || stopLossTriggerPercent || takeProfitTriggerPercent);
  const prevNeedOrderBookApproval = usePrevious(needOrderBookApproval);

  const needPositionRouterApproval = (isLong || isShort) && isMarketOrder && !positionRouterApproved;
  const prevNeedPositionRouterApproval = usePrevious(needPositionRouterApproval);

  useEffect(() => {
    if (!needOrderBookApproval && prevNeedOrderBookApproval && isWaitingForPluginApproval) {
      setIsWaitingForPluginApproval(false);
      helperToast.success(<div>Orders enabled!</div>);
    }
  }, [needOrderBookApproval, prevNeedOrderBookApproval, setIsWaitingForPluginApproval, isWaitingForPluginApproval]);

  useEffect(() => {
    if (!needPositionRouterApproval && prevNeedPositionRouterApproval && isWaitingForPositionRouterApproval) {
      setIsWaitingForPositionRouterApproval(false);
      helperToast.success(<div>Leverage enabled!</div>);
    }
  }, [
    needPositionRouterApproval,
    prevNeedPositionRouterApproval,
    setIsWaitingForPositionRouterApproval,
    isWaitingForPositionRouterApproval,
  ]);

  useEffect(() => {
    if (!needOrderBookApproval && prevNeedOrderBookApproval && isWaitingForPluginApproval) {
      setIsWaitingForPluginApproval(false);
      helperToast.success(<div>Orders enabled!</div>);
    }
  }, [needOrderBookApproval, prevNeedOrderBookApproval, setIsWaitingForPluginApproval, isWaitingForPluginApproval]);

  const routerAddress = getContract(chainId, "Router");
  const tokenAllowanceAddress = fromTokenAddress === AddressZero ? nativeTokenAddress : fromTokenAddress;
  const { data: tokenAllowance } = useSWR(
    active && [active, chainId, tokenAllowanceAddress, "allowance", account, routerAddress],
    {
      fetcher: fetcher(library, Token),
    }
  );

  const positionRouterAddress = getContract(chainId, "PositionRouter");

  const { data: minExecutionFee } = useSWR([active, chainId, positionRouterAddress, "minExecutionFee"], {
    fetcher: fetcher(library, PositionRouter),
  });

  const { data: hasOutdatedUi } = Api.useHasOutdatedUi();

  const fromToken = getToken(chainId, fromTokenAddress);
  const toToken = getToken(chainId, toTokenAddress);
  const shortCollateralToken = getTokenInfo(infoTokens, shortCollateralAddress);

  const fromTokenInfo = getTokenInfo(infoTokens, fromTokenAddress);
  const toTokenInfo = getTokenInfo(infoTokens, toTokenAddress);

  const hasMaxAvailableShort = isShort && toTokenInfo.maxAvailableShort && toTokenInfo.maxAvailableShort.gt(0);

  const renderAvailableLiquidity = () => {
    if (!isLong && hasMaxAvailableShort) {
      return (
        <div className="Exchange-info-row">
          <div className="Exchange-info-label">Available Liquidity</div>
          <div className="align-right">
            <Tooltip
              handle={`${formatAmount(toTokenInfo.maxAvailableShort, USD_DECIMALS, 2, true)}`}
              position="right-bottom"
              renderContent={() => {
                return (
                  <>
                    Max {toTokenInfo.symbol} short capacity: $
                    {formatAmount(toTokenInfo.maxGlobalShortSize, USD_DECIMALS, 2, true)}
                    <br />
                    <br />
                    Current {toTokenInfo.symbol} shorts: $
                    {formatAmount(toTokenInfo.globalShortSize, USD_DECIMALS, 2, true)}
                    <br />
                  </>
                );
              }}
            ></Tooltip>
          </div>
        </div>
      );
    } else if (isLong) {
      return (
        <div className="Exchange-info-row">
          <div className="Exchange-info-label">Available Liquidity</div>
          <div className="align-right">
            <Tooltip
              handle={`$${formatAmount(toTokenInfo.maxAvailableLong, USD_DECIMALS, 2, true)}`}
              position="right-bottom"
              renderContent={() => {
                return (
                  <>
                    Max {toTokenInfo.symbol} long capacity: $
                    {formatAmount(toTokenInfo.maxLongCapacity, USD_DECIMALS, 0, true)}
                    <br />
                    <br />
                    Current {toTokenInfo.symbol} longs: $
                    {formatAmount(toTokenInfo.guaranteedUsd, USD_DECIMALS, 0, true)}
                    <br />
                  </>
                );
              }}
            ></Tooltip>
          </div>
        </div>
      );
    } else if (isSwap) {
      return (
        <div className="Exchange-info-row">
          <div className="Exchange-info-label">Available Liquidity</div>
          <div className="align-right al-swap">
            <Tooltip
              handle={`$${formatAmount(maxSwapAmountUsd, USD_DECIMALS, 2, true)}`}
              position="right-bottom"
              renderContent={() => {
                return (
                  <>
                    {`Max ${fromTokenInfo.symbol} in: `}
                    {formatAmount(maxFromTokenIn, fromTokenInfo.decimals, 0, true)} {fromTokenInfo.symbol} ($
                    {formatAmount(maxFromTokenInUSD, USD_DECIMALS, 0, true)})
                    <br />
                    <br />
                    {`Max ${toTokenInfo.symbol} out: `}
                    {formatAmount(maxToTokenOut, toTokenInfo.decimals, 0, true)} {toTokenInfo.symbol} ($
                    {formatAmount(maxToTokenOutUSD, USD_DECIMALS, 0, true)})
                    <br />
                  </>
                );
              }}
            />
          </div>
        </div>
      );
    } // else
    return null;
  };

  const fromBalance = fromTokenInfo ? fromTokenInfo.balance : bigNumberify(0);
  const toBalance = toTokenInfo ? toTokenInfo.balance : bigNumberify(0);

  const fromAmount = parseValue(fromValue, fromToken && fromToken.decimals);
  const toAmount = parseValue(toValue, toToken && toToken.decimals);

  const isPotentialWrap = (fromToken.isNative && toToken.isWrapped) || (fromToken.isWrapped && toToken.isNative);
  const isWrapOrUnwrap = isSwap && isPotentialWrap;
  const needApproval =
    fromTokenAddress !== AddressZero &&
    tokenAllowance &&
    fromAmount &&
    fromAmount.gt(tokenAllowance) &&
    !isWrapOrUnwrap;
  const prevFromTokenAddress = usePrevious(fromTokenAddress);
  const prevNeedApproval = usePrevious(needApproval);
  const prevToTokenAddress = usePrevious(toTokenAddress);

  const fromUsdMin = getUsd(fromAmount, fromTokenAddress, false, infoTokens);
  const toUsdMax = getUsd(toAmount, toTokenAddress, true, infoTokens, orderOption, triggerPriceUsd);

  const indexTokenAddress = toTokenAddress === AddressZero ? nativeTokenAddress : toTokenAddress;
  const collateralTokenAddress = isLong ? indexTokenAddress : shortCollateralAddress;
  const collateralToken = getToken(chainId, collateralTokenAddress);

  const [triggerRatioValue, setTriggerRatioValue] = useState("");

  const triggerRatioInverted = useMemo(() => {
    return isTriggerRatioInverted(fromTokenInfo, toTokenInfo);
  }, [toTokenInfo, fromTokenInfo]);

  const triggerRatio = useMemo(() => {
    if (!triggerRatioValue) {
      return bigNumberify(0);
    }
    let ratio = parseValue(triggerRatioValue, USD_DECIMALS);
    if (ratio.eq(0)) {
      return bigNumberify(0);
    }
    if (triggerRatioInverted) {
      ratio = PRECISION.mul(PRECISION).div(ratio);
    }
    return ratio;
  }, [triggerRatioValue, triggerRatioInverted]);

  const maxToTokenOut = useMemo(() => {
    const value = toTokenInfo.availableAmount?.gt(toTokenInfo.poolAmount?.sub(toTokenInfo.bufferAmount))
      ? toTokenInfo.poolAmount?.sub(toTokenInfo.bufferAmount)
      : toTokenInfo.availableAmount;

    if (!value) {
      return bigNumberify(0);
    }

    return value.gt(0) ? value : bigNumberify(0);
  }, [toTokenInfo]);

  const maxToTokenOutUSD = useMemo(() => {
    return getUsd(maxToTokenOut, toTokenAddress, false, infoTokens);
  }, [maxToTokenOut, toTokenAddress, infoTokens]);

  const maxFromTokenInUSD = useMemo(() => {
    const value = fromTokenInfo.maxUsdgAmount
      ?.sub(fromTokenInfo.usdgAmount)
      .mul(expandDecimals(1, USD_DECIMALS))
      .div(expandDecimals(1, USDG_DECIMALS));

    if (!value) {
      return bigNumberify(0);
    }

    return value.gt(0) ? value : bigNumberify(0);
  }, [fromTokenInfo]);

  const maxFromTokenIn = useMemo(() => {
    if (!fromTokenInfo.maxPrice) {
      return bigNumberify(0);
    }
    return maxFromTokenInUSD?.mul(expandDecimals(1, fromTokenInfo.decimals)).div(fromTokenInfo.maxPrice).toString();
  }, [maxFromTokenInUSD, fromTokenInfo]);

  let maxSwapAmountUsd = bigNumberify(0);

  if (maxToTokenOutUSD && maxFromTokenInUSD) {
    maxSwapAmountUsd = maxToTokenOutUSD.lt(maxFromTokenInUSD) ? maxToTokenOutUSD : maxFromTokenInUSD;
  }

  useEffect(() => {
    if (
      fromToken &&
      fromTokenAddress === prevFromTokenAddress &&
      !needApproval &&
      prevNeedApproval &&
      isWaitingForApproval
    ) {
      setIsWaitingForApproval(false);
      helperToast.success(<div>{fromToken.symbol} approved!</div>);
    }
  }, [
    fromTokenAddress,
    prevFromTokenAddress,
    needApproval,
    prevNeedApproval,
    setIsWaitingForApproval,
    fromToken.symbol,
    isWaitingForApproval,
    fromToken,
  ]);

  useEffect(() => {
    if (!toTokens.find((token) => token.address === toTokenAddress)) {
      // Only set toTokenAddress to ETH if the current token with toTokenAddress is not disabled
      if (isToTokenEnabled) {
        setToTokenAddress(swapOption, toTokens[0].address);
      }
    }
  }, [swapOption, tokens, toTokens, toTokenAddress, setToTokenAddress, isToTokenEnabled]);

  useEffect(() => {
    if (swapOption !== SHORT) {
      return;
    }
    if (toTokenAddress === prevToTokenAddress) {
      return;
    }
    for (let i = 0; i < stableTokens.length; i++) {
      const stableToken = stableTokens[i];
      const key = getPositionKey(account, stableToken.address, toTokenAddress, false, nativeTokenAddress);
      const position = positionsMap[key];
      if (position && position.size && position.size.gt(0)) {
        setShortCollateralAddress(position.collateralToken.address);
        return;
      }
    }
  }, [
    account,
    toTokenAddress,
    prevToTokenAddress,
    swapOption,
    positionsMap,
    stableTokens,
    nativeTokenAddress,
    shortCollateralAddress,
    setShortCollateralAddress,
  ]);

  useEffect(() => {
    const updateSwapAmounts = () => {
      if (anchorOnFromAmount) {
        if (!fromAmount) {
          setToValue("");
          return;
        }
        if (toToken) {
          const { amount: nextToAmount } = getNextToAmount(
            chainId,
            fromAmount,
            fromTokenAddress,
            toTokenAddress,
            infoTokens,
            undefined,
            !isMarketOrder && triggerRatio,
            usdgSupply,
            totalTokenWeights
          );

          const nextToValue = formatAmountFree(nextToAmount, toToken.decimals, toToken.decimals);
          setToValue(nextToValue);
        }
        return;
      }

      if (!toAmount) {
        setFromValue("");
        return;
      }
      if (fromToken) {
        const { amount: nextFromAmount } = getNextFromAmount(
          chainId,
          toAmount,
          fromTokenAddress,
          toTokenAddress,
          infoTokens,
          undefined,
          !isMarketOrder && triggerRatio,
          usdgSupply,
          totalTokenWeights
        );
        const nextFromValue = formatAmountFree(nextFromAmount, fromToken.decimals, fromToken.decimals);
        setFromValue(nextFromValue);
      }
    };

    const updateLeverageAmounts = () => {
      if (!hasLeverageOption) {
        return;
      }
      if (anchorOnFromAmount) {
        if (!fromAmount) {
          setToValue("");
          return;
        }

        const toTokenInfo = getTokenInfo(infoTokens, toTokenAddress);
        if (toTokenInfo && toTokenInfo.maxPrice && fromUsdMin && fromUsdMin.gt(0)) {
          const leverageMultiplier = parseInt(leverageOption * BASIS_POINTS_DIVISOR);
          const toTokenPriceUsd =
            !isMarketOrder && triggerPriceUsd && triggerPriceUsd.gt(0) ? triggerPriceUsd : toTokenInfo.maxPrice;

          const { feeBasisPoints } = getNextToAmount(
            chainId,
            fromAmount,
            fromTokenAddress,
            collateralTokenAddress,
            infoTokens,
            undefined,
            undefined,
            usdgSupply,
            totalTokenWeights
          );

          let fromUsdMinAfterFee = fromUsdMin;
          if (feeBasisPoints) {
            fromUsdMinAfterFee = fromUsdMin.mul(BASIS_POINTS_DIVISOR - feeBasisPoints).div(BASIS_POINTS_DIVISOR);
          }

          const toNumerator = fromUsdMinAfterFee.mul(leverageMultiplier).mul(BASIS_POINTS_DIVISOR);
          const toDenominator = bigNumberify(MARGIN_FEE_BASIS_POINTS)
            .mul(leverageMultiplier)
            .add(bigNumberify(BASIS_POINTS_DIVISOR).mul(BASIS_POINTS_DIVISOR));

          const nextToUsd = toNumerator.div(toDenominator);

          const nextToAmount = nextToUsd.mul(expandDecimals(1, toToken.decimals)).div(toTokenPriceUsd);

          const nextToValue = formatAmountFree(nextToAmount, toToken.decimals, toToken.decimals);

          setToValue(nextToValue);
        }
        return;
      }

      if (!toAmount) {
        setFromValue("");
        return;
      }

      const fromTokenInfo = getTokenInfo(infoTokens, fromTokenAddress);
      if (fromTokenInfo && fromTokenInfo.minPrice && toUsdMax && toUsdMax.gt(0)) {
        const leverageMultiplier = parseInt(leverageOption * BASIS_POINTS_DIVISOR);

        const baseFromAmountUsd = toUsdMax.mul(BASIS_POINTS_DIVISOR).div(leverageMultiplier);

        let fees = toUsdMax.mul(MARGIN_FEE_BASIS_POINTS).div(BASIS_POINTS_DIVISOR);

        const { feeBasisPoints } = getNextToAmount(
          chainId,
          fromAmount,
          fromTokenAddress,
          collateralTokenAddress,
          infoTokens,
          undefined,
          undefined,
          usdgSupply,
          totalTokenWeights
        );

        if (feeBasisPoints) {
          const swapFees = baseFromAmountUsd.mul(feeBasisPoints).div(BASIS_POINTS_DIVISOR);
          fees = fees.add(swapFees);
        }

        const nextFromUsd = baseFromAmountUsd.add(fees);

        const nextFromAmount = nextFromUsd.mul(expandDecimals(1, fromToken.decimals)).div(fromTokenInfo.minPrice);

        const nextFromValue = formatAmountFree(nextFromAmount, fromToken.decimals, fromToken.decimals);

        setFromValue(nextFromValue);
      }
    };

    if (isSwap) {
      updateSwapAmounts();
    }

    if (isLong || isShort) {
      updateLeverageAmounts();
    }
  }, [
    anchorOnFromAmount,
    fromAmount,
    toAmount,
    fromToken,
    toToken,
    fromTokenAddress,
    toTokenAddress,
    infoTokens,
    isSwap,
    isLong,
    isShort,
    leverageOption,
    fromUsdMin,
    toUsdMax,
    isMarketOrder,
    triggerPriceUsd,
    triggerRatio,
    hasLeverageOption,
    usdgSupply,
    totalTokenWeights,
    chainId,
    collateralTokenAddress,
    indexTokenAddress,
  ]);

  let entryMarkPrice;
  let exitMarkPrice;
  if (toTokenInfo) {
    entryMarkPrice = swapOption === LONG ? toTokenInfo.maxPrice : toTokenInfo.minPrice;
    exitMarkPrice = swapOption === LONG ? toTokenInfo.minPrice : toTokenInfo.maxPrice;
  }

  let leverage = bigNumberify(0);
  if (fromUsdMin && toUsdMax && fromUsdMin.gt(0)) {
    const fees = toUsdMax.mul(MARGIN_FEE_BASIS_POINTS).div(BASIS_POINTS_DIVISOR);
    if (fromUsdMin.sub(fees).gt(0)) {
      leverage = toUsdMax.mul(BASIS_POINTS_DIVISOR).div(fromUsdMin.sub(fees));
    }
  }

  let nextAveragePrice = isMarketOrder ? entryMarkPrice : triggerPriceUsd;
  if (hasExistingPosition) {
    let nextDelta, nextHasProfit;

    if (isMarketOrder) {
      nextDelta = existingPosition.delta;
      nextHasProfit = existingPosition.hasProfit;
    } else {
      const data = calculatePositionDelta(triggerPriceUsd || bigNumberify(0), existingPosition);
      nextDelta = data.delta;
      nextHasProfit = data.hasProfit;
    }

    nextAveragePrice = getNextAveragePrice({
      size: existingPosition.size,
      sizeDelta: toUsdMax,
      hasProfit: nextHasProfit,
      delta: nextDelta,
      nextPrice: isMarketOrder ? entryMarkPrice : triggerPriceUsd,
      isLong,
    });
  }

  const liquidationPrice = getLiquidationPrice({
    isLong,
    size: hasExistingPosition ? existingPosition.size : bigNumberify(0),
    collateral: hasExistingPosition ? existingPosition.collateral : bigNumberify(0),
    averagePrice: nextAveragePrice,
    entryFundingRate: hasExistingPosition ? existingPosition.entryFundingRate : bigNumberify(0),
    cumulativeFundingRate: hasExistingPosition ? existingPosition.cumulativeFundingRate : bigNumberify(0),
    sizeDelta: toUsdMax,
    collateralDelta: fromUsdMin,
    increaseCollateral: true,
    increaseSize: true,
  });

  const existingLiquidationPrice = existingPosition ? getLiquidationPrice(existingPosition) : undefined;
  let displayLiquidationPrice = liquidationPrice ? liquidationPrice : existingLiquidationPrice;

  if (hasExistingPosition) {
    const collateralDelta = fromUsdMin ? fromUsdMin : bigNumberify(0);
    const sizeDelta = toUsdMax ? toUsdMax : bigNumberify(0);
    leverage = getLeverage({
      size: existingPosition.size,
      sizeDelta,
      collateral: existingPosition.collateral,
      collateralDelta,
      increaseCollateral: true,
      entryFundingRate: existingPosition.entryFundingRate,
      cumulativeFundingRate: existingPosition.cumulativeFundingRate,
      increaseSize: true,
      hasProfit: existingPosition.hasProfit,
      delta: existingPosition.delta,
      includeDelta: savedIsPnlInLeverage,
    });
  } else if (hasLeverageOption) {
    leverage = bigNumberify(parseInt(leverageOption * BASIS_POINTS_DIVISOR));
  }

  const getSwapError = () => {
    const gasTokenInfo = getTokenInfo(infoTokens, ethers.constants.AddressZero);
    if (gasTokenInfo.balance?.eq(0)) {
      return ["Not enough ETH for gas"];
    }

    if (fromTokenAddress === toTokenAddress) {
      return ["Select different tokens"];
    }

    if (!isMarketOrder) {
      if ((toToken.isStable || toToken.isUsdg) && (fromToken.isStable || fromToken.isUsdg)) {
        return ["Select different tokens"];
      }

      if (fromToken.isNative && toToken.isWrapped) {
        return ["Select different tokens"];
      }

      if (toToken.isNative && fromToken.isWrapped) {
        return ["Select different tokens"];
      }
    }

    if (!fromAmount || fromAmount.eq(0)) {
      return ["Enter an amount"];
    }
    if (!toAmount || toAmount.eq(0)) {
      return ["Enter an amount"];
    }

    const fromTokenInfo = getTokenInfo(infoTokens, fromTokenAddress);
    if (!fromTokenInfo || !fromTokenInfo.minPrice) {
      return ["Incorrect network"];
    }
    if (fromTokenInfo && fromTokenInfo.balance && fromAmount && fromAmount.gt(fromTokenInfo.balance)) {
      return [`Insufficient ${fromTokenInfo.symbol} balance`];
    }

    const toTokenInfo = getTokenInfo(infoTokens, toTokenAddress);

    if (!isMarketOrder) {
      if (!triggerRatioValue || triggerRatio.eq(0)) {
        return ["Enter a price"];
      }

      const currentRate = getExchangeRate(fromTokenInfo, toTokenInfo);
      if (currentRate && currentRate.lt(triggerRatio)) {
        return [`Price ${triggerRatioInverted ? "below" : "above"} Mark Price`];
      }
    }

    if (
      !isWrapOrUnwrap &&
      toToken &&
      toTokenAddress !== USDG_ADDRESS &&
      toTokenInfo &&
      toTokenInfo.availableAmount &&
      toAmount.gt(toTokenInfo.availableAmount)
    ) {
      return ["Insufficient liquidity: exceeds available"];
    }
    if (
      !isWrapOrUnwrap &&
      toAmount &&
      toTokenInfo.bufferAmount &&
      toTokenInfo.poolAmount &&
      toTokenInfo.bufferAmount.gt(toTokenInfo.poolAmount.sub(toAmount))
    ) {
      return ["Insufficient liquidity: exceeds buffer"];
    }

    if (
      fromUsdMin &&
      fromTokenInfo.maxUsdgAmount &&
      fromTokenInfo.maxUsdgAmount.gt(0) &&
      fromTokenInfo.usdgAmount &&
      fromTokenInfo.maxPrice
    ) {
      const usdgFromAmount = adjustForDecimals(fromUsdMin, USD_DECIMALS, USDG_DECIMALS);
      const nextUsdgAmount = fromTokenInfo.usdgAmount.add(usdgFromAmount);

      if (nextUsdgAmount.gt(fromTokenInfo.maxUsdgAmount)) {
        return [`${fromTokenInfo.symbol} pool exceeded`];
      }
    }

    return [false];
  };

  const getLeverageError = useCallback(() => {
    const gasTokenInfo = getTokenInfo(infoTokens, ethers.constants.AddressZero);
    if (gasTokenInfo.balance?.eq(0)) {
      return ["Not enough ETH for gas"];
    }
    if (hasOutdatedUi) {
      return ["Page outdated, please refresh"];
    }
    if (!isToTokenEnabled) {
      return ["Token currently disabled"];
    }

    if (!toAmount || toAmount.eq(0)) {
      return ["Enter an amount"];
    }

    let toTokenInfo = getTokenInfo(infoTokens, toTokenAddress);
    if (toTokenInfo && toTokenInfo.isStable) {
      return [`${swapOption === LONG ? "Longing" : "Shorting"} ${toTokenInfo.symbol} not supported`];
    }

    const fromTokenInfo = getTokenInfo(infoTokens, fromTokenAddress);
    if (fromTokenInfo && fromTokenInfo.balance && fromAmount && fromAmount.gt(fromTokenInfo.balance)) {
      return [`Insufficient ${fromTokenInfo.symbol} balance`];
    }

    if (leverage && leverage.eq(0)) {
      return ["Enter an amount"];
    }
    if (!isMarketOrder && (!triggerPriceValue || triggerPriceUsd.eq(0))) {
      return ["Enter a price"];
    }

    if (!hasExistingPosition && fromUsdMin && fromUsdMin.lt(expandDecimals(10, USD_DECIMALS))) {
      return ["Min order: 10 USD"];
    }

    if (leverage && leverage.lt(1.1 * BASIS_POINTS_DIVISOR)) {
      return ["Min leverage: 1.1x"];
    }

    const maxLeverage = getMaxLeverage(toTokenInfo.symbol);
    if (leverage && leverage.gt(maxLeverage * BASIS_POINTS_DIVISOR)) {
      return [`Max leverage: ${maxLeverage}x`];
    }

    if (!isMarketOrder && entryMarkPrice && triggerPriceUsd) {
      if (isLong && entryMarkPrice.lt(triggerPriceUsd)) {
        return ["Price above Mark Price"];
      }
      if (!isLong && entryMarkPrice.gt(triggerPriceUsd)) {
        return ["Price below Mark Price"];
      }
    }

    if (isLong) {
      let requiredAmount = toAmount;
      if (fromTokenAddress !== toTokenAddress) {
        const { amount: swapAmount } = getNextToAmount(
          chainId,
          fromAmount,
          fromTokenAddress,
          toTokenAddress,
          infoTokens,
          undefined,
          undefined,
          usdgSupply,
          totalTokenWeights
        );
        requiredAmount = requiredAmount.add(swapAmount);

        if (toToken && toTokenAddress !== USDG_ADDRESS) {
          if (!toTokenInfo.availableAmount) {
            return ["Liquidity data not loaded"];
          }
          if (toTokenInfo.availableAmount && requiredAmount.gt(toTokenInfo.availableAmount)) {
            return ["Insufficient liquidity"];
          }
        }

        if (
          toTokenInfo.poolAmount &&
          toTokenInfo.bufferAmount &&
          toTokenInfo.bufferAmount.gt(toTokenInfo.poolAmount.sub(swapAmount))
        ) {
          return ["Insufficient liquidity", true, "BUFFER"];
        }

        if (
          fromUsdMin &&
          fromTokenInfo.maxUsdgAmount &&
          fromTokenInfo.maxUsdgAmount.gt(0) &&
          fromTokenInfo.minPrice &&
          fromTokenInfo.usdgAmount
        ) {
          const usdgFromAmount = adjustForDecimals(fromUsdMin, USD_DECIMALS, USDG_DECIMALS);
          const nextUsdgAmount = fromTokenInfo.usdgAmount.add(usdgFromAmount);
          if (nextUsdgAmount.gt(fromTokenInfo.maxUsdgAmount)) {
            return [`${fromTokenInfo.symbol} pool exceeded, try different token`, true, "MAX_USDG"];
          }
        }
        if (toTokenInfo && toTokenInfo.maxPrice) {
          const sizeUsd = toAmount.mul(toTokenInfo.maxPrice).div(expandDecimals(1, toTokenInfo.decimals));
          if (
            toTokenInfo.maxGlobalLongSize &&
            toTokenInfo.maxGlobalLongSize.gt(0) &&
            toTokenInfo.maxAvailableLong &&
            sizeUsd.gt(toTokenInfo.maxAvailableLong)
          ) {
            return [`Max ${toTokenInfo.symbol} long exceeded`];
          }
        }
      }
    }

    if (isShort) {
      let stableTokenAmount = bigNumberify(0);
      if (fromTokenAddress !== shortCollateralAddress && fromAmount && fromAmount.gt(0)) {
        const { amount: nextToAmount } = getNextToAmount(
          chainId,
          fromAmount,
          fromTokenAddress,
          shortCollateralAddress,
          infoTokens,
          undefined,
          undefined,
          usdgSupply,
          totalTokenWeights
        );
        stableTokenAmount = nextToAmount;
        if (stableTokenAmount.gt(shortCollateralToken.availableAmount)) {
          return [`Insufficient liquidity, change "Profits In"`];
        }

        if (
          shortCollateralToken.bufferAmount &&
          shortCollateralToken.poolAmount &&
          shortCollateralToken.bufferAmount.gt(shortCollateralToken.poolAmount.sub(stableTokenAmount))
        ) {
          // suggest swapping to collateralToken
          return [`Insufficient liquidity, change "Profits In"`, true, "BUFFER"];
        }

        if (
          fromTokenInfo.maxUsdgAmount &&
          fromTokenInfo.maxUsdgAmount.gt(0) &&
          fromTokenInfo.minPrice &&
          fromTokenInfo.usdgAmount
        ) {
          const usdgFromAmount = adjustForDecimals(fromUsdMin, USD_DECIMALS, USDG_DECIMALS);
          const nextUsdgAmount = fromTokenInfo.usdgAmount.add(usdgFromAmount);
          if (nextUsdgAmount.gt(fromTokenInfo.maxUsdgAmount)) {
            return [`${fromTokenInfo.symbol} pool exceeded, try different token`, true, "MAX_USDG"];
          }
        }
      }
      if (
        !shortCollateralToken ||
        !fromTokenInfo ||
        !toTokenInfo ||
        !toTokenInfo.maxPrice ||
        !shortCollateralToken.availableAmount
      ) {
        return ["Fetching token info..."];
      }

      const sizeUsd = toAmount.mul(toTokenInfo.maxPrice).div(expandDecimals(1, toTokenInfo.decimals));
      const sizeTokens = sizeUsd
        .mul(expandDecimals(1, shortCollateralToken.decimals))
        .div(shortCollateralToken.minPrice);

      if (!toTokenInfo.maxAvailableShort) {
        return ["Liquidity data not loaded"];
      }

      if (
        toTokenInfo.maxAvailableShort &&
        toTokenInfo.maxAvailableShort.gt(0) &&
        sizeUsd.gt(toTokenInfo.maxAvailableShort)
      ) {
        return [`Max ${toTokenInfo.symbol} short exceeded`];
      }

      stableTokenAmount = stableTokenAmount.add(sizeTokens);
      if (stableTokenAmount.gt(shortCollateralToken.availableAmount)) {
        return [`Insufficient liquidity, change "Profits In"`];
      }
    }

    return [false];
  }, [
    chainId,
    fromAmount,
    fromTokenAddress,
    fromUsdMin,
    hasExistingPosition,
    infoTokens,
    isLong,
    isMarketOrder,
    isShort,
    leverage,
    shortCollateralAddress,
    shortCollateralToken,
    swapOption,
    toAmount,
    toToken,
    toTokenAddress,
    totalTokenWeights,
    triggerPriceUsd,
    triggerPriceValue,
    usdgSupply,
    entryMarkPrice,
    hasOutdatedUi,
  ]);

  const getToLabel = () => {
    if (isSwap) {
      return "Receive";
    }
    if (isLong) {
      return "Long";
    }
    return "Short";
  };

  const getError = () => {
    if (isSwap) {
      return getSwapError();
    }
    return getLeverageError();
  };

  const renderOrdersToa = useCallback(() => {
    if (!ordersToaOpen) {
      return null;
    }

    return (
      <OrdersToa
        setIsVisible={setOrdersToaOpen}
        approveOrderBook={approveOrderBook}
        isPluginApproving={isPluginApproving}
      />
    );
  }, [ordersToaOpen, setOrdersToaOpen, isPluginApproving, approveOrderBook]);

  const renderErrorModal = useCallback(() => {
    const inputCurrency = fromToken.address === AddressZero ? "ETH" : fromToken.address;
    let outputCurrency;
    if (isLong) {
      outputCurrency = toToken.address === AddressZero ? "ETH" : toToken.address;
    } else {
      outputCurrency = shortCollateralToken.address;
    }
    let uniswapUrl = `https://app.uniswap.org/#/swap?inputCurrency=${inputCurrency}&outputCurrency=${outputCurrency}&chain=arbitrum`;
    const label =
      modalError === "BUFFER" ? `${shortCollateralToken.symbol} Required` : `${fromToken.symbol} Capacity Reached`;
    const swapTokenSymbol = isLong ? toToken.symbol : shortCollateralToken.symbol;
    return (
      <Modal isVisible={!!modalError} setIsVisible={setModalError} label={label} className="Error-modal">
        You will need to select {swapTokenSymbol} as the "Pay" token to initiate this trade.
        <br />
        <br />
        <a href={uniswapUrl} target="_blank" rel="noreferrer">
          Buy {swapTokenSymbol} on Uniswap
        </a>
      </Modal>
    );
  }, [
    modalError,
    setModalError,
    fromToken?.address,
    toToken?.address,
    shortCollateralToken?.address,
    isLong,
    shortCollateralToken?.symbol,
    toToken?.symbol,
    fromToken?.symbol,
  ]);

  const isPrimaryEnabled = () => {
    if (!active) {
      return true;
    }
    const [error, modal] = getError();
    if (error && !modal) {
      return false;
    }
    if (needOrderBookApproval && isWaitingForPluginApproval) {
      return false;
    }
    if ((needApproval && isWaitingForApproval) || isApproving) {
      return false;
    }
    if (needPositionRouterApproval && isWaitingForPositionRouterApproval) {
      return false;
    }
    if (isPositionRouterApproving) {
      return false;
    }
    if (isApproving) {
      return false;
    }
    if (isSubmitting) {
      return false;
    }

    return true;
  };

  const getPrimaryText = () => {
    if (!active) {
      return "Connect Wallet";
    }
    if (!isSupportedChain(chainId)) {
      return "Incorrect Network";
    }
    const [error, modal] = getError();
    if (error && !modal) {
      return error;
    }

    if (needPositionRouterApproval && isWaitingForPositionRouterApproval) {
      return "Enabling Leverage...";
    }
    if (isPositionRouterApproving) {
      return "Enabling Leverage...";
    }
    if (needPositionRouterApproval) {
      return "Enable Leverage";
    }

    if (needApproval && isWaitingForApproval) {
      return "Waiting for Approval";
    }
    if (isApproving) {
      return `Approving ${fromToken.symbol}...`;
    }
    if (needApproval) {
      return `Approve ${fromToken.symbol}`;
    }

    if (needOrderBookApproval && isWaitingForPluginApproval) {
      return "Enabling Orders...";
    }
    if (isPluginApproving) {
      return "Enabling Orders...";
    }
    if (needOrderBookApproval) {
      return "Enable Orders";
    }

    if (!isMarketOrder) return `Create ${orderOption.charAt(0) + orderOption.substring(1).toLowerCase()} Order`;

    if (isSwap) {
      if (toUsdMax && toUsdMax.lt(fromUsdMin.mul(95).div(100))) {
        return "High Slippage, Swap Anyway";
      }
      return "Swap";
    }

    if (isLong) {
      const indexTokenInfo = getTokenInfo(infoTokens, toTokenAddress);
      if (indexTokenInfo && indexTokenInfo.minPrice) {
        const { amount: nextToAmount } = getNextToAmount(
          chainId,
          fromAmount,
          fromTokenAddress,
          indexTokenAddress,
          infoTokens,
          undefined,
          undefined,
          usdgSupply,
          totalTokenWeights
        );
        const nextToAmountUsd = nextToAmount
          .mul(indexTokenInfo.minPrice)
          .div(expandDecimals(1, indexTokenInfo.decimals));
        if (fromTokenAddress === USDG_ADDRESS && nextToAmountUsd.lt(fromUsdMin.mul(98).div(100))) {
          return "High USDG Slippage, Long Anyway";
        }
      }
      return `Long ${toToken.symbol}`;
    }

    return `Short ${toToken.symbol}`;
  };

  const onSelectFromToken = (token) => {
    setFromTokenAddress(swapOption, token.address);
    setIsWaitingForApproval(false);

    if (isShort && token.isStable) {
      setShortCollateralAddress(token.address);
    }
  };

  const onSelectShortCollateralAddress = (token) => {
    setShortCollateralAddress(token.address);
  };

  const onSelectToToken = (token) => {
    setToTokenAddress(swapOption, token.address);
  };

  const onFromValueChange = (e) => {
    setAnchorOnFromAmount(true);
    setFromValue(e.target.value);
  };

  const onToValueChange = (e) => {
    setAnchorOnFromAmount(false);
    setToValue(e.target.value);
  };

  const switchTokens = () => {
    if (fromAmount && toAmount) {
      if (anchorOnFromAmount) {
        setToValue(formatAmountFree(fromAmount, fromToken.decimals, 8));
      } else {
        setFromValue(formatAmountFree(toAmount, toToken.decimals, 8));
      }
      setAnchorOnFromAmount(!anchorOnFromAmount);
    }
    setIsWaitingForApproval(false);

    const updatedTokenSelection = JSON.parse(JSON.stringify(tokenSelection));
    updatedTokenSelection[swapOption] = {
      from: toTokenAddress,
      to: fromTokenAddress,
    };
    setTokenSelection(updatedTokenSelection);
  };

  const wrap = async () => {
    setIsSubmitting(true);

    const contract = new ethers.Contract(nativeTokenAddress, WETH.abi, library.getSigner());
    Api.callContract(chainId, contract, "deposit", {
      value: fromAmount,
      sentMsg: "Swap submitted.",
      successMsg: `Swapped ${formatAmount(fromAmount, fromToken.decimals, 4, true)} ${
        fromToken.symbol
      } for ${formatAmount(toAmount, toToken.decimals, 4, true)} ${toToken.symbol}!`,
      failMsg: "Swap failed.",
      setPendingTxns,
    })
      .then(async (res) => {})
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const unwrap = async () => {
    setIsSubmitting(true);

    const contract = new ethers.Contract(nativeTokenAddress, WETH.abi, library.getSigner());
    Api.callContract(chainId, contract, "withdraw", [fromAmount], {
      sentMsg: "Swap submitted!",
      failMsg: "Swap failed.",
      successMsg: `Swapped ${formatAmount(fromAmount, fromToken.decimals, 4, true)} ${
        fromToken.symbol
      } for ${formatAmount(toAmount, toToken.decimals, 4, true)} ${toToken.symbol}!`,
      setPendingTxns,
    })
      .then(async (res) => {})
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const swap = async () => {
    if (fromToken.isNative && toToken.isWrapped) {
      wrap();
      return;
    }

    if (fromTokenAddress.isWrapped && toToken.isNative) {
      unwrap();
      return;
    }

    setIsSubmitting(true);
    let path = [fromTokenAddress, toTokenAddress];
    if (anchorOnFromAmount) {
      const { path: multiPath } = getNextToAmount(
        chainId,
        fromAmount,
        fromTokenAddress,
        toTokenAddress,
        infoTokens,
        undefined,
        undefined,
        usdgSupply,
        totalTokenWeights
      );
      if (multiPath) {
        path = multiPath;
      }
    } else {
      const { path: multiPath } = getNextFromAmount(
        chainId,
        toAmount,
        fromTokenAddress,
        toTokenAddress,
        infoTokens,
        undefined,
        undefined,
        usdgSupply,
        totalTokenWeights
      );
      if (multiPath) {
        path = multiPath;
      }
    }

    let method;
    let contract;
    let value;
    let params;
    let minOut;
    if (shouldRaiseGasError(getTokenInfo(infoTokens, fromTokenAddress), fromAmount)) {
      setIsSubmitting(false);
      setIsPendingConfirmation(true);
      helperToast.error(
        `Leave at least ${formatAmount(DUST_BNB, 18, 3)} ${getConstant(chainId, "nativeTokenSymbol")} for gas`
      );
      return;
    }

    if (!isMarketOrder) {
      minOut = toAmount;
      Api.createSwapOrder(chainId, library, path, fromAmount, minOut, triggerRatio, nativeTokenAddress, {
        sentMsg: "Swap Order submitted!",
        successMsg: "Swap Order created!",
        failMsg: "Swap Order creation failed.",
        pendingTxns,
        setPendingTxns,
      })
        .then(() => {
          trackTrade(3, "Swap");
          setIsConfirming(false);
        })
        .finally(() => {
          setIsSubmitting(false);
          setIsPendingConfirmation(false);
        });
      return;
    }

    path = replaceNativeTokenAddress(path, nativeTokenAddress);
    method = "swap";
    value = bigNumberify(0);
    if (toTokenAddress === AddressZero) {
      method = "swapTokensToETH";
    }

    minOut = toAmount.mul(BASIS_POINTS_DIVISOR - allowedSlippage).div(BASIS_POINTS_DIVISOR);
    params = [path, fromAmount, minOut, account];
    if (fromTokenAddress === AddressZero) {
      method = "swapETHToTokens";
      value = fromAmount;
      params = [path, minOut, account];
    }
    contract = new ethers.Contract(routerAddress, Router.abi, library.getSigner());

    Api.callContract(chainId, contract, method, params, {
      value,
      sentMsg: `Swap ${!isMarketOrder ? " order " : ""} submitted!`,
      successMsg: `Swapped ${formatAmount(fromAmount, fromToken.decimals, 4, true)} ${
        fromToken.symbol
      } for ${formatAmount(toAmount, toToken.decimals, 4, true)} ${toToken.symbol}!`,
      failMsg: "Swap failed.",
      setPendingTxns,
    })
      .then(async () => {
        trackTrade(3, "Swap");
        setIsConfirming(false);
      })
      .finally(() => {
        setIsSubmitting(false);
        setIsPendingConfirmation(false);
      });
  };

  const createIncreaseOrder = () => {
    let path = [fromTokenAddress];

    if (path[0] === USDG_ADDRESS) {
      if (isLong) {
        const stableToken = getMostAbundantStableToken(chainId, infoTokens);
        path.push(stableToken.address);
      } else {
        path.push(shortCollateralAddress);
      }
    }

    const minOut = 0;
    const indexToken = getToken(chainId, indexTokenAddress);
    const successMsg = `
      Created limit order for ${indexToken.symbol} ${isLong ? "Long" : "Short"}: ${formatAmount(
      toUsdMax,
      USD_DECIMALS,
      2
    )} USD!
    `;
    return Api.createIncreaseOrder(
      chainId,
      library,
      nativeTokenAddress,
      path,
      fromAmount,
      indexTokenAddress,
      minOut,
      toUsdMax,
      collateralTokenAddress,
      isLong,
      triggerPriceUsd,
      {
        pendingTxns,
        setPendingTxns,
        sentMsg: "Limit order submitted!",
        successMsg,
        failMsg: "Limit order creation failed.",
      }
    )
      .then(() => {
        trackTrade(3, "Limit");
        setIsConfirming(false);
      })
      .finally(() => {
        setIsSubmitting(false);
        setIsPendingConfirmation(false);
      });
  };

  let referralCode = ethers.constants.HashZero;
  if (isHashZero(userReferralCode) && userReferralCodeInLocalStorage) {
    referralCode = userReferralCodeInLocalStorage;
  }

  const increasePosition = async () => {
    setIsSubmitting(true);
    const tokenAddress0 = fromTokenAddress === AddressZero ? nativeTokenAddress : fromTokenAddress;
    const indexTokenAddress = toTokenAddress === AddressZero ? nativeTokenAddress : toTokenAddress;
    let path = [indexTokenAddress]; // assume long
    if (toTokenAddress !== fromTokenAddress) {
      path = [tokenAddress0, indexTokenAddress];
    }

    if (fromTokenAddress === AddressZero && toTokenAddress === nativeTokenAddress) {
      path = [nativeTokenAddress];
    }

    if (fromTokenAddress === nativeTokenAddress && toTokenAddress === AddressZero) {
      path = [nativeTokenAddress];
    }

    if (isShort) {
      path = [shortCollateralAddress];
      if (tokenAddress0 !== shortCollateralAddress) {
        path = [tokenAddress0, shortCollateralAddress];
      }
    }

    const refPrice = isLong ? toTokenInfo.maxPrice : toTokenInfo.minPrice;
    const priceBasisPoints = isLong ? BASIS_POINTS_DIVISOR + allowedSlippage : BASIS_POINTS_DIVISOR - allowedSlippage;
    const priceLimit = refPrice.mul(priceBasisPoints).div(BASIS_POINTS_DIVISOR);

    const boundedFromAmount = fromAmount ? fromAmount : bigNumberify(0);

    if (fromAmount && fromAmount.gt(0) && fromTokenAddress === USDG_ADDRESS && isLong) {
      const { amount: nextToAmount, path: multiPath } = getNextToAmount(
        chainId,
        fromAmount,
        fromTokenAddress,
        indexTokenAddress,
        infoTokens,
        undefined,
        undefined,
        usdgSupply,
        totalTokenWeights
      );
      if (nextToAmount.eq(0)) {
        helperToast.error("Insufficient liquidity");
        return;
      }
      if (multiPath) {
        path = replaceNativeTokenAddress(multiPath);
      }
    }

    let params = [
      path, // _path
      indexTokenAddress, // _indexToken
      boundedFromAmount, // _amountIn
      0, // _minOut
      toUsdMax, // _sizeDelta
      isLong, // _isLong
      priceLimit, // _acceptablePrice
      minExecutionFee, // _executionFee
      referralCode, // _referralCode
    ];

    let method = "createIncreasePosition";
    let value = minExecutionFee;
    if (fromTokenAddress === AddressZero) {
      method = "createIncreasePositionETH";
      value = boundedFromAmount.add(minExecutionFee);
      params = [
        path, // _path
        indexTokenAddress, // _indexToken
        0, // _minOut
        toUsdMax, // _sizeDelta
        isLong, // _isLong
        priceLimit, // _acceptablePrice
        minExecutionFee, // _executionFee
        referralCode, // _referralCode
      ];
    }

    if (shouldRaiseGasError(getTokenInfo(infoTokens, fromTokenAddress), fromAmount)) {
      setIsSubmitting(false);
      setIsPendingConfirmation(false);
      helperToast.error(
        `Leave at least ${formatAmount(DUST_BNB, 18, 3)} ${getConstant(chainId, "nativeTokenSymbol")} for gas`
      );
      return;
    }

    const contractAddress = getContract(chainId, "PositionRouter");
    const contract = new ethers.Contract(contractAddress, PositionRouter.abi, library.getSigner());
    const indexToken = getTokenInfo(infoTokens, indexTokenAddress);
    const tokenSymbol = indexToken.isWrapped ? getConstant(chainId, "nativeTokenSymbol") : indexToken.symbol;
    const successMsg = `Requested increase of ${tokenSymbol} ${isLong ? "Long" : "Short"} by ${formatAmount(
      toUsdMax,
      USD_DECIMALS,
      2
    )} USD.`;

    Api.callContract(chainId, contract, method, params, {
      value,
      setPendingTxns,
      sentMsg: `${isLong ? "Long" : "Short"} submitted.`,
      failMsg: `${isLong ? "Long" : "Short"} failed.`,
      successMsg,
    })
      .then(async () => {
        trackTrade(3, `${isLong ? "Long" : "Short"}`);
        setIsConfirming(false);

        const key = getPositionKey(account, path[path.length - 1], indexTokenAddress, isLong);
        let nextSize = toUsdMax;
        if (hasExistingPosition) {
          nextSize = existingPosition.size.add(toUsdMax);
        }

        pendingPositions[key] = {
          updatedAt: Date.now(),
          pendingChanges: {
            size: nextSize,
          },
        };

        setPendingPositions({ ...pendingPositions });
      })
      .finally(() => {
        setIsSubmitting(false);
        setIsPendingConfirmation(false);
      });
  };

  const INCREASE_POSITION = 0;
  const DECREASE_ORDER = 2;
  const orderExecutionFee = getConstant(chainId, "DECREASE_ORDER_EXECUTION_GAS_FEE");

  const createIncreasePositionWithOrders = async () => {
    setIsSubmitting(true);

    const actions = [];
    const args = [];
    const values = [];

    // Increase Position Params
    const tokenAddress0 = fromTokenAddress === AddressZero ? nativeTokenAddress : fromTokenAddress;
    const indexTokenAddress = toTokenAddress === AddressZero ? nativeTokenAddress : toTokenAddress;
    let path = [indexTokenAddress]; // assume long
    if (toTokenAddress !== fromTokenAddress) {
      path = [tokenAddress0, indexTokenAddress];
    }

    if (fromTokenAddress === AddressZero && toTokenAddress === nativeTokenAddress) {
      path = [nativeTokenAddress];
    }

    if (fromTokenAddress === nativeTokenAddress && toTokenAddress === AddressZero) {
      path = [nativeTokenAddress];
    }

    if (isShort) {
      path = [shortCollateralAddress];
      if (tokenAddress0 !== shortCollateralAddress) {
        path = [tokenAddress0, shortCollateralAddress];
      }
    }

    const refPrice = isLong ? toTokenInfo.maxPrice : toTokenInfo.minPrice;
    const priceBasisPoints = isLong ? BASIS_POINTS_DIVISOR + allowedSlippage : BASIS_POINTS_DIVISOR - allowedSlippage;
    const priceLimit = refPrice.mul(priceBasisPoints).div(BASIS_POINTS_DIVISOR);

    const boundedFromAmount = fromAmount ? fromAmount : bigNumberify(0);

    if (fromAmount && fromAmount.gt(0) && fromTokenAddress === USDG_ADDRESS && isLong) {
      const { amount: nextToAmount, path: multiPath } = getNextToAmount(
        chainId,
        fromAmount,
        fromTokenAddress,
        indexTokenAddress,
        infoTokens,
        undefined,
        undefined,
        usdgSupply,
        totalTokenWeights
      );
      if (nextToAmount.eq(0)) {
        helperToast.error("Insufficient liquidity");
        return;
      }
      if (multiPath) {
        path = replaceNativeTokenAddress(multiPath);
      }
    }

    const usingETH = fromTokenAddress === AddressZero;
    const abiCoder = new ethers.utils.AbiCoder();

    const encodedIncreasePositionArgs = abiCoder.encode(
      ["address[]", "address", "uint256", "uint256", "uint256", "bool", "uint256", "uint256", "bytes32", "bool"],
      [
        path, // _path
        indexTokenAddress, // _indexToken
        boundedFromAmount, // _amountIn
        0, // _minOut
        toUsdMax, // _sizeDelta
        isLong, // _isLong
        priceLimit, // _acceptablePrice
        minExecutionFee, // _executionFee
        referralCode, // _referralCode
        usingETH, // _wrap
      ]
    );

    actions.push(INCREASE_POSITION);
    args.push(encodedIncreasePositionArgs);
    if (usingETH) {
      values.push(boundedFromAmount.add(minExecutionFee));
    } else {
      values.push(minExecutionFee);
    }

    if (shouldRaiseGasError(getTokenInfo(infoTokens, fromTokenAddress), fromAmount)) {
      setIsSubmitting(false);
      setIsPendingConfirmation(false);
      helperToast.error(
        `Leave at least ${formatAmount(DUST_BNB, 18, 3)} ${getConstant(chainId, "nativeTokenSymbol")} for gas`
      );
      return;
    }

    if (stopLossTriggerPercent) {
      actions.push(DECREASE_ORDER);
      const encodedStopLossArgs = abiCoder.encode(
        ["address", "uint256", "address", "uint256", "bool", "uint256", "bool"],
        [
          indexTokenAddress, // _indexToken
          toUsdMax, // _sizeDelta
          isLong ? indexTokenAddress : shortCollateralAddress, // _collateralToken
          0, // _collateralDelta
          isLong, // _isLong
          stopLossTriggerPrice, // _triggerPrice
          !isLong, // _triggerAboveThreshold
        ]
      );
      args.push(encodedStopLossArgs);
      values.push(orderExecutionFee);
    }

    if (takeProfitTriggerPercent) {
      actions.push(DECREASE_ORDER);
      const encodedTakeProfitArgs = abiCoder.encode(
        ["address", "uint256", "address", "uint256", "bool", "uint256", "bool"],
        [
          indexTokenAddress, // _indexToken
          toUsdMax, // _sizeDelta
          isLong ? indexTokenAddress : shortCollateralAddress, // _collateralToken
          0, // _collateralDelta
          isLong, // _isLong
          takeProfitTriggerPrice, // _triggerPrice
          isLong, // _triggerAboveThreshold
        ]
      );
      args.push(encodedTakeProfitArgs);
      values.push(orderExecutionFee);
    }

    const contractAddress = getContract(chainId, "PositionCreator");
    const contract = new ethers.Contract(contractAddress, PositionCreator.abi, library.getSigner());
    const indexToken = getTokenInfo(infoTokens, indexTokenAddress);
    const tokenSymbol = indexToken.isWrapped ? getConstant(chainId, "nativeTokenSymbol") : indexToken.symbol;
    let successMsg = `Requested increase of ${tokenSymbol} ${isLong ? "Long" : "Short"} by ${formatAmount(
      toUsdMax,
      USD_DECIMALS,
      2
    )} USD`;
    if (stopLossTriggerPercent && takeProfitTriggerPercent) {
      successMsg += ` with stop loss and take profit orders`;
    } else if (stopLossTriggerPercent) {
      successMsg += ` with stop loss order`;
    } else if (takeProfitTriggerPercent) {
      successMsg += ` with take profit order`;
    }

    console.log("contractAddress", contractAddress);
    console.log("contract", contract);

    await Api.callContract(chainId, contract, "executeMultiple", [actions, args, values], {
      value: values.reduce((a, b) => a.add(b), bigNumberify(0)),
      setPendingTxns,
      sentMsg: `Actions submitted.`,
      failMsg: `Actions failed.`,
      successMsg,
    });

    trackTrade(3, `${isLong ? "Long" : "Short"}`);
    setIsConfirming(false);

    const key = getPositionKey(account, path[path.length - 1], indexTokenAddress, isLong);
    let nextSize = toUsdMax;
    if (hasExistingPosition) {
      nextSize = existingPosition.size.add(toUsdMax);
    }

    pendingPositions[key] = {
      updatedAt: Date.now(),
      pendingChanges: {
        size: nextSize,
      },
    };

    setPendingPositions({ ...pendingPositions });

    setIsSubmitting(false);
    setIsPendingConfirmation(false);
  };

  const onSwapOptionChange = (opt) => {
    setSwapOption(opt);
    setAnchorOnFromAmount(true);
    setFromValue("");
    setToValue("");
    setTriggerPriceValue("");
    setTriggerRatioValue("");

    if (opt === SHORT && infoTokens) {
      const fromToken = getToken(chainId, tokenSelection[opt].from);
      if (fromToken && fromToken.isStable) {
        setShortCollateralAddress(fromToken.address);
      } else {
        const stableToken = getMostAbundantStableToken(chainId, infoTokens);
        setShortCollateralAddress(stableToken.address);
      }
    }

    trackAction &&
      trackAction("Swap option changed", {
        option: opt,
      });
  };

  const onConfirmationClick = () => {
    if (!active) {
      props.connectWallet();
      return;
    }

    if (needOrderBookApproval) {
      approveOrderBook();
      return;
    }

    setIsPendingConfirmation(true);

    if (isSwap) {
      swap();
      return;
    }

    if (orderOption === LIMIT) {
      createIncreaseOrder();
      return;
    }

    if (takeProfitTriggerPercent || stopLossTriggerPercent) {
      createIncreasePositionWithOrders();
      return;
    }

    increasePosition();
  };

  function approveFromToken() {
    approveTokens({
      setIsApproving,
      library,
      tokenAddress: fromToken.address,
      spender: routerAddress,
      chainId: chainId,
      onApproveSubmitted: () => {
        setIsWaitingForApproval(true);
      },
      infoTokens,
      getTokenInfo,
      pendingTxns,
      setPendingTxns,
    });
  }

  const onClickPrimary = () => {
    if (!active) {
      props.connectWallet();
      return;
    }

    if (needPositionRouterApproval) {
      approvePositionRouter({
        sentMsg: "Enable leverage sent.",
        failMsg: "Enable leverage failed.",
      });
      return;
    }

    if (needApproval) {
      approveFromToken();
      return;
    }

    if (needOrderBookApproval) {
      setOrdersToaOpen(true);
      return;
    }

    const [, modal, errorCode] = getError();

    if (modal) {
      setModalError(errorCode);
      return;
    }

    if (isSwap) {
      if (fromTokenAddress === AddressZero && toTokenAddress === nativeTokenAddress) {
        wrap();
        return;
      }

      if (fromTokenAddress === nativeTokenAddress && toTokenAddress === AddressZero) {
        unwrap();
        return;
      }
    }

    setIsConfirming(true);
    setIsHigherSlippageAllowed(false);
  };

  const showFromAndToSection = orderOption !== STOP;
  const showSizeSection = orderOption === STOP;
  const showTriggerPriceSection = !isSwap && !isMarketOrder;
  const showTriggerRatioSection = isSwap && !isMarketOrder;
  const showMultiTriggerMaker = !isSwap && isMarketOrder;

  let fees;
  let feesUsd;
  let feeBps;
  let swapFees;
  let positionFee;
  if (isSwap) {
    if (fromAmount) {
      const { feeBasisPoints } = getNextToAmount(
        chainId,
        fromAmount,
        fromTokenAddress,
        toTokenAddress,
        infoTokens,
        undefined,
        undefined,
        usdgSupply,
        totalTokenWeights
      );
      if (feeBasisPoints !== undefined) {
        fees = fromAmount.mul(feeBasisPoints).div(BASIS_POINTS_DIVISOR);
        const feeTokenPrice =
          fromTokenInfo.address === USDG_ADDRESS ? expandDecimals(1, USD_DECIMALS) : fromTokenInfo.maxPrice;
        feesUsd = fees.mul(feeTokenPrice).div(expandDecimals(1, fromTokenInfo.decimals));
      }
      feeBps = feeBasisPoints;
    }
  } else if (toUsdMax) {
    positionFee = toUsdMax.mul(MARGIN_FEE_BASIS_POINTS).div(BASIS_POINTS_DIVISOR);
    feesUsd = positionFee;

    const { feeBasisPoints } = getNextToAmount(
      chainId,
      fromAmount,
      fromTokenAddress,
      collateralTokenAddress,
      infoTokens,
      undefined,
      undefined,
      usdgSupply,
      totalTokenWeights
    );
    if (feeBasisPoints) {
      swapFees = fromUsdMin.mul(feeBasisPoints).div(BASIS_POINTS_DIVISOR);
      feesUsd = feesUsd.add(swapFees);
    }
    feeBps = feeBasisPoints;
  }

  if (!fromToken || !toToken) {
    return null;
  }

  let hasZeroBorrowFee = false;
  let borrowFeeText;
  if (isLong && toTokenInfo && toTokenInfo.fundingRate) {
    borrowFeeText = formatAmount(toTokenInfo.fundingRate, 4, 4) + "% / 1h";
    if (toTokenInfo.fundingRate.eq(0)) {
      // hasZeroBorrowFee = true
    }
  }
  if (isShort && shortCollateralToken && shortCollateralToken.fundingRate) {
    borrowFeeText = formatAmount(shortCollateralToken.fundingRate, 4, 4) + "% / 1h";
    if (shortCollateralToken.fundingRate.eq(0)) {
      // hasZeroBorrowFee = true
    }
  }

  function setFromValueToMaximumAvailable() {
    if (!fromToken || !fromBalance) {
      return;
    }

    const maxAvailableAmount = fromToken.isNative ? fromBalance.sub(bigNumberify(DUST_BNB).mul(2)) : fromBalance;
    setFromValue(formatAmountFree(maxAvailableAmount, fromToken.decimals, fromToken.decimals));
    setAnchorOnFromAmount(true);
  }

  function shouldShowMaxButton() {
    if (!fromToken || !fromBalance) {
      return false;
    }
    const maxAvailableAmount = fromToken.isNative ? fromBalance.sub(bigNumberify(DUST_BNB).mul(2)) : fromBalance;
    return fromValue !== formatAmountFree(maxAvailableAmount, fromToken.decimals, fromToken.decimals);
  }

  const determineLiquidationPrice = () => {
    switch (true) {
      case !!existingLiquidationPrice:
        return formatAmount(existingLiquidationPrice, USD_DECIMALS, 2, false);
      case !!displayLiquidationPrice:
        return formatAmount(displayLiquidationPrice, USD_DECIMALS, 2, false);
      default:
        return 0;
    }
  };

  const determineBorrowFee = () => {
    let borrowFee = 0;
    switch (true) {
      case isLong && toTokenInfo:
        borrowFee = parseFloat(formatAmount(toTokenInfo.fundingRate, 4, 4));
        break;
      case isShort && shortCollateralToken:
        borrowFee = parseFloat(formatAmount(shortCollateralToken.fundingRate, 4, 4));
        break;
      default:
        borrowFee = 0;
        break;
    }
    if (
      (isLong && toTokenInfo && toTokenInfo.fundingRate) ||
      (isShort && shortCollateralToken && shortCollateralToken.fundingRate)
    ) {
      return `${borrowFee}% / 1h`;
    } else {
      return borrowFee;
    }
  };

  const trackTrade = (stage, tradeType) => {
    let stageName = "";
    switch (stage) {
      case 1:
        stageName = "Approve";
        break;
      case 2:
        stageName = "Pre-confirmation";
        break;
      case 3:
        stageName = "Post-confirmation";
        break;
      default:
        stageName = "Approve";
        break;
    }

    const actionName = `${stageName}`;

    try {
      const fromToken = getToken(chainId, fromTokenAddress);
      const toToken = getToken(chainId, toTokenAddress);
      const leverage = (isLong || isShort) && hasLeverageOption && parseFloat(leverageOption).toFixed(2);
      const market = swapOption !== "Swap" ? `${toToken.symbol}/USD` : "No market - swap"; //No market for Swap
      const collateralAfterFees = feesUsd ? fromUsdMin.sub(feesUsd) : 0; //No collateral for Swap
      const spread = getSpread(fromTokenInfo, toTokenInfo, isLong, nativeTokenAddress);
      const entryPrice =
        isLong || isShort ? formatAmount(entryMarkPrice, USD_DECIMALS, 2, false) : "No entry price - swap";
      let liqPrice = parseFloat(determineLiquidationPrice());
      liqPrice = liqPrice < 0 ? 0 : liqPrice;

      // Format user ERC20 token balances from BigNumber to float
      const [userBalances, tokenPrices, poolBalances] = getUserTokenBalances(infoTokens);

      const traits = {
        actionType: "Create",
        transactionType: "Buy",
        tradeType: tradeType,
        position: swapOption,
        market: market,
        tokenToPay: fromToken.symbol,
        tokenToReceive: toToken.symbol,
        amountToPay: parseFloat(fromValue),
        amountToReceive: parseFloat(toValue),
        fromCurrencyBalance: parseFloat(formatAmount(fromBalance, fromToken.decimals, 4, false)),
        fromCurrencyToken: fromToken.symbol,
        leverage: parseFloat(leverage),
        feesUsd: parseFloat(formatAmount(feesUsd, 4, 4, false)),
        feesUsdFormatted: parseFloat(formatAmount(feesUsd, 4, 4, false)?.toFixed(2)) || undefined,
        [`fees${fromToken.symbol}`]: parseFloat(formatAmount(fees, fromToken.decimals, 4, false)),
        walletAddress: account,
        network: NETWORK_NAME[chainId],
        profitsIn: toToken.symbol,
        liqPrice: liqPrice,
        collateralUsd: `${parseFloat(formatAmount(collateralAfterFees, USD_DECIMALS, 2, false))}`,
        spreadIsHigh: spread.isHigh,
        spreadValue: parseFloat(formatAmount(spread.value, 4, 4, true)),
        entryPrice: parseFloat(entryPrice),
        borrowFee: determineBorrowFee(),
        allowedSlippage: parseFloat(formatAmount(allowedSlippage, 2, 2)),
        upToOnePercentSlippageEnabled: isHigherSlippageAllowed,
        ...userBalances,
        ...tokenPrices,
        ...poolBalances,
      };
      trackAction && trackAction(actionName, traits);
    } catch (err) {
      console.error(`Unable to track ${actionName} event`, err);
    }
  };

  const preventStrangeNumberInputs = (e) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="Exchange-swap-box">
      {/* <div className="Exchange-swap-wallet-box App-box">
        {active && <div className="Exchange-swap-account" >
        </div>}
      </div> */}
      <div className="Exchange-swap-box-inner App-box-highlight">
        <div>
          <Tab
            icons={SWAP_ICONS}
            options={SWAP_OPTIONS}
            option={swapOption}
            onChange={onSwapOptionChange}
            className="Exchange-swap-option-tabs"
          />
          {flagOrdersEnabled && (
            <Tab
              options={orderOptions}
              className="Exchange-swap-order-type-tabs"
              type="inline"
              option={orderOption}
              onChange={onOrderOptionChange}
              newItem={LIMIT}
            />
          )}
        </div>
        {showFromAndToSection && (
          <React.Fragment>
            <div className="Exchange-swap-section">
              <div className="Exchange-swap-section-top">
                <div className="muted">
                  {fromUsdMin && (
                    <div className="Exchange-swap-usd">Pay: {formatAmount(fromUsdMin, USD_DECIMALS, 2, true)} USD</div>
                  )}
                  {!fromUsdMin && "Pay"}
                </div>
                {fromBalance && (
                  <div className="muted align-right clickable" onClick={setFromValueToMaximumAvailable}>
                    Balance: {formatAmount(fromBalance, fromToken.decimals, 4, true)}
                  </div>
                )}
              </div>
              <div className="Exchange-swap-section-bottom">
                <div className="Exchange-swap-input-container">
                  <input
                    type="number"
                    min="0"
                    placeholder="0.0"
                    className="Exchange-swap-input"
                    value={fromValue}
                    onChange={onFromValueChange}
                    onKeyDown={preventStrangeNumberInputs}
                  />
                  {shouldShowMaxButton() && (
                    <div
                      className="Exchange-swap-max"
                      onClick={() => {
                        setFromValueToMaximumAvailable();
                        trackAction &&
                          trackAction("Button clicked", {
                            buttonName: "Max amount",
                          });
                      }}
                    >
                      MAX
                    </div>
                  )}
                </div>
                <div>
                  <TokenSelector
                    label="Pay"
                    chainId={chainId}
                    tokenAddress={fromTokenAddress}
                    onSelectToken={onSelectFromToken}
                    tokens={[]}
                    infoTokens={infoTokens}
                    showMintingCap={false}
                    showTokenImgInDropdown={true}
                    trackAction={trackAction}
                  />
                </div>
              </div>
            </div>
            <div className="Exchange-swap-ball-container">
              <div
                className={cx("Exchange-swap-ball", {
                  disabled: !isToTokenEnabled,
                })}
                onClick={() => isToTokenEnabled && switchTokens()}
              >
                <IoMdSwap className="Exchange-swap-ball-icon" />
              </div>
            </div>
            <div className="Exchange-swap-section">
              <div className="Exchange-swap-section-top">
                <div className="muted">
                  {toUsdMax && (
                    <div className="Exchange-swap-usd">
                      {getToLabel()}: {formatAmount(toUsdMax, USD_DECIMALS, 2, true)} USD
                    </div>
                  )}
                  {!toUsdMax && getToLabel()}
                </div>
                {toBalance && isSwap && (
                  <div className="muted align-right">Balance: {formatAmount(toBalance, toToken.decimals, 4, true)}</div>
                )}
                {(isLong || isShort) && hasLeverageOption && (
                  <div className="muted align-right">Leverage: {parseFloat(leverageOption).toFixed(2)}x</div>
                )}
              </div>
              <div className="Exchange-swap-section-bottom">
                <div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.0"
                    className="Exchange-swap-input"
                    value={toValue}
                    onChange={onToValueChange}
                    onKeyDown={preventStrangeNumberInputs}
                  />
                </div>
                <div>
                  <TokenSelector
                    label={getTokenLabel()}
                    chainId={chainId}
                    tokenAddress={checkedToTokenAddress}
                    onSelectToken={onSelectToToken}
                    tokens={[]}
                    infoTokens={infoTokens}
                    showTokenImgInDropdown={true}
                    trackAction={trackAction}
                  />
                </div>
              </div>
            </div>
          </React.Fragment>
        )}
        {showSizeSection && (
          <div className="Exchange-swap-section">
            <div className="Exchange-swap-section-top">
              <div className="muted">Sell, USD</div>
              {existingPosition && (
                <div
                  className="muted align-right clickable"
                  onClick={() => {
                    setSellValue(formatAmountFree(existingPosition.size, USD_DECIMALS, 2));
                  }}
                >
                  Position: {formatAmount(existingPosition.size, USD_DECIMALS, 2, true)}
                </div>
              )}
            </div>
            <div className="Exchange-swap-section-bottom">
              <div className="Exchange-swap-input-container">
                <input
                  type="number"
                  min="0"
                  placeholder="0.0"
                  className="Exchange-swap-input"
                  value={sellValue}
                  onChange={onSellChange}
                  onKeyDown={preventStrangeNumberInputs}
                />
                {existingPosition && sellValue !== formatAmountFree(existingPosition.size, USD_DECIMALS, 2) && (
                  <div
                    className="Exchange-swap-max"
                    onClick={() => {
                      setSellValue(formatAmountFree(existingPosition.size, USD_DECIMALS, 2));
                    }}
                  >
                    MAX
                  </div>
                )}
              </div>
              <div>
                <TokenSelector
                  label="To"
                  chainId={chainId}
                  tokenAddress={checkedToTokenAddress}
                  onSelectToken={onSelectToToken}
                  tokens={toTokens}
                  infoTokens={infoTokens}
                  trackAction={trackAction}
                />
              </div>
            </div>
          </div>
        )}
        {showTriggerRatioSection && (
          <div className="Exchange-swap-section">
            <div className="Exchange-swap-section-top">
              <div className="muted">Price</div>
              {fromTokenInfo && toTokenInfo && (
                <div
                  className="muted align-right clickable"
                  onClick={() => {
                    setTriggerRatioValue(
                      formatAmountFree(
                        getExchangeRate(fromTokenInfo, toTokenInfo, triggerRatioInverted),
                        USD_DECIMALS,
                        10
                      )
                    );
                  }}
                >
                  {formatAmount(getExchangeRate(fromTokenInfo, toTokenInfo, triggerRatioInverted), USD_DECIMALS, 4)}
                </div>
              )}
            </div>
            <div className="Exchange-swap-section-bottom">
              <div className="Exchange-swap-input-container">
                <input
                  type="number"
                  min="0"
                  placeholder="0.0"
                  className="Exchange-swap-input small"
                  value={triggerRatioValue}
                  onChange={onTriggerRatioChange}
                  onKeyDown={preventStrangeNumberInputs}
                />
              </div>
              {(() => {
                if (!toTokenInfo) return;
                if (!fromTokenInfo) return;
                const [tokenA, tokenB] = triggerRatioInverted
                  ? [toTokenInfo, fromTokenInfo]
                  : [fromTokenInfo, toTokenInfo];
                return (
                  <div className="PositionEditor-token-symbol">
                    {tokenA.symbol}&nbsp;per&nbsp;{tokenB.symbol}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        {showTriggerPriceSection && (
          <div className="Exchange-swap-section">
            <div className="Exchange-swap-section-top">
              <div className="muted">Price</div>
              <div
                className="muted align-right clickable"
                onClick={() => {
                  setTriggerPriceValue(formatAmountFree(entryMarkPrice, USD_DECIMALS, 2));
                }}
              >
                Mark: {formatAmount(entryMarkPrice, USD_DECIMALS, 2, true)}
              </div>
            </div>
            <div className="Exchange-swap-section-bottom">
              <div className="Exchange-swap-input-container">
                <input
                  type="number"
                  min="0"
                  placeholder="0.0"
                  className="Exchange-swap-input"
                  value={triggerPriceValue}
                  onChange={onTriggerPriceChange}
                  onKeyDown={preventStrangeNumberInputs}
                />
              </div>
              <div className="PositionEditor-token-symbol">USD</div>
            </div>
          </div>
        )}
        {isSwap && (
          <div className="Exchange-swap-box-info">
            <ExchangeInfoRow label="Fees">
              <div>
                {!fees && "-"}
                {fees && (
                  <div>
                    {formatAmount(feeBps, 2, 2, false)}%&nbsp; ({formatAmount(fees, fromToken.decimals, 4, true)}{" "}
                    {fromToken.symbol}: ${formatAmount(feesUsd, USD_DECIMALS, 2, true)})
                  </div>
                )}
              </div>
            </ExchangeInfoRow>
          </div>
        )}
        {(isLong || isShort) && (
          <div className="Exchange-leverage-box">
            <LeverageInput
              value={leverageOption}
              onChange={setLeverageOption}
              max={getMaxLeverage(toToken.symbol)}
              min={1.1}
              step={0.01}
            />
            {showMultiTriggerMaker && (
              <TriggerCreator
                isLong={isLong}
                leverage={leverageOption}
                currentPrice={triggerReferencePrice}
                stopLossTriggerPercent={stopLossTriggerPercent}
                setStopLossTriggerPercent={setStopLossTriggerPercent}
                takeProfitTriggerPercent={takeProfitTriggerPercent}
                setTakeProfitTriggerPercent={setTakeProfitTriggerPercent}
              />
            )}
            {isShort && (
              <div className="Exchange-info-row">
                <div className="Exchange-info-label">Profits In</div>
                <div className="align-right">
                  <TokenSelector
                    label="Profits In"
                    chainId={chainId}
                    tokenAddress={shortCollateralAddress}
                    onSelectToken={onSelectShortCollateralAddress}
                    tokens={stableTokens}
                    showTokenImgInDropdown={true}
                    trackAction={trackAction}
                  />
                </div>
              </div>
            )}
            {isLong && (
              <div className="Exchange-info-row">
                <div className="Exchange-info-label">Profits In</div>
                <div className="align-right strong">{toToken.symbol}</div>
              </div>
            )}
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">Leverage</div>
              <div className="align-right">
                {hasExistingPosition && toAmount && toAmount.gt(0) && (
                  <div className="inline-block muted">
                    {formatAmount(existingPosition.leverage, 4, 2)}x
                    <BsArrowRight className="transition-arrow" />
                  </div>
                )}
                {toAmount && leverage && leverage.gt(0) && `${formatAmount(leverage, 4, 2)}x`}
                {!toAmount && leverage && leverage.gt(0) && `-`}
                {leverage && leverage.eq(0) && `-`}
              </div>
            </div>
            {showMultiTriggerMaker && (
              <>
                <div className="Exchange-info-row">
                  <div className="Exchange-info-label">Trigger Price Stop Loss</div>
                  <div className="align-right">
                    ${stopLossTriggerPrice ? formatAmount(stopLossTriggerPrice, USD_DECIMALS, 2, true) : "-"}
                  </div>
                </div>
                <div className="Exchange-info-row">
                  <div className="Exchange-info-label">Trigger Price Take Profit</div>
                  <div className="align-right">
                    ${takeProfitTriggerPrice ? formatAmount(takeProfitTriggerPrice, USD_DECIMALS, 2, true) : "-"}
                  </div>
                </div>
                <div className="Exchange-info-row">
                  <div className="Exchange-info-label">Trigger PnL Stop Loss</div>
                  <div className="align-right">
                    {stopLossTriggerPercent ? `-${limitDecimals(stopLossTriggerPercent * 100, 2)}%` : "-"}
                  </div>
                </div>
                <div className="Exchange-info-row">
                  <div className="Exchange-info-label">Trigger PnL Take Profit</div>
                  <div className="align-right">
                    {stopLossTriggerPrice ? limitDecimals(takeProfitTriggerPercent * 100, 2) + "%" : "-"}
                  </div>
                </div>
              </>
            )}
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">Entry Price</div>
              <div className="align-right">
                {hasExistingPosition && toAmount && toAmount.gt(0) && (
                  <div className="inline-block muted">
                    ${formatAmount(existingPosition.averagePrice, USD_DECIMALS, 2, true)}
                    <BsArrowRight className="transition-arrow" />
                  </div>
                )}
                {nextAveragePrice && `$${formatAmount(nextAveragePrice, USD_DECIMALS, 2, true)}`}
                {!nextAveragePrice && `-`}
              </div>
            </div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">Liq. Price</div>
              <div className="align-right">
                {hasExistingPosition && toAmount && toAmount.gt(0) && (
                  <div className="inline-block muted">
                    ${formatAmount(existingLiquidationPrice, USD_DECIMALS, 2, true)}
                    <BsArrowRight className="transition-arrow" />
                  </div>
                )}
                {toAmount &&
                  displayLiquidationPrice &&
                  `$${formatAmount(displayLiquidationPrice, USD_DECIMALS, 2, true)}`}
                {!toAmount && displayLiquidationPrice && `-`}
                {!displayLiquidationPrice && `-`}
              </div>
            </div>
            <ExchangeInfoRow label="Fees">
              <div>
                {!feesUsd && "-"}
                {feesUsd && (
                  <Tooltip
                    handle={`$${formatAmount(feesUsd, USD_DECIMALS, 2, true)}`}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          {swapFees && (
                            <div>
                              {collateralToken.symbol} is required for collateral. <br />
                              <br />
                              Swap {fromToken.symbol} to {collateralToken.symbol} Fee: $
                              {formatAmount(swapFees, USD_DECIMALS, 2, true)}
                              <br />
                              <br />
                            </div>
                          )}
                          <div>
                            Position Fee ({MARGIN_FEE_BASIS_POINTS / 100}% of position size): $
                            {formatAmount(positionFee, USD_DECIMALS, 2, true)}
                          </div>
                        </>
                      );
                    }}
                  />
                )}
              </div>
            </ExchangeInfoRow>
          </div>
        )}
        {/* <div className="Exchange-swap-button-container">
          <button
            className="App-cta Exchange-swap-button"
            onClick={() => {
              const buttonText = getPrimaryText();
              onClickPrimary();
              if (buttonText.includes("Approve")) {
                trackTrade(1, fromToken?.symbol);
                trackAction &&
                  trackAction("Button clicked", {
                    buttonName: "Approve",
                    fromToken: fromToken?.symbol,
                  });
              } else {
                trackAction &&
                  trackAction("Button clicked", {
                    buttonName: buttonText,
                  });
              }
            }}
            disabled={!isPrimaryEnabled()}
          >
            {getPrimaryText()}
          </button>
        </div> */}
      </div>
      {isSwap && (
        <div className="Exchange-swap-market-box App-box App-box-border">
          <div className="Exchange-swap-market-box-title">Swap</div>
          <div className="App-card-divider"></div>
          <div className="Exchange-info-row">
            <div className="Exchange-info-label">{fromToken.symbol} Price</div>
            <div className="align-right">
              {fromTokenInfo && formatAmount(fromTokenInfo.minPrice, USD_DECIMALS, 2, true)} USD
            </div>
          </div>
          <div className="Exchange-info-row">
            <div className="Exchange-info-label">{toToken.symbol} Price</div>
            <div className="align-right">
              {toTokenInfo && formatAmount(toTokenInfo.maxPrice, USD_DECIMALS, 2, true)} USD
            </div>
          </div>
          {!isMarketOrder && (
            <ExchangeInfoRow label="Price">
              {getExchangeRateDisplay(getExchangeRate(fromTokenInfo, toTokenInfo), fromToken, toToken)}
            </ExchangeInfoRow>
          )}
          {renderAvailableLiquidity()}
        </div>
      )}
      {(isLong || isShort) && (
        <div className="Exchange-swap-market-box App-box App-box-border">
          <div className="Exchange-swap-market-box-title">
            {isLong ? "Long" : "Short"}&nbsp;{toToken.symbol}
          </div>
          <div className="App-card-divider"></div>
          <div className="Exchange-info-row">
            <div className="Exchange-info-label">Entry Price</div>
            <div className="align-right">
              <Tooltip
                handle={`${formatAmount(entryMarkPrice, USD_DECIMALS, 2, true)} USD`}
                position="right-bottom"
                renderContent={() => {
                  return (
                    <>
                      The position will be opened at {formatAmount(entryMarkPrice, USD_DECIMALS, 2, true)} USD with a
                      max slippage of {parseFloat(savedSlippageAmount / 100.0).toFixed(2)}%.
                      <br />
                      <br />
                      The slippage amount can be configured under Settings, found by clicking on your address at the top
                      right of the page after connecting your wallet.
                      <br />
                      <br />
                      <a
                        href="https://swaps.docs.mycelium.xyz/quick-start-guide/2.-how-to-trade"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        More Info
                      </a>
                    </>
                  );
                }}
              />
            </div>
          </div>
          <div className="Exchange-info-row">
            <div className="Exchange-info-label">Exit Price</div>
            <div className="align-right">
              <Tooltip
                handle={`${formatAmount(exitMarkPrice, USD_DECIMALS, 2, true)} USD`}
                position="right-bottom"
                renderContent={() => {
                  return (
                    <>
                      If you have an existing position, the position will be closed at{" "}
                      {formatAmount(exitMarkPrice, USD_DECIMALS, 2, true)} USD.
                      <br />
                      <br />
                      This exit price will change with the price of the asset.
                      <br />
                      <br />
                      <a
                        href="https://swaps.docs.mycelium.xyz/quick-start-guide/2.-how-to-trade"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        More Info
                      </a>
                    </>
                  );
                }}
              />
            </div>
          </div>
          <div className="Exchange-info-row">
            <div className="Exchange-info-label">Borrow Fee</div>
            <div className="align-right">
              <Tooltip
                handle={borrowFeeText}
                position="right-bottom"
                renderContent={() => {
                  return (
                    <>
                      {hasZeroBorrowFee && (
                        <div>
                          {isLong && "There are more shorts than longs, borrow fees for longing is currently zero"}
                          {isShort && "There are more longs than shorts, borrow fees for shorting is currently zero"}
                        </div>
                      )}
                      {!hasZeroBorrowFee && (
                        <div>
                          The borrow fee is calculated as (assets borrowed) / (total assets in pool) * 0.005% per hour.
                          <br />
                          <br />
                          {isShort && `You can change the "Profits In" token above to find lower fees`}
                        </div>
                      )}
                      <br />
                      <a
                        href="https://swaps.docs.mycelium.xyz/protocol-design/trading/fees#borrowing-fees"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        More Info
                      </a>
                    </>
                  );
                }}
              >
                {!hasZeroBorrowFee && null}
              </Tooltip>
            </div>
          </div>
          {renderAvailableLiquidity()}
        </div>
      )}
      <div className="Exchange-swap-market-box App-box App-box-border">
        <div className="Exchange-swap-market-box-title">Useful Links</div>
        <div className="App-card-divider"></div>
        <div className="Exchange-info-row">
          <div className="Exchange-info-label-button">
            <a
              href="https://swaps.docs.mycelium.xyz/quick-start-guide/2.-how-to-trade"
              target="_blank"
              rel="noopener noreferrer"
            >
              Trading guide
            </a>
          </div>
        </div>
      </div>
      {renderErrorModal()}
      {renderOrdersToa()}
      {isConfirming && (
        <ConfirmationBox
          isHigherSlippageAllowed={isHigherSlippageAllowed}
          setIsHigherSlippageAllowed={setIsHigherSlippageAllowed}
          orders={orders}
          isSwap={isSwap}
          isLong={isLong}
          isMarketOrder={isMarketOrder}
          orderOption={orderOption}
          isShort={isShort}
          fromToken={fromToken}
          fromTokenInfo={fromTokenInfo}
          toToken={toToken}
          toTokenInfo={toTokenInfo}
          toAmount={toAmount}
          fromAmount={fromAmount}
          feeBps={feeBps}
          onConfirmationClick={onConfirmationClick}
          setIsConfirming={setIsConfirming}
          hasExistingPosition={hasExistingPosition}
          shortCollateralAddress={shortCollateralAddress}
          shortCollateralToken={shortCollateralToken}
          leverage={leverage}
          existingPosition={existingPosition}
          existingLiquidationPrice={existingLiquidationPrice}
          displayLiquidationPrice={displayLiquidationPrice}
          nextAveragePrice={nextAveragePrice}
          triggerPriceUsd={triggerPriceUsd}
          triggerRatio={triggerRatio}
          fees={fees}
          feesUsd={feesUsd}
          isSubmitting={isSubmitting}
          isPendingConfirmation={isPendingConfirmation}
          fromUsdMin={fromUsdMin}
          toUsdMax={toUsdMax}
          collateralTokenAddress={collateralTokenAddress}
          infoTokens={infoTokens}
          chainId={chainId}
          trackAction={trackAction}
          trackTrade={trackTrade}
          stopLossTriggerPrice={stopLossTriggerPrice}
          stopLossTriggerPnl={stopLossTriggerPercent}
          takeProfitTriggerPrice={takeProfitTriggerPrice}
          takeProfitTriggerPnl={takeProfitTriggerPercent}
        />
      )}
    </div>
  );
}
