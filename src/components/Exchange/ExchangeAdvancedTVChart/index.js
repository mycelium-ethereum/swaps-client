import React, { useState, useEffect, useMemo } from "react";

import { widget } from "../../../charting_library";
import { generateDataFeed } from "../../../Api/TradingView";

const getLanguageFromURL = () => {
  const regex = new RegExp("[\\?&]lang=([^&#]*)");
  const results = regex.exec(window.location.search);
  return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
};

export default function ExchangeAdvancedTVChart(props) {
  const { selectedToken, priceData, updatePriceData, period, setPeriod } = props;
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
  const [prevToken, setPrevToken] = useState(selectedToken?.address);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     updatePriceData(undefined, true);
  //   }, 60 * 1000);
  //   return () => clearInterval(interval);
  // }, [updatePriceData]);

  useEffect(() => {
    if (!tvWidget && priceData?.length && selectedToken) {
      const widgetOptions = {
        ...defaultProps,
        symbol: `${selectedToken?.address}:${selectedToken?.symbol}/USD`,
        debug: false,
        datafeed: generateDataFeed(priceData),
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
        selectedToken: selectedToken,
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
          backgroundColor: "#000a00!important",
          foregroundColor: "#000a00!important",
        },
        toolbar_bg: "#000a00",
        custom_css_url: "/AdvancedTVChart.css",
      };
      const tvWidget = new widget(widgetOptions);
      tvWidget.onChartReady(() => {
        setShowChart(true);
      });
      setTvWidget(tvWidget);
    }
  }, [defaultProps, selectedToken, priceData, tvWidget, period]);

  useEffect(() => {
    if (tvWidget && prevPeriod !== period) {
      setPrevPeriod(period);
      setShowChart(false);
      tvWidget.setResolution(period, () => setShowChart(true));
    }
  }, [period, prevPeriod, tvWidget]);

  useEffect(() => {
    if (showChart && tvWidget && prevToken !== selectedToken?.address) {
      setShowChart(false);
      setPrevToken(selectedToken?.address);
      tvWidget.setSymbol(`${selectedToken?.address}:${selectedToken?.symbol}/USD`, period, () => {
        setShowChart(false);
      });
    }
  }, [showChart, prevToken, tvWidget, selectedToken?.address, selectedToken?.symbol, period]);

  if (!priceData) {
    return null;
  }

  return (
    <>
      <div id={defaultProps.container} className="ExchangeChart tv" />
      {/* {!showChart ? <>Loading</> : null} */}
    </>
  );
}
