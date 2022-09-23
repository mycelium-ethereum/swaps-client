import React, { useState, useEffect, useMemo, useCallback } from "react";
import cx from "classnames";
import { widget } from "../../../charting_library";
import { generateDataFeed, supportedResolutions } from "../../../Api/TradingView";
import ChartTokenSelector from "../ChartTokenSelector";

import { USD_DECIMALS, getTokenInfo, formatAmount } from "../../../Helpers";

const getLanguageFromURL = () => {
  const regex = new RegExp("[\\?&]lang=([^&#]*)");
  const results = regex.exec(window.location.search);
  return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
};

const translateLightweightChartPeriod = (period) => {
  switch (period) {
    case "5m":
      return supportedResolutions[0]; // 5
    case "15m":
      return supportedResolutions[1]; // 15
    case "1h":
      return supportedResolutions[2]; //60
    case "4h":
      return supportedResolutions[3]; // 240
    case "1d":
      return supportedResolutions[4]; // 1d
    default:
      return supportedResolutions[3]; // 240
  }
};

export default function ExchangeAdvancedTVChart(props) {
  const {
    chartToken,
    setChartToken,
    priceData,
    updatePriceData,
    period,
    setPeriod,
    infoTokens,
    setToTokenAddress,
    swapOption,
    chainId,
    currentAveragePrice,
    trackAction,
  } = props;
  const defaultProps = useMemo(
    () => ({
      symbol: "0x00000:default/market",
      interval: "1D",
      container: "tv_chart_container",
      charts_storage_url: "",
      charts_storage_api_version: "1.1",
      client_id: "tradingview.com",
      user_id: "public_user_id",
      fullscreen: false,
      autosize: true,
      studies_overrides: {},
    }),
    []
  );
  const [tvWidget, setTvWidget] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [prevPeriod, setPrevPeriod] = useState(period);
  const [prevToken, setPrevToken] = useState(chartToken?.address);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     updatePriceData(undefined, true);
  //   }, 60 * 1000);
  //   return () => clearInterval(interval);
  // }, [updatePriceData]);

  const dataFeed = useMemo(() => generateDataFeed(priceData), [priceData]);

  const createChart = useCallback(() => {
    const widgetOptions = {
      ...defaultProps,
      symbol: `${chartToken?.address}:${chartToken?.symbol}/USD`,
      debug: false,
      datafeed: dataFeed,
      // interval: period.toUpperCase(),
      interval: period,
      container: "tv_chart_container",
      library_path: process.env.NODE_ENV === "production" ? "/charting_library/" : "../../charting_library/",
      locale: getLanguageFromURL() || "en",
      disabled_features: [
        "use_localstorage_for_settings",
        "save_chart_properties_to_local_storage",
        "header_symbol_search",
        "timeframes_toolbar",
        "go_to_date",
      ],
      chartToken: chartToken,
      enabled_features: [],
      timeframe: "14D",
      overrides: {
        "paneProperties.backgroundType": "solid",
        "paneProperties.background": "#000a00",
        "scalesProperties.lineColor": "#8b968c",
        "scalesProperties.textColor": "#fff",
        "scalesProperties.backgroundColor": "#000a00",
        "paneProperties.backgroundGradientStartColor": "#000a00",
        "paneProperties.backgroundGradientEndColor": "#000a00",
      },
      loading_screen: {
        backgroundColor: "#000a00 !important",
        foregroundColor: "#000a00 !important",
      },
      toolbar_bg: "#000a00",
      custom_css_url: "/AdvancedTVChart.css",
    };
    const tvWidget = new widget(widgetOptions);
    tvWidget.onChartReady(() => {
      setShowChart(true);
    });
    setTvWidget(tvWidget);
  }, [chartToken, dataFeed, defaultProps, period]);

  // Create chart
  useEffect(() => {
    if (!tvWidget && priceData?.length && chartToken) {
      createChart();
    }
  }, [chartToken, priceData, tvWidget, createChart]);

  // Update chart period
  useEffect(() => {
    if (tvWidget && prevPeriod !== period) {
      const advancedChartPeriod = translateLightweightChartPeriod(period);
      setPrevPeriod(advancedChartPeriod);
      setShowChart(false);
      tvWidget.setResolution(advancedChartPeriod, () => setShowChart(true));
    }
  }, [period, prevPeriod, tvWidget]);

  // Recreate chart on token change
  useEffect(() => {
    if (showChart && tvWidget && priceData?.length && prevToken !== chartToken?.address) {
      setShowChart(false);
      setTimeout(() => {
        if (tvWidget) {
          tvWidget.remove();
          setTvWidget(null);
        }
        createChart();
      }, 300); // Wait for overlay animation to complete
      setPrevToken(chartToken?.address);
    }
  }, [showChart, prevToken, tvWidget, priceData, chartToken?.address, chartToken?.symbol, period, createChart]);

  if (!priceData) {
    return null;
  }

  const onSelectToken = (token) => {
    const tmp = getTokenInfo(infoTokens, token.address);
    setChartToken(tmp);
    setToTokenAddress(swapOption, token.address);
  };

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

  if (!chartToken) {
    return null;
  }

  return (
    <>
      <div className="ExchangeChart tv AdvancedTv">
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
        <div className="ChartContainer">
          <div id={defaultProps.container} className="Chart" />
          <div
            className={cx("Overlay", {
              active: !showChart,
            })}
          />
        </div>
      </div>
    </>
  );
}
