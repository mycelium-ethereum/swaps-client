import React, { useState } from "react";
import cx from "classnames";
import { Text } from "../Translation/Text";

import Tooltip from "../Tooltip/Tooltip";
import PositionSeller from "./PositionSeller";
import PositionEditor from "./PositionEditor";
import OrdersToa from "./OrdersToa";

import { ImSpinner2 } from "react-icons/im";

import {
  helperToast,
  bigNumberify,
  getLiquidationPrice,
  getUsd,
  getLeverage,
  formatAmount,
  USD_DECIMALS,
  FUNDING_RATE_PRECISION,
  SWAP,
  LONG,
  SHORT,
  INCREASE,
  DECREASE,
} from "../../Helpers";

const getOrdersForPosition = (position, orders, nativeTokenAddress) => {
  if (!orders || orders.length === 0) {
    return [];
  }
  /* eslint-disable array-callback-return */
  return orders
    .filter((order) => {
      if (order.type === SWAP) {
        return false;
      }
      const hasMatchingIndexToken =
        order.indexToken === nativeTokenAddress
          ? position.indexToken.isNative
          : order.indexToken === position.indexToken.address;
      const hasMatchingCollateralToken =
        order.collateralToken === nativeTokenAddress
          ? position.collateralToken.isNative
          : order.collateralToken === position.collateralToken.address;
      if (order.isLong === position.isLong && hasMatchingIndexToken && hasMatchingCollateralToken) {
        return true;
      }
    })
    .map((order) => {
      if (order.type === DECREASE && order.sizeDelta.gt(position.size)) {
        order.error = "Order size exceeds position size, order cannot be executed";
      }
      return order;
    });
};

