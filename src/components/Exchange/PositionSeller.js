import React, { useState, useCallback, useEffect, useMemo } from "react";
import useSWR from "swr";
import { ethers } from "ethers";
import cx from "classnames";

import { BsArrowRight } from "react-icons/bs";

import {
  CLOSE_POSITION_RECEIVE_TOKEN_KEY,
  SLIPPAGE_BPS_KEY
} from '../../config/localstorage';

import {
  formatAmount,
  bigNumberify,
  DEFAULT_SLIPPAGE_AMOUNT,
  DEFAULT_HIGHER_SLIPPAGE_AMOUNT,
  USD_DECIMALS,
  DUST_USD,
  BASIS_POINTS_DIVISOR,
  TRIGGER_PREFIX_BELOW,
  TRIGGER_PREFIX_ABOVE,
  MIN_PROFIT_TIME,
  fetcher,
  usePrevious,
  formatAmountFree,
  parseValue,
  expandDecimals,
  getTokenInfo,
  getLiquidationPrice,
  getLeverage,
  getMarginFee,
  PRECISION,
  MARKET,
  STOP,
  DECREASE,
  LIMIT,
  useLocalStorageSerializeKey,
  calculatePositionDelta,
  getDeltaStr,
  getProfitPrice,
  formatDateTime,
  getTimeRemaining,
  getUserTokenBalances,
  USDG_DECIMALS,
  useLocalStorageByChainId,
  getNextToAmount,
  adjustForDecimals,
  getDeltaAfterFees,
} from "../../Helpers";
import { getAnalyticsEventStage } from "../../utils/analytics";

import "./PositionSeller.css";
import { getConstant } from "../../Constants";
import { createDecreaseOrder, callContract, useHasOutdatedUi } from "../../Api";
import { getContract } from "../../Addresses";
import PositionRouter from "../../abis/PositionRouter.json";
import Checkbox from "../Checkbox/Checkbox";
import Tab from "../Tab/Tab";
import Modal from "../Modal/Modal";
import ExchangeInfoRow from "./ExchangeInfoRow";
import Tooltip from "../Tooltip/Tooltip";
import TooltipRow from "../Tooltip/TooltipRow";
import { getTokens } from "../../data/Tokens";
import TokenSelector from "./TokenSelector";
import { getTokenAmountFromUsd, getUsd } from "../../utils/tokens";
import { convertStringToFloat } from "../../utils/common";

const { AddressZero } = ethers.constants;
const ORDER_SIZE_DUST_USD = expandDecimals(1, USD_DECIMALS - 1); // $0.10

const orderOptionLabels = {
  [MARKET]: "Market",
  [STOP]: "Trigger",
};

function shouldSwap(collateralToken, receiveToken) {
  // If position collateral is WETH in contract, then position.collateralToken is { symbol: “ETH”, isNative: true, … }
  // @see https://github.com/mycelium-ethereum/swaps-client/blob/master/src/pages/Exchange/Exchange.js#L162
  // meaning if collateralToken.isNative === true in reality position has WETH as a collateral
  // and if collateralToken.isNative === true and receiveToken.isNative === true then position’s WETH will be unwrapped and user will receive native ETH
  const isCollateralWrapped = collateralToken.isNative;

  const isSameToken =
    collateralToken.address === receiveToken.address || (isCollateralWrapped && receiveToken.isWrapped);

  const isUnwrap = isCollateralWrapped && receiveToken.isNative;

  return !isSameToken && !isUnwrap;
}

function getSwapLimits(infoTokens, fromTokenAddress, toTokenAddress) {
  const fromInfo = getTokenInfo(infoTokens, fromTokenAddress);
  const toInfo = getTokenInfo(infoTokens, toTokenAddress);

  let maxInUsd;
  let maxIn;
  let maxOut;
  let maxOutUsd;

  if (!fromInfo?.maxUsdgAmount) {
    maxInUsd = bigNumberify(0);
    maxIn = bigNumberify(0);
  } else {
    maxInUsd = fromInfo.maxUsdgAmount
      .sub(fromInfo.usdgAmount)
      .mul(expandDecimals(1, USD_DECIMALS))
      .div(expandDecimals(1, USDG_DECIMALS));

    maxIn = maxInUsd.mul(expandDecimals(1, fromInfo.decimals)).div(fromInfo.maxPrice).toString();
  }

  if (!toInfo?.poolAmount || !toInfo?.bufferAmount) {
    maxOut = bigNumberify(0);
    maxOutUsd = bigNumberify(0);
  } else {
    maxOut = toInfo.availableAmount.gt(toInfo.poolAmount.sub(toInfo.bufferAmount))
      ? toInfo.poolAmount.sub(toInfo.bufferAmount)
      : toInfo.availableAmount;

    maxOutUsd = getUsd(maxOut, toInfo.address, false, infoTokens);
  }

  return {
    maxIn,
    maxInUsd,
    maxOut,
    maxOutUsd,
  };
}

const orderOptions = [MARKET, STOP];

