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
  const [showChart, setShowChart] = useState(false);
  const [prevPeriod, setPrevPeriod] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      updatePriceData(undefined, true);
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [updatePriceData]);

  useEffect(() => {
    if (prevPeriod !== period && priceData?.length) {
      setPrevPeriod(period);
      setShowChart(false);
      const widgetOptions = {
        ...defaultProps,
        symbol: `${selectedToken?.address}:${selectedToken?.symbol}/USD`,
        debug: false,
        datafeed: generateDataFeed(priceData),
        // interval: period.toUpperCase(),
        interval: "1D",
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
          // "paneProperties.background": "#000240",
          // "scalesProperties.lineColor": "#3da8f5",
          // "scalesProperties.textColor": "#fff",
          // "scalesProperties.backgroundColor": "#000240",
          // "paneProperties.backgroundGradientStartColor": "#000240",
          // "paneProperties.backgroundGradientEndColor": "#000240",
        },
        // loading_screen: {
        //   backgroundColor: "#000240!important",
        //   foregroundColor: "#000240!important",
        // },
        // toolbar_bg: "#000240",
        // custom_css_url: "/styles/chartStyles.css",
      };

      new widget(widgetOptions);
      setShowChart(true);
    }
  }, [defaultProps, selectedToken, priceData, period, prevPeriod]);

  // public componentDidUpdate(prevProps: ChartContainerProps, prevState: ChartContainerState): void {
  //     if (
  //         !tvWidgetReady ||
  //         prevProps.selectedTracer.address !== this.props?.selectedTracer?.address
  //     ) {
  //         console.debug('Tracer has changed, new tracer', this.props.selectedTracer);
  //         this.setState({ showChart: false });
  //         const { address, marketId } = this.props?.selectedTracer ?? {
  //             address: '',
  //             marketId: 'ETH/USD',
  //         };
  //         if (this.state.tvWidgetReady) {
  //             this.tvWidget?.setSymbol(
  //                 `${address}:${marketId}`,
  //                 '1D' as ChartingLibraryWidgetOptions['interval'],
  //                 () => {
  //                     this.setState({ showChart: true });
  //                 },
  //             );
  //         }
  //     }
  // }

  return (
    <>
      <div id={defaultProps.container} className="ExchangeChart tv" />
      {showChart ? <>Loading</> : null}
    </>
  );
}
