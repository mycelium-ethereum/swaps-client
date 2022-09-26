import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import cx from "classnames";

import { createChart } from "krasulya-lightweight-charts";

import {
  USD_DECIMALS,
  SWAP,
  CHART_PERIODS,
  formatAmount,
  formatDateTime,
  useLocalStorageSerializeKey,
} from "../../Helpers";
import { useMlpPrices } from "../../Api";

import { getTokens } from "../../data/Tokens";
import { ethers } from "ethers";

const timezoneOffset = -new Date().getTimezoneOffset() * 60;

export function getChartToken(swapOption, fromToken, toToken, chainId) {
  if (!fromToken || !toToken) {
    return;
  }

  if (swapOption !== SWAP) {
    return toToken;
  }

  if (fromToken.isUsdg && toToken.isUsdg) {
    return getTokens(chainId).find((t) => t.isStable);
  }
  if (fromToken.isUsdg) {
    return toToken;
  }
  if (toToken.isUsdg) {
    return fromToken;
  }

  if (fromToken.isStable && toToken.isStable) {
    return toToken;
  }
  if (fromToken.isStable) {
    return toToken;
  }
  if (toToken.isStable) {
    return fromToken;
  }

  return toToken;
}

const DEFAULT_PERIOD = "4h";

const getSeriesOptions = () => ({
  // https://github.com/tradingview/lightweight-charts/blob/master/docs/area-series.md
  lineColor: "#4FE021",
  topColor: "rgba(49, 69, 131, 0.4)",
  bottomColor: "rgba(140, 198, 63, 0.2)",
  lineWidth: 2,
  priceLineColor: "rgba(0, 48, 0, 1)",
  downColor: "#FF5621",
  wickDownColor: "#FF5621",
  upColor: "#4FE021",
  wickUpColor: "#4FE021",
  borderVisible: false,

  // topColor: 'rgba(38, 198, 218, 0.56)',
  // bottomColor: 'rgba(38, 198, 218, 0.04)',
  // lineColor: 'rgba(38, 198, 218, 1)',
  // lineWidth: 2,
  // crossHairMarkerVisible: false,
});

const getChartOptions = (width, height) => ({
  width,
  height,
  layout: {
    backgroundColor: "rgba(255, 255, 255, 0)",
    textColor: "#ccc",
    fontFamily: "Inter",
  },
  localization: {
    // https://github.com/tradingview/lightweight-charts/blob/master/docs/customization.md#time-format
    timeFormatter: (businessDayOrTimestamp) => {
      return formatDateTime(businessDayOrTimestamp - timezoneOffset);
    },
  },
  grid: {
    vertLines: {
      visible: true,
      color: "rgba(0, 48, 0, 0.2)",
      style: 2,
    },
    horzLines: {
      visible: true,
      color: "rgba(0, 48, 0, 0.2)",
      style: 2,
    },
  },
  // https://github.com/tradingview/lightweight-charts/blob/master/docs/time-scale.md#time-scale
  timeScale: {
    rightOffset: 5,
    borderVisible: false,
    timeVisible: true,
    fixLeftEdge: true,
  },
  // https://github.com/tradingview/lightweight-charts/blob/master/docs/customization.md#price-axis
  priceScale: {
    borderVisible: false,
    scaleMargins: {
        top: 0.5,
        bottom: 0.3,
    },
  },
  crosshair: {
    horzLine: {
      color: "#aaa",
    },
    vertLine: {
      color: "#aaa",
    },
    mode: 0,
  },
});