export default function PositionsList(props) {
  const {
    pendingPositions,
    setPendingPositions,
    positions,
    positionsDataIsLoading,
    positionsMap,
    infoTokens,
    active,
    account,
    library,
    pendingTxns,
    setPendingTxns,
    setListSection,
    flagOrdersEnabled,
    savedIsPnlInLeverage,
    chainId,
    nativeTokenAddress,
    orders,
    setIsWaitingForPluginApproval,
    approveOrderBook,
    isPluginApproving,
    isWaitingForPluginApproval,
    orderBookApproved,
    positionRouterApproved,
    isWaitingForPositionRouterApproval,
    isPositionRouterApproving,
    approvePositionRouter,
    showPnlAfterFees,
    setMarket,
    trackAction,
    usdgSupply,
    totalTokenWeights,
  } = props;

  const [positionToEditKey, setPositionToEditKey] = useState(undefined);
  const [positionToSellKey, setPositionToSellKey] = useState(undefined);
  const [isPositionEditorVisible, setIsPositionEditorVisible] = useState(undefined);
  const [isPositionSellerVisible, setIsPositionSellerVisible] = useState(undefined);
  const [collateralTokenAddress, setCollateralTokenAddress] = useState(undefined);
  const [ordersToaOpen, setOrdersToaOpen] = useState(false);
  const [isHigherSlippageAllowed, setIsHigherSlippageAllowed] = useState(false);

  const editPosition = (position) => {
    setCollateralTokenAddress(position.collateralToken.address);
    setPositionToEditKey(position.key);
    setIsPositionEditorVisible(true);
  };

  const sellPosition = (position) => {
    setPositionToSellKey(position.key);
    setIsPositionSellerVisible(true);
    setIsHigherSlippageAllowed(false);
  };

  const onPositionClick = (position) => {
    helperToast.success(
      <>
        <Text>{position.isLong ? "Long" : "Short"}</Text> {position.indexToken.symbol} <Text>market selected</Text>
      </>
    );
    setMarket(position.isLong ? LONG : SHORT, position.indexToken.address);
  };

  return (
    <div className="PositionsList">
      <PositionEditor
        pendingPositions={pendingPositions}
        setPendingPositions={setPendingPositions}
        positionsMap={positionsMap}
        positionKey={positionToEditKey}
        isVisible={isPositionEditorVisible}
        setIsVisible={setIsPositionEditorVisible}
        infoTokens={infoTokens}
        active={active}
        account={account}
        library={library}
        collateralTokenAddress={collateralTokenAddress}
        pendingTxns={pendingTxns}
        setPendingTxns={setPendingTxns}
        getUsd={getUsd}
        getLeverage={getLeverage}
        savedIsPnlInLeverage={savedIsPnlInLeverage}
        positionRouterApproved={positionRouterApproved}
        isPositionRouterApproving={isPositionRouterApproving}
        isWaitingForPositionRouterApproval={isWaitingForPositionRouterApproval}
        approvePositionRouter={approvePositionRouter}
        chainId={chainId}
        trackAction={trackAction}
      />
      {ordersToaOpen && (
        <OrdersToa
          setIsVisible={setOrdersToaOpen}
          approveOrderBook={approveOrderBook}
          isPluginApproving={isPluginApproving}
        />
      )}
      {isPositionSellerVisible && (
        <PositionSeller
          pendingPositions={pendingPositions}
          setPendingPositions={setPendingPositions}
          setIsWaitingForPluginApproval={setIsWaitingForPluginApproval}
          approveOrderBook={approveOrderBook}
          isPluginApproving={isPluginApproving}
          isWaitingForPluginApproval={isWaitingForPluginApproval}
          orderBookApproved={orderBookApproved}
          positionsMap={positionsMap}
          positionKey={positionToSellKey}
          isVisible={isPositionSellerVisible}
          setIsVisible={setIsPositionSellerVisible}
          infoTokens={infoTokens}
          active={active}
          account={account}
          orders={orders}
          library={library}
          pendingTxns={pendingTxns}
          setPendingTxns={setPendingTxns}
          flagOrdersEnabled={flagOrdersEnabled}
          savedIsPnlInLeverage={savedIsPnlInLeverage}
          chainId={chainId}
          nativeTokenAddress={nativeTokenAddress}
          setOrdersToaOpen={setOrdersToaOpen}
          positionRouterApproved={positionRouterApproved}
          isPositionRouterApproving={isPositionRouterApproving}
          isWaitingForPositionRouterApproval={isWaitingForPositionRouterApproval}
          approvePositionRouter={approvePositionRouter}
          isHigherSlippageAllowed={isHigherSlippageAllowed}
          setIsHigherSlippageAllowed={setIsHigherSlippageAllowed}
          trackAction={trackAction}
          usdgSupply={usdgSupply}
          totalTokenWeights={totalTokenWeights}
          showPnlAfterFees={showPnlAfterFees}
        />
      )}
      {positions && (
        <div className="Exchange-list small">
          <div>
            {positions.length === 0 && positionsDataIsLoading && (
              <div className="Exchange-empty-positions-list-note App-card">
                <Text>Loading...</Text>
              </div>
            )}
            {positions.length === 0 && !positionsDataIsLoading && (
              <div className="Exchange-empty-positions-list-note App-card">
                <Text>No open positions</Text>
              </div>
            )}
            {positions.map((position) => {
              const positionOrders = getOrdersForPosition(position, orders, nativeTokenAddress);
              const liquidationPrice = getLiquidationPrice(position);
              const hasPositionProfit = position[showPnlAfterFees ? "hasProfitAfterFees" : "hasProfit"];
              const positionDelta =
                position[showPnlAfterFees ? "pendingDeltaAfterFees" : "pendingDelta"] || bigNumberify(0);
              let borrowFeeText;
              if (position.collateralToken && position.collateralToken.fundingRate) {
                const borrowFeeRate = position.collateralToken.fundingRate
                  .mul(position.size)
                  .mul(24)
                  .div(FUNDING_RATE_PRECISION);
                borrowFeeText = (
                  <>
                    <Text>Borrow Fee / Day:</Text> ${formatAmount(borrowFeeRate, USD_DECIMALS, 2)}
                  </>
                );
              }

              return (
                <div key={position.key} className="App-card">
                  <div className="App-card-title">
                    <span className="Exchange-list-title">{position.indexToken.symbol}</span>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-content">
                    <div className="App-card-row">
                      <div className="label">
                        <Text>Leverage</Text>
                      </div>
                      <div>
                        {formatAmount(position.leverage, 4, 2, true)}x&nbsp;
                        <span
                          className={cx("Exchange-list-side", {
                            positive: position.isLong,
                            negative: !position.isLong,
                          })}
                        >
                          <Text>{position.isLong ? "Long" : "Short"}</Text>
                        </span>
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Text>Size</Text>
                      </div>
                      <div>${formatAmount(position.size, USD_DECIMALS, 2, true)}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Text>Collateral</Text>
                      </div>
                      <div>
                        <Tooltip
                          handle={`$${formatAmount(position.collateralAfterFee, USD_DECIMALS, 2, true)}`}
                          position="right-bottom"
                          handleClassName={cx("plain", { negative: position.hasLowCollateral })}
                          renderContent={() => {
                            return (
                              <>
                                {position.hasLowCollateral && (
                                  <div>
                                    <Text>
                                      WARNING: This position has a low amount of collateral after deducting borrowing
                                      fees, deposit more collateral to reduce the position's liquidation risk.
                                    </Text>
                                    <br />
                                    <br />
                                  </div>
                                )}
                                <Text>Initial Collateral:</Text> $
                                {formatAmount(position.collateral, USD_DECIMALS, 2, true)}
                                <br />
                                <Text>Borrow Fee:</Text> ${formatAmount(position.fundingFee, USD_DECIMALS, 2, true)}
                                {borrowFeeText && <div>{borrowFeeText}</div>}
                                <br />
                                <Text>Use the "Edit" button to deposit or withdraw collateral.</Text>
                              </>
                            );
                          }}
                        />
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Text>PnL</Text>
                      </div>
                      <div>
                        <span
                          className={cx("Exchange-list-info-label", {
                            positive: hasPositionProfit && positionDelta.gt(0),
                            negative: !hasPositionProfit && positionDelta.gt(0),
                            muted: positionDelta.eq(0),
                          })}
                        >
                          {position.deltaStr} ({position.deltaPercentageStr})
                        </span>
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Text>Net Value</Text>
                      </div>
                      <div>
                        <Tooltip
                          handle={`$${formatAmount(position.netValue, USD_DECIMALS, 2, true)}`}
                          position="right-bottom"
                          handleClassName="plain"
                          renderContent={() => {
                            return (
                              <>
                                <Text>Net Value:</Text>{" "}
                                <Text>
                                  {showPnlAfterFees
                                    ? "Initial Collateral - Fees + PnL"
                                    : "Initial Collateral - Borrow Fee + PnL"}
                                </Text>
                                <br />
                                <br />
                                <Text>Initial Collateral:</Text> $
                                {formatAmount(position.collateral, USD_DECIMALS, 2, true)}
                                <br />
                                <Text>PnL:</Text> {position.deltaBeforeFeesStr}
                                <br />
                                <Text>Borrow Fee:</Text> ${formatAmount(position.fundingFee, USD_DECIMALS, 2, true)}
                                <br />
                                <Text>Open + Close fee:</Text> $
                                {formatAmount(position.positionFee, USD_DECIMALS, 2, true)}
                                <br />
                                <Text>PnL After Fees:</Text> {position.deltaAfterFeesStr} (
                                {position.deltaAfterFeesPercentageStr})
                              </>
                            );
                          }}
                        />
                      </div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Text>Orders</Text>
                      </div>
                      <div>
                        {positionOrders.length === 0 && "None"}
                        {positionOrders.map((order) => {
                          return (
                            <div key={`${order.isLong}-${order.type}-${order.index}`} className="Position-list-order">
                              {order.triggerAboveThreshold ? ">" : "<"} {formatAmount(order.triggerPrice, 30, 2, true)}:
                              {order.type === INCREASE ? " +" : " -"}${formatAmount(order.sizeDelta, 30, 2, true)}
                              {order.error && (
                                <>
                                  ,{" "}
                                  <span className="negative">
                                    <Text>{order.error}</Text>
                                  </span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-content">
                    <div className="App-card-row">
                      <div className="label">
                        <Text>Mark Price</Text>
                      </div>
                      <div>${formatAmount(position.markPrice, USD_DECIMALS, 2, true)}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Text>Entry Price</Text>
                      </div>
                      <div>${formatAmount(position.averagePrice, USD_DECIMALS, 2, true)}</div>
                    </div>
                    <div className="App-card-row">
                      <div className="label">
                        <Text>Liq. Price</Text>
                      </div>
                      <div>${formatAmount(liquidationPrice, USD_DECIMALS, 2, true)}</div>
                    </div>
                  </div>
                  <div className="App-card-divider"></div>
                  <div className="App-card-options">
                    <button
                      className="App-button-option App-card-option"
                      onClick={() => editPosition(position)}
                      disabled={position.size.eq(0) || position.hasPendingChanges}
                    >
                      <Text>Edit</Text>
                    </button>
                    <button
                      className="App-button-option App-card-option"
                      onClick={() => sellPosition(position)}
                      disabled={position.size.eq(0) || position.hasPendingChanges}
                    >
                      <Text>Close</Text>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="large App-box">
        <table className="Exchange-list large">
          <tbody>
            <tr className="Exchange-list-header">
              <th>
                <Text>Position</Text>
              </th>
              <th>
                <Text>Net Value</Text>
              </th>
              <th>
                <Text>Size</Text>
              </th>
              <th>
                <Text>Collateral</Text>
              </th>
              <th>
                <Text>Mark Price</Text>
              </th>
              <th>
                <Text>Entry Price</Text>
              </th>
              <th>
                <Text>Liq. Price</Text>
              </th>
              <th></th>
              <th></th>
            </tr>
            {positions.length === 0 && positionsDataIsLoading && (
              <tr>
                <td colSpan="15">
                  <div className="Exchange-empty-positions-list-note">
                    <Text>Loading...</Text>
                  </div>
                </td>
              </tr>
            )}
            {positions.length === 0 && !positionsDataIsLoading && (
              <tr>
                <td colSpan="15">
                  <div className="Exchange-empty-positions-list-note">
                    <Text>No open positions</Text>
                  </div>
                </td>
              </tr>
            )}
            {positions.map((position) => {
              const liquidationPrice = getLiquidationPrice(position) || bigNumberify(0);
              const positionOrders = getOrdersForPosition(position, orders, nativeTokenAddress);
              const hasOrderError = !!positionOrders.find((order) => order.error);
              const hasPositionProfit = position[showPnlAfterFees ? "hasProfitAfterFees" : "hasProfit"];
              const positionDelta =
                position[showPnlAfterFees ? "pendingDeltaAfterFees" : "pendingDelta"] || bigNumberify(0);
              let borrowFeeText;
              if (position.collateralToken && position.collateralToken.fundingRate) {
                const borrowFeeRate = position.collateralToken.fundingRate
                  .mul(position.size)
                  .mul(24)
                  .div(FUNDING_RATE_PRECISION);
                borrowFeeText = (
                  <>
                    <Text>Borrow Fee / Day:</Text> ${formatAmount(borrowFeeRate, USD_DECIMALS, 2)}
                  </>
                );
              }

              return (
                <tr key={position.key}>
                  <td className="clickable" onClick={() => onPositionClick(position)}>
                    <div className="Exchange-list-title">
                      {position.indexToken.symbol}
                      {position.hasPendingChanges && <ImSpinner2 className="spin position-loading-icon" />}
                    </div>
                    <div className="Exchange-list-info-label">
                      {position.leverage && (
                        <span className="muted">{formatAmount(position.leverage, 4, 2, true)}x&nbsp;</span>
                      )}
                      <span className={cx({ positive: position.isLong, negative: !position.isLong })}>
                        <Text>{position.isLong ? "Long" : "Short"}</Text>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div>
                      {!position.netValue && "Opening..."}
                      {position.netValue && (
                        <Tooltip
                          handle={`$${formatAmount(position.netValue, USD_DECIMALS, 2, true)}`}
                          position="left-bottom"
                          handleClassName="plain"
                          renderContent={() => {
                            return (
                              <>
                                <Text>
                                  Net Value:{" "}
                                  {showPnlAfterFees
                                    ? "Initial Collateral - Fees + PnL"
                                    : "Initial Collateral - Borrow Fee + PnL"}
                                </Text>
                                <br />
                                <br />
                                <Text>Initial Collateral:</Text> $
                                {formatAmount(position.collateral, USD_DECIMALS, 2, true)}
                                <br />
                                <Text>PnL:</Text> {position.deltaBeforeFeesStr}
                                <br />
                                <Text>Borrow Fee:</Text> ${formatAmount(position.fundingFee, USD_DECIMALS, 2, true)}
                                <br />
                                <Text>Open + Close fee:</Text> $
                                {formatAmount(position.positionFee, USD_DECIMALS, 2, true)}
                                <br />
                                <br />
                                <Text>PnL After Fees:</Text> {position.deltaAfterFeesStr} (
                                {position.deltaAfterFeesPercentageStr})
                              </>
                            );
                          }}
                        />
                      )}
                    </div>
                    {position.deltaStr && (
                      <div
                        className={cx("Exchange-list-info-label", {
                          positive: hasPositionProfit && positionDelta.gt(0),
                          negative: !hasPositionProfit && positionDelta.gt(0),
                          muted: positionDelta.eq(0),
                        })}
                      >
                        {position.deltaStr} ({position.deltaPercentageStr})
                      </div>
                    )}
                  </td>
                  <td>
                    <div>${formatAmount(position.size, USD_DECIMALS, 2, true)}</div>
                    {positionOrders.length > 0 && (
                      <div onClick={() => setListSection && setListSection("Orders")}>
                        <Tooltip
                          handle={`Orders (${positionOrders.length})`}
                          position="left-bottom"
                          handleClassName={cx(
                            ["Exchange-list-info-label", "Exchange-position-list-orders", "plain", "clickable"],
                            { muted: !hasOrderError, negative: hasOrderError }
                          )}
                          renderContent={() => {
                            return (
                              <>
                                <strong>
                                  <Text>Active Orders</Text>
                                </strong>
                                {positionOrders.map((order) => {
                                  return (
                                    <div
                                      key={`${order.isLong}-${order.type}-${order.index}`}
                                      className="Position-list-order"
                                    >
                                      {order.triggerAboveThreshold ? ">" : "<"}{" "}
                                      {formatAmount(order.triggerPrice, 30, 2, true)}:
                                      {order.type === INCREASE ? " +" : " -"}$
                                      {formatAmount(order.sizeDelta, 30, 2, true)}
                                      {order.error && (
                                        <>
                                          ,{" "}
                                          <span className="negative">
                                            <Text>{order.error}</Text>
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </>
                            );
                          }}
                        />
                      </div>
                    )}
                  </td>
                  <td>
                    <Tooltip
                      handle={`$${formatAmount(position.collateralAfterFee, USD_DECIMALS, 2, true)}`}
                      position="left-bottom"
                      handleClassName={cx("plain", { negative: position.hasLowCollateral })}
                      renderContent={() => {
                        return (
                          <>
                            {position.hasLowCollateral && (
                              <div>
                                <Text>
                                  WARNING: This position has a low amount of collateral after deducting borrowing fees,
                                  deposit more collateral to reduce the position's liquidation risk.
                                </Text>
                                <br />
                                <br />
                              </div>
                            )}
                            <Text>Initial Collateral:</Text> ${formatAmount(position.collateral, USD_DECIMALS, 2, true)}
                            <br />
                            <Text>Borrow Fee:</Text> ${formatAmount(position.fundingFee, USD_DECIMALS, 2, true)}
                            {borrowFeeText && (
                              <div>
                                <Text>{borrowFeeText}</Text>
                              </div>
                            )}
                            <br />
                            <Text>Use the "Edit" button to deposit or withdraw collateral.</Text>
                          </>
                        );
                      }}
                    />
                  </td>
                  <td className="clickable" onClick={() => onPositionClick(position)}>
                    <Tooltip
                      handle={`$${formatAmount(position.markPrice, USD_DECIMALS, 2, true)}`}
                      position="left-bottom"
                      handleClassName="plain clickable"
                      renderContent={() => {
                        return (
                          <>
                            <Text>
                              Click on a row to select the position's market, then use the swap box to increase your
                              position size if needed.
                            </Text>
                            <br />
                            <br />
                            <Text>
                              Use the "Close" button to reduce your position size, or to set stop-loss / take-profit
                              orders.
                            </Text>
                          </>
                        );
                      }}
                    />
                  </td>
                  <td className="clickable" onClick={() => onPositionClick(position)}>
                    ${formatAmount(position.averagePrice, USD_DECIMALS, 2, true)}
                  </td>
                  <td className="clickable" onClick={() => onPositionClick(position)}>
                    ${formatAmount(liquidationPrice, USD_DECIMALS, 2, true)}
                  </td>
                  <td>
                    <button
                      className="Exchange-list-action"
                      onClick={() => {
                        trackAction("Button clicked", { buttonName: "Edit Position" });
                        editPosition(position);
                      }}
                      disabled={position.size.eq(0) || position.hasPendingChanges}
                    >
                      <Text>Edit</Text>
                    </button>
                  </td>
                  <td>
                    <button
                      className="Exchange-list-action"
                      onClick={() => {
                        trackAction("Button clicked", { buttonName: "Close Position" });
                        sellPosition(position);
                      }}
                      disabled={position.size.eq(0) || position.hasPendingChanges}
                    >
                      <Text>Close</Text>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
