import cx from "classnames";
import { formatAmount, USD_DECIMALS, getTokenInfo, CHART_PERIODS } from "../../../Helpers";
import ChartTokenSelector from "../ChartTokenSelector";
import Tab from "../../Tab/Tab";
import { ChartToggle } from "./ChartToggle";

export const ExchangeHeader = (props) => {
  const {
    priceData,
    currentAveragePrice,
    setChartToken,
    setToTokenAddress,
    swapOption,
    chainId,
    chartToken,
    trackAction,
    period,
    setPeriod,
    infoTokens,
    selectedChart,
    setSelectedChart,
  } = props;

  let high;
  let low;
  let deltaPrice;
  let delta;
  let deltaPercentage;
  let deltaPercentageStr;

  const now = parseInt(Date.now() / 1000);
  const timeThreshold = now - 24 * 60 * 60;

  if (priceData) {
    for (let i = priceData.length - 1; i > 0; i--) {
      const price = priceData[i];
      if (price.time < timeThreshold) {
        break;
      }
      if (!low) {
        low = price.low;
      }
      if (!high) {
        high = price.high;
      }

      if (price.high > high) {
        high = price.high;
      }
      if (price.low < low) {
        low = price.low;
      }

      deltaPrice = price.open;
    }
  }

  if (deltaPrice && currentAveragePrice) {
    const average = parseFloat(formatAmount(currentAveragePrice, USD_DECIMALS, 2));
    delta = average - deltaPrice;
    deltaPercentage = (delta * 100) / average;
    if (deltaPercentage > 0) {
      deltaPercentageStr = `+${deltaPercentage.toFixed(2)}%`;
    } else {
      deltaPercentageStr = `${deltaPercentage.toFixed(2)}%`;
    }
    if (deltaPercentage === 0) {
      deltaPercentageStr = "0.00";
    }
  }

  const onSelectToken = (token) => {
    const tmp = getTokenInfo(infoTokens, token.address);
    setChartToken(tmp);
    setToTokenAddress(swapOption, token.address);
  };

  return (
    <>
      <div className="ExchangeChart-top App-box App-box-border">
        <div className="ExchangeChart-top-inner">
          <div>
            <div className="ExchangeChart-title">
              <ChartTokenSelector
                chainId={chainId}
                selectedToken={chartToken}
                swapOption={swapOption}
                infoTokens={infoTokens}
                onSelectToken={onSelectToken}
                className="chart-token-selector"
                trackAction={trackAction}
              />
            </div>
          </div>
          <div>
            <div className="ExchangeChart-main-price">
              {chartToken.maxPrice && formatAmount(chartToken.maxPrice, USD_DECIMALS, 2)}
            </div>
            <div className="ExchangeChart-info-label">
              ${chartToken.minPrice && formatAmount(chartToken.minPrice, USD_DECIMALS, 2)}
            </div>
          </div>
          <div>
            <div className={cx({ positive: deltaPercentage > 0, negative: deltaPercentage < 0 })}>
              {!deltaPercentageStr && "-"}
              {deltaPercentageStr && deltaPercentageStr}
            </div>
            <div className="ExchangeChart-info-label">24h Change</div>
          </div>
          <div className="ExchangeChart-additional-info">
            <div>
              {!high && "-"}
              {high && high.toFixed(2)}
            </div>
            <div className="ExchangeChart-info-label">24h High</div>
          </div>
          <div className="ExchangeChart-additional-info">
            <div>
              {!low && "-"}
              {low && low.toFixed(2)}
            </div>
            <div className="ExchangeChart-info-label">24h Low</div>
          </div>
        </div>
      </div>
      <div className="ExchangeChart-top-controls">
        <Tab options={Object.keys(CHART_PERIODS)} option={period} setOption={setPeriod} trackAction={trackAction} />
        <ChartToggle selectedChart={selectedChart} setSelectedChart={setSelectedChart} />
      </div>
    </>
  );
};