export default function MlpPriceChart(props) {
  const {
    chainId,
    sidebarVisible,
    mlpPrice
  } = props;

  const priceData = useMlpPrices(chainId, mlpPrice);

  const [currentChart, setCurrentChart] = useState();
  const [currentSeries, setCurrentSeries] = useState();

  let [period, setPeriod] = useLocalStorageSerializeKey([chainId, "Chart-period"], DEFAULT_PERIOD);
  if (!(period in CHART_PERIODS)) {
    period = DEFAULT_PERIOD;
  }

  const [hoveredPoint, setHoveredPoint] = useState();

  const ref = useRef(null);
  const chartRef = useRef(null);

  const currentPrice = mlpPrice;

  const [chartInited, setChartInited] = useState(false);

  const scaleChart = useCallback(() => {
    currentChart.timeScale().fitContent();
  }, [currentChart, period]);

  const onCrosshairMove = useCallback(
    (evt) => {
      if (!evt.time) {
        setHoveredPoint(null);
        return;
      }
      const priceDataById = priceData.reduce((o, stat) => ({
        ...o,
        [stat.time]: {
          ...stat
        }
      }), {})

      const hoveredPoint = priceDataById[evt.time];
      if (!hoveredPoint) {
        return
      }
      
      setHoveredPoint(hoveredPoint);
    },
    [setHoveredPoint, priceData]
  );

  useEffect(() => {
    if (!ref.current || !priceData || !priceData.length || currentChart) {
      return;
    }

    const chart = createChart(
      chartRef.current,
      getChartOptions(chartRef.current.offsetWidth, chartRef.current.offsetHeight)
    );

    chart.subscribeCrosshairMove(onCrosshairMove);

    const series = chart.addAreaSeries(getSeriesOptions());

    setCurrentChart(chart);
    setCurrentSeries(series);
  }, [ref, priceData, currentChart, onCrosshairMove]);

  // useEffect(() => {
    // const interval = setInterval(() => {
      // updatePriceData(undefined, true);
    // }, 60 * 1000);
    // return () => clearInterval(interval);
  // }, [updatePriceData]);

  useEffect(() => {
    if (!currentChart) {
      return;
    }
    const resizeChart = () => {
      currentChart.resize(chartRef.current.offsetWidth, chartRef.current.offsetHeight);
    };
    window.addEventListener("resize", resizeChart);
    return () => window.removeEventListener("resize", resizeChart);
  }, [currentChart]);

  useEffect(() => {
    if (!currentChart) {
      return;
    }
    const resizeChart = () => {
      currentChart.resize(chartRef.current.offsetWidth, chartRef.current.offsetHeight);
    };
    let timeout = setTimeout(() => {
      resizeChart();
    }, 500);
    return () => clearTimeout(timeout);
  }, [currentChart, sidebarVisible]);

  useEffect(() => {
    if (currentSeries && priceData && priceData.length) {
      currentSeries.setData(priceData);

      if (!chartInited) {
        scaleChart();
        setChartInited(true);
      }
    }
  }, [priceData, currentSeries, chartInited, scaleChart]);

  const statsHtml = useMemo(() => {
    if (!priceData) {
      return null;
    }
    const point = hoveredPoint || priceData[priceData.length - 1];
    if (!point) {
      return null;
    }

    const className = cx({
      "ExchangeChart-bottom-stats": true,
    });

    const toFixedNumbers = 3;

    return (
      <div className={className}>
        <span className="ExchangeChart-bottom-stats-label">p</span>
        <span className="ExchangeChart-bottom-stats-value">{point.value.toFixed(toFixedNumbers)}</span>
        <span className="ExchangeChart-bottom-stats-label">w/fees</span>
        <span className="ExchangeChart-bottom-stats-value">{point.mlpPriceWithFees.toFixed(toFixedNumbers)}</span>
      </div>
    );
  }, [hoveredPoint, priceData]);

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
      deltaPrice = price.value;
    }
  }

  if (deltaPrice && currentPrice) {
    const average = parseFloat(formatAmount(currentPrice, USD_DECIMALS, 2));
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

  return (
    <div className="Mlp-price-chart ExchangeChart tv" ref={ref}>
      <div className="ExchangeChart-bottom App-box App-box-border">
        <div className="ExchangeChart-bottom-header">
          {statsHtml}
        </div>
        <div className="ExchangeChart-bottom-content" ref={chartRef}></div>
      </div>
    </div>
  );
}
