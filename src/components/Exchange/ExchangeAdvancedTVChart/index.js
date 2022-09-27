import React, { useState, useEffect, useMemo, useCallback } from "react";
import cx from "classnames";
import { widget } from "../../../charting_library";
import { generateDataFeed, supportedResolutions } from "../../../Api/TradingView";

const getLanguageFromURL = () => {
  const regex = new RegExp("[\\?&]lang=([^&#]*)");
  const results = regex.exec(window.location.search);
  return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
};

const convertLightweightChartPeriod = (period) => {
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
      return supportedResolutions[4]; // D
    default:
      return supportedResolutions[3]; // 240
  }
};

const TIMEFRAME = {
  "5m": "210", // 5 * 14
  "15m": "840", // 15 * 14
  "1h": "7D", // 60 * 14
  "4h": "7D", // 240 * 14
  "1d": "14D", // 1440 * 14
};

export default function ExchangeAdvancedTVChart(props) {
  const { chartToken, priceData, period } = props;

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
  const [prevToken, setPrevToken] = useState(null);
  const [prevPriceDataLength, setPrevPriceDataLength] = useState(0);

  const dataFeed = useMemo(() => generateDataFeed(priceData), [priceData]);

  const createChart = useCallback(() => {
    const advancedChartPeriod = convertLightweightChartPeriod(period);
    const widgetOptions = {
      ...defaultProps,
      symbol: `${chartToken?.address}:${chartToken?.symbol}/USD`,
      debug: false,
      datafeed: dataFeed,
      interval: advancedChartPeriod,
      container: "tv_chart_container",
      library_path: process.env.NODE_ENV === "production" ? "/charting_library/" : "../../charting_library/",
      locale: getLanguageFromURL() || "en",
      disabled_features: [
        "header_symbol_search",
        "header_toolbar_compare",
        "timeframes_toolbar",
        "go_to_date",
        "header_resolutions",
      ],
      chartToken: chartToken,
      enabled_features: [],
      timeframe: TIMEFRAME[period],
      overrides: {
        "paneProperties.backgroundType": "solid",
        "paneProperties.background": "#000a00",
        "scalesProperties.lineColor": "#8b968c",
        "scalesProperties.textColor": "#fff",
        "scalesProperties.backgroundColor": "#000a00",
        "paneProperties.backgroundGradientStartColor": "#000a00",
        "paneProperties.backgroundGradientEndColor": "#000a00",
        "paneProperties.legendProperties.showStudyArguments": false,
        "paneProperties.legendProperties.showStudyTitles": false,
        "paneProperties.legendProperties.showStudyValues": false,
        "paneProperties.legendProperties.showSeriesTitle": false,
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

  // Update chart on period change
  useEffect(() => {
    if (tvWidget && prevPeriod !== period && priceData?.length !== prevPriceDataLength) {
      setPrevPeriod(period);
      setPrevPriceDataLength(priceData.length);
      setShowChart(false);
      setTimeout(() => {
        if (tvWidget) {
          tvWidget.remove();
          setTvWidget(null);
        }
        createChart();
      }, 300); // Wait for overlay animation to complete
    }
  }, [period, prevPeriod, tvWidget, createChart, prevPriceDataLength, priceData?.length]);

  // Recreate chart on token change
  useEffect(() => {
    if (showChart && tvWidget && priceData?.length !== prevPriceDataLength && prevToken !== chartToken?.address) {
      setShowChart(false);
      setPrevToken(chartToken?.address);
      setTimeout(() => {
        if (tvWidget) {
          tvWidget.remove();
          setTvWidget(null);
        }
        createChart();
      }, 300); // Wait for overlay animation to complete
    }
  }, [
    showChart,
    prevToken,
    tvWidget,
    priceData,
    chartToken?.address,
    chartToken?.symbol,
    period,
    createChart,
    prevPriceDataLength,
  ]);

  useEffect(() => {
    if (!priceData) {
      tvWidget.remove();
      setTvWidget(null);
    }
  }, [tvWidget, priceData]);

  if (!priceData || !chartToken) {
    return null;
  }

  return (
    <>
      <div className="ChartContainer">
        <div id={defaultProps.container} className="Chart" />
        <div
          className={cx("Overlay", {
            active: !showChart,
          })}
        >
          <svg
            version="1.1"
            id="L9"
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            viewBox="0 0 100 100"
            enableBackground="new 0 0 0 0"
            className="mx-auto h-20 w-20"
          >
            <path
              fill="#098200"
              d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50"
            >
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                dur="1s"
                from="0 50 50"
                to="360 50 50"
                repeatCount="indefinite"
              />
            </path>
          </svg>
        </div>
      </div>
    </>
  );
}