export default function PositionSeller(props) {
  const {
    active,
    pendingPositions,
    setPendingPositions,
    positionsMap,
    positionKey,
    isVisible,
    setIsVisible,
    account,
    library,
    infoTokens,
    setPendingTxns,
    flagOrdersEnabled,
    savedIsPnlInLeverage,
    chainId,
    nativeTokenAddress,
    orders,
    isWaitingForPluginApproval,
    isPluginApproving,
    orderBookApproved,
    setOrdersToaOpen,
    positionRouterApproved,
    isWaitingForPositionRouterApproval,
    isPositionRouterApproving,
    approvePositionRouter,
    isHigherSlippageAllowed,
    setIsHigherSlippageAllowed,
    trackAction,
    usdgSupply,
    totalTokenWeights,
    showPnlAfterFees
  } = props;
  const [savedSlippageAmount] = useLocalStorageSerializeKey([chainId, SLIPPAGE_BPS_KEY], DEFAULT_SLIPPAGE_AMOUNT);
  const [keepLeverage, setKeepLeverage] = useLocalStorageSerializeKey([chainId, "Exchange-keep-leverage"], true);
  const position = positionsMap && positionKey ? positionsMap[positionKey] : undefined;
  const [fromValue, setFromValue] = useState("");
  const [isProfitWarningAccepted, setIsProfitWarningAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevIsVisible = usePrevious(isVisible);
  const positionRouterAddress = getContract(chainId, "PositionRouter");
  const nativeTokenSymbol = getConstant(chainId, "nativeTokenSymbol");
  const toTokens = getTokens(chainId);

  const [savedReceiveTokenAddress, setSavedReceiveTokenAddress] = useLocalStorageByChainId(
    chainId,
    `${CLOSE_POSITION_RECEIVE_TOKEN_KEY}-${position?.indexToken?.symbol}-${position.isLong ? "long" : "short"}`
  );

  const [swapToToken, setSwapToToken] = useState(() =>
    savedReceiveTokenAddress ? toTokens.find((token) => token.address === savedReceiveTokenAddress) : undefined
  );

  let allowedSlippage = savedSlippageAmount;
  if (isHigherSlippageAllowed) {
    allowedSlippage = DEFAULT_HIGHER_SLIPPAGE_AMOUNT;
  }

  const { data: minExecutionFee } = useSWR([active, chainId, positionRouterAddress, "minExecutionFee"], {
    fetcher: fetcher(library, PositionRouter),
  });


  let [orderOption, setOrderOption] = useState(MARKET);

  if (!flagOrdersEnabled) {
    orderOption = MARKET;
  }

  const needPositionRouterApproval = !positionRouterApproved && orderOption === MARKET;

  const onOrderOptionChange = (option) => {
    // disabled limit close
    if (typeof option === "string" && option !== LIMIT) {
      setOrderOption(option);
    }
  };

  const onTriggerPriceChange = (evt) => {
    setTriggerPriceValue(evt.target.value || "");
  };
  const [triggerPriceValue, setTriggerPriceValue] = useState("");
  const triggerPriceUsd = orderOption === MARKET ? 0 : parseValue(triggerPriceValue, USD_DECIMALS);

  const [nextDelta, nextHasProfit = bigNumberify(0)] = useMemo(() => {
    if (!position) {
      return [bigNumberify(0), false];
    }

    if (orderOption !== STOP) {
      return [position.delta, position.hasProfit, position.deltaPercentage];
    }

    if (!triggerPriceUsd) {
      return [bigNumberify(0), false];
    }

    const { delta, hasProfit, deltaPercentage } = calculatePositionDelta(triggerPriceUsd, position);
    return [delta, hasProfit, deltaPercentage];
  }, [position, orderOption, triggerPriceUsd]);

  const existingOrders = useMemo(() => {
    if (orderOption === STOP && (!triggerPriceUsd || triggerPriceUsd.eq(0))) {
      return [];
    }
    if (!orders || !position) {
      return [];
    }

    const ret = [];
    for (const order of orders) {
      // only Stop orders can't be executed without corresponding opened position
      if (order.type !== DECREASE) continue;

      // if user creates Stop-Loss we need only Stop-Loss orders and vice versa
      if (orderOption === STOP) {
        const triggerAboveThreshold = triggerPriceUsd.gt(position.markPrice);
        if (triggerAboveThreshold !== order.triggerAboveThreshold) continue;
      }

      const sameToken =
        order.indexToken === nativeTokenAddress
          ? position.indexToken.isNative
          : order.indexToken === position.indexToken.address;
      if (order.isLong === position.isLong && sameToken) {
        ret.push(order);
      }
    }
    return ret;
  }, [position, orders, triggerPriceUsd, orderOption, nativeTokenAddress]);

  const existingOrder = existingOrders[0];



  const needOrderBookApproval = orderOption === STOP && !orderBookApproved;

  const isSwapAllowed = orderOption === MARKET;

  const { data: hasOutdatedUi } = useHasOutdatedUi();

  let collateralToken;
  let receiveToken;
  let maxAmount;
  let maxAmountFormatted;
  let maxAmountFormattedFree;
  let fromAmount;

  let convertedAmount;
  let convertedAmountFormatted;

  let nextLeverage;
  let liquidationPrice;
  let nextLiquidationPrice;
  let isClosing;
  let sizeDelta;

  let nextCollateral;
  let collateralDelta = bigNumberify(0);
  let receiveAmount = bigNumberify(0);
  let convertedReceiveAmount = bigNumberify(0);
  let adjustedDelta = bigNumberify(0);

  let isNotEnoughReceiveTokenLiquidity;
  let isCollateralPoolCapacityExceeded;

  let title;
  let fundingFee;
  let positionFee;
  let swapFeeToken;
  let swapFee;
  let totalFees = bigNumberify(0);

  let executionFee = orderOption === STOP ? getConstant(chainId, "DECREASE_ORDER_EXECUTION_GAS_FEE") : minExecutionFee;

  let executionFeeUsd = getUsd(executionFee, nativeTokenAddress, false, infoTokens) || bigNumberify(0);

  if (position) {
    fundingFee = position.fundingFee;
    fromAmount = parseValue(fromValue, USD_DECIMALS);
    sizeDelta = fromAmount;

    title = `Close ${position.isLong ? "Long" : "Short"} ${position.indexToken.symbol}`;
    collateralToken = position.collateralToken;
    liquidationPrice = getLiquidationPrice(position);

    if (fromAmount) {
      isClosing = position.size.sub(fromAmount).lt(DUST_USD);
      positionFee = getMarginFee(fromAmount);
    }

    if (isClosing) {
      sizeDelta = position.size;
      receiveAmount = position.collateral;
    } else if (orderOption === STOP && sizeDelta && existingOrders.length > 0) {
      let residualSize = position.size;
      for (const order of existingOrders) {
        residualSize = residualSize.sub(order.sizeDelta);
      }
      if (residualSize.sub(sizeDelta).abs().lt(ORDER_SIZE_DUST_USD)) {
        sizeDelta = residualSize;
      }
    }

    if (sizeDelta) {
      adjustedDelta = nextDelta.mul(sizeDelta).div(position.size);
    }

    if (nextHasProfit) {
      receiveAmount = receiveAmount.add(adjustedDelta);
    } else {
      if (receiveAmount.gt(adjustedDelta)) {
        receiveAmount = receiveAmount.sub(adjustedDelta);
      } else {
        receiveAmount = bigNumberify(0);
      }
    }

    if (keepLeverage && sizeDelta && !isClosing) {
      collateralDelta = sizeDelta.mul(position.collateral).div(position.size);
      // if the position will be realising a loss then reduce collateralDelta by the realised loss
      if (!nextHasProfit) {
        const deductions = adjustedDelta.add(positionFee).add(fundingFee);
        if (collateralDelta.gt(deductions)) {
          collateralDelta = collateralDelta = collateralDelta.sub(deductions);
        } else {
          collateralDelta = bigNumberify(0);
        }
      }
    }

    maxAmount = position.size;
    maxAmountFormatted = formatAmount(maxAmount, USD_DECIMALS, 2, true);
    maxAmountFormattedFree = formatAmountFree(maxAmount, USD_DECIMALS, 2);

    if (fromAmount && collateralToken.maxPrice) {
      convertedAmount = fromAmount.mul(expandDecimals(1, collateralToken.decimals)).div(collateralToken.maxPrice);
      convertedAmountFormatted = formatAmount(convertedAmount, collateralToken.decimals, 4, true);
    }

    totalFees = totalFees.add(positionFee || bigNumberify(0)).add(fundingFee || bigNumberify(0));

    receiveAmount = receiveAmount.add(collateralDelta);

    if (sizeDelta) {
      if (receiveAmount.gt(totalFees)) {
        receiveAmount = receiveAmount.sub(totalFees);
      } else {
        receiveAmount = bigNumberify(0);
      }
    }

    receiveToken = isSwapAllowed && swapToToken ? swapToToken : collateralToken;

    // Calculate swap fees
    if (isSwapAllowed && swapToToken) {
      const { feeBasisPoints } = getNextToAmount(
        chainId,
        convertedAmount,
        collateralToken.address,
        receiveToken.address,
        infoTokens,
        undefined,
        undefined,
        usdgSupply,
        totalTokenWeights,
        true
      );

      if (feeBasisPoints) {
        swapFee = receiveAmount.mul(feeBasisPoints).div(BASIS_POINTS_DIVISOR);
        swapFeeToken = getTokenAmountFromUsd(infoTokens, collateralToken.address, swapFee);
        totalFees = totalFees.add(swapFee || bigNumberify(0));
        receiveAmount = receiveAmount.sub(swapFee);
      }
    }

    if (orderOption === STOP) {
      convertedReceiveAmount = getTokenAmountFromUsd(infoTokens, receiveToken.address, receiveAmount, {
        overridePrice: triggerPriceUsd,
      });
    } else {
      convertedReceiveAmount = getTokenAmountFromUsd(infoTokens, receiveToken.address, receiveAmount);
    }

    // Check swap limits (max in / max out)
    if (isSwapAllowed && shouldSwap(collateralToken, receiveToken)) {
      const collateralInfo = getTokenInfo(infoTokens, collateralToken.address);
      const receiveTokenInfo = getTokenInfo(infoTokens, receiveToken.address);

      isNotEnoughReceiveTokenLiquidity =
        receiveTokenInfo.availableAmount.lt(convertedReceiveAmount) ||
        receiveTokenInfo.bufferAmount.gt(receiveTokenInfo.poolAmount.sub(convertedReceiveAmount));

      if (
        collateralInfo.maxUsdgAmount &&
        collateralInfo.maxUsdgAmount.gt(0) &&
        collateralInfo.usdgAmount &&
        collateralInfo.maxPrice
      ) {
        const usdgFromAmount = adjustForDecimals(receiveAmount, USD_DECIMALS, USDG_DECIMALS);
        const nextUsdgAmount = collateralInfo.usdgAmount.add(usdgFromAmount);

        if (nextUsdgAmount.gt(collateralInfo.maxUsdgAmount)) {
          isCollateralPoolCapacityExceeded = true;
        }
      }
    }

    if (isClosing) {
      nextCollateral = bigNumberify(0);
    } else {
      if (position.collateral) {
        nextCollateral = position.collateral;
        if (collateralDelta && collateralDelta.gt(0)) {
          nextCollateral = position.collateral.sub(collateralDelta);
        } else if (position.delta && position.delta.gt(0) && sizeDelta) {
          if (!position.hasProfit) {
            nextCollateral = nextCollateral.sub(adjustedDelta);
          }
        }
      }
    }

    if (fromAmount) {
      if (!isClosing && !keepLeverage) {
        nextLeverage = getLeverage({
          size: position.size,
          sizeDelta,
          collateral: position.collateral,
          entryFundingRate: position.entryFundingRate,
          cumulativeFundingRate: position.cumulativeFundingRate,
          hasProfit: nextHasProfit,
          delta: nextDelta,
          includeDelta: savedIsPnlInLeverage,
        });
        nextLiquidationPrice = getLiquidationPrice({
          isLong: position.isLong,
          size: position.size,
          sizeDelta,
          collateral: position.collateral,
          averagePrice: position.averagePrice,
          entryFundingRate: position.entryFundingRate,
          cumulativeFundingRate: position.cumulativeFundingRate,
          delta: nextDelta,
          hasProfit: nextHasProfit,
          includeDelta: true,
        });
      }
    }
  }

  const [deltaStr, deltaPercentageStr] = useMemo(() => {
    let pendingDelta, pendingDeltaPercentage, hasProfit;
    if (!position || !position.markPrice) {
      return ["-", "-"];
    } else if (orderOption !== STOP) {
      ({ pendingDelta, pendingDeltaPercentage, hasProfit } = calculatePositionDelta(
        position.markPrice,
        position,
        fromAmount
      ));
    } else if (!triggerPriceUsd || triggerPriceUsd.eq(0)) {
      return ["-", "-"];
    } else {
      ({ pendingDelta, pendingDeltaPercentage, hasProfit } = calculatePositionDelta(
        triggerPriceUsd,
        position,
        fromAmount
      ));
    }

    let deltaStr, deltaPercentageStr;
    if (showPnlAfterFees) {
      const { pendingDeltaAfterFees, deltaPercentageAfterFees, hasProfitAfterFees } = getDeltaAfterFees({
        delta: pendingDelta,
        totalFees: position.totalFees,
        hasProfit,
        collateral: position.collateral
      })
      ({ deltaStr, deltaPercentageStr } = getDeltaStr({
        delta: pendingDeltaAfterFees,
        deltaPercentage: deltaPercentageAfterFees,
        hasProfit: hasProfitAfterFees,
      }));
    } else {
      ({ deltaStr, deltaPercentageStr } = getDeltaStr({
        delta: pendingDelta,
        deltaPercentage: pendingDeltaPercentage,
        hasProfit,
      }));
    }
    return [deltaStr, deltaPercentageStr];
  }, [position, triggerPriceUsd, orderOption, fromAmount]);

  const getError = () => {
    if (hasOutdatedUi) {
      return "Page outdated, please refresh";
    }
    if (!fromAmount) {
      return "Enter an amount";
    }
    if (nextLeverage && nextLeverage.eq(0)) {
      return "Enter an amount";
    }
    if (orderOption === STOP) {
      if (!triggerPriceUsd || triggerPriceUsd.eq(0)) {
        return "Enter Price";
      }
      if (position.isLong && triggerPriceUsd.lte(liquidationPrice)) {
        return "Price below Liq. Price";
      }
      if (!position.isLong && triggerPriceUsd.gte(liquidationPrice)) {
        return "Price above Liq. Price";
      }

      if (profitPrice && nextDelta.eq(0) && nextHasProfit) {
        return "Invalid price, see warning";
      }
    }

    if (!isClosing && position && position.size && fromAmount) {
      if (position.size.sub(fromAmount).lt(expandDecimals(10, USD_DECIMALS))) {
        return "Leftover position below 10 USD";
      }
    }

    if (position && position.size && position.size.lt(fromAmount)) {
      return "Max close amount exceeded";
    }

    if (nextLeverage && nextLeverage.lt(1.1 * BASIS_POINTS_DIVISOR)) {
      return "Min leverage: 1.1x";
    }

    if (nextLeverage && nextLeverage.gt(30.5 * BASIS_POINTS_DIVISOR)) {
      return "Max leverage: 30.5x";
    }

    if (hasPendingProfit && orderOption !== STOP && !isProfitWarningAccepted) {
      return "Forfeit profit not checked";
    }
  };

  const isPrimaryEnabled = () => {
    const error = getError();
    if (error) {
      return false;
    }
    if (isSubmitting) {
      return false;
    }
    if (needOrderBookApproval && isWaitingForPluginApproval) {
      return false;
    }
    if (isPluginApproving) {
      return false;
    }
    if (needPositionRouterApproval && isWaitingForPositionRouterApproval) {
      return false;
    }
    if (isPositionRouterApproving) {
      return false;
    }

    return true;
  };

  const hasPendingProfit = MIN_PROFIT_TIME > 0 && position.delta.eq(0) && position.pendingDelta.gt(0);

  const getPrimaryText = () => {
    const error = getError();
    if (error) {
      return error;
    }

    if (orderOption === STOP) {
      if (isSubmitting) return "Creating Order...";

      if (needOrderBookApproval && isWaitingForPluginApproval) {
        return "Enabling Orders...";
      }
      if (isPluginApproving) {
        return "Enabling Orders...";
      }
      if (needOrderBookApproval) {
        return "Enable Orders";
      }

      return "Create Order";
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

    if (hasPendingProfit) {
      return "Close without profit";
    }
    return isSubmitting ? "Closing..." : "Close";
  };

  const resetForm = () => {
    setFromValue("");
    setIsProfitWarningAccepted(false);
  };

  useEffect(() => {
    if (prevIsVisible !== isVisible) {
      resetForm();
    }
  }, [prevIsVisible, isVisible]);

  const onClickPrimary = async () => {
    if (needOrderBookApproval) {
      setOrdersToaOpen(true);
      return;
    }

    if (needPositionRouterApproval) {
      approvePositionRouter({
        sentMsg: `Enable leverage sent.`,
        failMsg: `Enable leverage failed.`,
      });
      return;
    }

    setIsSubmitting(true);

    const collateralTokenAddress = position.collateralToken.isNative
      ? nativeTokenAddress
      : position.collateralToken.address;
    const indexTokenAddress = position.indexToken.isNative ? nativeTokenAddress : position.indexToken.address;

    if (orderOption === STOP) {
      const triggerAboveThreshold = triggerPriceUsd.gt(position.markPrice);

      createDecreaseOrder(
        chainId,
        library,
        indexTokenAddress,
        sizeDelta,
        collateralTokenAddress,
        collateralDelta,
        position.isLong,
        triggerPriceUsd,
        triggerAboveThreshold,
        {
          sentMsg: `Order submitted!`,
          successMsg: `Order created!`,
          failMsg: `Order creation failed.`,
          setPendingTxns,
        }
      )
        .then(() => {
          setFromValue("");
          setIsVisible(false);
        })
        .finally(() => {
          setIsSubmitting(false);
        });
      return;
    }

    const priceBasisPoints = position.isLong
      ? BASIS_POINTS_DIVISOR - allowedSlippage
      : BASIS_POINTS_DIVISOR + allowedSlippage;
    const refPrice = position.isLong ? position.indexToken.minPrice : position.indexToken.maxPrice;
    let priceLimit = refPrice.mul(priceBasisPoints).div(BASIS_POINTS_DIVISOR);
    const minProfitExpiration = position.lastIncreasedTime + MIN_PROFIT_TIME;
    const minProfitTimeExpired = parseInt(Date.now() / 1000) > minProfitExpiration;

    if (nextHasProfit && !minProfitTimeExpired && !isProfitWarningAccepted) {
      if ((position.isLong && priceLimit.lt(profitPrice)) || (!position.isLong && priceLimit.gt(profitPrice))) {
        priceLimit = profitPrice;
      }
    }

    const tokenAddress0 = collateralTokenAddress === AddressZero ? nativeTokenAddress : collateralTokenAddress;

    const path = [tokenAddress0];

    const isUnwrap = receiveToken.address === AddressZero;
    const isSwap = receiveToken.address !== tokenAddress0;

    if (isSwap) {
      if (isUnwrap && tokenAddress0 !== nativeTokenAddress) {
        path.push(nativeTokenAddress);
      } else if (!isUnwrap) {
        path.push(receiveToken.address);
      }
    }

    const withdrawETH = isUnwrap;

    const params = [
      path, // _path
      indexTokenAddress, // _indexToken
      collateralDelta, // _collateralDelta
      sizeDelta, // _sizeDelta
      position.isLong, // _isLong
      account, // _receiver
      priceLimit, // _acceptablePrice
      0, // _minOut
      minExecutionFee, // _executionFee
      withdrawETH, // _withdrawETH
    ];

    const successMsg = `Requested decrease of ${position.indexToken.symbol} ${
      position.isLong ? "Long" : "Short"
    } by ${formatAmount(sizeDelta, USD_DECIMALS, 2)} USD.`;

    const contract = new ethers.Contract(positionRouterAddress, PositionRouter.abi, library.getSigner());

    callContract(chainId, contract, "createDecreasePosition", params, {
      value: minExecutionFee,
      sentMsg: `Close submitted!`,
      successMsg,
      failMsg: `Close failed.`,
      setPendingTxns,
    })
      .then(async (res) => {
        setFromValue("");
        setIsVisible(false);

        let nextSize = position.size.sub(sizeDelta);

        pendingPositions[position.key] = {
          updatedAt: Date.now(),
          pendingChanges: {
            size: nextSize,
          },
        };

        setPendingPositions({ ...pendingPositions });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const renderExistingOrderWarning = useCallback(() => {
    if (!existingOrder) {
      return;
    }
    const indexToken = getTokenInfo(infoTokens, existingOrder.indexToken);
    const sizeInToken = formatAmount(
      existingOrder.sizeDelta.mul(PRECISION).div(existingOrder.triggerPrice),
      USD_DECIMALS,
      4,
      true
    );
    const prefix = existingOrder.triggerAboveThreshold ? TRIGGER_PREFIX_ABOVE : TRIGGER_PREFIX_BELOW;
    return (
      <div className="Confirmation-box-warning">
        You have an active order to decrease {existingOrder.isLong ? "Long" : "Short"} {sizeInToken} {indexToken.symbol}{" "}
        ($
        {formatAmount(existingOrder.sizeDelta, USD_DECIMALS, 2, true)}) at {prefix}{" "}
        {formatAmount(existingOrder.triggerPrice, USD_DECIMALS, 2, true)}
      </div>
    );
  }, [existingOrder, infoTokens]);

  function renderMinProfitWarning() {
    if (MIN_PROFIT_TIME === 0) {
      return null;
    }

    if (profitPrice && nextDelta.eq(0) && nextHasProfit) {
      const minProfitExpiration = position.lastIncreasedTime + MIN_PROFIT_TIME;

      if (orderOption === MARKET) {
        return (
          <div className="Confirmation-box-warning">
            Reducing the position at the current price will forfeit a pending profit of {deltaStr}. <br />
            <br />
            Profit price: {position.isLong ? ">" : "<"} ${formatAmount(profitPrice, USD_DECIMALS, 2, true)}. This rule
            applies for the next {getTimeRemaining(minProfitExpiration)}, until {formatDateTime(minProfitExpiration)}.
          </div>
        );
      }
      return (
        <div className="Confirmation-box-warning">
          This order will forfeit a profit of {deltaStr}. <br />
          Profit price: {position.isLong ? ">" : "<"} ${formatAmount(profitPrice, USD_DECIMALS, 2, true)}. This rule
          applies for the next {getTimeRemaining(minProfitExpiration)}, until {formatDateTime(minProfitExpiration)}.
        </div>
      );
    }
  }

  const profitPrice = getProfitPrice(orderOption === MARKET ? position.markPrice : triggerPriceUsd, position);

  let triggerPricePrefix;
  if (triggerPriceUsd) {
    triggerPricePrefix = triggerPriceUsd.gt(position.markPrice) ? TRIGGER_PREFIX_ABOVE : TRIGGER_PREFIX_BELOW;
  }

  const shouldShowExistingOrderWarning = false;

  const trackClosePosition = (stage) => {
    const eventName = getAnalyticsEventStage(stage);
    try {
      const size = convertStringToFloat(formatAmount(position.size, USD_DECIMALS, 2, true));
      const collateral = convertStringToFloat(formatAmount(position.collateral, USD_DECIMALS, 2, true));
      const nextCollateralValue = nextCollateral
        ? convertStringToFloat(formatAmount(nextCollateral, USD_DECIMALS, 2, true))
        : 0;
      const leverage = convertStringToFloat(formatAmount(position.leverage, 4, 2, true));
      const nextLeverageValue = nextLeverage ? convertStringToFloat(formatAmount(nextLeverage, 4, 2, true)) : 0;
      const liqPrice = convertStringToFloat(formatAmount(liquidationPrice, USD_DECIMALS, 2, true));
      const nextLiqPriceValue = nextLiquidationPrice
        ? convertStringToFloat(formatAmount(nextLiquidationPrice, USD_DECIMALS, 2, true))
        : 0;
      const amountToPay = convertedAmountFormatted;
      const allowedSlippageValue = convertStringToFloat(formatAmount(allowedSlippage, 2, 2));
      const entryPrice = convertStringToFloat(formatAmount(position.averagePrice, USD_DECIMALS, 2, true));
      const exitPrice = convertStringToFloat(formatAmount(position.markPrice, USD_DECIMALS, 2, true));
      const borrowFeeValue = convertStringToFloat(formatAmount(fundingFee, USD_DECIMALS, 2, true));
      const closingFee = convertStringToFloat(formatAmount(positionFee, USD_DECIMALS, 2, true));
      const amountToReceiveUsd = convertStringToFloat(formatAmount(receiveAmount, USD_DECIMALS, 2, true));
      const amountToReceive = convertStringToFloat(
        formatAmount(convertedReceiveAmount, position.collateralToken.decimals, 4, true)
      );
      const [userBalances, tokenPrices, poolBalances] = getUserTokenBalances(infoTokens);

      const traits = {
        actionType: "Close",
        position: position.isLong ? "Long" : "Short",
        transactionType: orderOption === MARKET ? "Market" : "Trigger",
        size: size,
        collateral: collateral,
        nextCollateral: nextCollateralValue,
        leverage: leverage,
        nextLeverage: nextLeverageValue,
        keepOriginalLeverage: keepLeverage,
        upToOnePercentSlippageEnabled: isHigherSlippageAllowed,
        liqPrice: liqPrice,
        nextLiqPrice: nextLiqPriceValue,
        amountToPay: amountToPay,
        allowedSlippage: allowedSlippageValue,
        entryPrice: entryPrice,
        exitPrice: exitPrice,
        borrowFee: borrowFeeValue,
        closingFee: closingFee,
        pnlActual: deltaStr,
        pnlPercentage: deltaPercentageStr,
        amountToReceiveUsd: amountToReceiveUsd,
        amountToReceive: amountToReceive,
        tokenToReceive: position.collateralToken.symbol,
        ...userBalances,
        ...tokenPrices,
        ...poolBalances,
      };
      trackAction && trackAction(eventName, traits);
    } catch (err) {
      console.error(`Unable to track ${eventName} event`, err);
    }
  };

  return (
    <div className="PositionEditor">
      {position && (
        <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={title}>
          {flagOrdersEnabled && (
            <Tab
              options={orderOptions}
              option={orderOption}
              optionLabels={orderOptionLabels}
              onChange={onOrderOptionChange}
            />
          )}
          <div className="Exchange-swap-section">
            <div className="Exchange-swap-section-top">
              <div className="muted">
                {convertedAmountFormatted && (
                  <div className="Exchange-swap-usd">
                    Close: {convertedAmountFormatted} {position.collateralToken.symbol}
                  </div>
                )}
                {!convertedAmountFormatted && "Close"}
              </div>
              {maxAmount && (
                <div className="muted align-right clickable" onClick={() => setFromValue(maxAmountFormattedFree)}>
                  Max: {maxAmountFormatted}
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
                  onChange={(e) => setFromValue(e.target.value)}
                />
                {fromValue !== maxAmountFormattedFree && (
                  <div
                    className="Exchange-swap-max"
                    onClick={() => {
                      setFromValue(maxAmountFormattedFree);
                    }}
                  >
                    MAX
                  </div>
                )}
              </div>
              <div className="PositionEditor-token-symbol">USD</div>
            </div>
          </div>
          {orderOption === STOP && (
            <div className="Exchange-swap-section">
              <div className="Exchange-swap-section-top">
                <div className="muted">Price</div>
                <div
                  className="muted align-right clickable"
                  onClick={() => {
                    setTriggerPriceValue(formatAmountFree(position.markPrice, USD_DECIMALS, 2));
                  }}
                >
                  Mark: {formatAmount(position.markPrice, USD_DECIMALS, 2, true)}
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
                  />
                </div>
                <div className="PositionEditor-token-symbol">USD</div>
              </div>
            </div>
          )}
          {renderMinProfitWarning()}
          {shouldShowExistingOrderWarning && renderExistingOrderWarning()}
          <div className="PositionEditor-info-box">
            <div className="Exchange-info-row PositionSeller-receive-row bottom-line">
              <div className="Exchange-info-label">
                Receive
              </div>

              {!isSwapAllowed && receiveToken && (
                <div className="align-right PositionSelector-selected-receive-token">
                  {formatAmount(convertedReceiveAmount, receiveToken.decimals, 4, true)}&nbsp;{receiveToken.symbol} ($
                  {formatAmount(receiveAmount, USD_DECIMALS, 2, true)})
                </div>
              )}

              {isSwapAllowed && receiveToken && (
                <div className="align-right">
                  <TokenSelector
                    // Scroll lock lead to side effects
                    // if it applied on modal inside another modal
                    disableBodyScrollLock={true}
                    className={cx("PositionSeller-token-selector", {
                      warning: isNotEnoughReceiveTokenLiquidity || isCollateralPoolCapacityExceeded,
                    })}
                    label={"Receive"}
                    showBalances={false}
                    chainId={chainId}
                    tokenAddress={receiveToken.address}
                    onSelectToken={(token) => {
                      setSwapToToken(token);
                      setSavedReceiveTokenAddress(token.address);
                    }}
                    tokens={toTokens}
                    getTokenState={(tokenOptionInfo) => {
                      if (!shouldSwap(collateralToken, tokenOptionInfo)) {
                        return;
                      }

                      const convertedTokenAmount = getTokenAmountFromUsd(
                        infoTokens,
                        tokenOptionInfo.address,
                        receiveAmount
                      );

                      const isNotEnoughLiquidity =
                        tokenOptionInfo.availableAmount.lt(convertedTokenAmount) ||
                        tokenOptionInfo.bufferAmount.gt(tokenOptionInfo.poolAmount.sub(convertedTokenAmount));

                      if (isNotEnoughLiquidity) {
                        const { maxIn, maxOut, maxInUsd, maxOutUsd } = getSwapLimits(
                          infoTokens,
                          collateralToken.address,
                          tokenOptionInfo.address
                        );

                        const collateralInfo = getTokenInfo(infoTokens, collateralToken.address);

                        return {
                          disabled: true,
                          message: (
                            <div>
                              Insufficient Available Liquidity to swap to {tokenOptionInfo.symbol}:
                              <br />
                              <br />
                              <TooltipRow
                                label={`Max ${collateralInfo.symbol} in`}
                                value={[
                                  `${formatAmount(maxIn, collateralInfo.decimals, 0, true)} ${collateralInfo.symbol}`,
                                  `($${formatAmount(maxInUsd, USD_DECIMALS, 0, true)})`,
                                ]}
                              />
                              <br />
                              <br />
                              Max {tokenOptionInfo.symbol} out:{" "}
                              {formatAmount(maxOut, tokenOptionInfo.decimals, 2, true)} {tokenOptionInfo.symbol}
                              <br />
                              (${formatAmount(maxOutUsd, USD_DECIMALS, 2, true)})
                            </div>
                          ),
                        };
                      }
                    }}
                    infoTokens={infoTokens}
                    showTokenImgInDropdown={true}
                    selectedTokenLabel={
                      <span className="PositionSelector-selected-receive-token">
                        {formatAmount(convertedReceiveAmount, receiveToken.decimals, 4, true)}&nbsp;
                        {receiveToken.symbol} (${formatAmount(receiveAmount, USD_DECIMALS, 2, true)})
                      </span>
                    }
                  />
                </div>
              )}
            </div>
            {hasPendingProfit && orderOption !== STOP && (
              <div className="PositionEditor-accept-profit-warning">
                <Checkbox isChecked={isProfitWarningAccepted} setIsChecked={setIsProfitWarningAccepted}>
                  <span className="muted">Forfeit profit</span>
                </Checkbox>
              </div>
            )}
            <div className="PositionEditor-keep-leverage-settings">
              <Checkbox isChecked={keepLeverage} setIsChecked={setKeepLeverage}>
                <span className="muted">Keep leverage at {formatAmount(position.leverage, 4, 2)}x</span>
              </Checkbox>
            </div>
            {orderOption === MARKET && (
              <div className="PositionEditor-allow-higher-slippage">
                <Checkbox isChecked={isHigherSlippageAllowed} setIsChecked={setIsHigherSlippageAllowed}>
                  <span className="muted">Allow up to 1% slippage</span>
                </Checkbox>
              </div>
            )}
            {orderOption === MARKET && (
              <div>
                <ExchangeInfoRow label="Allowed Slippage">
                  <Tooltip
                    handle={`${formatAmount(allowedSlippage, 2, 2)}%`}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          You can change this in the settings menu on the top right of the page.
                          <br />
                          <br />
                          Note that a low allowed slippage, e.g. less than 0.5%, may result in failed orders if prices
                          are volatile.
                        </>
                      );
                    }}
                  />
                </ExchangeInfoRow>
              </div>
            )}
            {orderOption === STOP && (
              <div className="Exchange-info-row">
                <div className="Exchange-info-label">Trigger Price</div>
                <div className="align-right">
                  {!triggerPriceUsd && "-"}
                  {triggerPriceUsd && `${triggerPricePrefix} ${formatAmount(triggerPriceUsd, USD_DECIMALS, 2, true)}`}
                </div>
              </div>
            )}
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">Entry Price</div>
              <div className="align-right">${formatAmount(position.averagePrice, USD_DECIMALS, 2, true)}</div>
            </div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">Exit Price</div>
              <div className="align-right">${formatAmount(position.markPrice, USD_DECIMALS, 2, true)}</div>
            </div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">Liq. Price</div>
              <div className="align-right">
                {isClosing && orderOption !== STOP && "-"}
                {(!isClosing || orderOption === STOP) && (
                  <div>
                    {(!nextLiquidationPrice || nextLiquidationPrice.eq(liquidationPrice)) && (
                      <div>{`$${formatAmount(liquidationPrice, USD_DECIMALS, 2, true)}`}</div>
                    )}
                    {nextLiquidationPrice && !nextLiquidationPrice.eq(liquidationPrice) && (
                      <div>
                        <div className="inline-block muted">
                          ${formatAmount(liquidationPrice, USD_DECIMALS, 2, true)}
                          <BsArrowRight className="transition-arrow" />
                        </div>
                        ${formatAmount(nextLiquidationPrice, USD_DECIMALS, 2, true)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="Exchange-info-row top-line">
              <div className="Exchange-info-label">Size</div>
              <div className="align-right">
                {position && position.size && fromAmount && (
                  <div>
                    <div className="inline-block muted">
                      ${formatAmount(position.size, USD_DECIMALS, 2, true)}
                      <BsArrowRight className="transition-arrow" />
                    </div>
                    ${formatAmount(position.size.sub(fromAmount), USD_DECIMALS, 2, true)}
                  </div>
                )}
                {position && position.size && !fromAmount && (
                  <div>${formatAmount(position.size, USD_DECIMALS, 2, true)}</div>
                )}
              </div>
            </div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">Collateral</div>
              <div className="align-right">
                {nextCollateral && !nextCollateral.eq(position.collateral) ? (
                  <div>
                    <div className="inline-block muted">
                      ${formatAmount(position.collateral, USD_DECIMALS, 2, true)}
                      <BsArrowRight className="transition-arrow" />
                    </div>
                    ${formatAmount(nextCollateral, USD_DECIMALS, 2, true)}
                  </div>
                ) : (
                  `$${formatAmount(position.collateral, USD_DECIMALS, 4, true)}`
                )}
              </div>
            </div>
            {!keepLeverage && (
              <div className="Exchange-info-row">
                <div className="Exchange-info-label">Leverage</div>
                <div className="align-right">
                  {isClosing && "-"}
                  {!isClosing && (
                    <div>
                      {!nextLeverage && <div>{formatAmount(position.leverage, 4, 2)}x</div>}
                      {nextLeverage && (
                        <div>
                          <div className="inline-block muted">
                            {formatAmount(position.leverage, 4, 2)}x
                            <BsArrowRight className="transition-arrow" />
                          </div>
                          {formatAmount(nextLeverage, 4, 2)}x
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">PnL</div>
              <div className="align-right">
                {deltaStr} ({deltaPercentageStr})
              </div>
            </div>
            <div className="Exchange-info-row top-line">
              <div className="Exchange-info-label">Borrow Fee</div>
              <div className="align-right">${formatAmount(fundingFee, USD_DECIMALS, 2, true)}</div>
            </div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">Closing Fee</div>
              <div className="align-right">
                {positionFee && `$${formatAmount(positionFee, USD_DECIMALS, 2, true)}`}
                {!positionFee && "-"}
              </div>
            </div>
            <div className="Exchange-info-row">
              <div className="Exchange-info-label">
                Fees
              </div>
              <div className="align-right">
                <Tooltip
                  position="right-top"
                  className="PositionSeller-fees-tooltip"
                  handle={
                    <div>
                      {totalFees ? `$${formatAmount(totalFees.add(executionFeeUsd), USD_DECIMALS, 2, true)}` : "-"}
                    </div>
                  }
                  renderContent={() => (
                    <div>
                      {fundingFee && (
                        <TooltipRow label="Borrow fee" value={formatAmount(fundingFee, USD_DECIMALS, 2, true)} />
                      )}

                      {positionFee && (
                        <TooltipRow label="Closing fee" value={formatAmount(positionFee, USD_DECIMALS, 2, true)} />
                      )}

                      {swapFee && (
                        <TooltipRow
                          label="Swap fee"
                          showDollar={false}
                          value={`${formatAmount(swapFeeToken, collateralToken.decimals, 5)} ${collateralToken.symbol}
                           ($${formatAmount(swapFee, USD_DECIMALS, 2, true)})`}
                        />
                      )}

                      <TooltipRow
                        label="Execution fee"
                        showDollar={false}
                        value={`${formatAmount(executionFee, 18, 5, true)} ${nativeTokenSymbol} ($${formatAmount(
                          executionFeeUsd,
                          USD_DECIMALS,
                          2
                        )})`}
                      />

                      <br />

                      <div className="PositionSeller-fee-item">
                        <a href="https://swaps.docs.mycelium.xyz/protocol-design/trading/fees" target="_blank" rel="noopener noreferrer">
                          More Info
                        </a>{" "}
                        about fees.
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
          <div className="Exchange-swap-button-container">
            <button
              className="App-cta Exchange-swap-button"
              onClick={() => {
                const stage = getPrimaryText() === "Approve" ? 1 : 2;
                trackClosePosition(stage);
                onClickPrimary();
              }}
              disabled={!isPrimaryEnabled()}
            >
              {getPrimaryText()}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
