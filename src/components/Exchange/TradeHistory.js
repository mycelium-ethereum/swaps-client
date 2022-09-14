import React, { useEffect, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import { Link } from "react-router-dom";
import Tooltip from "../../components/Tooltip/Tooltip";
import { Text } from "../Translation/Text";

import {
  USD_DECIMALS,
  MAX_LEVERAGE,
  BASIS_POINTS_DIVISOR,
  LIQUIDATION_FEE,
  formatAmount,
  getExplorerUrl,
  formatDateTime,
  deserialize,
  getExchangeRateDisplay,
  bigNumberify,
} from "../../Helpers";
import { useTrades, useLiquidationsData } from "../../Api";
import { getContract } from "../../Addresses";

import "./TradeHistory.css";

const { AddressZero } = ethers.constants;

function getPositionDisplay(increase, indexToken, isLong, sizeDelta) {
  const symbol = indexToken ? (indexToken.isWrapped ? indexToken.baseSymbol : indexToken.symbol) : "";
  return `
    ${increase ? "Increase" : "Decrease"} ${symbol} ${isLong ? "Long" : "Short"}
    ${increase ? "+" : "-"}${formatAmount(sizeDelta, USD_DECIMALS, 2, true)} USD`;
}

function getOrderActionTitle(action) {
  let actionDisplay;

  if (action.startsWith("Create")) {
    actionDisplay = "Create";
  } else if (action.startsWith("Cancel")) {
    actionDisplay = "Cancel";
  } else {
    actionDisplay = "Update";
  }

  return `${actionDisplay} Order`;
}

function renderLiquidationTooltip(liquidationData, label) {
  const minCollateral = liquidationData.size.mul(BASIS_POINTS_DIVISOR).div(MAX_LEVERAGE);
  const text =
    liquidationData.type === "full"
      ? "This position was liquidated as the max leverage of 100x was exceeded"
      : "Max leverage of 100x was exceeded, the remaining collateral after deducting losses and fees have been sent back to your account";
  return (
    <Tooltip
      position="left-top"
      handle={label}
      renderContent={() => (
        <>
          <Text>{text}</Text>
          <br />
          <br />
          <Text>Initial collateral:</Text> ${formatAmount(liquidationData.collateral, USD_DECIMALS, 2, true)}
          <br />
          <Text>Min required collateral:</Text> ${formatAmount(minCollateral, USD_DECIMALS, 2, true)}
          <br />
          <Text>Borrow fee:</Text> ${formatAmount(liquidationData.borrowFee, USD_DECIMALS, 2, true)}
          <br />
          <Text>PnL:</Text> -${formatAmount(liquidationData.loss, USD_DECIMALS, 2, true)}
          {liquidationData.type === "full" && (
            <div>
              <Text>Liquidation fee: ${formatAmount(LIQUIDATION_FEE, 30, 2, true)}</Text>
            </div>
          )}
        </>
      )}
    />
  );
}

function getLiquidationData(liquidationsDataMap, key, timestamp) {
  return liquidationsDataMap && liquidationsDataMap[`${key}:${timestamp}`];
}

export default function TradeHistory(props) {
  const { account, infoTokens, getTokenInfo, chainId, nativeTokenAddress } = props;
  const { trades, updateTrades } = useTrades(chainId, account);

  const liquidationsData = useLiquidationsData(chainId, account);
  const liquidationsDataMap = useMemo(() => {
    if (!liquidationsData) {
      return null;
    }
    return liquidationsData.reduce((memo, item) => {
      const liquidationKey = `${item.key}:${item.timestamp}`;
      memo[liquidationKey] = item;
      return memo;
    }, {});
  }, [liquidationsData]);

  useEffect(() => {
    const interval = setInterval(() => {
      updateTrades(undefined, true);
    }, 10 * 1000);
    return () => clearInterval(interval);
  }, [updateTrades]);

  const getMsg = useCallback(
    (trade) => {
      const tradeData = trade.data;
      const params = JSON.parse(tradeData.params);
      const defaultMsg = "";

      if (tradeData.action === "BuyUSDG") {
        const token = getTokenInfo(infoTokens, params.token, true, nativeTokenAddress);
        if (!token) {
          return defaultMsg;
        }
        return `Swap ${formatAmount(params.tokenAmount, token.decimals, 4, true)} ${token.symbol} for ${formatAmount(
          params.usdgAmount,
          18,
          4,
          true
        )} USDG`;
      }

      if (tradeData.action === "SellUSDG") {
        const token = getTokenInfo(infoTokens, params.token, true, nativeTokenAddress);
        if (!token) {
          return defaultMsg;
        }
        return `Swap ${formatAmount(params.usdgAmount, 18, 4, true)} USDG for ${formatAmount(
          params.tokenAmount,
          token.decimals,
          4,
          true
        )} ${token.symbol}`;
      }

      if (tradeData.action === "Swap") {
        const tokenIn = getTokenInfo(infoTokens, params.tokenIn, true, nativeTokenAddress);
        const tokenOut = getTokenInfo(infoTokens, params.tokenOut, true, nativeTokenAddress);
        if (!tokenIn || !tokenOut) {
          return defaultMsg;
        }
        return `Swap ${formatAmount(params.amountIn, tokenIn.decimals, 4, true)} ${tokenIn.symbol} for ${formatAmount(
          params.amountOut,
          tokenOut.decimals,
          4,
          true
        )} ${tokenOut.symbol}`;
      }

      if (tradeData.action === "CreateIncreasePosition") {
        const indexToken = getTokenInfo(infoTokens, params.indexToken, true, nativeTokenAddress);
        if (!indexToken) {
          return defaultMsg;
        }

        if (bigNumberify(params.sizeDelta).eq(0)) {
          return `Request deposit into ${indexToken.symbol} ${params.isLong ? "Long" : "Short"}`;
        }

        return `Request increase ${indexToken.symbol} ${params.isLong ? "Long" : "Short"}, +${formatAmount(
          params.sizeDelta,
          USD_DECIMALS,
          2,
          true
        )} USD, Acceptable Price: ${params.isLong ? "<" : ">"} ${formatAmount(
          params.acceptablePrice,
          USD_DECIMALS,
          2,
          true
        )} USD`;
      }

      if (tradeData.action === "CreateDecreasePosition") {
        const indexToken = getTokenInfo(infoTokens, params.indexToken, true, nativeTokenAddress);
        if (!indexToken) {
          return defaultMsg;
        }

        if (bigNumberify(params.sizeDelta).eq(0)) {
          return `Request withdrawal from ${indexToken.symbol} ${params.isLong ? "Long" : "Short"}`;
        }

        return `Request decrease ${indexToken.symbol} ${params.isLong ? "Long" : "Short"}, -${formatAmount(
          params.sizeDelta,
          USD_DECIMALS,
          2,
          true
        )} USD, Acceptable Price: ${params.isLong ? ">" : "<"} ${formatAmount(
          params.acceptablePrice,
          USD_DECIMALS,
          2,
          true
        )} USD`;
      }

      if (tradeData.action === "CancelIncreasePosition") {
        const indexToken = getTokenInfo(infoTokens, params.indexToken, true, nativeTokenAddress);
        if (!indexToken) {
          return defaultMsg;
        }

        if (bigNumberify(params.sizeDelta).eq(0)) {
          return (
            <>
              Could not execute deposit into {indexToken.symbol} {params.isLong ? "Long" : "Short"}
            </>
          );
        }

        return (
          <>
            <Text>Could not increase</Text> {indexToken.symbol} <Text>{params.isLong ? "Long" : "Short"}</Text>,
            {`+${formatAmount(params.sizeDelta, USD_DECIMALS, 2, true)}`} USD, <Text>Acceptable Price:</Text>&nbsp;
            {params.isLong ? "<" : ">"}&nbsp;
            <Tooltip
              position="left-top"
              handle={`${formatAmount(params.acceptablePrice, USD_DECIMALS, 2, true)} USD`}
              renderContent={() => (
                <Text>Try increasing the "Allowed Slippage", under the Settings menu on the top right</Text>
              )}
            />
          </>
        );
      }

      if (tradeData.action === "CancelDecreasePosition") {
        const indexToken = getTokenInfo(infoTokens, params.indexToken, true, nativeTokenAddress);
        if (!indexToken) {
          return defaultMsg;
        }

        if (bigNumberify(params.sizeDelta).eq(0)) {
          return `Could not execute withdrawal from ${indexToken.symbol} ${params.isLong ? "Long" : "Short"}`;
        }

        return (
          <>
            <Text>Could not decrease</Text> {indexToken.symbol} <Text>{params.isLong ? "Long" : "Short"}</Text>,
            {`+${formatAmount(params.sizeDelta, USD_DECIMALS, 2, true)}`} USD, <Text>Acceptable Price:</Text>&nbsp;
            {params.isLong ? ">" : "<"}&nbsp;
            <Tooltip
              position="left-top"
              handle={`${formatAmount(params.acceptablePrice, USD_DECIMALS, 2, true)} USD`}
              renderContent={() => (
                <Text>Try increasing the "Allowed Slippage", under the Settings menu on the top right</Text>
              )}
            />
          </>
        );
      }

      if (tradeData.action === "IncreasePosition-Long" || tradeData.action === "IncreasePosition-Short") {
        if (params.flags?.isOrderExecution) {
          return;
        }

        const indexToken = getTokenInfo(infoTokens, params.indexToken, true, nativeTokenAddress);
        if (!indexToken) {
          return defaultMsg;
        }
        if (bigNumberify(params.sizeDelta).eq(0)) {
          return `Deposit ${formatAmount(params.collateralDelta, USD_DECIMALS, 2, true)} USD into ${
            indexToken.symbol
          } ${params.isLong ? "Long" : "Short"}`;
        }
        return `Increase ${indexToken.symbol} ${params.isLong ? "Long" : "Short"}, +${formatAmount(
          params.sizeDelta,
          USD_DECIMALS,
          2,
          true
        )} USD, ${indexToken.symbol} Price: ${formatAmount(params.price, USD_DECIMALS, 2, true)} USD`;
      }

      if (tradeData.action === "DecreasePosition-Long" || tradeData.action === "DecreasePosition-Short") {
        if (params.flags?.isOrderExecution) {
          return;
        }

        const indexToken = getTokenInfo(infoTokens, params.indexToken, true, nativeTokenAddress);
        if (!indexToken) {
          return defaultMsg;
        }
        if (bigNumberify(params.sizeDelta).eq(0)) {
          return `Withdraw ${formatAmount(params.collateralDelta, USD_DECIMALS, 2, true)} USD from ${
            indexToken.symbol
          } ${params.isLong ? "Long" : "Short"}`;
        }
        const isLiquidation = params.flags?.isLiquidation;
        const liquidationData = getLiquidationData(liquidationsDataMap, params.key, tradeData.timestamp);

        if (isLiquidation && liquidationData) {
          return (
            <>
              {renderLiquidationTooltip(liquidationData, "Partial Liquidation")} {indexToken.symbol}{" "}
              {params.isLong ? "Long" : "Short"}, -{formatAmount(params.sizeDelta, USD_DECIMALS, 2, true)} USD,{" "}
              {indexToken.symbol}&nbsp; Price: ${formatAmount(params.price, USD_DECIMALS, 2, true)} USD
            </>
          );
        }
        const actionDisplay = isLiquidation ? "Partially Liquidated" : "Decreased";
        return `
        ${actionDisplay} ${indexToken.symbol} ${params.isLong ? "Long" : "Short"},
        -${formatAmount(params.sizeDelta, USD_DECIMALS, 2, true)} USD,
        ${indexToken.symbol} Price: ${formatAmount(params.price, USD_DECIMALS, 2, true)} USD
      `;
      }

      if (tradeData.action === "LiquidatePosition-Long" || tradeData.action === "LiquidatePosition-Short") {
        const indexToken = getTokenInfo(infoTokens, params.indexToken, true, nativeTokenAddress);
        if (!indexToken) {
          return defaultMsg;
        }
        const liquidationData = getLiquidationData(liquidationsDataMap, params.key, tradeData.timestamp);
        if (liquidationData) {
          return (
            <>
              {renderLiquidationTooltip(liquidationData, "Liquidated")} {indexToken.symbol}{" "}
              {params.isLong ? "Long" : "Short"}, -{formatAmount(params.size, USD_DECIMALS, 2, true)} USD,&nbsp;
              {indexToken.symbol} Price: ${formatAmount(params.markPrice, USD_DECIMALS, 2, true)} USD
            </>
          );
        }
        return `
        Liquidated ${indexToken.symbol} ${params.isLong ? "Long" : "Short"},
        -${formatAmount(params.size, USD_DECIMALS, 2, true)} USD,
        ${indexToken.symbol} Price: ${formatAmount(params.markPrice, USD_DECIMALS, 2, true)} USD
      `;
      }

      if (["ExecuteIncreaseOrder", "ExecuteDecreaseOrder"].includes(tradeData.action)) {
        const order = deserialize(params.order);
        const indexToken = getTokenInfo(infoTokens, order.indexToken, true, nativeTokenAddress);
        if (!indexToken) {
          return defaultMsg;
        }
        const longShortDisplay = order.isLong ? "Long" : "Short";
        const executionPriceDisplay = formatAmount(order.executionPrice, USD_DECIMALS, 2, true);
        const sizeDeltaDisplay = `${order.type === "Increase" ? "+" : "-"}${formatAmount(
          order.sizeDelta,
          USD_DECIMALS,
          2,
          true
        )}`;

        return `
        Execute Order: ${order.type} ${indexToken.symbol} ${longShortDisplay}
        ${sizeDeltaDisplay} USD, Price: ${executionPriceDisplay} USD
      `;
      }

      if (
        [
          "CreateIncreaseOrder",
          "CancelIncreaseOrder",
          "UpdateIncreaseOrder",
          "CreateDecreaseOrder",
          "CancelDecreaseOrder",
          "UpdateDecreaseOrder",
        ].includes(tradeData.action)
      ) {
        const order = deserialize(params.order);
        const indexToken = getTokenInfo(infoTokens, order.indexToken);
        if (!indexToken) {
          return defaultMsg;
        }
        const increase = tradeData.action.includes("Increase");
        const priceDisplay = `${order.triggerAboveThreshold ? ">" : "<"} ${formatAmount(
          order.triggerPrice,
          USD_DECIMALS,
          2,
          true
        )}`;
        return `
        ${getOrderActionTitle(tradeData.action)}:
        ${getPositionDisplay(increase, indexToken, order.isLong, order.sizeDelta)},
        Price: ${priceDisplay}
      `;
      }

      if (tradeData.action === "ExecuteSwapOrder") {
        const order = deserialize(params.order);
        const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
        const fromToken = getTokenInfo(infoTokens, order.path[0] === nativeTokenAddress ? AddressZero : order.path[0]);
        const toToken = getTokenInfo(infoTokens, order.shouldUnwrap ? AddressZero : order.path[order.path.length - 1]);
        if (!fromToken || !toToken) {
          return defaultMsg;
        }
        const fromAmountDisplay = formatAmount(order.amountIn, fromToken.decimals, fromToken.isStable ? 2 : 4, true);
        const toAmountDisplay = formatAmount(order.amountOut, toToken.decimals, toToken.isStable ? 2 : 4, true);
        return `
        Execute Order: Swap ${fromAmountDisplay} ${fromToken.symbol} for ${toAmountDisplay} ${toToken.symbol}
      `;
      }

      if (["CreateSwapOrder", "UpdateSwapOrder", "CancelSwapOrder"].includes(tradeData.action)) {
        const order = deserialize(params.order);
        const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");
        const fromToken = getTokenInfo(infoTokens, order.path[0] === nativeTokenAddress ? AddressZero : order.path[0]);
        const toToken = getTokenInfo(infoTokens, order.shouldUnwrap ? AddressZero : order.path[order.path.length - 1]);
        if (!fromToken || !toToken) {
          return defaultMsg;
        }
        const amountInDisplay = fromToken
          ? formatAmount(order.amountIn, fromToken.decimals, fromToken.isStable ? 2 : 4, true)
          : "";
        const minOutDisplay = toToken
          ? formatAmount(order.minOut, toToken.decimals, toToken.isStable ? 2 : 4, true)
          : "";

        return `
        ${getOrderActionTitle(tradeData.action)}:
        Swap ${amountInDisplay} ${fromToken?.symbol || ""} for ${minOutDisplay} ${toToken?.symbol || ""},
        Price: ${getExchangeRateDisplay(order.triggerRatio, fromToken, toToken)}`;
      }
    },
    [getTokenInfo, infoTokens, nativeTokenAddress, chainId, liquidationsDataMap]
  );

  const tradesWithMessages = useMemo(() => {
    if (!trades) {
      return [];
    }

    return trades
      .map((trade) => ({
        msg: getMsg(trade),
        ...trade,
      }))
      .filter((trade) => trade.msg);
  }, [trades, getMsg]);

  return (
    <div className="TradeHistory">
      {tradesWithMessages.length === 0 && (
        <div className="Exchange-empty-positions-list-note App-card">
          <Text>No trades yet</Text>
        </div>
      )}
      {tradesWithMessages.length > 0 &&
        tradesWithMessages.map((trade, index) => {
          const tradeData = trade.data;
          const txUrl = getExplorerUrl(chainId) + "tx/" + tradeData.tx_hash;

          let msg = getMsg(trade);

          if (!msg) {
            return null;
          }

          return (
            <div className="TradeHistory-row App-box App-box-border" key={index}>
              <div>
                <div className="muted TradeHistory-time">
                  {formatDateTime(tradeData.timestamp)}
                  {(!account || account.length === 0) && (
                    <span>
                      {" "}
                      (<Link to={`/actions/${tradeData.account}`}>{tradeData.account}</Link>)
                    </span>
                  )}
                </div>
                <a className="plain" href={txUrl} target="_blank" rel="noopener noreferrer">
                  <Text>{msg}</Text>
                </a>
              </div>
            </div>
          );
        })}
    </div>
  );
}
