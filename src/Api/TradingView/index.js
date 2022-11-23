import { CHART_PERIODS } from "src/Helpers";
import { roundUpTime } from "src/utils/common";
import { fillGaps, getChartPrices } from "../prices";
import { newPriceEmitter } from "./newPriceEmitter";


// [5m, 15m, 60m (1h), 240m(4h), 1D(24h)]
export const supportedResolutions = ["1", "5", "15", "60", "240", "24H"];
export const supportedResolutionsToPeriod = {
  1: '1m',
  5: '5m',
  15: '15m',
  60: '1h',
  240: '4h',
  1440: '1d',
}

export const intradayMultipliers = ["1", "5", "15", "60", "240"];

const config = {
  supported_resolutions: [...supportedResolutions],
  exchanges: [
    {
      value: "Swaps",
      name: "Swaps",
      desc: 'Swaps',
    }
  ]
};


const allSymbols = ["ETH/USD", "BTC/USD", "LINK/USD", "CRV/USD", "BAL/USD", "UNI/USD", "FXS/USD"]

export const dataFeed = {
    onReady: (cb) => {
      console.debug("=====onReady running");
      setTimeout(() => cb(config), 0);
    },

    searchSymbols: (_userInput, _exchange, _symbolType, onResultReadyCallback) => {
      console.log("====Search Symbols running");
      const symbols = allSymbols.map((symbol) => ({
        symbol: symbol,
        ticker: symbol,
        full_name: `Swaps:${symbol}`,
        description: symbol,
        type: 'crypto',
      }))
      onResultReadyCallback(symbols);
    },

    resolveSymbol: async (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
      console.log('[resolveSymbol]: Method call', symbolName);
      const market = symbolName.replace("Swaps:", "");
      if (!allSymbols.includes(market)) {
        onResolveErrorCallback('cannot resolve symbol');
        return;
      }
      const symbol = {
        name: market,
        ticker: market,
        full_name: symbolName,
        description: market,
        type: "crypto",
        session: "24x7",
        exchange: "Swaps",
        timezone: "Etc/UTC",
        format: "price",
        listed_exchange: "",
        minmov: 1,
        minmov2: 0,
        pricescale: 100000,
        has_intraday: true,
        intraday_multipliers: intradayMultipliers,
        debug: false,
        supported_resolutions: supportedResolutions,
        has_daily: true,
        dailyMultipliers: ['1'],
        has_empty_bars: true
      };

      if (market.split("/")[1].match(/USD|EUR|JPY|AUD|GBP|KRW|CNY/)) {
        symbol.pricescale = 100;
      }
      onSymbolResolvedCallback(symbol);
    },

    getBars: async (symbolInfo, resolution, periodParams, onResult, onErrorCallback) => {
      const { from, to, firstDataRequest, countBack } = periodParams;
      console.log('[getBars]: Method call', symbolInfo, resolution, periodParams);
      try {
        const symbol = symbolInfo.name.split("/")[0];
        const period = supportedResolutionsToPeriod[resolution];

        if (countBack === 0 || !firstDataRequest) {
          onResult([], { noData: true });
        }

        const prices = await getChartPrices(42161, symbol, period, { from, to });

        if (prices.length === 0) {
          // "noData" should be set if there is no data in the requested period.
          onResult([], { noData: true });
          return;
        }

        // const prices = fillGaps(prices_, CHART_PERIODS[period])

        const bars = prices.map((el) => {
          let low = el.low;
          if (low === 0) {
            low = el.open * 0.9996;
          }
          return {
            ...el,
            low,
            time: el.time * 1000, //TradingView requires bar time in ms
          };
        })

        console.log(`[getBars]: returned ${bars.length} bar(s)`);
        onResult(bars, { noData: false });
      } catch (error) {
          console.log('[getBars]: Get error', error);
          onErrorCallback(error);
      }
    },
    subscribeBars: (_symbolInfo, resolution, onRealtimeCallback, _subscribeUID, onResetCacheNeededCallback) => {
      console.debug("=====subscribeBars runnning");
      newPriceEmitter.on('update', (bar) => {
        const period = supportedResolutionsToPeriod[resolution]
        onRealtimeCallback({ ...bar, time: roundUpTime(bar.time, period) * 1000 })
        // onResetCacheNeededCallback();
      })
    },
    unsubscribeBars: (_subscriberUID) => {
      console.debug("=====unsubscribeBars running");
    },
  };
