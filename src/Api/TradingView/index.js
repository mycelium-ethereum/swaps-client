import {CHART_PERIODS} from "src/Helpers";
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

let activeSubscriptions = {};

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
        // has_empty_bars: true
      };

      if (market.split("/")[1].match(/USD|EUR|JPY|AUD|GBP|KRW|CNY/)) {
        symbol.pricescale = 100;
      }
      onSymbolResolvedCallback(symbol);
    },

    getBars: async (symbolInfo, resolution, periodParams, onResult, onErrorCallback) => {
      let { from, to, countBack } = periodParams;
      console.log('[getBars]: Method call', symbolInfo, resolution, periodParams);
      try {
        const symbol = symbolInfo.name.split("/")[0];
        const period = supportedResolutionsToPeriod[resolution];

        let cumulativePrices = [];
        let prices = [];
        const timeDiff = CHART_PERIODS[period] * 1000;
        let count = 0;
        while (cumulativePrices.length < countBack) {
          if (count > 0) {
            to = from;
            from = from - (count * timeDiff)
          }
          prices = await getChartPrices(42161, symbol, period, { from, to });
          console.log(`[getBars]: found ${prices.length} more bars, target: ${countBack} bars, cumulative total: ${cumulativePrices.length + prices.length} bars`);
          if (!prices || prices.length === 0) {
            break;
          } else {
            cumulativePrices = cumulativePrices.concat(prices)
            count += 1;
          }
        }

        const uniqueBars = {};
        fillGaps(cumulativePrices, CHART_PERIODS[period]).forEach((el) => {
          let low = el.low;
          if (low === 0) {
            low = el.open * 0.9996;
          }
          uniqueBars[el.time] = {
            ...el,
            low,
            time: el.time * 1000, //TradingView requires bar time in ms
          }
        })
        const bars = Object.values(uniqueBars).sort((a, b) => a.time - b.time);
        console.log(`[getBars]: returned ${bars.length} bar(s), countBack: ${countBack}`);

        onResult(bars, { noData: bars.length < countBack });

      } catch (error) {
          console.log('[getBars]: Get error', error);
          onErrorCallback(error);
      }
    },
    subscribeBars: (_symbolInfo, resolution, onRealtimeCallback, subscribeUID, _onResetCacheNeededCallback) => {
      console.debug(`[subscribeBars]: id: ${subscribeUID}, resolution: ${resolution}`);
      activeSubscriptions[subscribeUID] = true;
      newPriceEmitter.on('update', (bar) => {
        if (activeSubscriptions[subscribeUID]) {
          onRealtimeCallback({ ...bar, time: bar.time * 1000 })
        }
      })
    },
    unsubscribeBars: (subscribeUID) => {
      console.debug(`[unsubscribeBars]: id: ${subscribeUID}`);
      activeSubscriptions[subscribeUID] = false;
    },
  };
