import { CHART_PERIODS } from "src/Helpers";
import { fillGaps, getChartPrices } from "../prices";

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

const parseFullSymbol = (fullSymbol) => {
    const match = fullSymbol.match(/^(\w+):(\w+)\/(\w+)$/);
    if (!match) {
        return null;
    }

    return { exchange: match[1], fromSymbol: match[2], toSymbol: match[3] };
}

export const dataFeed = {
    onReady: (cb) => {
      console.debug("=====onReady running");
      setTimeout(() => cb(config), 0);
    },

    searchSymbols: (_userInput, _exchange, _symbolType, onResultReadyCallback) => {
      console.log("====Search Symbols running");
      const symbols = [
        {
          symbol: 'ETH/USD',
          ticker: 'ETH/USD',
          full_name: `Swaps:ETH/USD`,
          description: 'Ethereum',
          type: 'crypto',
        }
      ]
      onResultReadyCallback(symbols);
    },

    resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
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
        debug: true,
        supported_resolutions: supportedResolutions,
      };

      if (market.split("/")[1].match(/USD|EUR|JPY|AUD|GBP|KRW|CNY/)) {
        symbol.pricescale = 100;
      }
      onSymbolResolvedCallback(symbol);
    },

    getBars: async (symbolInfo, resolution, periodParams, onResult, onErrorCallback) => {
      const { from, to, firstDataRequest } = periodParams;
      console.log('[getBars]: Method call', symbolInfo, resolution, from, to);
      try {
        const symbol = symbolInfo.name.split("/")[0];
        const period = supportedResolutionsToPeriod[resolution];

        // const prices_ = await getChartPrices(42161, symbol, period);
        const prices_ = await getChartPrices(42161, symbol, period, periodParams);

        if (prices_.length === 0) {
          // "noData" should be set if there is no data in the requested period.
          onResult([], { noData: true });
          return;
        }

        const prices = fillGaps(prices_, CHART_PERIODS[period])

        const bars = prices.map((el) => {
          return {
            ...el,
            time: el.time * 1000, //TradingView requires bar time in ms
          };
        })

        console.log(`[getBars]: returned ${bars.length} bar(s)`);

        if (!firstDataRequest) {
          onResult([], { noData: true});
        }
        onResult(bars, { noData: false });
      } catch (error) {
          console.log('[getBars]: Get error', error);
          onErrorCallback(error);
      }
    },
    subscribeBars: (_symbolInfo, _resolution, _onRealtimeCallback, _subscribeUID, _onResetCacheNeededCallback) => {
      console.debug("=====subscribeBars runnning");
    },
    unsubscribeBars: (_subscriberUID) => {
      console.debug("=====unsubscribeBars running");
    },
  };
